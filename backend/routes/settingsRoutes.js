import express from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const router = express.Router();

// Public settings (read-only)
router.get('/', getPublicSettings);

export default router;
