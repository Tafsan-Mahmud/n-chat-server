const authService = require('../services/auth.service');
const crypto = require('crypto');
const util = require('util');
const randomBytesAsync = util.promisify(crypto.randomBytes);
async function generateSecret() {
  const secretLengthInBytes = 150;
  try {
    const buffer = await randomBytesAsync(secretLengthInBytes);
    return buffer.toString('hex');
  } catch (err) {
    console.error('An error occurred while generating the secret:', err);
    throw err; // Re-throw the error to be handled by the caller.
  }
}

exports.registerUser = async (req, res, next) => {
  try {
    const { email, password, name, active_Status, profile_image, title, bio, country } = req.body;
    const token = email+await generateSecret();

   const response = await authService.register({ email, password, name, active_Status, profile_image, title,country,token, bio });
   if(response.status === 401 && response.message === 'User with this email already exists.'){
    res.status(401).json({
      message: response.message,
    });
   }else{
    if(response.status === 400 && response.message === 'You have already try to register with this email.We have already sent a OTP to your email Please VERIFY!.'){
      res.status(400).json({
      message: response.message,
      email:response.email,
      token:response.token,
      redirect:'/authOTP'
    });

    }else{
      res.status(201).json({
            status: "SUCCESS",
            message: 'OTP sent to your email. Please verify to log in',
            email:response.email,
            token:response.token,
            redirect:'/authOTP'
      });
    }
    
   }
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
      sameSite: 'lax',
      maxAge: 86400000
    });

    res.status(200).json({
      status:'SUCCESS',
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