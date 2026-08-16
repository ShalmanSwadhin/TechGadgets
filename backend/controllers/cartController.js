import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const populateCart = (query) =>
  query.populate({
    path: 'items.product',
    select: 'title images price discountPrice stock variants brand category ratings',
  });

// Normalizes "no color" to a single comparable value (missing, undefined,
// and '' all mean the same thing: this line item has no variant).
const normColor = (c) => (c ? String(c).trim() : undefined);

// Resolves the price/stock that actually apply to `productId` + `color`:
// the matching variant's when the product has variants (color required),
// otherwise the product's own price/stock (existing, non-variant behavior).
const resolveStock = (product, color) => {
  if (product.variants?.length > 0) {
    if (!color) return { error: 'Please select a color' };
    const variant = product.variants.find((v) => v.color === color);
    if (!variant) return { error: 'Invalid color variant' };
    return { stock: variant.stock };
  }
  return { stock: product.stock };
};

export const getCart = asyncHandler(async (req, res) => {
  let cart = await populateCart(Cart.findOne({ user: req.user._id }));
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
    cart = await populateCart(Cart.findById(cart._id));
  }
  res.json({ success: true, cart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const color = normColor(req.body.color);
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const { stock, error } = resolveStock(product, color);
  if (error) {
    res.status(400);
    throw new Error(error);
  }
  if (stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const idx = cart.items.findIndex(
    (i) => i.product.toString() === productId && normColor(i.color) === color
  );
  if (idx > -1) {
    cart.items[idx].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity, color });
  }
  await cart.save();
  cart = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, cart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  const color = normColor(req.body.color);
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  if (quantity < 1) {
    res.status(400);
    throw new Error('Quantity must be at least 1');
  }

  const { stock, error } = resolveStock(product, color);
  if (error) {
    res.status(400);
    throw new Error(error);
  }
  if (stock < quantity) {
    res.status(400);
    throw new Error('Insufficient stock');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId && normColor(i.color) === color
  );
  if (!item) {
    res.status(404);
    throw new Error('Item not in cart');
  }
  item.quantity = quantity;
  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, cart: populated });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const color = normColor(req.query.color);
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Cart not found');
  }
  cart.items = cart.items.filter(
    (i) => !(i.product.toString() === req.params.productId && normColor(i.color) === color)
  );
  await cart.save();
  const populated = await populateCart(Cart.findById(cart._id));
  res.json({ success: true, cart: populated });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  res.json({ success: true, cart: cart || { items: [] } });
});
