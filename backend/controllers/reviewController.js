import Review from '../models/Review.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const updateProductRatings = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const ratings =
    numReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews
      : 0;
  await Product.findByIdAndUpdate(productId, {
    ratings: Math.round(ratings * 10) / 10,
    numReviews,
  });
};

export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, reviews });
});

export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const existing = await Review.findOne({
    product: req.params.productId,
    user: req.user._id,
  });
  if (existing) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const review = await Review.create({
    user: req.user._id,
    product: req.params.productId,
    name: req.user.name,
    rating,
    comment,
  });

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  });
  await product.save();
  await updateProductRatings(req.params.productId);

  res.status(201).json({ success: true, review });
});

export const getFeaturedReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find({})
    .populate('product', 'title images')
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .limit(6);
  res.json({ success: true, reviews });
});
