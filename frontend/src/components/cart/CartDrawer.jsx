import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiX, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { formatPrice, getEffectivePrice } from '../../utils/format';
import EmptyState from '../ui/EmptyState';

export default function CartDrawer() {
  const {
    items,
    drawerOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
  } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => closeCart()}
      />
      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900 transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <h2 className="text-lg font-bold">Your Cart ({items.length})</h2>
          <button type="button" onClick={() => closeCart()} className="btn-ghost rounded-full p-2" aria-label="Close">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <EmptyState
              icon={FiShoppingBag}
              title="Cart is empty"
              description="Browse our latest tech gadgets and add items to your cart."
              actionLabel="Shop Now"
              actionTo="/products"
            />
          ) : (
            <ul className="space-y-4">
              {items.map(({ product, quantity }) => (
                <li key={product._id} className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <img src={product.images?.[0]} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  <div className="flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{product.title}</p>
                    <p className="mt-1 text-sm font-bold text-brand-600">
                      {formatPrice(getEffectivePrice(product))}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <FiMinus />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <FiPlus />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product._id)}
                        className="ml-auto text-red-500"
                        aria-label="Remove"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold dark:border-slate-800">
                <span>Total (estimated)</span>
                <span className="text-brand-600">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <Link
              to="/checkout"
              onClick={() => closeCart()}
              className="btn-primary mt-4 w-full"
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
