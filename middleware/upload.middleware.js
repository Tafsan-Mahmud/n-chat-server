const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const DataURIParser = require('datauri/parser');
const path = require('path');
const parser = new DataURIParser();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadImageToCloudinary = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const dataUri = parser.format(
    path.extname(req.file.originalname).toString(),
    req.file.buffer
  );

  try {
    const result = await cloudinary.uploader.upload(dataUri.content, {
      folder: 'profile_images',
      quality: 'auto',
      fetch_format: 'auto',
    });
    req.body.profile_image = result.secure_url;
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const err = new Error('Image upload failed.');
    err.status = 500;
    next(err);
  }
};

module.exports = { upload, uploadImageToCloudinary };