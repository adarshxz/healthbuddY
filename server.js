// ============================================================
// server.js — HealthBuddy Express Application Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const appointmentRoutes = require('./routes/appointments');
const reminderRoutes = require('./routes/reminders');
const adminRoutes = require('./routes/admin');
const facilityRoutes = require('./routes/facilities');
const triageRoutes = require('./routes/triage');
const familyRoutes = require('./routes/family');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Connect to MongoDB ---
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/family', familyRoutes);

// --- HTML Page Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/doctor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'doctor.html'));
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'map.html'));
});

app.get('/family', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'family.html'));
});

// --- 404 fallback ---
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n🏥 HealthBuddy Server running at http://localhost:${PORT}`);
  console.log(`   📄 Auth:      http://localhost:${PORT}/`);
  console.log(`   💬 Chat:      http://localhost:${PORT}/chat`);
  console.log(`   📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`   👨‍👩‍👧‍👦 Family:   http://localhost:${PORT}/family`);
  console.log(`   🗺️  Map:       http://localhost:${PORT}/map`);
  console.log(`   🔐 Admin:     http://localhost:${PORT}/admin\n`);
});
