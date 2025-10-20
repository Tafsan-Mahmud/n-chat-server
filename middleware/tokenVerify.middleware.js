const jwt = require('jsonwebtoken');

exports.verifyTokenOnly = async (req, res, next) => {
    let token;
    // 1. Get token from HttpOnly cookie set by Express
    if (req.cookies.token) {
        token = req.cookies.token;
        console.log(token,'tokens');
    }
    // Fallback Check: Check if Next.js middleware explicitly forwarded the cookie
    // This handles the race condition where req.cookies.token might not be set yet,
    // but the token is available in the request headers (which Next.js forwards).
    if (!token && req.headers.cookie) {
        const cookieHeader = req.headers.cookie;
        const match = cookieHeader.match(/token=([^;]+)/);
        if (match) {
            token = match[1];
        }
    }

    if (!token) {
        const error = new Error('Not authorized, no token provided.');
        error.status = 401;
        return next(error);
    }

    try {
        // Only verify the signature and expiration
       const decode= jwt.verify(token, process.env.JWT_SECRET);
       console.log(decode,'sdfhasdfjhsdfjhdsf')
        next();
    } catch (error) {
        // Log the error to see what went wrong (e.g., TokenExpiredError, JsonWebTokenError)
        console.error('JWT Verification Failed during quick check:', error.message);

        // Handles expired or invalid signature
        const err = new Error('Not authorized, token failed.');
        err.status = 401;
        next(err);
    }
};