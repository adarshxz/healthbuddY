// ============================================================
// MedicineReminder.js — Medicine Reminder Model per Family Member
// ============================================================
const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema({
  caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', required: true, index: true },
  medicineName: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, enum: ['daily', 'twice_daily', 'thrice_daily', 'weekly', 'as_needed'], default: 'daily' },
  timings: [{ type: String, required: true }], // e.g. ["08:00", "14:00", "20:00"]
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  instructions: { type: String, default: '' }, // e.g. "Take after meals"
  isActive: { type: Boolean, default: true },
  adherenceLog: [{
    date: { type: Date, required: true },
    timing: { type: String, required: true },
    status: { type: String, enum: ['taken', 'missed', 'skipped', 'late'], default: 'missed' },
    loggedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  }],
}, { timestamps: true });

// Compound indexes for efficient queries
medicineReminderSchema.index({ caregiverId: 1, memberId: 1, isActive: 1 });
medicineReminderSchema.index({ memberId: 1, isActive: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
