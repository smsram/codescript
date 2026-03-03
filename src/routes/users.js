const express = require('express');
const router = express.Router();

// 👇 THE FIX: Point to requireAuth.js and import it directly (no curly braces)
const requireAuth = require('../middleware/requireAuth'); 
const { getAllUsers, createUser, getMe } = require('../controllers/userController');

// Routes
router.get('/', requireAuth, getAllUsers);
router.post('/', requireAuth, createUser);
router.get('/me', requireAuth, getMe);

module.exports = router;