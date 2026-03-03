const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const { getStudentDashboard } = require('../controllers/dashboardController');

router.get('/student', requireAuth, getStudentDashboard);

module.exports = router;