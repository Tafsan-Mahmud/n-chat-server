const mongoose = require('mongoose');

const PasswordResetLogSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  ip: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  success: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String, // rate_limited, invalid_token, expired, success
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model(
  'PasswordResetLog',
  PasswordResetLogSchema
);
