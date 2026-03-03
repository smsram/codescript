const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Create a temp folder to hold student code files
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);

const executeCode = (language, code) => {
    return new Promise((resolve, reject) => {
        const jobId = crypto.randomUUID();
        let fileName, dockerImage, runCommand;

        // Map languages to their lightweight Docker images
        if (language === 'python') {
            fileName = `${jobId}.py`;
            dockerImage = 'python:3.10-alpine';
            runCommand = `python /app/${fileName}`;
        } else if (language === 'javascript') {
            fileName = `${jobId}.js`;
            dockerImage = 'node:20-alpine';
            runCommand = `node /app/${fileName}`;
        } else {
            return reject({ status: 'Error', output: 'Unsupported language' });
        }

        // Save the code to a temporary file
        const filePath = path.join(TEMP_DIR, fileName);
        fs.writeFileSync(filePath, code);

        // THE SECURE DOCKER COMMAND
        // --rm: Deletes the container immediately after it finishes
        // --network none: Prevents the code from accessing the internet
        // --memory="128m": Keeps your 1GB RAM server from crashing
        // --cpus="0.5": Limits CPU usage
        const dockerCmd = `docker run --rm --network none --memory="128m" --cpus="0.5" -v ${TEMP_DIR}:/app -w /app ${dockerImage} ${runCommand}`;

        // Execute the container with a strict 15-second timeout
        exec(dockerCmd, { timeout: 15000 }, (error, stdout, stderr) => {
            // Clean up the temp file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            if (error) {
                if (error.killed) {
                    return resolve({ status: 'Time Limit Exceeded (TLE)', output: 'Code took longer than 5.0s to execute.' });
                }
                return resolve({ status: 'Runtime Error', output: stderr.trim() });
            }
            resolve({ status: 'Accepted', output: stdout.trim() });
        });
    });
};

module.exports = { executeCode };
