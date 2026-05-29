const mongoose = require('mongoose');

const triageRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  language: { type: String, default: 'en' },
  symptoms: [String],
  severityScore: { type: Number, min: 1, max: 10 },
  possibleConditions: [String],
  recommendation: String,
  followUpQuestions: [String],
  isEmergency: { type: Boolean, default: false },
  classification: { type: String, enum: ['mild', 'moderate', 'emergency'], default: 'mild' },
  aiConfidence: { type: Number, min: 0, max: 100 },
  aiResponse: String,
  sources: [String],
}, { timestamps: true });

module.exports = mongoose.model('TriageRecord', triageRecordSchema);
