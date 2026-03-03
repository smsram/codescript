const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TEMP_DIR = path.join(__dirname, '../../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const executeCode = (language, code, input = "") => {
    return new Promise((resolve) => {
        const jobId = crypto.randomUUID();
        const folderPath = path.join(TEMP_DIR, jobId);
        
        console.log(`\n[DEBUG] --- New Execution Job: ${jobId} ---`);
        console.log(`[DEBUG] Language: ${language}`);
        
        try {
            fs.mkdirSync(folderPath);
        } catch (err) {
            console.error(`[ERROR] Failed to create folder: ${err.message}`);
            return resolve({ status: 'Error', output: "Internal Server Error: Folder Creation" });
        }

        let fileName, compileCmd, runCmd;
        const lang = language.toLowerCase();

        if (lang.includes('python')) {
            fileName = 'solution.py';
            runCmd = `python3 ${fileName}`;
        } else if (lang === 'c') {
            fileName = 'solution.c';
            compileCmd = `gcc ${fileName} -o out`;
            runCmd = './out';
        } else if (lang === 'c++' || lang === 'cpp') {
            fileName = 'solution.cpp';
            compileCmd = `g++ ${fileName} -o out`;
            runCmd = './out';
        } else if (lang === 'java') {
            fileName = 'Solution.java';
            compileCmd = `javac ${fileName}`;
            runCmd = 'java Solution';
        } else if (lang === 'c#' || lang === 'csharp') {
            fileName = 'solution.cs';
            compileCmd = `mcs ${fileName}`;
            runCmd = 'mono solution.exe';
        } else {
            console.error(`[ERROR] Unsupported Language: ${language}`);
            return resolve({ status: 'Error', output: "Unsupported Language" });
        }

        // Write files
        const codePath = path.join(folderPath, fileName);
        const inputPath = path.join(folderPath, 'input.txt');
        fs.writeFileSync(codePath, code);
        fs.writeFileSync(inputPath, input || ""); // Write empty string if no input

        console.log(`[DEBUG] File written to: ${codePath}`);

        const innerCmd = compileCmd 
            ? `${compileCmd} && ${runCmd} < input.txt` 
            : `${runCmd} < input.txt`;

        const dockerCmd = `docker run --rm --network none --memory="128m" --cpus="0.5" -v ${folderPath}:/app -w /app codescript-polyglot sh -c "${innerCmd}"`;

        console.log(`[DEBUG] Executing Docker Command: \n${dockerCmd}\n`);

        exec(dockerCmd, { timeout: 10000 }, (error, stdout, stderr) => {
            console.log(`[DEBUG] Execution Finished.`);
            
            // Log raw outputs
            if (stdout) console.log(`[STDOUT]: ${stdout}`);
            if (stderr) console.error(`[STDERR]: ${stderr}`);

            // Cleanup
            try {
                fs.rmSync(folderPath, { recursive: true, force: true });
                console.log(`[DEBUG] Temp folder cleaned up.`);
            } catch (cleanupErr) {
                console.error(`[ERROR] Cleanup failed: ${cleanupErr.message}`);
            }

            if (error) {
                if (error.killed) {
                    console.warn(`[RESULT] TLE for Job ${jobId}`);
                    return resolve({ status: 'TLE', output: 'Time Limit Exceeded (10s)' });
                }
                console.error(`[RESULT] Runtime Error for Job ${jobId}`);
                return resolve({ status: 'Runtime Error', output: stderr || stdout || error.message });
            }

            console.log(`[RESULT] Accepted for Job ${jobId}`);
            resolve({ status: 'Accepted', output: stdout.trim() });
        });
    });
};

module.exports = { executeCode };