const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { toIST } = require('../utils/timeUtils');

const getStudentDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date(toIST());

        // 1. Fetch User Data
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
        });

        // 2. Fetch Active Contests (Rules 1, 3, & 4)
        // Must be ACTIVE (not draft), public (not private), and NOT completed (endTime > now)
        const activeContests = await prisma.contest.findMany({
            where: { 
                status: "ACTIVE",       // Rule 1: Not a draft
                isPrivate: false,       // Rule 4: Not private
                OR: [
                    { endTime: null },
                    { endTime: { gt: now } } // Rule 3: Don't load if completed (moves to history)
                ]
            },
            include: { _count: { select: { problems: true } } }
        });

        // 3. Sort into Live vs Upcoming based on Start Time
        const mappedExams = activeContests.map(c => {
            const isUpcoming = c.startTime && new Date(c.startTime) > now;
            return {
                id: c.id,
                title: c.title,
                professor: "Admin", 
                status: isUpcoming ? "Upcoming" : "Live",
                startTime: c.startTime, 
                problems: c._count.problems
            };
        });

        // 4. Fetch Completed Contests ONLY if the user attempted them (Rules 2 & 3)
        const userSubmissions = await prisma.submission.findMany({
            where: { userId },
            include: { 
                problem: { 
                    include: { 
                        contests: { select: { id: true, title: true, endTime: true, status: true } } 
                    } 
                } 
            }
        });

        const participatedContestsMap = new Map();
        userSubmissions.forEach(sub => {
            sub.problem.contests.forEach(c => {
                const isCompleted = c.endTime && new Date(c.endTime) <= now;
                if (isCompleted || c.status === "CLOSED") {
                    participatedContestsMap.set(c.id, c);
                }
            });
        });
        const historyContests = Array.from(participatedContestsMap.values());

        // 5. Calculate Stats
        const totalSolved = userSubmissions.length; 

        res.status(200).json({
            user: {
                name: user.name,
                studentId: `#${user.id.substring(0, 6).toUpperCase()}`
            },
            exams: mappedExams,
            history: historyContests.map(c => ({
                id: c.id,
                title: c.title,
                date: c.endTime ? new Date(c.endTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) : 'Recently',
                score: "Completed",
                scoreClass: "score-med"
            })),
            stats: {
                totalSolved,
                avgPassRate: totalSolved > 0 ? "85%" : "0%"
            }
        });

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ error: "Failed to load dashboard data" });
    }
};

module.exports = { getStudentDashboard };