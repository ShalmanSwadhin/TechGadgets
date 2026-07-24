import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import StarRating from '../components/ui/StarRating';
import { CATEGORIES } from '../utils/categories';
import { SITE_NAME, SITE_TAGLINE } from '../config/site';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [productsRes, reviewsRes] = await Promise.all([
          api.get('/products?featured=true&limit=8'),
          api.get('/reviews/featured'),
        ]);
        setFeatured(productsRes.data.products);
        setReviews(reviewsRes.data.reviews);
      } catch {
        setFeatured([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        <div className="container-page grid min-h-[85vh] items-center gap-8 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-sm font-medium backdrop-blur">
              New arrivals · Latest deals
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Elevate Your
              <span className="block text-brand-200">Everyday Tech</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-brand-100">
              {SITE_TAGLINE}. Discover premium power banks, fast chargers, earbuds, and smart accessories curated for modern life.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50">
                Shop Now <FiArrowRight />
              </Link>
              <Link to="/products?featured=true" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/10">
                Featured Deals
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <img
              src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80"
              alt="Tech gadgets"
              className="rounded-3xl shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-100 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-page grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
            { icon: FiTruck, title: 'Fast Delivery', desc: 'Local & nationwide' },
            { icon: FiShield, title: 'Secure Checkout', desc: 'Protected payments' },
            { icon: FiRefreshCw, title: 'Easy Returns', desc: '30-day policy' },
            { icon: FiShield, title: 'Warranty', desc: '1-year on select items' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                <Icon className="text-xl" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <h2 className="section-title">Shop by Category</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map(({ name, icon: Icon, color }) => (
              <Link
                key={name}
                to={`/products?category=${encodeURIComponent(name)}`}
                className="group card-interactive flex flex-col items-center gap-3 p-6 text-center"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-2xl text-white shadow-soft`}>
                  <Icon />
                </div>
                <span className="text-sm font-semibold group-hover:text-brand-600">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 dark:bg-slate-900/50">
        <div className="container-page">
          <div className="flex items-end justify-between">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-page">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-violet-600 p-8 text-white sm:p-12">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold sm:text-3xl">Summer Tech Sale</h2>
              <p className="mt-3 text-brand-100">Up to 30% off chargers, power banks, and audio gear. Limited time only.</p>
              <Link to="/products?sort=popularity" className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-brand-700">
                Shop Sale
              </Link>
            </div>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="py-16">
          <div className="container-page">
            <h2 className="section-title text-center">What Customers Say</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <div key={r._id} className="card p-6">
                  <StarRating rating={r.rating} />
                  <p className="mt-4 text-slate-600 dark:text-slate-300">&ldquo;{r.comment}&rdquo;</p>
                  <p className="mt-4 font-semibold">{r.name}</p>
                  {r.product && <p className="text-xs text-slate-500">{r.product.title}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-slate-100 py-16 dark:border-slate-800">
        <div className="container-page mx-auto max-w-xl text-center">
          <h2 className="section-title">Stay in the Loop</h2>
          <p className="mt-2 text-slate-500">Get exclusive deals and new product alerts.</p>
          {subscribed ? (
            <p className="mt-6 font-medium text-emerald-600">Thanks for subscribing!</p>
          ) : (
            <form onSubmit={handleNewsletter} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary">Subscribe</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
