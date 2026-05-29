// ============================================================
// FamilyMember.js — Family Member Model (Dependent Profiles)
// ============================================================
const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
  caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, minlength: 2 },
  age: { type: Number, required: true, min: 0, max: 150 },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  relation: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  healthProfile: {
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], default: '' },
    allergies: [{ type: String, trim: true }],
    conditions: [{ type: String, trim: true }],
    medications: [{ type: String, trim: true }],
    notes: { type: String, default: '' },
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Index for efficient queries
familyMemberSchema.index({ caregiverId: 1, isActive: 1 });

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
