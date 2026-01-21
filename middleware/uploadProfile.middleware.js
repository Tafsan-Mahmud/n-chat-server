// middleware/uploadAvatar.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat_app/Profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:low' },
      { fetch_format: 'auto' },
    ],
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 7 * 1024 * 1024, // 7MB
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

module.exports = {
  upload,
};
