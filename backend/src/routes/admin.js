const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const requireAuth = require('../middleware/requireAuth');

router.get('/stats', requireAuth, adminController.getDashboardStats);
// 🚀 Add these two lines:
router.get('/settings', requireAuth, adminController.getSystemAndSettings);
router.post('/settings', requireAuth, adminController.saveSettings);

module.exports = router;