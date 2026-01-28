const authService = require('../services/auth.service');
const crypto = require('crypto');
const util = require('util');
const User = require('../models/User');
const randomBytesAsync = util.promisify(crypto.randomBytes);
const sendEmail = require('../utils/sendEmail');

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

exports.forgotPasswordInit = async (req, res) => {
  res.cookie('forgot_allowed', '_697891a0-570c-8320-bc4e-e4a9bc20ebbd', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000, // 5 minutes to enter email
  });

  res.status(200).json({
    ok: true
  });
};

exports.forgotPassword = async (req, res) => {
  const {
    email
  } = req.body;
  const ip = req.ip;
  const ua = req.headers['user-agent'];

  // Rate limit: same IP + email
  const recent = await PasswordResetLog.countDocuments({
    email,
    ip,
    createdAt: {
      $gt: Date.now() - 15 * 60 * 1000
    },
  });

  if (recent >= 4) {
    await PasswordResetLog.create({
      email,
      ip,
      userAgent: ua,
      success: false,
      reason: 'rate_limited',
    });

    return res.status(200).json({
      message: 'If email exists, reset link sent.',
    });
  }

  const user = await User.findOne({
    email
  });

  if (!user) {
    await PasswordResetLog.create({
      email,
      ip,
      userAgent: ua,
      success: false,
      reason: 'email_not_found',
    });

    return res.status(200).json({
      message: 'If email exists, reset link sent.',
    });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  user.resetTokenHash = tokenHash;
  user.resetTokenExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const emailSubject = 'NChat - Reset Password Request';
  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NChat Password Reset</title>

    <!-- FORCE LIGHT MODE (APPLE MAIL / IOS) -->
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">

    <style>
        body,
        table,
        td {
            margin: 0;
            padding: 0;
            border: 0;
        }

        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        @media (max-width: 600px) {
            .card {
                width: 92% !important;
            }

            .reset-btn {
                font-size: 15px !important;
                padding: 14px 22px !important;
            }
        }
    </style>
</head>

<body bgcolor="#f5f7fb" style="
        margin:0;
        padding:0;
        background:#f5f7fb !important;
        color:#000000 !important;
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
    ">

    <table width="100%" height="100%" bgcolor="#f5f7fb" style="background:#f5f7fb !important;">
        <tr>
            <td align="center" valign="middle" style="padding:40px 12px;">

                <div style="position: relative; width: 100%; max-width: 420px;">

                    <div class="card" style="
                        position: relative;
                        z-index: 10;
                        background: rgba(255, 255, 255, 0.74) !important;
                        border-radius: 10px;
                        border: 2px solid #ffffff;
                        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.063);
                        backdrop-filter: blur(14px);
                        -webkit-backdrop-filter: blur(14px);
                        text-align: center;
                        overflow: hidden;
                    ">

                        <table width="100%">
                            <tr>
                                <td style="padding:28px 32px 18px;">
                                    <img src="https://res.cloudinary.com/db9b6b0bu/image/upload/v1769615534/logoName_dojoic.png"
                                        alt="NChat" width="110" style="display:block;margin:auto;">
                                </td>
                            </tr>

                            <tr>
                                <td style="padding:0 32px 24px;">
                                    <h2 style="
                                    margin:0 0 6px;
                                    font-size:20px;
                                    font-weight:600;
                                    color:#0f172a !important;
                                ">
                                        Reset your password?
                                    </h2>

                                    <p style="
                                    margin:0 0 20px;
                                    font-size:13px;
                                    line-height:1.5;
                                    color:#475569 !important;
                                ">
                                        We received a request to reset your <strong>NChat</strong> password.
                                        Click the button below to continue.
                                    </p>

                                    <a href="${resetUrl}" class="reset-btn" style="
                                        display:inline-block;
                                        background:#193cb8;
                                        color:#ffffff !important;
                                        text-decoration:none;
                                        font-size:14px;
                                        font-weight:600;
                                        padding:14px 26px;
                                        border-radius:8px;
                                        margin-bottom:16px;
                                    ">
                                        Reset Password
                                    </a>

                                    <p style="
                                    margin:0;
                                    font-size:12.5px;
                                    color:#64748b !important;
                                ">
                                        This link expires in 15 minutes.<br>
                                        If you didn’t request a password reset, you can safely ignore this email.
                                    </p>
                                </td>
                            </tr>

                            <tr>
                                <td style="
                                padding:14px;
                                background:rgba(255,255,255,0.45) !important;
                                border-top:1px solid rgba(15,23,42,0.05);
                            ">
                                    <p style="
                                    margin:0;
                                    font-size:11px;
                                    color:#94a3b8 !important;
                                    letter-spacing:1.2px;
                                    text-transform:uppercase;
                                    font-weight:600;
                                ">
                                        © 2026 NChat
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </div>
                </div>

            </td>
        </tr>
    </table>

</body>

</html>
`
  await sendEmail(
    user.email,
    emailSubject,
    emailHtml
  );

  await PasswordResetLog.create({
    email,
    userId: user._id,
    ip,
    userAgent: ua,
    success: true,
    reason: 'reset_sent',
  });

  res.clearCookie('forgot_allowed');

  res.status(200).json({
    message: 'If email exists, reset link sent.',
  });
};

// validate the reset token 

exports.validateResetToken = async (req, res) => {
  const tokenHash = crypto
    .createHash('sha256')
    .update(req.body.token)
    .digest('hex');

  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ valid: false });
  }

  res.status(200).json({ valid: true });
};
