const os = require('os');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const prisma = require('../../prisma/prisma');
const { getSystemLogs, logRamSpike } = require('../utils/systemLogger');

// 🚀 --- SETTINGS MANAGER ---
const settingsPath = path.join(__dirname, '../../config_settings.json');
let currentSettings = { maxMem: 256, maxCpu: 0.5, globalTle: 5.0 };

if (fs.existsSync(settingsPath)) {
    try {
        currentSettings = { ...currentSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
    } catch (e) {
        console.error("Failed to parse settings JSON");
    }
}

const getDiskUsage = () => {
    return new Promise((resolve) => {
        exec('df -h /', (error, stdout) => {
            if (error) return resolve({ total: '0GB', used: '0GB', percent: 0 });
            const lines = stdout.trim().split('\n');
            const cols = lines[1].split(/\s+/);
            resolve({ total: cols[1], used: cols[2], percent: parseInt(cols[4].replace('%', '')) });
        });
    });
};

exports.getEngineSettings = () => currentSettings;

exports.getSystemAndSettings = async (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const ramUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
        const freeRamMB = Math.round(freeMem / (1024 * 1024));
        const disk = await getDiskUsage();

        res.status(200).json({
            system: { ramPercent: ramUsagePercent, freeRamMB, diskPercent: disk.percent, diskUsed: disk.used, diskTotal: disk.total },
            settings: currentSettings
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};

exports.saveSettings = (req, res) => {
    try {
        currentSettings = { ...currentSettings, ...req.body };
        fs.writeFileSync(settingsPath, JSON.stringify(currentSettings, null, 2));
        res.status(200).json({ message: "Settings updated successfully", settings: currentSettings });
    } catch (err) {
        res.status(500).json({ error: "Failed to save settings" });
    }
};

// 🚀 --- ORIGINAL DASHBOARD STATS ---
exports.getDashboardStats = async (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramUsagePercent = Math.round((usedMem / totalMem) * 100);

        if (ramUsagePercent > 85) {
            logRamSpike(ramUsagePercent);
        }

        const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } });
        const now = new Date();
        const activeContestsCount = await prisma.contest.count({
            where: { startTime: { lte: now }, endTime: { gte: now } }
        });

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const submissionsToday = await prisma.sessionAnswer.count({
            where: { updatedAt: { gte: startOfDay } }
        });

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentSubmissions = await prisma.sessionAnswer.findMany({
            where: { updatedAt: { gte: oneDayAgo } },
            select: { updatedAt: true }
        });
        
        const chartData = [0, 0, 0, 0, 0, 0, 0];
        recentSubmissions.forEach(sub => {
            const diffHours = (Date.now() - new Date(sub.updatedAt).getTime()) / (1000 * 60 * 60);
            const bucketIndex = 6 - Math.floor(diffHours / 4); 
            if (bucketIndex >= 0 && bucketIndex <= 6) chartData[bucketIndex]++;
        });

        const activeContestsList = await prisma.contest.findMany({
            where: { startTime: { lte: now }, endTime: { gte: now } },
            include: { _count: { select: { sessions: true } } },
            orderBy: { startTime: 'desc' },
            take: 4
        });

        res.status(200).json({
            ramUsage: ramUsagePercent,
            totalUsers,
            activeContests: activeContestsCount,
            submissionsToday,
            chartData,
            activeContestsList,
            systemLogs: getSystemLogs() 
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
};