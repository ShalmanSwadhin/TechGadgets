import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // SVG is technically an "image/*" mimetype but is XML that can embed
    // <script>, making it a stored-XSS vector if the uploaded file is ever
    // opened directly rather than rendered inside an <img> tag. Product
    // photos never need SVG, so it's excluded outright.
    if (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

export default upload;
