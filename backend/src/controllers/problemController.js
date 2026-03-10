const prisma = require('../../prisma/prisma');
const { toIST } = require('../utils/timeUtils');
const { uploadImage, deleteImage } = require('../services/cloudinaryService');
const { generateProblemJSON } = require('../services/geminiService');
const { executeCode } = require('../services/dockerService');

// 1. Get all problems
const getAllProblems = async (req, res) => {
    try {
        const problems = await prisma.problem.findMany({
            orderBy: { createdAt: 'desc' },
            include: { 
                // 🚀 FIXED: 'contest' is now singular based on the new schema
                contest: { select: { id: true, title: true } } 
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

const testSolution = async (req, res) => {
    try {
        const { language, solutionCode, driverCode, testCases } = req.body;

        if (!language || !solutionCode || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ error: "Missing required fields to run tests." });
        }

        const results = [];
        
        // Loop through each test case and execute using your Docker Service
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            
            // Execute the code
            const result = await executeCode(
                language,
                solutionCode,
                driverCode || "",
                tc.input || ""
            );

            // Check if execution was successful (No compilation/runtime errors)
            if (result.status === 'Accepted') {
                const actualOutput = (result.output || "").replace(/\r\n/g, '\n').trim();
                const expectedOutput = (tc.expectedOutput || "").replace(/\r\n/g, '\n').trim();
                const passed = actualOutput === expectedOutput;

                results.push({
                    passed: passed,
                    actualOutput: actualOutput,
                    error: passed ? null : "Output mismatch."
                });
            } else {
                // Handle Compilation Errors, TLE, or Runtime Errors
                results.push({
                    passed: false,
                    actualOutput: null,
                    error: result.output || result.status
                });
            }
        }

        res.status(200).json({ success: true, results });

    } catch (error) {
        console.error("Test Solution Error:", error);
        res.status(500).json({ error: "Internal server error during execution." });
    }
};

const createProblem = async (req, res) => {
    const { title, description, diff, tag, contestId, testCases, codeStubs, solutions, driverCode } = req.body;
    
    try {
        const newProblem = await prisma.problem.create({
            data: {
                title, 
                description, 
                diff, 
                tag,
                codeStubs: codeStubs || {}, 
                solution: solutions || {},  
                driverCode: driverCode || {}, 
                createdAt: toIST(), 
                
                // 🚀 FIXED: Directly assign contestId instead of the old "contests: { connect: ... }" syntax
                contestId: contestId || null,

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
        console.error("Failed to create problem:", error);
        res.status(500).json({ error: "Failed to create problem" });
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const { title, description, diff, tag, testCases, codeStubs, solutions, driverCode } = req.body;
    
    try {
        await prisma.testCase.deleteMany({ where: { problemId: id } });
        
        const updated = await prisma.problem.update({
            where: { id },
            data: { 
                title, 
                description, 
                diff, 
                tag,
                codeStubs: codeStubs || {}, 
                solution: solutions || {},  
                driverCode: driverCode || {}, 
                
                testCases: testCases && testCases.length > 0 ? {
                    create: testCases.map(tc => ({
                        input: tc.input || "", expectedOutput: tc.expectedOutput || "", isHidden: tc.isHidden || false
                    }))
                } : undefined
            }
        });
        res.status(200).json({ message: "Problem updated!", problem: updated });
    } catch (error) {
        console.error("Failed to update problem:", error);
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

const uploadProblemImage = async (req, res) => {
    try {
        const { image } = req.body; 
        if (!image) return res.status(400).json({ error: "No image payload received by the server." });

        console.log("Attempting to upload image to Cloudinary...");
        const result = await uploadImage(image);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message || "Server crashed during image upload." });
    }
};

const deleteProblemImage = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) return res.status(400).json({ error: "No public_id provided" });
        await deleteImage(public_id);
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Gemini AI Problem Generator
const generateAIProblem = async (req, res) => {
    try {
        const { promptText, difficulty, allowedLangs } = req.body;

        if (!promptText) return res.status(400).json({ error: "Prompt is required" });

        const systemPrompt = `You are an expert competitive programming problem setter. Create a coding problem based on this request: "${promptText}".
Difficulty: ${difficulty}.
Allowed Languages: ${(allowedLangs || ['Python 3', 'Java', 'C++']).join(', ')}.

Return STRICTLY a valid JSON object matching this exact schema (do not include markdown code blocks like \`\`\`json, just the raw JSON):
{
  "title": "Problem Title",
  "description": "Full markdown description.",
  "tag": "Primary topic tag",
  "codeStubs": { "Python 3": "...", "Java": "..." },
  "solutions": { "Python 3": "...", "Java": "..." },
  "driverCode": { "Python 3": "...", "Java": "..." },
  "testCases": [
    { "input": "...", "expectedOutput": "...", "isHidden": false }
  ]
}

CRITICAL RULES:
1. LANGUAGE NAME: You MUST use "Python 3" as the key. NEVER use "Python".
2. ESCAPING: Use single quotes for strings inside code. Double escape LaTeX backslashes (\\\\le).
3. FORMATTING: Use \\n for EVERY newline and \\t for EVERY tab.
4. EXAMPLES: Put Input and Output examples inside \`\`\`text ... \`\`\` blocks so they render on separate lines.
5. REQUIREMENTS: Provide driverCode that parses standard input, calls the codeStub function, and prints the result. Provide at least 3 test cases (at least 1 hidden).

DESCRIPTION FORMATTING GUIDE:
Make the description highly readable using these Markdown elements:
* Headings: Use # for H1, ## for H2, ### for H3.
* Text Styles: **bold**, _italic_.
* Lists: Use - for bullet points.
* Code: Use \`inline code\` for variables, and \`\`\`language\\n...\\n\`\`\` for code blocks.
* Math: Use LaTeX enclosed in $ (e.g., $O(N^2)$).
* Alignment: If you need to center text or images, wrap them in: <div align="center">...</div> (can also use "left" or "right").`;

        const problemData = await generateProblemJSON(systemPrompt);
        res.status(200).json(problemData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    getAllProblems, 
    getProblemById, 
    createProblem, 
    updateProblem, 
    deleteProblem, 
    uploadProblemImage, 
    deleteProblemImage,
    generateAIProblem,
    testSolution
};
