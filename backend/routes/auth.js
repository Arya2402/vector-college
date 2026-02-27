const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const { protect } = require('../middleware/authMiddleware');

// POST /api/auth/login — Multi-role login with userId + password
router.post('/login', async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ success: false, message: 'Please provide userId and password' });
  }

  try {
    const user = await User.findOne({ userId: parseInt(userId) });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokenPayload = {
      userId: user.userId,
      role: user.role,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      token,
      role: user.role,
      userId: user.userId,
      message: 'Login successful',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/auth/verify — Check if token is valid
router.get('/verify', (req, res) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ valid: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true, role: decoded.role, userId: decoded.userId });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

// GET /api/auth/me — Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ studentId: user.userId });
    }

    res.json({
      userId: user.userId,
      role: user.role,
      profile,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
