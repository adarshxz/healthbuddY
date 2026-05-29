const express = require('express');
const Reminder = require('../models/Reminder');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/reminders
router.get('/', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ reminders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/reminders
router.post('/', auth, async (req, res) => {
  try {
    const { medicineName, dosage, frequency, timing, notes } = req.body;
    const reminder = await Reminder.create({
      userId: req.user._id,
      medicineName,
      dosage,
      frequency,
      timing: timing || [],
      notes,
    });
    res.status(201).json({ reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/reminders/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
