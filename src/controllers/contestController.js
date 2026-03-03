const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { toIST } = require('../utils/timeUtils');

// 1. Initialize or Create a Contest/Draft
const createDraft = async (req, res) => {
    try {
        const { 
            title, description, startTime, endTime, 
            isPrivate, joinCode, strikes, strictMode, // 👈 Removed ipWhitelist
            allowedLangs, status, problemIds 
        } = req.body;

        // 👇 UNIQUENESS CHECK
        if (isPrivate && joinCode) {
            const existingCode = await prisma.contest.findUnique({ where: { joinCode } });
            if (existingCode) {
                return res.status(400).json({ error: "Join code is already taken. Please enter a different one." });
            }
        }

        const contest = await prisma.contest.create({
            data: {
                title: title || "Untitled Contest",
                description,
                startTime: startTime ? toIST(startTime) : null,
                endTime: endTime ? toIST(endTime) : null,
                isPrivate: isPrivate || false,
                joinCode: isPrivate ? joinCode : null, 
                // 👈 Removed ipWhitelist from here
                strikes: strikes || 3,
                strictMode: strictMode || true,
                status: status || "DRAFT",
                allowedLangs: allowedLangs ? allowedLangs.join(',') : "Python,Python 3,Java,C,C++,C#",
                creatorId: req.user.id,
                createdAt: toIST(),
                problems: problemIds ? { connect: problemIds.map(id => ({ id })) } : undefined
            },
            include: { problems: true }
        });

        res.status(201).json({ id: contest.id, contest });
    } catch (error) {
        console.error("Create Draft Error:", error);
        res.status(500).json({ error: "Failed to initialize contest" });
    }
};

// 2. Auto-Save (Update) Logic
const updateContest = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    
    try {
        // 👇 UNIQUENESS CHECK (Ignoring the current contest's own code)
        if (data.isPrivate && data.joinCode) {
            const existingCode = await prisma.contest.findFirst({
                where: { joinCode: data.joinCode, id: { not: id } }
            });
            if (existingCode) {
                return res.status(400).json({ error: "Join code is already taken. Please enter a different one." });
            }
        }

        const updated = await prisma.contest.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                startTime: data.startTime ? toIST(data.startTime) : null,
                endTime: data.endTime ? toIST(data.endTime) : null,
                isPrivate: data.isPrivate,
                joinCode: data.isPrivate ? data.joinCode : null,
                // 👈 Removed ipWhitelist from here
                strikes: data.strikes,
                strictMode: data.strictMode,
                allowedLangs: data.allowedLangs ? data.allowedLangs.join(',') : undefined,
                status: data.status || undefined,
                problems: data.problemIds ? { set: data.problemIds.map(pid => ({ id: pid })) } : undefined
            },
            include: { problems: true }
        });
        res.status(200).json({ contest: updated });
    } catch (error) {
        console.error("Update Contest Error:", error);
        res.status(500).json({ error: "Failed to save contest" });
    }
};

// 3. Fetch Problem Library (Grouped by Contest)
const getGroupedLibrary = async (req, res) => {
    const { excludeContestId } = req.query; 
    try {
        const activeContests = await prisma.contest.findMany({
            where: { 
                status: "ACTIVE",
                id: { not: excludeContestId }
            },
            select: {
                id: true,
                title: true,
                problems: {
                    include: { contests: { select: { id: true, title: true } } }
                }
            }
        });
        res.status(200).json({ grouped: activeContests });
    } catch (error) {
        res.status(500).json({ error: "Failed to load library" });
    }
};

// 4. Delete Contest & Orphan Cleanup Logic
const deleteContest = async (req, res) => {
    const { id } = req.params;
    try {
        const contest = await prisma.contest.findUnique({
            where: { id },
            include: { problems: { include: { contests: true } } }
        });

        await prisma.contest.delete({ where: { id } });

        const orphans = contest.problems.filter(p => p.contests.length === 1);
        for (const orphan of orphans) {
            await prisma.problem.delete({ where: { id: orphan.id } });
        }

        res.status(200).json({ message: "Contest and orphaned problems deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete" });
    }
};

// 5. Get a specific contest by ID or Join Code
const getContestById = async (req, res) => {
    const { id } = req.params;
    try {
        const contest = await prisma.contest.findFirst({
            where: {
                OR: [
                    { id: id },
                    { joinCode: id }
                ]
            },
            include: { 
                problems: {
                    include: { contests: { select: { id: true, title: true } } }
                },
                creator: { select: { name: true } } 
            }
        });

        if (!contest) {
            return res.status(404).json({ error: "Contest not found or Invalid Code" });
        }

        res.status(200).json({ contest });
    } catch (error) {
        console.error("Fetch Contest Error:", error);
        res.status(500).json({ error: "Failed to fetch contest details" });
    }
};

// 6. Duplicate an existing contest
const duplicateContest = async (req, res) => {
    const { id } = req.params;
    try {
        const original = await prisma.contest.findUnique({
            where: { id },
            include: { problems: true }
        });

        if (!original) return res.status(404).json({ error: "Original not found" });

        const copy = await prisma.contest.create({
            data: {
                title: `${original.title} (Copy)`,
                description: original.description,
                startTime: original.startTime, 
                endTime: original.endTime,
                isPrivate: original.isPrivate,
                joinCode: original.joinCode ? `${original.joinCode}_copy` : null, // 👈 Added joinCode logic here too
                strikes: original.strikes,
                strictMode: original.strictMode,
                allowedLangs: original.allowedLangs,
                status: "DRAFT",
                creatorId: req.user.id,
                createdAt: toIST(), 
                problems: {
                    connect: original.problems.map(p => ({ id: p.id }))
                }
            }
        });

        res.status(201).json({ id: copy.id });
    } catch (error) {
        res.status(500).json({ error: "Failed to duplicate" });
    }
};

// 7. Get all contests
const getAllContests = async (req, res) => {
    try {
        const contests = await prisma.contest.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                _count: { select: { problems: true } }
            }
        });
        res.status(200).json({ contests });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contests" });
    }
};

module.exports = { createDraft, updateContest, getGroupedLibrary, deleteContest, getContestById, duplicateContest, getAllContests};