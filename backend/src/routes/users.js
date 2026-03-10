const express = require('express');
const router = express.Router();

const requireAuth = require('../middleware/requireAuth'); 
const { 
    getAllUsers, 
    createUser, 
    getMe,
    updateUserRole,       // 🚀 Import the new functions
    updateUserStatus,
    getUserHistory
} = require('../controllers/userController');

// Existing Routes
router.get('/', requireAuth, getAllUsers);
router.post('/', requireAuth, createUser);
router.get('/me', requireAuth, getMe);

// 🚀 NEW: Admin Action Routes
// NOTE: Depending on your security, you might want an isAdmin middleware here
router.put('/:id/role', requireAuth, updateUserRole);
router.put('/:id/status', requireAuth, updateUserStatus);
router.get('/:id/history', requireAuth, getUserHistory);

module.exports = router;