import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getEffectivePrice, parseDiscountInput } from '../utils/pricing.js';

// Validates and normalizes every discount in an incoming create/update body so
// bad or empty input can never be stored as a valid discount: '', null, 0 and
// missing all become null (no discount); non-numeric, negative, or >= price is
// rejected with a 400. `currentPrice` is the stored price, used when an update
// sends a discount without also sending the price.
const normalizeDiscounts = (res, payload, currentPrice) => {
  const fail = (message) => {
    res.status(400);
    throw new Error(message);
  };

  if ('discountPrice' in payload) {
    const price = payload.price !== undefined ? Number(payload.price) : currentPrice;
    const parsed = parseDiscountInput(payload.discountPrice, price);
    if (parsed.error) fail(parsed.error);
    payload.discountPrice = parsed.value;
  }

  if (Array.isArray(payload.variants)) {
    payload.variants = payload.variants.map((variant) => {
      if (!variant || typeof variant !== 'object' || !('discountPrice' in variant)) return variant;
      const parsed = parseDiscountInput(variant.discountPrice, Number(variant.price));
      if (parsed.error) fail(`${variant.color || 'Color variant'}: ${parsed.error}`);
      return { ...variant, discountPrice: parsed.value };
    });
  }
};

export const getProducts = asyncHandler(async (req, res) => {
  // Clamp to sane bounds: an unbounded/negative page or limit (e.g.
  // ?limit=1000000 or ?page=0) would otherwise let a client force a huge,
  // memory-heavy query or trigger a Mongo error from a negative skip.
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(req.query.limit)) || 12));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.featured = true;
  if (req.query.newArrival === 'true') filter.newArrival = true;

  const search = req.query.search?.trim();
  if (search) {
    // Case-insensitive partial match across every user-facing field.
    // Special regex characters are escaped so queries like "USB-C" are safe.
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const term = { $regex: escaped, $options: 'i' };
    filter.$or = [
      { title: term },
      { description: term },
      { brand: term },
      { category: term },
      { sku: term },
      { tags: term },
    ];
  }

  let sort = { createdAt: -1 };
  if (req.query.sort === 'price-asc') sort = { price: 1 };
  if (req.query.sort === 'price-desc') sort = { price: -1 };
  if (req.query.sort === 'popularity') sort = { popularity: -1, numReviews: -1 };
  if (req.query.sort === 'rating') sort = { ratings: -1 };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort(sort).skip(skip).limit(limit);

  res.json({
    success: true,
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    'reviews.user',
    'name'
  );
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  const related = await Product.find({
    category: product.category,
    _id: { $ne: product._id },
  }).limit(4);
  res.json({ success: true, products: related });
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.thumbnail && payload.images?.length) {
    payload.thumbnail = payload.images[0];
  }
  normalizeDiscounts(res, payload, undefined);
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.thumbnail && payload.images?.length) {
    payload.thumbnail = payload.images[0];
  }
  let currentPrice;
  if ('discountPrice' in payload && payload.price === undefined) {
    currentPrice = (await Product.findById(req.params.id).select('price'))?.price;
  }
  normalizeDiscounts(res, payload, currentPrice);
  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ success: true, message: 'Product removed' });
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct('category');
  res.json({ success: true, categories });
});

export { getEffectivePrice };
