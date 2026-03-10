// Holds the last 10 system events in server memory
const systemLogs = [];
const MAX_LOGS = 10;
let lastRamAlert = 0; // Prevents spamming RAM alerts every second

const addSystemLog = (type, message, detail) => {
    systemLogs.unshift({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        type, // 'error' (red), 'warning' (amber), 'info' (blue)
        message,
        detail,
        timestamp: new Date()
    });

    // Keep only the newest 10 logs
    if (systemLogs.length > MAX_LOGS) {
        systemLogs.pop();
    }
};

const getSystemLogs = () => systemLogs;

// Helper to prevent spamming RAM alerts
const logRamSpike = (usage) => {
    const now = Date.now();
    // Only log a RAM spike once every 5 minutes max to avoid spam
    if (now - lastRamAlert > 5 * 60 * 1000) {
        addSystemLog('warning', 'High Memory Usage Detected', `Usage spiked to ${usage}% on Debian VM`);
        lastRamAlert = now;
    }
};

module.exports = { addSystemLog, getSystemLogs, logRamSpike };