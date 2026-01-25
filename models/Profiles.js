const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This links the profile to your TempUser model
    required: true,
  },
  user_email: {
    type: String,
    required: true,
    lowercase: true,
  },
  profile_image_url: {
    type: String,
    required: true,
  },
  profile_image_id: {
    type: String,
    required: true,
  },
  upload_date: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Profiles', ProfileSchema);