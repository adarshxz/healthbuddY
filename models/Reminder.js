const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  timing: [String],
  active: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Reminder', reminderSchema);
