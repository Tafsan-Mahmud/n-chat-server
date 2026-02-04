const userService = require('../services/user.service');

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      title,
      bio,
      avatarUrl
    } = req.body;

    // Image comes either from Cloudinary upload or avatar URL
    const profile_image = req.file?.path || avatarUrl;
    const profile_image_id = req.file?.filename || null;

    if (!title || !bio || !profile_image) {
      return res.status(400).json({
        message: 'Profile image, title and bio are required.',
      });
    }

    const updatedUser = await userService.updateProfile(userId, {
      title,
      bio,
      profile_image,
      profile_image_id,
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// New Password Change
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    await userService.changePasswordLogic(userId, currentPassword, newPassword);

    // optional security: force logout after password change
    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: "Password changed. Please login again."
    });

  } catch (err) {
    next(err); 
  }
};