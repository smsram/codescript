const prisma = require('../../prisma/prisma');
const { toIST } = require('../utils/timeUtils');

// 🚀 GLOBAL AUTO-SWEEP ENGINE (Runs passively on exact IST time)
const sweepExpiredSessions = async () => {
    try {
        const currentTime = toIST();
        
        const expiredContests = await prisma.contest.findMany({
            where: { endTime: { lt: currentTime } },
            select: { id: true }
        });

        if (expiredContests.length > 0) {
            await prisma.contestSession.updateMany({
                where: { 
                    contestId: { in: expiredContests.map(c => c.id) }, 
                    status: 'IN_PROGRESS' 
                },
                data: { status: 'SUBMITTED', completedAt: currentTime }
            });
        }
    } catch (error) {
        console.error("Global Auto-Sweep Error:", error);
    }
};

const createDraft = async (req, res) => {
    try {
        const { title, description, startTime, endTime, isPrivate, joinCode, strikes, strictMode, allowedLangs, status } = req.body;
        if (isPrivate && joinCode) {
            const existingCode = await prisma.contest.findUnique({ where: { joinCode } });
            if (existingCode) return res.status(400).json({ error: "Join code taken." });
        }
        const contest = await prisma.contest.create({
            data: {
                title: title || "Untitled Contest", description,
                startTime: startTime ? toIST(startTime) : null, endTime: endTime ? toIST(endTime) : null,
                isPrivate: isPrivate || false, joinCode: isPrivate ? joinCode : null, 
                strikes: strikes || 3, strictMode: strictMode !== undefined ? strictMode : true,
                status: status || "DRAFT",
                allowedLangs: Array.isArray(allowedLangs) ? allowedLangs.join(',') : (allowedLangs || "Python,Python 3,Java,C,C++,C#"),
                creatorId: req.user.id, createdAt: toIST()
            }
        });
        res.status(201).json({ id: contest.id, contest });
    } catch (error) {
        res.status(500).json({ error: "Failed to initialize contest" });
    }
};

const updateContest = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        if (data.isPrivate && data.joinCode) {
            const existingCode = await prisma.contest.findFirst({
                where: { joinCode: data.joinCode, id: { not: id } }
            });
            if (existingCode) return res.status(400).json({ error: "Join code is already taken." });
        }

        const updated = await prisma.contest.update({
            where: { id },
            data: {
                title: data.title, description: data.description,
                startTime: data.startTime ? toIST(data.startTime) : null, endTime: data.endTime ? toIST(data.endTime) : null,
                isPrivate: data.isPrivate, joinCode: data.isPrivate ? data.joinCode : null,
                strikes: data.strikes, strictMode: data.strictMode,
                allowedLangs: Array.isArray(data.allowedLangs) ? data.allowedLangs.join(',') : data.allowedLangs,
                status: data.status || undefined
            }
        });

        if (data.orderedProblemIds && Array.isArray(data.orderedProblemIds)) {
            const orderUpdates = data.orderedProblemIds.map((problemId, index) => 
                prisma.problem.update({ where: { id: problemId }, data: { order: index } })
            );
            await prisma.$transaction(orderUpdates);
        }
        res.status(200).json({ contest: updated });
    } catch (error) {
        res.status(500).json({ error: "Failed to save contest" });
    }
};

