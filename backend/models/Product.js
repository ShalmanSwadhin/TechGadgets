import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        'Power Banks',
        'Fast Chargers',
        'Turbo Fans',
        'Earbuds',
        'Headphones',
        'USB Cables',
        'Smart Gadgets',
        'Phone Accessories',
      ],
    },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, default: '' },
    warranty: { type: String, trim: true, default: '1 year' },
    tags: [{ type: String, trim: true }],
    thumbnail: { type: String, default: '' },
    images: [{ type: String, required: true }],
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
    featured: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    specifications: { type: Map, of: String, default: {} },
    popularity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice != null && this.discountPrice < this.price
    ? this.discountPrice
    : this.price;
});

// Indexes to keep listing, filtering, and sorting efficient at scale.
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ newArrival: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ sku: 1 });
// Text index powers relevance-based full-text search across key fields.
productSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' });

const Product = mongoose.model('Product', productSchema);
export default Product;
