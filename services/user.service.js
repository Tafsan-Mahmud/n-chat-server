const Profiles = require('../models/Profiles');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  // Explicit field assignment (prevents mass-assignment attacks)

  if (updateData.title !== undefined) user.title = updateData.title;

  if (updateData.bio !== undefined) user.bio = updateData.bio;

  if (updateData.profile_image !== undefined) {
    user.profile_image = updateData.profile_image;
  }
  if (updateData.profile_image_id) {
    user.profile_image_id = updateData.profile_image_id;
  }

  // Server-controlled flag (cannot be spoofed)
  user.isProfileComplete = true;

  await Profiles.create({
    user_id: user._id,
    user_email: user.email,
    profile_image_url: updateData.profile_image || user.profile_image,
    profile_image_id: updateData.profile_image_id || '0',
    upload_date: new Date(),
  });

  await user.save();
  const userObj = user.toObject();
  return userObj;
};

// New Password Change
exports.changePasswordLogic = async (userId, currentPassword, newPassword) => {

  const user = await User.findById(userId).select('+password');

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  // const match = await bcrypt.compare(currentPassword.trim(), user.password);
  const match = await user.comparePassword(currentPassword.trim());

  if (!match) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword.trim(), salt);

  await user.save();
};