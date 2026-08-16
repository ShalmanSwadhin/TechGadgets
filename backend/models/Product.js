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

// A color variant carries its own price/stock, authoritative over the base
// product price/stock whenever a color is selected. Optional and defaulted
// so products created before variants existed (plain price/stock only)
// continue to work unchanged — `variants: []` behaves exactly like "no
// variants" everywhere this is read.
const variantSchema = new mongoose.Schema(
  {
    // Mongoose's default `required` check treats '' as present, so an empty
    // color would otherwise slip through — the explicit validator closes that.
    color: {
      type: String,
      required: [true, 'Color name is required'],
      trim: true,
      validate: {
        validator: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Color name cannot be empty',
      },
    },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true }
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
        'Wired Headphones',
        'Neckband',
        'Gaming Earphones',
        'Desktop Fan',
        'Mini Speakers',
        'Speakers',
        'Converter',
        'Smartwatch',
        'Microphone',
        'Trimmer',
        'Mouse',
        'Keyboard',
        'Home Accessories',
      ],
    },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    stock: { type: Number, required: true, min: 0, default: 0 },
    // Optional per-color variants. Empty/absent (the default for every
    // existing product) means "this product has no color options" — every
    // price/stock/cart/order code path falls back to the fields above.
    variants: {
      type: [variantSchema],
      default: [],
      validate: {
        validator: (arr) => {
          const colors = (arr || []).map((v) => v.color.toLowerCase().trim());
          return colors.length === new Set(colors).size;
        },
        message: 'Duplicate color variant names are not allowed.',
      },
    },
    sku: { type: String, trim: true, default: '' },
    warranty: { type: String, trim: true, default: '1 year' },
    tags: [{ type: String, trim: true }],
    thumbnail: { type: String, default: '' },
    // The admin UI blocks saving without an image, but the API itself didn't
    // enforce it. A product created with an empty array would pass here
    // silently and then fail every checkout for it later, since orderItemSchema
    // requires `image` and `product.images[0]` would be undefined.
    images: {
      type: [{ type: String, required: true }],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one product image is required.',
      },
    },
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
