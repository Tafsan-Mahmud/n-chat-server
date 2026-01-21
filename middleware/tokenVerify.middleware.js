// middlewares/verifyTokenOnly.js
const jwt = require('jsonwebtoken');

exports.verifyTokenOnly = (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //  attach ONLY the user ID
    req.tokenUserId = decoded._id || decoded.id;

    next(); //  IMPORTANT
  } catch (err) {
    return res.status(401).json({ valid: false });
  }
};
