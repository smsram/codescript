const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { toIST } = require('../utils/timeUtils'); // 👈 Import the utility

const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

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
                password: hashedPassword,
                createdAt: toIST() // 👈 Explicitly save in IST
            },
            select: { id: true, name: true, email: true, role: true }
        });
        res.status(201).json({ user: newUser });
    } catch (error) {
        res.status(500).json({ error: "Failed to create user" });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) return res.status(404).json({ error: "User not found" });

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getAllUsers, createUser, getMe };