const deleteContest = async (req, res) => {
    try {
        await prisma.contest.delete({ where: { id: req.params.id } });
        res.status(200).json({ message: "Contest deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};

// 🚀 IN: src/controllers/contestController.js
// Replace your existing getContestById with this:
const getContestById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id; 

    try {
        await sweepExpiredSessions();

        const contest = await prisma.contest.findFirst({
            where: { OR: [{ id: id }, { joinCode: id }] },
            include: {
                problems: { select: { id: true, title: true, description: true, diff: true, tag: true, codeStubs: true, order: true }, orderBy: { order: 'asc' } },
                creator: { select: { name: true } }
            }
        });

        if (!contest) return res.status(404).json({ error: "Contest not found" });

        let session = null;

        if (userId !== contest.creatorId) {
            const currentTime = toIST();
            const isOver = contest.endTime && currentTime > new Date(contest.endTime);

            session = await prisma.contestSession.findUnique({
                where: { userId_contestId: { userId, contestId: contest.id } }
            });

            // 🛑 ONLY BLOCK IF EXAM IS OVER AND THEY NEVER JOINED. 
            // DO NOT block if it hasn't started, so the Lobby can show the countdown!
            if (!session && isOver) {
                return res.status(403).json({ error: "Exam time is already over. You did not participate." });
            }
        }

        res.status(200).json({ contest, session });
    } catch (error) {
        if (error.code === 'P2024') return res.status(503).json({ error: "Server is busy. Please try again." });
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const duplicateContest = async (req, res) => {
    try {
        const original = await prisma.contest.findUnique({
            where: { id: req.params.id }, include: { problems: { include: { testCases: true } } }
        });
        if (!original) return res.status(404).json({ error: "Original not found" });

        const copy = await prisma.contest.create({
            data: {
                title: `${original.title} (Copy)`, description: original.description,
                startTime: original.startTime, endTime: original.endTime,
                isPrivate: original.isPrivate, joinCode: original.joinCode ? `${original.joinCode}_copy` : null,
                strikes: original.strikes, strictMode: original.strictMode, allowedLangs: original.allowedLangs,
                status: "DRAFT", creatorId: req.user.id, createdAt: toIST(), 
                problems: {
                    create: original.problems.map(p => ({
                        title: p.title, description: p.description, diff: p.diff, tag: p.tag,
                        codeStubs: p.codeStubs || {}, solution: p.solution || {}, driverCode: p.driverCode || {},
                        testCases: { create: p.testCases.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput, isHidden: tc.isHidden })) }
                    }))
                }
            }
        });
        res.status(201).json({ id: copy.id });
    } catch (error) {
        res.status(500).json({ error: "Failed to duplicate" });
    }
};

const getAllContests = async (req, res) => {
    try {
        await sweepExpiredSessions();
        const contests = await prisma.contest.findMany({
            orderBy: { createdAt: 'desc' }, include: { _count: { select: { problems: true } } }
        });
        res.status(200).json({ contests });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contests" });
    }
};

const getContestDetails = async (req, res) => {
    try {
        // Fetch Contest Details & Total Problems Count
        const contest = await prisma.contest.findFirst({
            where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] },
            select: { 
                id: true, title: true, status: true, strikes: true, 
                strictMode: true, startTime: true, endTime: true,
                _count: { select: { problems: true } } // 🚀 Fetch total questions
            }
        });
        
        if (!contest) return res.status(404).json({ error: "Contest not found" });

        // Fetch Sessions with ONLY "Accepted" Answers
        const sessions = await prisma.contestSession.findMany({
            where: { contestId: contest.id }, 
            include: { 
                user: { select: { name: true, email: true } },
                answers: {
                    where: { status: "Accepted" }, // 🚀 ONLY fetch successful executions
                    select: { problemId: true }
                }
            }, 
            orderBy: { joinedAt: 'desc' }
        });

        // Calculate Unique Attempts
        const enrichedSessions = sessions.map(session => {
            // 🚀 Use a Set to ensure we don't double-count if they got "Accepted" in 2 different languages
            const uniqueSolvedProblems = new Set(session.answers.map(a => a.problemId));

            return {
                id: session.id,
                userId: session.userId,
                status: session.status,
                strikes: session.strikes,
                joinedAt: session.joinedAt,
                user: session.user,
                attempted: uniqueSolvedProblems.size // 🚀 Map unique successful attempts
            };
        });

        res.status(200).json({ 
            contestTitle: contest.title, 
            contestStatus: contest.status, 
            contestStrikes: contest.strikes,
            startTime: contest.startTime,
            endTime: contest.endTime,
            totalProblems: contest._count?.problems || 0, // 🚀 Return total problems
            sessions: enrichedSessions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error fetching details" });
    }
};

const resetStudentExam = async (req, res) => {
    const { userId } = req.body;
    try {
        const contest = await prisma.contest.findFirst({ where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] } });
        if(contest) await prisma.contestSession.delete({ where: { userId_contestId: { userId, contestId: contest.id } } });
        res.status(200).json({ message: "Exam data wiped and reset successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to reset student exam." });
    }
};

const terminateStudentExam = async (req, res) => {
    const { userId } = req.body;
    try {
        const contest = await prisma.contest.findFirst({ where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] } });
        if(contest) await prisma.contestSession.update({ where: { userId_contestId: { userId, contestId: contest.id } }, data: { status: 'KICKED', completedAt: toIST() } });
        res.status(200).json({ message: "Student session terminated." });
    } catch (error) {
        res.status(500).json({ error: "Failed to terminate session." });
    }
};

// 🚀 FIXED: Rejects manual submission attempts if user has no session
const submitExam = async (req, res) => {
    const userId = req.user.id;
    try {
        await sweepExpiredSessions();
        const contest = await prisma.contest.findFirst({ where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] } });
        if (!contest) return res.status(404).json({ error: "Not found" });

        const session = await prisma.contestSession.findUnique({ where: { userId_contestId: { userId, contestId: contest.id } } });
        
        if (!session) return res.status(400).json({ error: "You cannot submit an exam you never started." });
        if (session.status !== "IN_PROGRESS") return res.status(200).json({ message: "Exam was already submitted." });

        await prisma.contestSession.update({
            where: { userId_contestId: { userId, contestId: contest.id } },
            data: { status: 'SUBMITTED', completedAt: toIST() }
        });
        res.status(200).json({ message: "Exam submitted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Server error submitting exam." });
    }
};

const getStudentLogs = async (req, res) => {
    const { userId } = req.params;
    try {
        await sweepExpiredSessions();
        const contest = await prisma.contest.findFirst({ where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] } });
        if(!contest) return res.status(404).json({error: "Contest not found"});

        const session = await prisma.contestSession.findUnique({
            where: { userId_contestId: { userId, contestId: contest.id } }, include: { user: { select: { name: true, email: true } } }
        });
        if (!session) return res.status(404).json({ error: "Session not found" });

        const answers = await prisma.sessionAnswer.findMany({
            where: { contestSessionId: session.id }, include: { problem: { select: { title: true } } }, orderBy: { updatedAt: 'desc' }
        });
        res.status(200).json({ session, answers });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};

const getMySubmissions = async (req, res) => {
    try {
        const userId = req.user.id;
        await sweepExpiredSessions();
        const contest = await prisma.contest.findFirst({ where: { OR: [{ id: req.params.id }, { joinCode: req.params.id }] } });
        if(!contest) return res.status(404).json({error: "Contest not found"});

        const session = await prisma.contestSession.findUnique({
            where: { userId_contestId: { userId, contestId: contest.id } }
        });
        if (!session) return res.status(404).json({ error: "Session not found" });

        const answers = await prisma.sessionAnswer.findMany({
            where: { contestSessionId: session.id }, include: { problem: { select: { title: true } } }, orderBy: { updatedAt: 'desc' } 
        });
        res.status(200).json({ session, answers });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
};

module.exports = { 
    createDraft, updateContest, deleteContest, getContestById, duplicateContest, getAllContests, getContestDetails, resetStudentExam, terminateStudentExam, submitExam, getStudentLogs, getMySubmissions
};
