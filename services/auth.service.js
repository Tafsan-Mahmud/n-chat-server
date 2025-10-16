const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TempUser = require('../models/TempUser');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id) => {
  return jwt.sign({
    id
  }, JWT_SECRET, {
    expiresIn: '1d',
  });
};

const generateAndSendOtp = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  const emailSubject = 'NChat OTP for Authentication';
  const emailHtml = `
    <h1>Your OTP Code</h1>
    <p>Please use the following code to complete your action:</p>
    <h2><b>${otp}</b></h2>
    <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>`;

  await sendEmail(user.email, emailSubject, emailHtml);
};

exports.register = async (userData) => {
  const userExists = await User.findOne({
    email: userData.email
  });
  const tempUserExists = await TempUser.findOne({
    email: userData.email
  });

  if (userExists) {
    const error = new Error('User with this email already exists.');
    error.status = 401;
    return error;
  }
  if (tempUserExists) {
    const error = new Error('You have already try to register with this email. We have already sent a OTP to your email Please VERIFY!.');
    error.status = 400;
    return error;
  }

  const tempUser = await TempUser.create(userData);
  await generateAndSendOtp(tempUser);
  return tempUser;
};

exports.login = async (email, password) => {

  const user = await User.findOne({ email }).select('+password');

  if (user) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials.');
      error.status = 401;
      return {err:error, error:true};
    }
    await generateAndSendOtp(user);
    return {email:user.email, success:true};
  }

  const tempUser = await TempUser.findOne({ email }).select('+password');

  if (tempUser) {
    const isMatch = await tempUser.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid credentials.');
      error.status = 401;
     return {err:error, error:true};
    }
    await generateAndSendOtp(tempUser);
    const error = new Error('Email not verified. Please check your email for the OTP.');
    error.status = 403;
    return {err:error, process:true, email:tempUser.email};
  }
  const error = new Error('Invalid credentials.');
    error.status = 401;
  return {err:error, error:true};
};

exports.verifyOtpAndLogin = async (email, otp) => {

  const tempUser = await TempUser.findOne({ email }).select('+password');
  const user = await User.findOne({ email }).select('+password');

  if (!tempUser && !user) {
    const error = new Error('Verification failed. Register again.');
    error.status = 404;
    return error;
  }
  let userToVerify = tempUser || user;

  const now = new Date();

  if (userToVerify.otp !== otp || now > userToVerify.otpExpires) {
    const error = new Error('Invalid or expired OTP.');
    error.status = 401;
    return error;
  }

  if (tempUser) {
    const newUser = await User.create({
      email: tempUser.email,
      password: tempUser.password,
      name: tempUser.name,
      active_Status: true,
      profile_image: tempUser.profile_image,
      title: tempUser.title,
      country: tempUser.country,
      bio: tempUser.bio,
    });
    await TempUser.deleteOne({ email });
    const token = generateToken(newUser._id);
    return { user: newUser, token };
  } else {
    userToVerify.otp = undefined;
    userToVerify.otpExpires = undefined;
    await userToVerify.save();
    const token = generateToken(userToVerify._id);
    return { user: userToVerify,  token };
  }
};






exports.updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    throw error;
  }

  Object.assign(user, updateData);

  await user.save();
  return user;
};