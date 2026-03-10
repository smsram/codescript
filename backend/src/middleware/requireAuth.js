const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    // 1. Check if the header exists
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    // 2. Extract the token (Format: "Bearer <token>")
    const token = authorization.split(' ')[1];

    try {
        // 3. Verify the token
        const { userId, role } = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key_change_me");
        
        // 4. Attach the user info to the request so the next function can use it
        req.user = { id: userId, role };
        next(); // Move on to the actual route controller!
        
    } catch (error) {
        res.status(401).json({ error: 'Request is not authorized or token expired' });
    }
};

// 👇 CRITICAL: Export it directly as a function, NOT as an object { requireAuth }
module.exports = requireAuth;