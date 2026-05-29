const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/user/profile
router.get('/profile', auth, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, age, language, location, healthProfile } = req.body;
    const update = {};
    if (name) update.name = name;
    if (age !== undefined) update.age = age;
    if (language) update.language = language;
    if (location) update.location = location;
    if (healthProfile) update.healthProfile = healthProfile;

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
