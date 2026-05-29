const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  age: { type: Number, min: 0, max: 150 },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  language: { type: String, default: 'en' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  },
  healthProfile: {
    bloodType: String,
    allergies: [String],
    conditions: [String],
    medications: [String],
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
