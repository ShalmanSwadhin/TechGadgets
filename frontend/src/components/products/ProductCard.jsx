import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import StarRating from '../ui/StarRating';
import { formatPrice, getDiscountPercent, getEffectivePrice, resolveVariantPricing } from '../../utils/format';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const hasVariants = product.variants?.length > 0;
  // With color variants, the quick-add button can't know which color the
  // customer wants — send them to the product page to choose instead of
  // guessing (silently defaulting to a color they didn't pick).
  const firstVariant = hasVariants ? product.variants[0] : null;
  const pricedFrom = firstVariant ? resolveVariantPricing(product, firstVariant) : product;
  const discount = getDiscountPercent(pricedFrom);
  const price = getEffectivePrice(pricedFrom);
  const stockForCard = hasVariants
    ? product.variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;
  const outOfStock = stockForCard === 0;
  const lowStock = !outOfStock && stockForCard <= 5;

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
            Only {stockForCard} left
          </p>
        )}

        {/* The price gets its own full-width row so it's never squeezed by
            a neighboring button — the button sits in its own row below,
            full width, so it never competes with the price for space. */}
        <div className="mt-auto pt-3">
          <div className="flex flex-col">
            {discount > 0 && (
              <span className="text-xs text-slate-400 line-through">{formatPrice(pricedFrom.price)}</span>
            )}
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatPrice(price)}</span>
            {hasVariants && <span className="text-[11px] text-slate-400">{product.variants.length} colors</span>}
          </div>
          <button
            type="button"
            onClick={() => (hasVariants ? navigate(`/products/${product._id}`) : addToCart(product))}
            disabled={outOfStock}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0"
            aria-label={hasVariants ? `View ${product.title} colors` : `Add ${product.title} to cart`}
          >
            <FiShoppingCart />
            {outOfStock ? 'Out of Stock' : hasVariants ? 'View Options' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
}
