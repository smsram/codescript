const prisma = require('../../prisma/prisma');
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

        if (!user) return res.status(404).json({ error: "User not found" });

        // 2. Fetch Active Contests
        const activeContests = await prisma.contest.findMany({
            where: { 
                status: "ACTIVE",
                isPrivate: false,
                OR: [
                    { endTime: null },
                    { endTime: { gt: now } }
                ]
            },
            include: { _count: { select: { problems: true } } }
        });

        // 3. Sort into Live vs Upcoming
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

        // 4. Fetch Completed Contests via ContestSession (Rule 2 & 3)
        // Since we removed the Submission table, we check ContestSessions for history
        const userSessions = await prisma.contestSession.findMany({
            where: { 
                userId,
                status: { in: ["SUBMITTED", "KICKED"] } // Only show finished attempts in history
            },
            include: {
                contest: {
                    select: { id: true, title: true, endTime: true }
                },
                _count: {
                    select: { answers: { where: { status: "Accepted" } } } // Count solved problems
                }
            }
        });

        // 5. Calculate Total Solved (Aggregating from the new SessionAnswer table)
        const totalSolved = await prisma.sessionAnswer.count({
            where: {
                contestSession: { userId },
                status: "Accepted"
            }
        });

        res.status(200).json({
            user: {
                name: user.name,
                studentId: `#${user.id.substring(0, 6).toUpperCase()}`
            },
            exams: mappedExams,
            history: userSessions.map(s => ({
                id: s.contest.id,
                title: s.contest.title,
                date: s.completedAt 
                    ? new Date(s.completedAt).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) 
                    : (s.contest.endTime ? new Date(s.contest.endTime).toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' }) : 'Recently'),
                score: s.status === "KICKED" ? "Terminated" : "Completed",
                scoreClass: s.status === "KICKED" ? "score-low" : "score-med"
            })),
            stats: {
                totalSolved,
                avgPassRate: totalSolved > 0 ? "85%" : "0%" // Static placeholder or calculate logic here
            }
        });

    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        res.status(500).json({ error: "Failed to load dashboard data" });
    }
};

module.exports = { getStudentDashboard };