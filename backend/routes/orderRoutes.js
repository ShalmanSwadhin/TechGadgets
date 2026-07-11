import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateDeliveryChargeNumber,
  getOrderStats,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const shippingValidation = [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone required'),
  body('shippingAddress.street').notEmpty().withMessage('Street required'),
  body('shippingAddress.city').notEmpty().withMessage('City required'),
  body('shippingAddress.state').notEmpty().withMessage('State required'),
  body('shippingAddress.zipCode').notEmpty().withMessage('Zip code required'),
  body('shippingAddress.country').notEmpty().withMessage('Country required'),
];

router.post('/', protect, shippingValidation, validate, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/delivery-charge', protect, updateDeliveryChargeNumber);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
