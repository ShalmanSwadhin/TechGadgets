import express from 'express';
import {
  getDashboardStats,
  getAnalytics,
  getAllUsers,
  toggleBlockUser,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';
import { getAdminSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

router.use(protect, admin);
router.get('/dashboard', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-block', toggleBlockUser);
router.get('/settings', getAdminSettings);
router.put('/settings', updateSettings);

export default router;
