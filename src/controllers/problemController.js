const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { toIST } = require('../utils/timeUtils'); // 👈 Import the utility

// 1. Get all problems
const getAllProblems = async (req, res) => {
    try {
        const problems = await prisma.problem.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                contests: { select: { id: true, title: true } } 
            }
        });
        res.status(200).json({ problems });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch problem library" });
    }
};

const getProblemById = async (req, res) => {
    const { id } = req.params;
    try {
        const problem = await prisma.problem.findUnique({
            where: { id },
            include: { testCases: true } 
        });
        if (!problem) return res.status(404).json({ error: "Problem not found" });
        res.status(200).json({ problem });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};

const createProblem = async (req, res) => {
    const { title, description, diff, tag, contestId, testCases, codeStubs, solutions } = req.body;
    try {
        const newProblem = await prisma.problem.create({
            data: {
                title, description, diff, tag,
                codeStubs: codeStubs || {}, 
                solution: solutions || {},  
                createdAt: toIST(), // 👈 Explicitly save in IST
                contests: contestId ? { connect: { id: contestId } } : undefined,
                testCases: testCases && testCases.length > 0 ? {
                    create: testCases.map(tc => ({
                        input: tc.input || "",
                        expectedOutput: tc.expectedOutput || "",
                        isHidden: tc.isHidden || false
                    }))
                } : undefined
            }
        });
        res.status(201).json({ message: "Problem created!", problem: newProblem });
    } catch (error) {
        res.status(500).json({ error: "Failed to create problem" });
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const { title, description, diff, tag, testCases, codeStubs, solutions } = req.body;
    try {
        await prisma.testCase.deleteMany({ where: { problemId: id } });
        const updated = await prisma.problem.update({
            where: { id },
            data: { 
                title, description, diff, tag,
                codeStubs: codeStubs || {}, 
                solution: solutions || {},  
                testCases: testCases && testCases.length > 0 ? {
                    create: testCases.map(tc => ({
                        input: tc.input || "", expectedOutput: tc.expectedOutput || "", isHidden: tc.isHidden || false
                    }))
                } : undefined
            }
        });
        res.status(200).json({ message: "Problem updated!", problem: updated });
    } catch (error) {
        res.status(500).json({ error: "Failed to update problem" });
    }
};

const deleteProblem = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.problem.delete({ where: { id } });
        res.status(200).json({ message: "Problem deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete problem" });
    }
};

module.exports = { getAllProblems, getProblemById, createProblem, updateProblem, deleteProblem };