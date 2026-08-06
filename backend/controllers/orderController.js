import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getPrice = (p) =>
  p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;

export const createOrder = asyncHandler(async (req, res) => {
  const clientRequestId = (req.body.clientRequestId || '').toString().trim() || undefined;

  // Idempotency guard: if this exact checkout submission was already processed
  // (e.g. the client retried after the response was lost during a restart),
  // return the original order instead of creating — and charging stock for —
  // a duplicate. This runs BEFORE any stock mutation.
  if (clientRequestId) {
    const existing = await Order.findOne({ clientRequestId });
    if (existing) {
      return res.status(200).json({ success: true, order: existing, idempotent: true });
    }
  }

  let itemsToProcess = [];
  if (req.user) {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400);
      throw new Error('Cart is empty');
    }
    itemsToProcess = cart.items;
  } else {
    const { items } = req.body;
    if (!items || items.length === 0) {
      res.status(400);
      throw new Error('Cart is empty');
    }
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error('Product not found');
      }
      itemsToProcess.push({ product, quantity: item.quantity });
    }
  }

  // Build the order and prepare (but do not yet apply) stock changes.
  const orderItems = [];
  const stockOps = [];
  let itemsPrice = 0;

  for (const item of itemsToProcess) {
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
    stockOps.push({ productId: product._id, quantity: item.quantity });
  }

  // Guest orders have no account to own them, so anyone who saw/guessed the
  // order id could otherwise read another guest's PII or rewrite their
  // delivery-charge number. This random token is required (in addition to
  // the id) for guest lookups; logged-in orders are authorized by the JWT
  // instead and don't need one.
  const guestAccessToken = req.user ? undefined : crypto.randomBytes(20).toString('hex');

  // Determine shipping price based on settings and destination city/district
  const settings = (await Setting.findOne()) || { deliveryChargeDhaka: 80, deliveryChargeOutside: 150 };
  const districtOrCity = (req.body.shippingAddress?.district || req.body.shippingAddress?.city || '').toString().toLowerCase();
  let shippingPrice = 0;
  if (itemsPrice > 0) {
    shippingPrice = districtOrCity.includes('dhaka') ? settings.deliveryChargeDhaka : settings.deliveryChargeOutside;
  }
  const totalPrice = itemsPrice; // keep order total as product subtotal only; shipping is stored separately

  // Persist the order FIRST. If a concurrent duplicate submission wins the
  // unique clientRequestId race, return that order rather than erroring or
  // double-counting stock (stock is only mutated after a successful create).
  let order;
  try {
    order = await Order.create({
      user: req.user ? req.user._id : undefined,
      orderItems,
      shippingAddress: req.body.shippingAddress,
      deliveryChargePhone: req.body.deliveryChargePhone || '',
      paymentMethod: 'cod',
      itemsPrice,
      shippingPrice,
      totalPrice,
      clientRequestId,
      guestAccessToken,
    });
  } catch (err) {
    if (err.code === 11000 && clientRequestId) {
      const existing = await Order.findOne({ clientRequestId });
      if (existing) {
        return res.status(200).json({ success: true, order: existing, idempotent: true });
      }
    }
    throw err;
  }

  // Order is safely stored — now apply stock/popularity changes and clear cart.
  // Each decrement is conditional on enough stock remaining: if a concurrent
  // order for the same product wins the race first, we clamp to zero instead
  // of letting an unconditional $inc push stock negative. Negative stock
  // would silently defeat the "out of stock" checks elsewhere (which test
  // `stock === 0`), letting an unbounded number of further orders oversell
  // the same item.
  if (stockOps.length > 0) {
    await Promise.all(
      stockOps.map(async ({ productId, quantity }) => {
        const result = await Product.updateOne(
          { _id: productId, stock: { $gte: quantity } },
          { $inc: { stock: -quantity, popularity: quantity } }
        );
        if (result.modifiedCount === 0) {
          await Product.updateOne(
            { _id: productId },
            { $set: { stock: 0 }, $inc: { popularity: quantity } }
          );
        }
      })
    );
  }

  if (req.user) {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
  }

  const orderResponse = order.toObject();
  if (guestAccessToken) orderResponse.guestAccessToken = guestAccessToken;
  res.status(201).json({ success: true, order: orderResponse });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .select('+guestAccessToken')
    .populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.user) {
    if (!req.user || (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      res.status(403);
      throw new Error('Not authorized');
    }
  } else if (!req.user || req.user.role !== 'admin') {
    // Guest order: the id alone is not proof of ownership (Mongo ObjectIds
    // are guessable/enumerable), so a matching guest access token is
    // required unless an admin is looking it up.
    const providedToken = (req.query.token || '').toString();
    if (!order.guestAccessToken || providedToken !== order.guestAccessToken) {
      res.status(404);
      throw new Error('Order not found');
    }
  }
  const orderResponse = order.toObject();
  delete orderResponse.guestAccessToken;
  res.json({ success: true, order: orderResponse });
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
  const order = await Order.findById(req.params.id).select('+guestAccessToken');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user) {
    if (!req.user || (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      res.status(403);
      throw new Error('Not authorized');
    }
  } else if (!req.user || req.user.role !== 'admin') {
    const providedToken = (req.body.token || req.query.token || '').toString();
    if (!order.guestAccessToken || providedToken !== order.guestAccessToken) {
      res.status(404);
      throw new Error('Order not found');
    }
  }

  order.deliveryChargePhone = req.body.deliveryChargePhone ?? order.deliveryChargePhone;
  await order.save();

  const orderResponse = order.toObject();
  delete orderResponse.guestAccessToken;
  res.json({ success: true, order: orderResponse });
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
