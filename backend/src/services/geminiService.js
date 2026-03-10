const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure you have GEMINI_API_KEY in your backend .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// You specifically requested Gemini 2.5 Flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const generateProblemJSON = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Clean up markdown formatting if the AI wraps it in ```json ... ```
        text = text.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
        
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate problem from AI. Make sure your prompt is clear or try again.");
    }
};

module.exports = { generateProblemJSON };