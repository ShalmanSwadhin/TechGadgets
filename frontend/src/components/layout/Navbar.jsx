import { Link, useNavigate } from 'react-router-dom';
import {
  FiChevronDown,
  FiGrid,
  FiHeart,
  FiLogOut,
  FiMenu,
  FiMoon,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiSun,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import Logo from '../ui/Logo';

export default function Navbar({ onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const { cartCount, openCart, closeCart } = useCart();
  const { dark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      onSearch?.(query);
      setSearchOpen(false);
      setQuery('');
    }
  };

  // Close the profile dropdown on outside click or Escape (accessibility).
  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onPointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const profileTo = isAdmin ? '/admin' : '/dashboard';
  const menuItemClass =
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white';
  const comingSoon = (label) => {
    setUserMenuOpen(false);
    showToast(`${label} is coming soon`, 'info');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-surface-dark/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo textClassName="hidden text-xl font-display font-bold tracking-tight sm:inline" />

        <form onSubmit={handleSearch} className="hidden flex-1 max-w-md md:flex">
          <div className="relative w-full">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search gadgets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => setSearchOpen(!searchOpen)} className="btn-ghost md:hidden" aria-label="Search">
            <FiSearch className="text-xl" />
          </button>
          <button type="button" onClick={toggleTheme} className="btn-ghost" aria-label="Toggle theme">
            {dark ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
          </button>
          <button type="button" onClick={() => openCart()} className="btn-ghost relative" aria-label="Cart">
            <FiShoppingBag className="text-xl" />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="animate-cart-pop absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          {user ? (
            <div className="relative hidden sm:block" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                onClick={() => setUserMenuOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-glow-sm ring-1 ring-white/20">
                  {initials || <FiUser />}
                </span>
                <span className="max-w-[80px] truncate text-sm font-medium">{user.name.split(' ')[0]}</span>
                <FiChevronDown
                  className={`text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="animate-fade-in-scale absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-card backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 p-4 dark:border-white/10">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white shadow-glow-sm ring-1 ring-white/20">
                      {initials || <FiUser />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                      {user.email && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-2">
                    <Link
                      to={profileTo}
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => { setUserMenuOpen(false); closeCart(); }}
                    >
                      <FiUser className="text-base text-brand-500" /> Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      role="menuitem"
                      className={menuItemClass}
                      onClick={() => { setUserMenuOpen(false); closeCart(); }}
                    >
                      <FiPackage className="text-base text-brand-500" /> Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        className={menuItemClass}
                        onClick={() => { setUserMenuOpen(false); closeCart(); }}
                      >
                        <FiGrid className="text-base text-brand-500" /> Admin Panel
                      </Link>
                    )}
                    <button type="button" role="menuitem" className={`${menuItemClass} w-full`} onClick={() => comingSoon('Wishlist')}>
                      <FiHeart className="text-base text-brand-500" /> Wishlist
                    </button>
                    <button type="button" role="menuitem" className={`${menuItemClass} w-full`} onClick={() => comingSoon('Settings')}>
                      <FiSettings className="text-base text-brand-500" /> Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 p-2 dark:border-white/10">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                      onClick={() => { logout(); setUserMenuOpen(false); closeCart(); }}
                    >
                      <FiLogOut className="text-base" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:inline-flex">
              <Link to="/login" className="btn-ghost">
                <FiUser className="text-xl" />
              </Link>
            </div>
          )}
          <button type="button" className="btn-ghost lg:hidden" onClick={() => { setMenuOpen(!menuOpen); closeCart(); }} aria-label="Menu">
            {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={handleSearch} className="border-t border-slate-100 p-4 md:hidden dark:border-slate-800">
          <input
            type="search"
            placeholder="Search gadgets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field"
            autoFocus
          />
        </form>
      )}

      {menuOpen && (
        <nav className="border-t border-slate-100 p-4 lg:hidden dark:border-slate-800">
          <div className="flex flex-col gap-2">
            <Link to="/products" className="btn-ghost justify-start" onClick={() => { setMenuOpen(false); closeCart(); }}>Shop</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="btn-ghost justify-start" onClick={() => { setMenuOpen(false); closeCart(); }}>Dashboard</Link>
                {isAdmin && <Link to="/admin" className="btn-ghost justify-start" onClick={() => { setMenuOpen(false); closeCart(); }}>Admin</Link>}
                <button type="button" className="btn-ghost justify-start text-red-500" onClick={() => { logout(); setMenuOpen(false); closeCart(); }}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost justify-start" onClick={() => { setMenuOpen(false); closeCart(); }}>Login</Link>
                <Link to="/register" className="btn-primary" onClick={() => { setMenuOpen(false); closeCart(); }}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
