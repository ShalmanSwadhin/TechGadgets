import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getEffectivePrice = (product) =>
  product.discountPrice != null && product.discountPrice < product.price
    ? product.discountPrice
    : product.price;

export const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
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
  const product = await Product.create(payload);
  res.status(201).json({ success: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.thumbnail && payload.images?.length) {
    payload.thumbnail = payload.images[0];
  }
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
