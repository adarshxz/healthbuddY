// seed.js — Create admin user for testing
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create admin
  const adminExists = await User.findOne({ email: 'admin@healthbuddy.com' });
  if (!adminExists) {
    await User.create({ name: 'Admin', email: 'admin@healthbuddy.com', password: 'admin123', role: 'admin', age: 30 });
    console.log('✅ Admin created: admin@healthbuddy.com / admin123');
  } else {
    console.log('Admin already exists');
  }

  // Create doctor
  const doctorExists = await User.findOne({ email: 'doctor@healthbuddy.com' });
  if (!doctorExists) {
    await User.create({ name: 'Dr. Smith', email: 'doctor@healthbuddy.com', password: 'doctor123', role: 'doctor', age: 45 });
    console.log('✅ Doctor created: doctor@healthbuddy.com / doctor123');
  } else {
    console.log('Doctor already exists');
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
