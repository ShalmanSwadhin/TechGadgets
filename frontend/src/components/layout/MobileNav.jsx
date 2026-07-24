import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingBag, FiUser } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/', icon: FiHome, label: 'Home' },
  { to: '/products', icon: FiGrid, label: 'Shop' },
  { cart: true, icon: FiShoppingBag, label: 'Cart' },
  { to: '/dashboard', icon: FiUser, label: 'Account' },
];

export default function MobileNav() {
  const location = useLocation();
  const { cartCount, openCart } = useCart();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-safe md:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-center justify-around py-2">
        {links.map((link) => {
          const Icon = link.icon;
          if (link.cart) {
            return (
              <button
                key="cart"
                type="button"
                onClick={() => openCart()}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-slate-500"
              >
                <Icon className="text-xl" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                    {cartCount}
                  </span>
                )}
                {link.label}
              </button>
            );
          }
          const to = link.to === '/dashboard' && !user ? '/login' : link.to;
          const active = location.pathname === to || (to === '/products' && location.pathname.startsWith('/products'));
          return (
            <Link
              key={link.to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition ${
                active ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="text-xl" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
