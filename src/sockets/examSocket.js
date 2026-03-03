const { executeCode } = require('../services/dockerService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { toIST } = require('../utils/timeUtils');

const examSocket = (io) => {
    io.on('connection', (socket) => {
        
        socket.on('join-exam', async ({ examId, userId }) => {
            socket.join(`exam_${examId}`);
            console.log(`[${toIST()}] 🏁 Student ${userId} joined Exam Room: exam_${examId}`);
        });

        // 🚀 FULL TEST CASE EXECUTION ENGINE
        socket.on('run-code', async ({ examId, userId, problemId, language, code }) => {
            console.log(`\n[${toIST()}] 📥 RECEIVED RUN REQUEST:`);
            console.log(`   - User: ${userId}`);
            console.log(`   - Exam: ${examId}`);
            console.log(`   - Problem: ${problemId}`);
            console.log(`   - Lang: ${language}`);
            console.log(`   - Code Length: ${code?.length || 0} chars`);

            if (!code || code.trim() === "") {
                console.log(`[${toIST()}] ⚠️ Rejected: Code is empty`);
                return socket.emit('code-output', { 
                    problemId, 
                    status: 'Error', 
                    results: [{ index: 1, type: 'raw', output: 'No code was sent to the server.' }] 
                });
            }

            try {
                // 1. Fetch test cases for this specific problem
                console.log(`[${toIST()}] 🔍 Fetching test cases for problem: ${problemId}`);
                const testCases = await prisma.testCase.findMany({
                    where: { problemId },
                    orderBy: { isHidden: 'asc' } 
                });

                console.log(`[${toIST()}] 📋 Found ${testCases.length} test cases`);

                if (!testCases || testCases.length === 0) {
                    console.log(`[${toIST()}] ⚡ No test cases found. Running raw execution...`);
                    const res = await executeCode(language, code, "");
                    
                    console.log(`[${toIST()}] 📤 Sending raw output back to client`);
                    return socket.emit('code-output', { 
                        problemId, 
                        status: res.status, 
                        results: [{ index: 1, type: 'raw', output: res.output }] 
                    });
                }

                let results = [];
                let allPassed = true;

                // 2. Execute sequentially
                for (let i = 0; i < testCases.length; i++) {
                    const tc = testCases[i];
                    console.log(`[${toIST()}] ⚙️ Executing Test Case ${i + 1}/${testCases.length} (${tc.isHidden ? 'Hidden' : 'Public'})`);
                    
                    const res = await executeCode(language, code, tc.input);

                    // Normalize line endings for accurate comparison
                    const actualOutput = (res.output || "").replace(/\r\n/g, '\n').trim();
                    const expectedOutput = (tc.expectedOutput || "").replace(/\r\n/g, '\n').trim();
                    
                    const passed = res.status === 'Accepted' && actualOutput === expectedOutput;
                    if (!passed) allPassed = false;

                    console.log(`   - Result: ${res.status} | Passed: ${passed}`);

                    results.push({
                        index: i + 1,
                        passed,
                        status: res.status === 'Accepted' && !passed ? 'Wrong Answer' : res.status,
                        input: tc.isHidden ? 'Hidden' : tc.input,
                        expected: tc.isHidden ? 'Hidden' : tc.expectedOutput,
                        actual: tc.isHidden ? 'Hidden' : actualOutput,
                        isHidden: tc.isHidden
                    });
                }

                const finalStatus = allPassed ? 'Accepted' : 'Failed';
                console.log(`[${toIST()}] ✅ Execution Complete. Final Status: ${finalStatus}`);

                // 3. Send structured results back
                socket.emit('code-output', {
                    problemId,
                    status: finalStatus,
                    results
                });

            } catch (error) {
                console.error(`[${toIST()}] ❌ FATAL ERROR during execution:`, error);
                socket.emit('code-output', {
                    problemId, 
                    status: 'Error',
                    results: [{ index: 1, passed: false, actual: error.message || 'Server Internal Error', isHidden: false }]
                });
            }
        });

        socket.on('violation-tab-switch', async ({ examId, userId }) => {
            console.warn(`[${toIST()}] ⚠️ VIOLATION: User ${userId} switched tabs in Exam ${examId}`);
        });

        socket.on('disconnect', (reason) => {
            console.log(`[${toIST()}] 🔌 Socket Disconnected. Reason: ${reason}`);
        });
    });
};

module.exports = examSocket;