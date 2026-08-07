import express from 'express';
import { body } from 'express-validator';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  updateDeliveryChargeNumber,
} from '../controllers/orderController.js';
import { protect, admin, optionalProtect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const shippingValidation = [
  body('shippingAddress.fullName').notEmpty().withMessage('Full name required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone required'),
  body('shippingAddress.district').notEmpty().withMessage('District required'),
  body('shippingAddress.thana').notEmpty().withMessage('Upazila/Thana required'),
  body('shippingAddress.area').notEmpty().withMessage('Area/Road/Village required'),
  body('shippingAddress.country').notEmpty().withMessage('Country required'),
];

router.post('/', optionalProtect, shippingValidation, validate, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', optionalProtect, getOrderById);
router.put('/:id/delivery-charge', optionalProtect, updateDeliveryChargeNumber);
router.put('/:id/status', protect, admin, updateOrderStatus);

export default router;
