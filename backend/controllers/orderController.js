import mongoose from 'mongoose';
import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getPrice = (p) =>
  p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;

class InsufficientStockError extends Error {}

// Flips to false the first time this MongoDB deployment reports it can't run
// multi-document transactions (a standalone server, not a replica set or
// mongos — possible on some local/dev setups, never true on MongoDB Atlas).
// Checked once so a non-replica-set local DB doesn't retry-and-fail a
// transaction on every single checkout for the rest of the process.
let transactionsSupported = true;
const isTransactionsUnsupportedError = (err) =>
  /Transaction numbers are only allowed on a replica set member or mongos/i.test(err.message || '');

// Atomically reserves stock and creates the order in one multi-document
// transaction: if any item is oversold, the whole thing — including every
// stock decrement already applied earlier in this same attempt — rolls back
// automatically. This is the strong, race-free path used on Atlas.
// Builds the Mongo filter/update pair for a stock decrement, targeting the
// matching color variant's stock when the item has a color, otherwise the
// product's own top-level stock (unchanged, non-variant behavior).
const decrementQuery = (productId, quantity, color) =>
  color
    ? {
        filter: { _id: productId, variants: { $elemMatch: { color, stock: { $gte: quantity } } } },
        update: { $inc: { 'variants.$.stock': -quantity, popularity: quantity } },
      }
    : {
        filter: { _id: productId, stock: { $gte: quantity } },
        update: { $inc: { stock: -quantity, popularity: quantity } },
      };

async function createOrderTransactional(orderPayload, stockOps) {
  const session = await mongoose.startSession();
  try {
    let createdOrder;
    await session.withTransaction(async () => {
      for (const { productId, quantity, color } of stockOps) {
        const { filter, update } = decrementQuery(productId, quantity, color);
        const result = await Product.updateOne(filter, update, { session });
        if (result.modifiedCount === 0) {
          throw new InsufficientStockError('Insufficient stock for one or more items. Please refresh your cart and try again.');
        }
      }
      const [created] = await Order.create([orderPayload], { session });
      createdOrder = created;
    });
    return createdOrder;
  } finally {
    await session.endSession();
  }
}

