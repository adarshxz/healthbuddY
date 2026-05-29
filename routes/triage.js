const express = require('express');
const axios = require('axios');
const TriageRecord = require('../models/TriageRecord');
const { auth } = require('../middleware/auth');

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/triage/analyze — proxy to AI service + save to DB
router.post('/analyze', auth, async (req, res) => {
  try {
    const { query, history } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });

    let result;
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/triage/analyze`, {
        query,
        history: history || null,
      }, { timeout: 30000 });
      result = aiResponse.data;
    } catch (aiError) {
      // Fallback to rule-based triage if AI service is down
      result = fallbackTriage(query);
    }

    // Save to history
    await TriageRecord.create({
      userId: req.user._id,
      query,
      symptoms: result.symptoms_extracted || result.symptoms || [],
      severityScore: result.severity_score || result.severityScore || 3,
      possibleConditions: result.possible_conditions || result.possibleConditions || [],
      recommendation: result.recommendation || '',
      followUpQuestions: result.follow_up_questions || result.followUpQuestions || [],
      isEmergency: result.is_emergency || result.isEmergency || false,
      classification: getClassification(result.severity_score || result.severityScore || 3),
      aiConfidence: result.confidence || 85,
      aiResponse: JSON.stringify(result),
      sources: result.sources || [],
    });

    // Normalize response for frontend
    res.json({
      symptoms: result.symptoms_extracted || result.symptoms || [],
      severityScore: result.severity_score || result.severityScore || 3,
      possibleConditions: result.possible_conditions || result.possibleConditions || [],
      recommendation: result.recommendation || '',
      followUpQuestions: result.follow_up_questions || result.followUpQuestions || [],
      isEmergency: result.is_emergency || result.isEmergency || false,
      confidence: result.confidence || 85,
      sources: result.sources || [],
    });
  } catch (error) {
    console.error('Triage error:', error.message);
    res.status(500).json({ message: 'Triage analysis failed' });
  }
});

// GET /api/triage/history
router.get('/history', auth, async (req, res) => {
  try {
    const records = await TriageRecord.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const history = records.map(r => ({
      id: r._id,
      symptom: r.query,
      symptoms: r.symptoms,
      intensity: r.severityScore,
      conditions: r.possibleConditions,
      recommendation: r.recommendation,
      classification: r.classification,
      isEmergency: r.isEmergency,
      confidence: r.aiConfidence,
      sources: r.sources || [],
      timestamp: r.createdAt,
    }));

    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/triage/analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const records = await TriageRecord.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const totalInteractions = records.length;
    const emergencyCount = records.filter(r => r.isEmergency).length;
    const avgSeverity = records.length > 0
      ? (records.reduce((sum, r) => sum + (r.severityScore || 0), 0) / records.length).toFixed(1)
      : 0;

    // Symptom frequency
    const symptomFreq = {};
    records.forEach(r => {
      (r.symptoms || []).forEach(s => {
        symptomFreq[s] = (symptomFreq[s] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symptom, count]) => ({ symptom, count }));

    // Monthly trends
    const monthlyTrends = {};
    records.forEach(r => {
      const month = new Date(r.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    });

    res.json({
      totalInteractions,
      emergencyCount,
      avgSeverity: parseFloat(avgSeverity),
      topSymptoms,
      monthlyTrends,
      recentRecords: records.slice(0, 10),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function getClassification(score) {
  if (score >= 8) return 'emergency';
  if (score >= 5) return 'moderate';
  return 'mild';
}

function fallbackTriage(query) {
  const lower = query.toLowerCase();
  const emergencyKeywords = ['chest pain', 'heart attack', "can't breathe", 'difficulty breathing', 'seizure', 'unconscious', 'severe bleeding', 'stroke'];
  const isEmergency = emergencyKeywords.some(kw => lower.includes(kw));

  const symptomPatterns = {
    'headache': ['Headache'],
    'fever': ['Fever'],
    'cough': ['Cough'],
    'cold': ['Common Cold'],
    'stomach': ['Stomach Pain'],
    'back pain': ['Back Pain'],
    'sore throat': ['Sore Throat'],
    'fatigue': ['Fatigue'],
    'nausea': ['Nausea'],
    'dizziness': ['Dizziness'],
  };

  const symptoms = [];
  for (const [key, vals] of Object.entries(symptomPatterns)) {
    if (lower.includes(key)) symptoms.push(...vals);
  }

  return {
    symptoms_extracted: symptoms.length > 0 ? symptoms : ['General symptoms'],
    severity_score: isEmergency ? 9 : (symptoms.length > 2 ? 5 : 3),
    possible_conditions: symptoms.length > 0 ? ['Consult a doctor for accurate diagnosis'] : ['General health check recommended'],
    recommendation: isEmergency
      ? 'Seek immediate emergency medical attention. Call 112/911.'
      : 'Rest, stay hydrated, and consult a doctor if symptoms persist.',
    follow_up_questions: [
      'How long have you been experiencing these symptoms?',
      'Have you taken any medication?',
      'Do you have any pre-existing medical conditions?',
    ],
    is_emergency: isEmergency,
    confidence: 60,
    sources: [],
  };
}

module.exports = router;
