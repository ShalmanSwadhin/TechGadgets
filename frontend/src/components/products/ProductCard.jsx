import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import StarRating from '../ui/StarRating';
import { formatPrice, getDiscountPercent, getEffectivePrice } from '../../utils/format';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const discount = getDiscountPercent(product);
  const price = getEffectivePrice(product);
  const outOfStock = product.stock === 0;
  const lowStock = !outOfStock && product.stock <= 5;

  return (
    <article className="group card-interactive flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Link to={`/products/${product._id}`} className="block h-full w-full" aria-label={product.title}>
          <img
            src={product.images?.[0]}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {product.newArrival && <span className="badge-solid">New</span>}
        </div>

        {product.featured && (
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur dark:bg-slate-900/80 dark:text-brand-300">
            Featured
          </span>
        )}

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px]">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-900">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{product.brand}</p>
        <Link to={`/products/${product._id}`} className="mt-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1.5">
          <StarRating rating={product.ratings} />
          <span className="text-xs text-slate-400">({product.numReviews || 0})</span>
        </div>

        {lowStock && (
          <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            Only {product.stock} left
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            {discount > 0 && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
            )}
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(price)}</span>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
            aria-label={`Add ${product.title} to cart`}
          >
            <FiShoppingCart />
          </button>
        </div>
      </div>
    </article>
  );
}
