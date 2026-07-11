import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getPrice = (p) =>
  p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;

export const createOrder = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error('Cart is empty');
  }

  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product) continue;
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    const price = getPrice(product);
    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.images[0],
      price,
      quantity: item.quantity,
    });
    itemsPrice += price * item.quantity;
    product.stock -= item.quantity;
    product.popularity += item.quantity;
    await product.save();
  }

  // Determine shipping price based on settings and destination city
  const settings = (await Setting.findOne()) || { deliveryChargeDhaka: 80, deliveryChargeOutside: 150 };
  const city = (req.body.shippingAddress?.city || '').toString().toLowerCase();
  let shippingPrice = 0;
  if (itemsPrice > 0) {
    shippingPrice = city.includes('dhaka') ? settings.deliveryChargeDhaka : settings.deliveryChargeOutside;
  }
  const totalPrice = itemsPrice; // keep order total as product subtotal only; shipping is stored separately

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress: req.body.shippingAddress,
    deliveryChargePhone: req.body.deliveryChargePhone || '',
    paymentMethod: 'cod',
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  cart.items = [];
  await cart.save();

  res.status(201).json({ success: true, order });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = req.body.status || order.status;
  if (req.body.status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.isPaid = true;
    order.paidAt = Date.now();
  }
  await order.save();
  res.json({ success: true, order });
});

export const updateDeliveryChargeNumber = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  order.deliveryChargePhone = req.body.deliveryChargePhone ?? order.deliveryChargePhone;
  await order.save();

  res.json({ success: true, order });
});

export const getOrderStats = asyncHandler(async (_req, res) => {
  const orders = await Order.find({});
  const totalSales = orders.reduce((sum, o) => sum + o.itemsPrice, 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const delivered = orders.filter((o) => o.status === 'delivered').length;
  res.json({
    success: true,
    stats: {
      totalOrders: orders.length,
      totalSales,
      pending,
      delivered,
    },
  });
});
