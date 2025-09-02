const authService = require('../services/auth.service');

exports.registerUser = async (req, res, next) => {
  try {
    const { email, password, name, active_Status, profile_image, title, bio } = req.body;
    await authService.register({ email, password, name, active_Status, profile_image, title, bio });

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to log in.',
      email,
    });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    await authService.login(email, password);

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to log in.',
      email,
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const { user, token } = await authService.verifyOtpAndLogin(email, otp);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400000
    });

    res.status(200).json({
      message: 'Login successful',
      _id: user._id,
      email: user.email,
      name: user.name,
      active_Status: user.active_Status,
      profile_image: user.profile_image,
      title: user.title,
      bio: user.bio,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, profile_image, title, bio } = req.body;

    const updatedUser = await authService.updateProfile(userId, { name, profile_image, title, bio });

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};