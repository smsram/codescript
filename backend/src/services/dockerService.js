const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { getEngineSettings } = require('../controllers/adminController'); // 🚀 Import live settings

const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const activeJobs = new Map();

// 🚀 --- THE RAM-AWARE QUEUE SYSTEM ---
let activeContainers = 0;
const executionQueue = [];

const processQueue = async () => {
    if (executionQueue.length === 0) return;

    const settings = getEngineSettings();
    const requiredMemMB = parseInt(settings.maxMem, 10) || 256;
    const freeRamMB = Math.floor(os.freemem() / (1024 * 1024));
    
    // Always leave 200MB free for the OS to prevent hard crashing
    const OS_SAFETY_BUFFER_MB = 200; 

    // If RAM is too low AND there are active containers, hold the request in queue.
    if (activeContainers > 0 && freeRamMB < (requiredMemMB + OS_SAFETY_BUFFER_MB)) {
        setTimeout(processQueue, 1500); // Check again in 1.5 seconds
        return;
    }

    const task = executionQueue.shift();
    activeContainers++;

    try {
        await task.execute(settings);
    } finally {
        activeContainers--;
        processQueue(); // Instantly trigger the next in queue when done
    }
};

// --- LANGUAGE REORGANIZERS ---
const reorganizeJavaCode = (studentCode, driverCode) => {
    const fullCode = `${studentCode}\n\n${driverCode}`;
    const importRegex = /import\s+[^;]+;/g;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(fullCode)) !== null) {
        imports.push(match[0].trim());
    }
    
    const codeWithoutImports = fullCode.replace(importRegex, '');
    const uniqueImports = [...new Set(imports)];
    
    return `${uniqueImports.join('\n')}\n\n${codeWithoutImports}`;
};

const reorganizePythonCode = (studentCode, driverCode) => {
    const fullCode = `${studentCode}\n\n${driverCode}`;
    const importRegex = /^(import\s+.*|from\s+.*)/gm;
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(fullCode)) !== null) {
        imports.push(match[0].trim());
    }
    
    const codeWithoutImports = fullCode.replace(importRegex, '');
    const uniqueImports = [...new Set(imports)];
    
    return `${uniqueImports.join('\n')}\n\n${codeWithoutImports}`;
};

// --- CORE EXECUTION LOGIC ---
const executeCode = (language, code, driverCode = "", input = "", jobId = crypto.randomUUID()) => {
    return new Promise((resolve) => {
        
        // Push the execution block into the Queue
        executionQueue.push({
            execute: async (settings) => {
                const folderPath = path.join(TEMP_DIR, jobId);
                
                try {
                    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
                } catch (err) {
                    console.error(`[ERROR] Failed to create folder: ${err.message}`);
                    return resolve({ status: 'Error', output: "Internal Server Error: Folder Creation" });
                }

                let fileName, compileCmd, runCmd;
                const lang = language.toLowerCase().replace(/\s+/g, '');

                const safeCode = code || "";
                const safeDriver = driverCode || "";
                
                let finalCodeToExecute = safeDriver.trim() !== "" 
                    ? `${safeCode}\n\n${safeDriver}` 
                    : safeCode;

                if (lang.includes('python')) {
                    fileName = 'solution.py';
                    runCmd = `python3 -u ${fileName}`;
                    if (safeDriver.trim() !== "") {
                        finalCodeToExecute = reorganizePythonCode(safeCode, safeDriver);
                    }
                } else if (lang === 'c') {
                    fileName = 'solution.c';
                    compileCmd = `gcc ${fileName} -o out`;
                    runCmd = './out';
                } else if (lang === 'c++' || lang === 'cpp') {
                    fileName = 'solution.cpp';
                    compileCmd = `g++ ${fileName} -o out`;
                    runCmd = './out';
                } else if (lang === 'java') {
                    if (safeDriver.trim() !== "") {
                        finalCodeToExecute = reorganizeJavaCode(safeCode, safeDriver);
                    }
                    let className = 'Main';
                    let classMatch = finalCodeToExecute.match(/public\s+class\s+([A-Za-z0-9_]+)/);
                    if (!classMatch) classMatch = finalCodeToExecute.match(/class\s+([A-Za-z0-9_]+)/);
                    if (classMatch) className = classMatch[1];

                    fileName = `${className}.java`;
                    compileCmd = `javac ${fileName}`;
                    runCmd = `java ${className}`;
                } else if (lang === 'c#' || lang === 'csharp') {
                    fileName = 'solution.cs';
                    compileCmd = `mcs ${fileName}`;
                    runCmd = 'mono solution.exe';
                } else {
                    return resolve({ status: 'Error', output: "Unsupported Language" });
                }

                const codePath = path.join(folderPath, fileName);
                const inputPath = path.join(folderPath, 'input.txt');
                
                fs.writeFileSync(codePath, finalCodeToExecute);
                fs.writeFileSync(inputPath, input || "");

                const innerCmd = compileCmd 
                    ? `${compileCmd} && ${runCmd} < input.txt` 
                    : `${runCmd} < input.txt`;

                // 🚀 APPLY DYNAMIC RESOURCE LIMITS TO DOCKER CMD
                const dockerCmd = `docker run --name ${jobId} --rm --network none --memory="${settings.maxMem}m" --cpus="${settings.maxCpu}" -v ${folderPath}:/app -w /app codescript-polyglot sh -c "${innerCmd}"`;
                
                // Convert Seconds to Milliseconds for the Node Exec timeout
                const timeoutMs = (settings.globalTle || 5.0) * 1000;

                const childProc = exec(dockerCmd, { timeout: timeoutMs }, (error, stdout, stderr) => {
                    activeJobs.delete(jobId);
                    
                    try {
                        if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });
                    } catch (cleanupErr) {}

                    if (error) {
                        // Node killed it due to timeout
                        if (error.killed) {
                            return resolve({ status: 'TLE', output: 'Execution Terminated or Time Limit Exceeded.' });
                        }
                        
                        let errOutput = (stderr || stdout || error.message || "").toString().trim();
                        
                        // Sanitize Docker Paths
                        errOutput = errOutput.replace(/\/app\/solution\.py/g, 'main.py');
                        errOutput = errOutput.replace(/\/app\/[A-Za-z0-9_]+\.java/g, 'Main.java');
                        errOutput = errOutput.replace(/\/app\//g, '');
                        
                        // OOM Killer detection (if container tried to use more than settings.maxMem)
                        if (errOutput.includes('137') || errOutput.includes('OOM') || errOutput.includes('Out of memory')) {
                            return resolve({ status: 'Runtime Error', output: 'Memory Limit Exceeded (Container OOM).' });
                        }

                        if (errOutput.includes('Could not find or load main class') || errOutput.includes('Main method not found')) {
                            errOutput = "Error: No execution entry point found.\n\nEnsure your Java code has a 'public static void main(String[] args)' method. If this is a method-only problem, the Admin has not configured the Driver Code.";
                        }
                        return resolve({ status: 'Runtime Error', output: errOutput });
                    }

                    const finalOutput = (stdout || "").toString().trim();
                    resolve({ status: 'Accepted', output: finalOutput });
                });

                activeJobs.set(jobId, childProc);
            }
        });

        // Jumpstart the queue if it's idle
        processQueue();
    });
};

const killJob = (jobPrefix) => {
    let killed = false;
    for (const [key, childProc] of activeJobs.entries()) {
        if (key.startsWith(jobPrefix)) {
            childProc.kill();
            exec(`docker kill ${key}`, () => {}); 
            activeJobs.delete(key);
            killed = true;
        }
    }
    return killed;
};

module.exports = { executeCode, killJob };