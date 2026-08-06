import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// The app-wide limiter (100 req / 15 min) is far too loose to stop a
// credential-stuffing/brute-force run against login. Scope a much tighter
// limit to the auth endpoints specifically; keyed by IP + email so one
// slow attacker can't lock out every other account sharing that IP (NAT/office).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 characters'),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
