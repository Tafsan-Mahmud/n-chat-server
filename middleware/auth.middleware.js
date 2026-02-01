const jwt = require('jsonwebtoken');
const User = require('../models/User');
exports.protect = async (req, res, next) => {
  let token;

  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    const error = new Error('Not authorized, no token provided.');
    error.status = 401;
    return next(error);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id).select('-password');
    
    
    if (!req.user) {
      const error = new Error('User specified in token no longer exists or was deleted.');
      error.status = 401;
      return next(error);
    }
    next();
  } catch (error) {
    const err = new Error('Not authorized, token failed.');
    err.status = 401;
    next(err);
  }
}