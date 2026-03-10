const prisma = require('../../prisma/prisma');
const bcrypt = require('bcrypt');
const { toIST } = require('../utils/timeUtils');

// 1. Get All Users (Updated to include status)
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            // 🚀 Added 'status' so the frontend knows who is suspended
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// 2. Create User (Updated to include status)
const createUser = async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ error: "Email already in use" });

        const hashedPassword = await bcrypt.hash(password || "password123", 10);

        const newUser = await prisma.user.create({
            data: { 
                name, 
                email, 
                role: role || "STUDENT", 
                status: "ACTIVE", // 🚀 Default to ACTIVE
                password: hashedPassword,
                createdAt: toIST()
            },
            select: { id: true, name: true, email: true, role: true, status: true }
        });
        res.status(201).json({ user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Failed to create user" });
    }
};

// 3. Get Current User
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true, name: true, email: true, role: true, status: true, createdAt: true
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });
        if (user.status === 'SUSPENDED') return res.status(403).json({ error: "Account Suspended" });

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

// 4. Change User Role (🚀 NEW)
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: { id: true, name: true, email: true, role: true, status: true }
        });
        res.status(200).json({ message: "Role updated successfully", user });
    } catch (error) {
        console.error("Update Role Error:", error);
        res.status(500).json({ error: "Failed to update user role" });
    }
};

// 5. Suspend / Reactivate User (🚀 NEW)
const updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expects 'ACTIVE' or 'SUSPENDED'
    
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { status },
            select: { id: true, name: true, email: true, role: true, status: true }
        });
        res.status(200).json({ message: `Account ${status.toLowerCase()} successfully`, user });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ error: "Failed to update account status" });
    }
};

// 6. Get User History (🚀 NEW)
const getUserHistory = async (req, res) => {
    const { id } = req.params;
    
    try {
        // Find user details
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, email: true, role: true, status: true, createdAt: true }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        // Fetch their contest history
        const sessions = await prisma.contestSession.findMany({
            where: { userId: id },
            include: {
                contest: { select: { title: true, startTime: true, endTime: true, strictMode: true } }
            },
            orderBy: { joinedAt: 'desc' }
        });

        res.status(200).json({ user, history: sessions });
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ error: "Failed to fetch user history" });
    }
};

module.exports = { 
    getAllUsers, 
    createUser, 
    getMe, 
    updateUserRole, 
    updateUserStatus, 
    getUserHistory 
};