import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No files were uploaded');
  }

  const uploads = req.files.map(
    (file) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'techgadgets/products',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        streamifier.createReadStream(file.buffer).pipe(stream);
      })
  );

  const results = await Promise.all(uploads);
  res.json({
    success: true,
    urls: results.map((result) => result.secure_url),
  });
});
