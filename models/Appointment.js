const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  age: Number,
  specialization: { type: String, required: true },
  symptoms: String,
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled', 'completed', 'rescheduled'], default: 'confirmed' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
