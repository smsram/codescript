const { executeCode } = require('./dockerService');

const pythonCode = `
def greet(name):
    return f"Hello, {name}! Your Python execution works."

print(greet("GGU Student"))
`;

console.log("Spinning up Docker container...");

executeCode('python', pythonCode)
    .then(result => {
        console.log("\n--- RESULT ---");
        console.log(`Status: ${result.status}`);
        console.log(`Output: ${result.output}`);
    })
    .catch(err => console.error(err));
