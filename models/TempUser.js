const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TempUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  name: {
    type: String,
    required: true,
  },
  active_Status: {
    type: Boolean,
    default: false,
  },
  profile_image: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  country: {
    type: String,
  },
  token: {
    type: String,
  },
  otp: String,
  otpExpires: Date,
}, {
  timestamps: true
});

TempUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    // Hashing the plain text password
    this.password = await bcrypt.hash(this.password.trim(), salt);
    next();
  } catch (error) {
    return next(error);
  }
});

TempUserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password.toString());
};

module.exports = mongoose.model('TempUser', TempUserSchema);