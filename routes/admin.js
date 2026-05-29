const express = require('express');
const User = require('../models/User');
const TriageRecord = require('../models/TriageRecord');
const Appointment = require('../models/Appointment');
const { auth, adminOnly, doctorOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/stats — admin dashboard stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  console.log('ADMIN: GET /stats hit');
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalTriages = await TriageRecord.countDocuments();
    const emergencies = await TriageRecord.countDocuments({ isEmergency: true });
    const totalAppointments = await Appointment.countDocuments();

    res.json({ totalUsers, totalDoctors, totalTriages, emergencies, totalAppointments });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/triages — view all triage records
router.get('/triages', auth, adminOnly, async (req, res) => {
  console.log('ADMIN: GET /triages hit');
  try {
    const triages = await TriageRecord.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ triages });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/appointments — view all appointments
router.get('/appointments', auth, adminOnly, async (req, res) => {
  console.log('ADMIN: GET /appointments hit');
  try {
    const appointments = await Appointment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ appointments });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/doctor/patients — doctor view: recent triage records
router.get('/doctor/patients', auth, doctorOnly, async (req, res) => {
  try {
    const records = await TriageRecord.find()
      .populate('userId', 'name email age')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ records });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});
// DELETE /api/admin/appointments/:id
router.delete('/appointments/:id', auth, adminOnly, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/triages/:id
router.delete('/triages/:id', auth, adminOnly, async (req, res) => {
  try {
    const triage = await TriageRecord.findByIdAndDelete(req.params.id);
    if (!triage) return res.status(404).json({ message: 'Triage record not found' });
    res.json({ message: 'Triage record deleted successfully' });
  } catch (error) {
    console.error('ADMIN ROUTE ERROR:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
