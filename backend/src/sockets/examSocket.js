const { executeCode, killJob } = require('../services/dockerService');
const prisma = require('../../prisma/prisma');
const { toIST } = require('../utils/timeUtils');

const cancelledJobs = new Set();

const examSocket = (io) => {
    
    // Helper to extract the REAL contest ID regardless of whether they used the URL UUID or Join Code
    const getRealContest = async (examIdOrCode) => {
        return await prisma.contest.findFirst({
            where: { OR: [{ id: examIdOrCode }, { joinCode: examIdOrCode }] },
            select: { id: true, endTime: true, strikes: true }
        });
    };

    const broadcastToAdmins = async (realContestId) => {
        try {
            const contest = await prisma.contest.findUnique({ where: { id: realContestId }, select: { strikes: true } });
            if (!contest) return;

            const sessions = await prisma.contestSession.findMany({
                where: { contestId: realContestId },
                include: { user: { select: { name: true, email: true } } },
                orderBy: { joinedAt: 'desc' }
            });

            io.to(`admin_${realContestId}`).emit('live-stats-update', { contestStrikes: contest.strikes, sessions });
        } catch (err) {}
    };

    io.on('connection', (socket) => {

        socket.on('join-admin-monitor', async ({ examId }) => {
            const contest = await getRealContest(examId);
            if(contest) {
                socket.join(`admin_${contest.id}`);
                await broadcastToAdmins(contest.id);
            }
        });

        socket.on('join-exam', async ({ examId, userId }) => {
            try {
                const contest = await getRealContest(examId);
                if (!contest) return;

                const realContestId = contest.id;
                socket.join(`exam_${realContestId}`);

                const currentTime = toIST();
                const isContestOver = contest.endTime && currentTime > new Date(contest.endTime);

                let session = await prisma.contestSession.findUnique({
                    where: { userId_contestId: { userId, contestId: realContestId } }
                });

                if (!session) {
                    if (isContestOver) {
                        return socket.emit('exam-terminated', { reason: 'The exam time is over. You did not participate.' });
                    }

                    session = await prisma.contestSession.create({
                        data: { 
                            userId, contestId: realContestId, 
                            status: "IN_PROGRESS", strikes: 0,
                            joinedAt: currentTime, completedAt: null
                        }
                    });
                    await broadcastToAdmins(realContestId); 
                } else if (isContestOver && session.status === "IN_PROGRESS") {
                    session = await prisma.contestSession.update({
                        where: { id: session.id },
                        data: { status: "SUBMITTED", completedAt: currentTime }
                    });
                    await broadcastToAdmins(realContestId);
                }

                if (session.status === "SUBMITTED" || session.status === "KICKED") {
                    return socket.emit('exam-terminated', { reason: 'Exam has already been submitted or terminated.' });
                }

                socket.emit('sync-session', { strikes: session.strikes, status: session.status });

                const cloudDrafts = await prisma.sessionAnswer.findMany({
                    where: { contestSessionId: session.id, status: 'DRAFT' }
                });
                if (cloudDrafts.length > 0) socket.emit('sync-drafts', cloudDrafts);

                const solvedSubmissions = await prisma.sessionAnswer.findMany({
                    where: { contestSessionId: session.id, status: 'Accepted' },
                    select: { problemId: true }
                });

                if (solvedSubmissions.length > 0) {
                    const solvedIds = [...new Set(solvedSubmissions.map(s => s.problemId))];
                    socket.emit('sync-solved', solvedIds);
                }
            } catch (err) {
                console.error("Join Exam Error:", err);
            }
        });

        // 🚀 FIXED: DRAFT SAVING
        socket.on('save-draft', async ({ examId, userId, problemId, language, code }) => {
            try {
                const contest = await getRealContest(examId);
                if (!contest) return;

                const session = await prisma.contestSession.findUnique({
                    where: { userId_contestId: { userId, contestId: contest.id } }
                });
                if (!session) return; 

                const currentTimeIST = toIST(); // Generate IST

                await prisma.sessionAnswer.upsert({
                    where: { contestSessionId_problemId_language: { contestSessionId: session.id, problemId, language } },
                    update: { 
                        code: code, 
                        status: 'DRAFT', 
                        updatedAt: currentTimeIST // 🚀 Explicitly override Prisma's default UTC
                    },
                    create: { 
                        contestSessionId: session.id, 
                        problemId, 
                        language, 
                        code, 
                        status: 'DRAFT', 
                        updatedAt: currentTimeIST // 🚀 Explicitly override Prisma's default UTC
                    }
                });

                // 🚀 Send live code updates to Admin Dashboard
                io.to(`admin_${contest.id}`).emit(`live-code-${userId}`, {
                    problemId, language, code, status: 'DRAFT', updatedAt: currentTimeIST
                });

            } catch (error) {
                console.error("Save Draft Error:", error);
            }
        });

        socket.on('stop-execution', ({ jobId }) => {
            if (jobId) { cancelledJobs.add(jobId); killJob(jobId); }
        });

        // 🚀 FIXED: CODE EXECUTION SAVING
        socket.on('run-code', async ({ examId, userId, problemId, language, code, jobId }) => {
            if (!code || code.trim() === "") return socket.emit('code-output', { problemId, status: 'Error', results: [{ index: 1, type: 'raw', output: 'No code.' }] });

            try {
                const contest = await getRealContest(examId);
                if (!contest) return;

                const session = await prisma.contestSession.findUnique({
                    where: { userId_contestId: { userId, contestId: contest.id } }
                });
                if (!session) return;

                const problemData = await prisma.problem.findUnique({ where: { id: problemId }, select: { driverCode: true } });

                let driverCodeMap = {};
                if (typeof problemData?.driverCode === 'string') {
                    try { driverCodeMap = JSON.parse(problemData.driverCode); } catch(e) {}
                } else if (problemData?.driverCode) {
                    driverCodeMap = problemData.driverCode;
                }

                let driverCode = "";
                const requestedLang = language.toLowerCase().replace(/\s+/g, '');

                for (const [dbKey, dbVal] of Object.entries(driverCodeMap)) {
                    const normalizedDbKey = dbKey.toLowerCase().replace(/\s+/g, '');
                    if (normalizedDbKey === requestedLang || normalizedDbKey.includes(requestedLang) || requestedLang.includes(normalizedDbKey)) {
                        driverCode = dbVal; break;
                    }
                }

                const testCases = await prisma.testCase.findMany({ where: { problemId }, orderBy: { isHidden: 'asc' } });
                let results = [];
                let allPassed = true;

                // --- RAW EXECUTION (No test cases) ---
                if (!testCases || testCases.length === 0) {
                    socket.emit('execution-progress', { message: 'Running raw execution...' });
                    const res = await executeCode(language, code, driverCode, "", jobId);
                    if (cancelledJobs.has(jobId) || (res.status === 'TLE' && res.output.includes('Terminated'))) {
                        cancelledJobs.delete(jobId); return; 
                    }
                    
                    const currentTimeIST = toIST(); // 🚀 Generate IST
                    
                    await prisma.sessionAnswer.upsert({
                        where: { contestSessionId_problemId_language: { contestSessionId: session.id, problemId, language } },
                        update: { code, status: res.status, updatedAt: currentTimeIST }, // 🚀 Override UTC
                        create: { contestSessionId: session.id, problemId, language, code, status: res.status, updatedAt: currentTimeIST } // 🚀 Override UTC
                    });
                    
                    // 🚀 Update Admin Monitor
                    io.to(`admin_${contest.id}`).emit(`live-code-${userId}`, {
                        problemId, language, code, status: res.status, updatedAt: currentTimeIST
                    });

                    return socket.emit('code-output', { problemId, status: res.status, results: [{ index: 1, type: 'raw', output: res.output }] });
                }

                // --- TEST CASE EXECUTION ---
                for (let i = 0; i < testCases.length; i++) {
                    if (cancelledJobs.has(jobId)) break;
                    const tc = testCases[i];
                    socket.emit('execution-progress', { message: `Executing Test Case ${i + 1}/${testCases.length} ${tc.isHidden ? '(Hidden)' : ''}...` });
                    const iterJobId = `${jobId}_${i}`;
                    const res = await executeCode(language, code, driverCode, tc.input, iterJobId);

                    if (cancelledJobs.has(jobId)) break;

                    if (res.status === 'TLE' && res.output.includes('Terminated')) {
                        results.push({ index: i + 1, passed: false, status: 'Time Limit Exceeded', actual: res.output, isHidden: tc.isHidden });
                        allPassed = false; break; 
                    }
                    if (res.status === 'Runtime Error') {
                        results.push({ index: i + 1, passed: false, status: 'Runtime Error', actual: res.output, isHidden: tc.isHidden });
                        allPassed = false; break; 
                    }

                    const actualOutput = (res.output || "").replace(/\r\n/g, '\n').trim();
                    const expectedOutput = (tc.expectedOutput || "").replace(/\r\n/g, '\n').trim();
                    const passed = res.status === 'Accepted' && actualOutput === expectedOutput;
                    if (!passed) allPassed = false;

                    results.push({
                        index: i + 1, passed, status: res.status === 'Accepted' && !passed ? 'Wrong Answer' : res.status,
                        input: tc.isHidden ? 'Hidden' : tc.input, expected: tc.isHidden ? 'Hidden' : tc.expectedOutput, actual: tc.isHidden ? 'Hidden' : actualOutput, isHidden: tc.isHidden
                    });
                }

                if (cancelledJobs.has(jobId)) { cancelledJobs.delete(jobId); return; }

                let finalStatus = allPassed ? 'Accepted' : 'Failed';
                if (results.length > 0) {
                    const lastStatus = results[results.length - 1].status;
                    if (lastStatus === 'Runtime Error' || lastStatus === 'Time Limit Exceeded') finalStatus = lastStatus;
                }

                const finalTimeIST = toIST(); // 🚀 Generate IST

                await prisma.sessionAnswer.upsert({
                    where: { contestSessionId_problemId_language: { contestSessionId: session.id, problemId, language } },
                    update: { code, status: finalStatus, updatedAt: finalTimeIST }, // 🚀 Override UTC
                    create: { contestSessionId: session.id, problemId, language, code, status: finalStatus, updatedAt: finalTimeIST } // 🚀 Override UTC
                });

                // 🚀 Update Admin Monitor
                io.to(`admin_${contest.id}`).emit(`live-code-${userId}`, {
                    problemId, language, code, status: finalStatus, updatedAt: finalTimeIST
                });

                socket.emit('code-output', { problemId, status: finalStatus, results });

            } catch (error) {
                socket.emit('code-output', { problemId, status: 'Error', results: [{ index: 1, passed: false, actual: error.message, isHidden: false }] });
            }
        });

        socket.on('violation-tab-switch', async ({ examId, userId, reason }) => {
            try {
                const contest = await getRealContest(examId);
                if (!contest) return;

                const session = await prisma.contestSession.findUnique({
                    where: { userId_contestId: { userId, contestId: contest.id } }
                });

                if (session && session.status === "IN_PROGRESS") {
                    const newStrikes = session.strikes + 1;
                    let newStatus = "IN_PROGRESS";
                    if (contest.strikes > 0 && newStrikes >= contest.strikes) newStatus = "KICKED"; 

                    await prisma.contestSession.update({
                        where: { id: session.id },
                        data: { strikes: newStrikes, status: newStatus, ...(newStatus === "KICKED" && { completedAt: toIST() }) }
                    });

                    socket.emit('strike-update', { count: newStrikes, limit: contest.strikes, status: newStatus, reason: reason });
                    await broadcastToAdmins(contest.id); 
                }
            } catch (err) {}
        });

        socket.on('disconnect', () => {});
    });
};

module.exports = examSocket;
