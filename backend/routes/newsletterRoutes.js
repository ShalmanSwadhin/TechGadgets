import express from 'express';
import { body } from 'express-validator';
import { subscribe } from '../controllers/newsletterController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/',
  [body('email').isEmail().withMessage('A valid email address is required')],
  validate,
  subscribe
);

export default router;
