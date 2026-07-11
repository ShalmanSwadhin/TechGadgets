import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import StarRating from '../components/ui/StarRating';
import ProductCard from '../components/products/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getDiscountPercent, getEffectivePrice } from '../utils/format';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);
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

  const discount = getDiscountPercent(product);
  const price = getEffectivePrice(product);

  return (
    <div className="container-page py-8 pb-28">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-10 lg:grid-cols-2"
      >
        <div>
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

        <div>
          <p className="text-sm font-medium text-brand-600">{product.brand} · {product.category}</p>
          <h1 className="mt-2 text-3xl font-bold">{product.title}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.ratings} size="md" />
            <span className="text-sm text-slate-500">{product.numReviews} reviews</span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-600">{formatPrice(price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
                <span className="rounded-lg bg-red-100 px-2 py-1 text-sm font-bold text-red-600">-{discount}%</span>
              </>
            )}
          </div>
          <p className="mt-6 text-slate-600 dark:text-slate-300">{product.description}</p>

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

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3">
                <FiMinus />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-4 py-3">
                <FiPlus />
              </button>
            </div>
            <button
              type="button"
              onClick={() => addToCart(product, qty)}
              disabled={product.stock === 0}
              className="btn-primary flex-1 sm:flex-none"
            >
              <FiShoppingCart /> {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {product.stock > 0 ? `${product.stock} in stock` : 'Currently unavailable'}
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
