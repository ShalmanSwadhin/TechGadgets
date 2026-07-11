import express from 'express';
import upload from '../middleware/upload.js';
import { protect, admin } from '../middleware/auth.js';
import { uploadImages } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/', protect, admin, upload.array('images', 8), uploadImages);

export default router;
