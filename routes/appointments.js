const express = require('express');
const Appointment = require('../models/Appointment');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/appointments
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/appointments
router.post('/', auth, async (req, res) => {
  try {
    const { patientName, age, specialization, symptoms, date, time, notes } = req.body;
    const appointment = await Appointment.create({
      userId: req.user._id,
      patientName: patientName || req.user.name,
      age,
      specialization,
      symptoms,
      date,
      time,
      notes,
    });
    res.status(201).json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/appointments/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
