import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiYoutube } from 'react-icons/fi';
import { SITE_ADDRESS, SITE_EMAIL, SITE_PHONE, SITE_NAME } from '../../config/site';
import Logo from '../ui/Logo';

export default function Footer() {
  return (
    <footer className="relative border-t border-slate-200/70 bg-white/60 pb-24 pt-12 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/60 md:pb-12">
      <div className="container-page grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Premium electronics and accessories curated for everyday performance, travel, and comfort.
          </p>
          <div className="mt-4 flex gap-3 text-slate-400">
            {[FiTwitter, FiInstagram, FiFacebook, FiYoutube].map((Icon, i) => (
              <a key={i} href="#" className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" aria-label="Social">
                <Icon className="text-lg" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li><Link to="/products" className="hover:text-brand-600">All Products</Link></li>
            <li><Link to="/products?category=Power+Banks" className="hover:text-brand-600">Power Banks</Link></li>
            <li><Link to="/products?category=Earbuds" className="hover:text-brand-600">Earbuds</Link></li>
            <li><Link to="/products?category=Fast+Chargers" className="hover:text-brand-600">Chargers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Support</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li><a href={`mailto:${SITE_EMAIL}`} className="hover:text-brand-600">{SITE_EMAIL}</a></li>
            <li><a href={`tel:${SITE_PHONE}`} className="hover:text-brand-600">{SITE_PHONE}</a></li>
            <li>{SITE_ADDRESS}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Account</h4>
          <ul className="mt-4 space-y-2 text-sm text-slate-500">
            <li><Link to="/login" className="hover:text-brand-600">Login</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">Register</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-600">My Orders</Link></li>
            <li><Link to="/checkout" className="hover:text-brand-600">Checkout</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-page mt-10 border-t border-slate-100 pt-6 text-center text-sm text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