// Fallback for MongoDB deployments that can't run transactions (standalone,
// non-replica-set — local dev only; never Atlas). Without a transaction we
// can't atomically reject an oversold order before it's created without
// risking a worse failure mode (a crash between reserving stock and creating
// the order would silently lose inventory tracking with no order to show for
// it). So this keeps the order-first approach and clamps stock to zero
// instead of letting it go negative — negative stock would silently defeat
// the "out of stock" checks elsewhere (which test `stock === 0`), letting an
// unbounded number of further orders oversell the same item. It's a weaker
// guarantee than the transactional path (a rare oversell can still slip
// through), but it can never crash-and-lose-stock or 500 the whole request.
async function createOrderNonTransactional(orderPayload) {
  const order = await Order.create(orderPayload);
  const stockOps = orderPayload.orderItems.map((i) => ({
    productId: i.product,
    quantity: i.quantity,
    color: i.color,
  }));
  if (stockOps.length > 0) {
    await Promise.all(
      stockOps.map(async ({ productId, quantity, color }) => {
        const { filter, update } = decrementQuery(productId, quantity, color);
        const result = await Product.updateOne(filter, update);
        if (result.modifiedCount === 0) {
          const clampFilter = color ? { _id: productId, 'variants.color': color } : { _id: productId };
          const clampUpdate = color
            ? { $set: { 'variants.$.stock': 0 }, $inc: { popularity: quantity } }
            : { $set: { stock: 0 }, $inc: { popularity: quantity } };
          await Product.updateOne(clampFilter, clampUpdate);
        }
      })
    );
  }
  return order;
}

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
      itemsToProcess.push({ product, quantity: item.quantity, color: item.color || undefined });
    }
  }

  // Build the order and prepare (but do not yet apply) stock changes.
  const orderItems = [];
  const stockOps = [];
  let itemsPrice = 0;

  for (const item of itemsToProcess) {
    const product = item.product;
    if (!product) continue;
    const color = item.color || undefined;

    // Variant products (color options) are priced/stocked per color; the
    // base price/stock only apply when the product has no variants at all —
    // this is what keeps every existing, variant-less product unchanged.
    let unitPrice;
    let availableStock;
    if (product.variants?.length > 0) {
      if (!color) {
        res.status(400);
        throw new Error(`Please select a color for ${product.title}`);
      }
      const variant = product.variants.find((v) => v.color === color);
      if (!variant) {
        res.status(400);
        throw new Error(`Invalid color variant for ${product.title}`);
      }
      availableStock = variant.stock;
      unitPrice =
        variant.discountPrice != null && variant.discountPrice < variant.price
          ? variant.discountPrice
          : variant.price;
    } else {
      availableStock = product.stock;
      unitPrice = getPrice(product);
    }

    if (availableStock < item.quantity) {
      res.status(400);
      throw new Error(`Insufficient stock for ${product.title}`);
    }
    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.images[0],
      price: unitPrice,
      quantity: item.quantity,
      color,
    });
    itemsPrice += unitPrice * item.quantity;
    stockOps.push({ productId: product._id, quantity: item.quantity, color });
  }

  // Guest orders have no account to own them, so anyone who saw/guessed the
  // order id could otherwise read another guest's PII or rewrite their
  // delivery-charge number. This random token is required (in addition to
  // the id) for guest lookups; logged-in orders are authorized by the JWT
  // instead and don't need one.
  const guestAccessToken = req.user ? undefined : crypto.randomBytes(20).toString('hex');

  // Determine shipping price from the explicit delivery zone the customer
  // picked at checkout. The zone (not free-text district parsing) is the
  // source of truth so what the UI shows the customer always matches what
  // gets charged; district-based inference is kept only as a fallback for
  // any caller that doesn't send a zone (keeps old/external requests working).
  const settings = (await Setting.findOne()) || {
    deliveryChargeDhaka: 80,
    deliveryChargeSubCity: 100,
    deliveryChargeOutside: 130,
  };
  const rawZone = (req.body.deliveryZone || '').toString().toLowerCase();
  const deliveryZone = ['dhaka', 'subcity', 'outside'].includes(rawZone)
    ? rawZone
    : (req.body.shippingAddress?.district || req.body.shippingAddress?.city || '')
          .toString()
          .toLowerCase()
          .includes('dhaka')
      ? 'dhaka'
      : 'outside';
  const ZONE_RATE = {
    dhaka: settings.deliveryChargeDhaka,
    subcity: settings.deliveryChargeSubCity,
    outside: settings.deliveryChargeOutside,
  };
  let shippingPrice = 0;
  if (itemsPrice > 0) {
    shippingPrice = ZONE_RATE[deliveryZone];
  }
  const totalPrice = itemsPrice; // keep order total as product subtotal only; shipping is stored separately

  const orderPayload = {
    user: req.user ? req.user._id : undefined,
    orderItems,
    shippingAddress: req.body.shippingAddress,
    deliveryZone: itemsPrice > 0 ? deliveryZone : undefined,
    deliveryChargePhone: req.body.deliveryChargePhone || '',
    paymentMethod: 'cod',
    itemsPrice,
    shippingPrice,
    totalPrice,
    clientRequestId,
    guestAccessToken,
  };

  let order;
  try {
    order = transactionsSupported
      ? await createOrderTransactional(orderPayload, stockOps)
      : await createOrderNonTransactional(orderPayload);
  } catch (err) {
    if (transactionsSupported && isTransactionsUnsupportedError(err)) {
      transactionsSupported = false;
      console.warn(
        'MongoDB does not support multi-document transactions on this deployment ' +
          '(not a replica set/mongos) — falling back to the non-transactional ' +
          'stock-reservation path for the rest of this process. Expected for some ' +
          'local/standalone MongoDB setups; always false on MongoDB Atlas.'
      );
      order = await createOrderNonTransactional(orderPayload);
    } else if (err.code === 11000) {
      // A concurrent duplicate submission (same clientRequestId) won the
      // race and already created the order — return that one instead of
      // erroring or double-counting stock.
      if (clientRequestId) {
        const existing = await Order.findOne({ clientRequestId });
        if (existing) {
          return res.status(200).json({ success: true, order: existing, idempotent: true });
        }
      }
      throw err;
    } else if (err instanceof InsufficientStockError) {
      res.status(400);
      throw err;
    } else {
      throw err;
    }
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

