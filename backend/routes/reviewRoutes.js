import express from 'express';
import { body } from 'express-validator';
import {
  getProductReviews,
  createReview,
  getFeaturedReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.get('/featured', getFeaturedReviews);
router.get('/product/:productId', getProductReviews);
router.post(
  '/product/:productId',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5 required'),
    body('comment').trim().notEmpty().withMessage('Comment required'),
  ],
  validate,
  createReview
);

export default router;
