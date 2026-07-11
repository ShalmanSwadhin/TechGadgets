import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiMoon, FiSearch, FiShoppingBag, FiSun, FiUser, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { SITE_NAME } from '../../config/site';

export default function Navbar({ onSearch }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const { cartCount, openCart, closeCart } = useCart();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      onSearch?.(query);
      setSearchOpen(false);
      setQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">TG</span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

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
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          {user ? (
            <div className="relative hidden sm:block">
              <button type="button" className="btn-ghost flex items-center gap-2" onClick={(e) => { e.stopPropagation(); setUserMenuOpen((s) => !s); }}>
                <FiUser className="text-xl" />
                <span className="max-w-[80px] truncate text-sm">{user.name.split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white p-2 shadow-md dark:bg-slate-800">
                  <Link to={isAdmin ? '/admin' : '/dashboard'} className="block px-3 py-2 text-sm" onClick={() => { setMenuOpen(false); closeCart(); }}>Profile</Link>
                  <button type="button" className="block w-full text-left px-3 py-2 text-sm text-red-500" onClick={() => { logout(); setUserMenuOpen(false); closeCart(); }}>Logout</button>
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
