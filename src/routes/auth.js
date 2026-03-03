const express = require('express');
const router = express.Router();

// 👇 MAKE SURE BOTH ARE IMPORTED HERE
const { register, login } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);

module.exports = router;