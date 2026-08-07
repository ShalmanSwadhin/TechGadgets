import express from 'express';
import {
  getAnalytics,
  getAllUsers,
  toggleBlockUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';
import { getAdminSettings, updateSettings } from '../controllers/settingsController.js';
import { getSubscribers } from '../controllers/newsletterController.js';

const router = express.Router();

router.use(protect, admin);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-block', toggleBlockUser);
router.get('/settings', getAdminSettings);
router.put('/settings', updateSettings);
router.get('/newsletter', getSubscribers);

export default router;
