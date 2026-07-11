import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart } from 'react-icons/fi';
import StarRating from '../ui/StarRating';
import { formatPrice, getDiscountPercent, getEffectivePrice } from '../../utils/format';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const discount = getDiscountPercent(product);
  const price = getEffectivePrice(product);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group card overflow-hidden transition hover:shadow-card"
    >
      <Link to={`/products/${product._id}`} className="relative block aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800">
        <img
          src={product.images?.[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {product.featured && (
          <span className="absolute right-3 top-3 rounded-lg bg-brand-600 px-2 py-1 text-xs font-bold text-white">
            Featured
          </span>
        )}
      </Link>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{product.brand}</p>
        <Link to={`/products/${product._id}`}>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug hover:text-brand-600">
            {product.title}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <StarRating rating={product.ratings} />
          <span className="text-xs text-slate-500">({product.numReviews || 0})</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-brand-700 dark:text-brand-400">
              {formatPrice(price)}
            </span>
            {discount > 0 && (
              <span className="ml-2 text-sm text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
            aria-label="Add to cart"
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
