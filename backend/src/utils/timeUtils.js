// src/utils/timeUtils.js

/**
 * Converts a given date or the current date to Indian Standard Time (IST).
 * Returns an ISO string to prevent Prisma from forcefully converting it back to UTC.
 *
 * @param {Date|string|number} dateInput - Optional date to convert. Defaults to now.
 * @returns {string} An ISO-8601 string offset to IST.
 */
const toIST = (dateInput = null) => {
    // 1. Get the target date or now
    const date = dateInput ? new Date(dateInput) : new Date();
    
    // 2. Calculate the exact milliseconds in IST
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istDate = new Date(utc + (330 * 60000));
    
    // 3. Format it manually to "YYYY-MM-DDTHH:mm:ss.000Z"
    // By keeping the 'Z' (UTC marker) on the *shifted* time, Prisma writes
    // the IST numbers directly into the DB as if they were UTC.
    const pad = (num) => num.toString().padStart(2, '0');
    
    return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(istDate.getDate())}T${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(istDate.getSeconds())}.000Z`;
};

module.exports = { toIST };