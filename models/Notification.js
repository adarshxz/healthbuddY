// ============================================================
// Notification.js — Caregiver Notification Model
// ============================================================
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
  type: {
    type: String,
    enum: ['missed_dose', 'critical_health', 'reminder', 'ai_suggestion', 'adherence_alert', 'system'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ caregiverId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
