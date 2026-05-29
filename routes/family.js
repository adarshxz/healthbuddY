// ============================================================
// routes/family.js — Family Caregiver API Routes
// ============================================================
const express = require('express');
const FamilyMember = require('../models/FamilyMember');
const MedicineReminder = require('../models/MedicineReminder');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// ─── Family Members CRUD ──────────────────────────────────────

// GET /api/family/members — List all family members for caregiver
router.get('/members', auth, async (req, res) => {
  try {
    const members = await FamilyMember.find({ caregiverId: req.user._id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/family/members/:id — Get single member detail
router.get('/members/:id', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOne({ _id: req.params.id, caregiverId: req.user._id });
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    
    // Also fetch their reminders
    const reminders = await MedicineReminder.find({ memberId: member._id, isActive: true })
      .sort({ createdAt: -1 });
    
    res.json({ member, reminders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/family/members — Add new family member
router.post('/members', auth, async (req, res) => {
  try {
    const { name, age, gender, relation, healthProfile, emergencyContact } = req.body;
    
    if (!name || !age || !gender || !relation) {
      return res.status(400).json({ message: 'Name, age, gender, and relation are required' });
    }

    const member = await FamilyMember.create({
      caregiverId: req.user._id,
      name, age, gender, relation,
      healthProfile: healthProfile || {},
      emergencyContact: emergencyContact || {},
    });

    // Create a welcome notification
    await Notification.create({
      caregiverId: req.user._id,
      memberId: member._id,
      type: 'system',
      title: 'Family Member Added',
      message: `${name} has been added to your family. Set up their medicine reminders to get started.`,
      severity: 'low',
    });

    res.status(201).json({ member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/family/members/:id — Update family member
router.put('/members/:id', auth, async (req, res) => {
  try {
    const allowedFields = ['name', 'age', 'gender', 'relation', 'healthProfile', 'emergencyContact'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    res.json({ member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/family/members/:id — Soft-delete a family member
router.delete('/members/:id', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: 'Family member not found' });
    
    // Deactivate all their reminders
    await MedicineReminder.updateMany(
      { memberId: member._id, caregiverId: req.user._id },
      { isActive: false }
    );

    res.json({ message: 'Family member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─── Medicine Reminders CRUD ──────────────────────────────────

// GET /api/family/reminders — All reminders for all members
router.get('/reminders', auth, async (req, res) => {
  try {
    const { memberId } = req.query;
    const query = { caregiverId: req.user._id, isActive: true };
    if (memberId) query.memberId = memberId;

    const reminders = await MedicineReminder.find(query)
      .populate('memberId', 'name relation avatar')
      .sort({ createdAt: -1 });
    res.json({ reminders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/family/reminders — Create medicine reminder
router.post('/reminders', auth, async (req, res) => {
  try {
    const { memberId, medicineName, dosage, frequency, timings, startDate, endDate, instructions } = req.body;

    if (!memberId || !medicineName || !dosage || !timings?.length || !startDate) {
      return res.status(400).json({ message: 'Member, medicine name, dosage, timings, and start date are required' });
    }

    // Verify member belongs to caregiver
    const member = await FamilyMember.findOne({ _id: memberId, caregiverId: req.user._id });
    if (!member) return res.status(404).json({ message: 'Family member not found' });

    const reminder = await MedicineReminder.create({
      caregiverId: req.user._id,
      memberId, medicineName, dosage, frequency,
      timings, startDate, endDate, instructions,
    });

    // Create a notification
    await Notification.create({
      caregiverId: req.user._id,
      memberId,
      type: 'reminder',
      title: 'New Medicine Reminder',
      message: `Reminder set: ${medicineName} (${dosage}) for ${member.name} — ${timings.join(', ')}`,
      severity: 'low',
    });

    res.status(201).json({ reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/family/reminders/:id — Update reminder
router.put('/reminders/:id', auth, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/family/reminders/:id — Deactivate reminder
router.delete('/reminders/:id', auth, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─── Adherence Tracking ───────────────────────────────────────

// POST /api/family/reminders/:id/log — Log a dose
router.post('/reminders/:id/log', auth, async (req, res) => {
  try {
    const { date, timing, status, notes } = req.body;
    
    const reminder = await MedicineReminder.findOne({ _id: req.params.id, caregiverId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    // Check if already logged for this date+timing
    const existingIdx = reminder.adherenceLog.findIndex(
      l => l.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0] && l.timing === timing
    );

    if (existingIdx >= 0) {
      reminder.adherenceLog[existingIdx].status = status;
      reminder.adherenceLog[existingIdx].loggedAt = new Date();
      reminder.adherenceLog[existingIdx].notes = notes || '';
    } else {
      reminder.adherenceLog.push({ date: new Date(date), timing, status, notes });
    }

    await reminder.save();

    // If missed, create alert notification
    if (status === 'missed') {
      const member = await FamilyMember.findById(reminder.memberId);
      await Notification.create({
        caregiverId: req.user._id,
        memberId: reminder.memberId,
        type: 'missed_dose',
        title: 'Missed Dose Alert',
        message: `${member?.name || 'Member'} missed ${reminder.medicineName} (${timing})`,
        severity: 'high',
        metadata: { reminderId: reminder._id, timing, date },
      });
    }

    res.json({ reminder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/family/adherence/:memberId — Adherence stats for a member
router.get('/adherence/:memberId', auth, async (req, res) => {
  try {
    const reminders = await MedicineReminder.find({
      memberId: req.params.memberId,
      caregiverId: req.user._id,
      isActive: true,
    });

    let totalDoses = 0, takenDoses = 0, missedDoses = 0, lateDoses = 0;
    const medicineStats = [];

    reminders.forEach(r => {
      const logs = r.adherenceLog || [];
      const taken = logs.filter(l => l.status === 'taken').length;
      const missed = logs.filter(l => l.status === 'missed').length;
      const late = logs.filter(l => l.status === 'late').length;
      totalDoses += logs.length;
      takenDoses += taken;
      missedDoses += missed;
      lateDoses += late;
      medicineStats.push({
        medicineName: r.medicineName,
        dosage: r.dosage,
        total: logs.length,
        taken, missed, late,
        adherenceRate: logs.length > 0 ? Math.round((taken / logs.length) * 100) : 100,
      });
    });

    const overallRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100;

    res.json({
      adherence: {
        overallRate, totalDoses, takenDoses, missedDoses, lateDoses,
        medicineStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─── AI Agent Insights ────────────────────────────────────────

// GET /api/family/insights/:memberId — AI-generated health insights
router.get('/insights/:memberId', auth, async (req, res) => {
  try {
    const member = await FamilyMember.findOne({ _id: req.params.memberId, caregiverId: req.user._id });
    if (!member) return res.status(404).json({ message: 'Member not found' });

    const reminders = await MedicineReminder.find({ memberId: member._id, isActive: true });
    
    const insights = generateAIInsights(member, reminders);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/family/dashboard-summary — Full dashboard overview
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const members = await FamilyMember.find({ caregiverId: req.user._id, isActive: true });
    const allReminders = await MedicineReminder.find({ caregiverId: req.user._id, isActive: true })
      .populate('memberId', 'name relation');
    const notifications = await Notification.find({ caregiverId: req.user._id, isRead: false })
      .sort({ createdAt: -1 }).limit(20);

    // Build per-member summary
    const memberSummaries = members.map(m => {
      const memberReminders = allReminders.filter(r => r.memberId?._id?.toString() === m._id.toString());
      const todayStr = new Date().toISOString().split('T')[0];
      
      let upcomingMeds = [];
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      memberReminders.forEach(r => {
        r.timings.forEach(t => {
          const todayLog = r.adherenceLog.find(
            l => l.date.toISOString().split('T')[0] === todayStr && l.timing === t
          );
          if (!todayLog && t >= currentTime) {
            upcomingMeds.push({ medicineName: r.medicineName, dosage: r.dosage, timing: t, reminderId: r._id });
          }
        });
      });

      // Count today's missed
      let missedToday = 0;
      memberReminders.forEach(r => {
        r.timings.forEach(t => {
          if (t < currentTime) {
            const todayLog = r.adherenceLog.find(
              l => l.date.toISOString().split('T')[0] === todayStr && l.timing === t
            );
            if (!todayLog) missedToday++;
          }
        });
      });

      return {
        _id: m._id, name: m.name, age: m.age, gender: m.gender, relation: m.relation,
        conditions: m.healthProfile?.conditions || [],
        allergies: m.healthProfile?.allergies || [],
        totalReminders: memberReminders.length,
        upcomingMeds: upcomingMeds.slice(0, 5),
        missedToday,
      };
    });

    // Overall stats
    const totalMissedToday = memberSummaries.reduce((sum, m) => sum + m.missedToday, 0);
    const totalReminders = allReminders.length;
    const criticalAlerts = notifications.filter(n => n.severity === 'high' || n.severity === 'critical').length;

    res.json({
      summary: {
        totalMembers: members.length,
        totalReminders,
        totalMissedToday,
        criticalAlerts,
        memberSummaries,
        recentNotifications: notifications.slice(0, 10),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─── Notifications ────────────────────────────────────────────

// GET /api/family/notifications
router.get('/notifications', auth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { caregiverId: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .populate('memberId', 'name relation')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ caregiverId: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/family/notifications/:id/read — Mark as read
router.put('/notifications/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, caregiverId: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/family/notifications/read-all — Mark all as read
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { caregiverId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ─── AI Insight Generator (Rule-based Agentic AI) ─────────────

function generateAIInsights(member, reminders) {
  const insights = [];
  const suggestions = [];
  const alerts = [];

  // 1. Age-based risk assessment
  if (member.age >= 65) {
    insights.push({
      type: 'risk', icon: '⚠️',
      title: 'Senior Care Alert',
      message: `${member.name} is ${member.age} years old. Regular health check-ups every 3 months are recommended.`,
    });
  }
  if (member.age >= 80) {
    alerts.push({
      type: 'critical', icon: '🔴',
      title: 'High Priority Care',
      message: `At ${member.age}, ${member.name} may require more frequent monitoring and assisted medication management.`,
    });
  }

  // 2. Medication interaction awareness
  const conditions = member.healthProfile?.conditions || [];
  const allergies = member.healthProfile?.allergies || [];
  const meds = reminders.map(r => r.medicineName.toLowerCase());

  if (conditions.includes('diabetes') || conditions.includes('Diabetes')) {
    insights.push({
      type: 'condition', icon: '🩸',
      title: 'Diabetes Management',
      message: `Monitor blood sugar levels regularly. Ensure meals are timed with insulin/medication schedules.`,
    });
  }
  if (conditions.includes('hypertension') || conditions.includes('Hypertension') || conditions.includes('high blood pressure')) {
    insights.push({
      type: 'condition', icon: '❤️',
      title: 'Blood Pressure Monitoring',
      message: `Regular BP checks recommended. Reduce sodium intake and ensure medication adherence.`,
    });
  }

  // 3. Adherence analysis
  let totalLogs = 0, totalMissed = 0, totalTaken = 0;
  reminders.forEach(r => {
    r.adherenceLog.forEach(l => {
      totalLogs++;
      if (l.status === 'taken') totalTaken++;
      if (l.status === 'missed') totalMissed++;
    });
  });

  const adherenceRate = totalLogs > 0 ? Math.round((totalTaken / totalLogs) * 100) : null;

  if (adherenceRate !== null && adherenceRate < 70) {
    alerts.push({
      type: 'adherence', icon: '🚨',
      title: 'Low Adherence Warning',
      message: `${member.name}'s medicine adherence is ${adherenceRate}%. Consider setting more reminders or consulting their doctor about medication simplification.`,
    });
    suggestions.push({
      type: 'action', icon: '📋',
      title: 'Consult Doctor',
      message: `With adherence below 70%, consider scheduling a consultation to discuss alternative medications or simplified dosing.`,
    });
  } else if (adherenceRate !== null && adherenceRate < 90) {
    suggestions.push({
      type: 'improvement', icon: '💡',
      title: 'Improve Adherence',
      message: `${member.name}'s adherence is at ${adherenceRate}%. Try setting phone alarms or linking medicine times with daily routines.`,
    });
  } else if (adherenceRate !== null) {
    insights.push({
      type: 'positive', icon: '✅',
      title: 'Good Adherence',
      message: `${member.name}'s medicine adherence is excellent at ${adherenceRate}%. Keep it up!`,
    });
  }

  // 4. Allergy alerts
  if (allergies.length > 0) {
    insights.push({
      type: 'allergy', icon: '⚠️',
      title: 'Allergy Information',
      message: `Known allergies: ${allergies.join(', ')}. Always verify new prescriptions against these.`,
    });
  }

  // 5. Medication count check
  if (reminders.length >= 5) {
    suggestions.push({
      type: 'polypharmacy', icon: '💊',
      title: 'Multiple Medications',
      message: `${member.name} is on ${reminders.length} medications. Discuss potential interactions with their healthcare provider.`,
    });
  }

  // 6. Missing end dates
  const noEndDate = reminders.filter(r => !r.endDate);
  if (noEndDate.length > 0) {
    suggestions.push({
      type: 'review', icon: '📅',
      title: 'Review Long-term Medications',
      message: `${noEndDate.length} medication(s) have no end date. Schedule periodic reviews with the doctor.`,
    });
  }

  return {
    adherenceRate,
    totalLogs, totalTaken, totalMissed,
    insights, suggestions, alerts,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = router;
