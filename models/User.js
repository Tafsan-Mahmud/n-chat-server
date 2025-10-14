const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
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
    default: true,
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
  otp: String,
  otpExpires: Date,
}, {
    timestamps: true
});


UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  next(); 
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password.toString());
};

module.exports = mongoose.model('User', UserSchema);
