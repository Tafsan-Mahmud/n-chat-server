const authService = require('../services/auth.service');
const crypto = require('crypto');
const util = require('util');
const User = require('../models/User');
const randomBytesAsync = util.promisify(crypto.randomBytes);

async function generateSecret() {
  const secretLengthInBytes = 150;
  try {
    const buffer = await randomBytesAsync(secretLengthInBytes);
    return buffer.toString('hex');
  } catch (err) {
    console.error('An error occurred while generating the secret:', err);
    throw err;
  }
}
// verify the user JWT token every request 

exports.validateToken = async (req, res) => {
  const user = await User.findById(req.tokenUserId)
    .select('isProfileComplete');

  if (!user) {
    return res.status(401).json({
      valid: false
    });
  }

  return res.status(200).json({
    valid: true,
    isProfileComplete: user.isProfileComplete,
    message: 'Token is valid.',
  });
};


// return login users safe data.

exports.returnME = async (req, res) => {
  res.status(200).json({
    status: 'SUCCESS USER',
    _id: req.user._id,
    email: req.user.email,
    name: req.user.name,
    active_Status: req.user.active_Status,
    profile_image: req.user.profile_image,
    title: req.user.title,
    gender: req.user.gender,
    bio: req.user.bio,
  });
};


exports.registerUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      name,
      active_Status,
      profile_image,
      title,
      gender,
      bio,
      country
    } = req.body;
    const token = await generateSecret() + email;
    const trimmedData = {
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      country: country.trim(),
      active_Status,
      token,
      profile_image,
      title,
      gender,
      bio,
    };
    const response = await authService.register(trimmedData);

    if (response.status === 401 && response.message === 'User with this email already exists.') {
      res.status(401).json({
        message: response.message,
      });
    } else {
      if (response.status === 400 && response.message === 'You have already try to register with this email.We have already sent a OTP to your email Please VERIFY!.') {
        res.status(400).json({
          message: response.message,
          email: response.email,
          token: response.token,
          redirect: '/authOTP'
        });
        res.cookie('otp_pending', '_eyJfaWQiOiI2OTAyMjdhYzI2DEiLCJpYXQiOjE3Njg5MDc5NTE', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
      } else {
        res.status(201).json({
          status: "SUCCESS",
          message: 'OTP sent to your email. Please verify to log in',
          email: response.email,
          token: response.token,
          redirect: '/authOTP'
        });
        res.cookie('otp_pending', '_eyJfaWQiOiI2OTAyMjdhYzI2DEiLCJpYXQiOjE3Njg5MDc5NTE', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
      }

    }
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const {
      email,
      password
    } = req.body;
    const trimmedEmail = email ? email.trim() : email;
    const trimmedPassword = password ? password.trim() : password;
    const response = await authService.login(trimmedEmail, trimmedPassword);

    if (response.success === true) {
      const secret = await generateSecret();
      res.cookie('otp_pending', '_eyJfaWQiOiI2OTAyMjdhYzI2DEiLCJpYXQiOjE3Njg5MDc5NTE', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 5 * 60 * 1000 // 15 minutes
      });
      res.status(200).json({
        status: "SUCCESS",
        message: 'OTP sent to your email. Please verify to log in.',
        email: response.email,
        secret: secret,
        redirect: '/authOTP'
      });
    }
    if (response.process === true) {
      res.cookie('otp_pending', '_eyJfaWQiOiI2OTAyMjdhYzI2DEiLCJpYXQiOjE3Njg5MDc5NTE', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      res.status(403).json({
        status: "PROCESS!",
        message: response.err.message,
        email: response.email,
        redirect: '/authOTP',
      });


    }
    if (response.error === true) {
      res.status(401).json({
        status: "ERROR!",
        message: response.err.message,
      });
    }

  } catch (error) {
    next(error);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const {
      email,
      otp
    } = req.body;
    const response = await authService.verifyOtpAndLogin(email, otp);
    const {
      user,
      token
    } = response;

    if (response.message === 'Verification failed. Register again.') {
      res.status(404).json({
        message: response.message,
        status: "ERROR!",
        redirect: '/register'
      });
    }
    if (response.message === 'Invalid or expired OTP.') {
      console.log(response);
      res.status(401).json({
        message: response.message,
        status: "ERROR!"
      });
    }
    if (user && token) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 86400000,
      });
      res.cookie('hasSession', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 86400000,
      });

      res.clearCookie('otp_pending');

      return res.status(200).json({
        status: 'SUCCESS',
        message: 'Login successful',
        _id: user._id,
        email: user.email,
        name: user.name,
        active_Status: user.active_Status,
        profile_image: user.profile_image,
        title: user.title,
        gender: user.gender,
        bio: user.bio,
      });

    }

  } catch (error) {
    next(error);
  }
};

exports.logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.clearCookie('hasSession', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    return res.status(200).json({
      success: true,
      status: 200,
      message: 'Logout successful',
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Server error while logging out',
    });
  }
};

