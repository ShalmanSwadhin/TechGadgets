import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMinus, FiPlus, FiShoppingCart, FiShield, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import StarRating from '../components/ui/StarRating';
import ProductCard from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getDiscountPercent, getEffectivePrice, resolveVariantPricing } from '../utils/format';
import { useSeo } from '../hooks/useSeo';
import { SITE_NAME } from '../config/site';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, relRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/related`),
          api.get(`/reviews/product/${id}`),
        ]);
        setProduct(prodRes.data.product);
        setRelated(relRes.data.products);
        setReviews(revRes.data.reviews);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Default to the first color so price/stock always reflect a real,
  // purchasable selection; products without variants never touch this.
  useEffect(() => {
    setSelectedColor(product?.variants?.length > 0 ? product.variants[0].color : '');
  }, [product]);

  // A quantity valid for one color may exceed another's stock — reset on
  // every color change rather than silently carrying over an invalid value.
  useEffect(() => {
    setQty(1);
  }, [selectedColor]);

  useSeo({
    title: product ? `${product.title} | ${SITE_NAME}` : undefined,
    description: product?.description ? product.description.slice(0, 155) : undefined,
  });

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to review', 'info');
      return;
    }
    try {
      await api.post(`/reviews/product/${id}`, reviewForm);
      showToast('Review submitted');
      const { data } = await api.get(`/reviews/product/${id}`);
      setReviews(data.reviews);
      const { data: p } = await api.get(`/products/${id}`);
      setProduct(p.product);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-red-500">{error || 'Product not found'}</p>
        <Link to="/products" className="btn-primary mt-4 inline-flex">Back to Shop</Link>
      </div>
    );
  }

  // Variant products (color options) price and stock from the selected
  // color; a product with no variants prices/stocks from itself exactly as
  // before — nothing here changes for any existing, variant-less product.
  const selectedVariant = product.variants?.length > 0
    ? product.variants.find((v) => v.color === selectedColor) || product.variants[0]
    : null;
  const pricedFrom = selectedVariant ? resolveVariantPricing(product, selectedVariant) : product;
  const discount = getDiscountPercent(pricedFrom);
  const price = getEffectivePrice(pricedFrom);
  const stockForSelection = selectedVariant ? selectedVariant.stock : product.stock;

  const handleAddToCart = () => addToCart(product, qty, selectedVariant?.color);
  const handleBuyNow = async () => {
    await addToCart(product, qty, selectedVariant?.color);
    navigate('/checkout');
  };

  return (
    <div className="container-page py-8 pb-28">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 gap-10 lg:grid-cols-2"
      >
        {/* min-w-0: grid items default to min-width:auto, which lets a wide
            child (e.g. a long unbroken title, or the action-button row)
            force this column past the viewport instead of shrinking/wrapping
            to fit it — this is what let content get clipped on mobile. */}
        <div className="min-w-0">
          <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            <img
              src={product.images[activeImage]}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${
                    activeImage === i ? 'border-brand-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-600">{product.brand} · {product.category}</p>
          <h1 className="mt-2 break-words text-3xl font-bold">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.ratings} size="md" />
            <span className="text-sm text-slate-500">{product.numReviews} reviews</span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-600">{formatPrice(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(pricedFrom.price)}</span>
                <span className="rounded-lg bg-red-100 px-2 py-1 text-sm font-bold text-red-600">-{discount}%</span>
              </>
            )}
          </div>

          {product.warranty && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <FiShield className="text-brand-500" /> Warranty: <span className="font-medium">{product.warranty}</span>
            </p>
          )}

          {product.variants?.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium">Color: <span className="text-slate-500 dark:text-slate-400">{selectedVariant?.color}</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const active = v.color === selectedVariant?.color;
                  const variantOut = v.stock === 0;
                  return (
                    <button
                      key={v._id || v.color}
                      type="button"
                      onClick={() => setSelectedColor(v.color)}
                      disabled={variantOut}
                      className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-brand-600 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                      } ${variantOut ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {active && <FiCheck className="text-brand-600 dark:text-brand-300" />}
                      {v.color}
                      {variantOut && <span className="text-xs">(Out of stock)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* whitespace-pre-line preserves the line breaks/bullets the admin
              typed — the stored description is already intact, this just
              stops the browser's default text collapsing from hiding it. */}
          <p className="mt-6 whitespace-pre-line text-slate-600 dark:text-slate-300">{product.description}</p>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6 card p-4">
              <h3 className="font-semibold">Specifications</h3>
              <dl className="mt-3 space-y-2 text-sm">
                {Object.entries(
                  product.specifications instanceof Map
                    ? Object.fromEntries(product.specifications)
                    : product.specifications
                ).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                    <dt className="text-slate-500">{key}</dt>
                    <dd className="font-medium">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Stacks on mobile (qty row, then a full-width button row) instead
              of relying on flex-wrap to shrink everything into one row —
              flex items refuse to shrink below their content's natural
              width without an explicit min-width, which was overflowing
              the viewport and clipping "Buy Now" off the right edge. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="min-h-[44px] min-w-[44px] px-4 py-3">
                <FiMinus />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(stockForSelection, qty + 1))} className="min-h-[44px] min-w-[44px] px-4 py-3">
                <FiPlus />
              </button>
            </div>
            <div className="flex min-w-0 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={stockForSelection === 0}
                className="btn-secondary min-h-[44px] min-w-0 flex-1 sm:flex-none"
              >
                <FiShoppingCart /> {stockForSelection === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={stockForSelection === 0}
                className="btn-primary min-h-[44px] min-w-0 flex-1 sm:flex-none"
              >
                Buy Now
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {stockForSelection > 0 ? `${stockForSelection} in stock` : 'Currently unavailable'}
          </p>
        </div>
      </motion.div>

      <section className="mt-16">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        {isAuthenticated && (
          <form onSubmit={submitReview} className="mt-4 card p-4">
            <label className="text-sm font-medium">Your Rating</label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              className="input-field mt-1 max-w-xs"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} stars</option>
              ))}
            </select>
            <textarea
              required
              placeholder="Share your experience..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input-field mt-3 min-h-[100px]"
            />
            <button type="submit" className="btn-primary mt-3">Submit Review</button>
          </form>
        )}
        <div className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <p className="text-slate-500">No reviews yet. Be the first!</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center gap-2">
                  <StarRating rating={r.rating} />
                  <span className="font-medium">{r.name}</span>
                </div>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">Related Products</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
