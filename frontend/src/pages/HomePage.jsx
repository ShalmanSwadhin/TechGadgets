import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiTruck,
  FiShield,
  FiHeadphones,
  FiCheckCircle,
  FiZap,
  FiTag,
  FiShoppingBag,
} from 'react-icons/fi';
import api from '../services/api';
import CategorySlider from '../components/home/CategorySlider';
import ProductCard from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import StarRating from '../components/ui/StarRating';
import SectionHeader from '../components/ui/SectionHeader';
import EmptyState from '../components/ui/EmptyState';
import { CATEGORIES } from '../utils/categories';
import { SITE_NAME, SITE_TAGLINE } from '../config/site';
import { useToast } from '../context/ToastContext';

const WHY = [
  { icon: FiCheckCircle, title: 'Genuine Products', desc: 'Every gadget is 100% authentic with an official warranty.' },
  { icon: FiTruck, title: 'Fast Nationwide Delivery', desc: 'Quick, tracked shipping to your doorstep across the country.' },
  { icon: FiShield, title: 'Secure Checkout', desc: 'Your payment and personal data are always protected.' },
  { icon: FiHeadphones, title: 'Dedicated Support', desc: 'Real people ready to help before and after you buy.' },
];

function ProductGrid({ loading, products }) {
  if (loading) {
    return (
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [trendingRes, newRes, featuredRes, reviewsRes] = await Promise.all([
          api.get('/products?sort=popularity&limit=8'),
          api.get('/products?newArrival=true&limit=8'),
          api.get('/products?featured=true&limit=8'),
          api.get('/reviews/featured'),
        ]);
        setTrending(trendingRes.data.products);
        setNewArrivals(newRes.data.products);
        setFeatured(featuredRes.data.products);
        setReviews(reviewsRes.data.reviews);
      } catch {
        setTrending([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    if (!email || subscribing) return;
    setSubscribing(true);
    try {
      await api.post('/newsletter', { email });
      setSubscribed(true);
    } catch (err) {
      showToast(err.message || 'Could not subscribe right now', 'error');
    } finally {
      setSubscribing(false);
    }
  };

  const viewAll = (to) => (
    <Link to={to} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:gap-2.5 dark:text-brand-400">
      View all <FiArrowRight />
    </Link>
  );

  return (
    <div>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-hero-gradient text-white">
        <div className="container-page grid min-h-[88vh] items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
              New arrivals · Latest deals
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Premium Tech,
              <span className="block bg-gradient-to-r from-brand-300 to-brand-400 bg-clip-text text-transparent">
                Curated for You
              </span>
            </h1>
            <p className="mt-4 text-lg font-semibold text-brand-200">{SITE_TAGLINE}</p>
            <p className="mt-4 max-w-lg text-lg text-slate-300">
              Discover premium power banks, fast chargers, earbuds, and smart accessories built for modern life.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                Shop Now <FiArrowRight />
              </Link>
              <Link to="/products?featured=true" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/10">
                Featured Deals
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2"><FiTruck className="text-brand-300" /> Fast delivery</span>
              <span className="inline-flex items-center gap-2"><FiShield className="text-brand-300" /> Secure payment</span>
              <span className="inline-flex items-center gap-2"><FiCheckCircle className="text-brand-300" /> Official warranty</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative hidden lg:block"
          >
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-brand-500/20 blur-3xl" />
            <img
              src="https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80"
              alt="Premium tech gadgets"
              className="relative aspect-[4/3] w-full rounded-3xl border border-white/10 object-cover shadow-2xl"
            />
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-slate-900/85 px-4 py-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2">
                <StarRating rating={5} />
                <span className="text-sm font-semibold text-white">4.9/5</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Trusted by thousands of customers</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 1.5 Category ticker — immediately after the hero, before every
          existing section. Does not touch the hero or any section below. */}
      <CategorySlider />

      {/* 2. Trending / Best Sellers */}
      {(loading || trending.length > 0) && (
        <section className="py-16">
          <div className="container-page">
            <SectionHeader
              eyebrow="Popular this week"
              title="Trending Now"
              description="The gadgets everyone is talking about — our best sellers right now."
              action={viewAll('/products?sort=popularity')}
            />
            <ProductGrid loading={loading} products={trending} />
          </div>
        </section>
      )}

      {/* 3. Featured Categories */}
      <section className="bg-slate-50 py-16 dark:bg-slate-950/40">
        <div className="container-page">
          <SectionHeader eyebrow="Browse" title="Shop by Category" description="Find exactly what you need across our curated collections." />
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
            {CATEGORIES.map(({ name, icon: Icon }) => (
              <Link
                key={name}
                to={`/products?category=${encodeURIComponent(name)}`}
                className="group card-interactive flex flex-col items-center gap-4 p-7 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl text-brand-600 shadow-soft transition duration-300 group-hover:scale-105 group-hover:bg-brand-500/10 dark:bg-slate-800 dark:text-brand-300">
                  <Icon />
                </div>
                <span className="text-sm font-semibold tracking-tight transition group-hover:text-brand-600 dark:group-hover:text-brand-300">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. New Arrivals */}
      {(loading || newArrivals.length > 0) && (
        <section className="py-16">
          <div className="container-page">
            <SectionHeader
              eyebrow="Just landed"
              title="New Arrivals"
              description="The latest additions to the TechGadgets collection."
              action={viewAll('/products?newArrival=true')}
            />
            <ProductGrid loading={loading} products={newArrivals} />
          </div>
        </section>
      )}

      {/* 5. Featured Products */}
      {(loading || featured.length > 0) && (
        <section className="bg-slate-50 py-16 dark:bg-slate-950/40">
          <div className="container-page">
            <SectionHeader
              eyebrow="Handpicked"
              title="Featured Products"
              description="Chosen by our team for quality, performance, and value."
              action={viewAll('/products?featured=true')}
            />
            <ProductGrid loading={loading} products={featured} />
          </div>
        </section>
      )}

      {/* Fallback when the store has no products at all */}
      {!loading && trending.length === 0 && featured.length === 0 && newArrivals.length === 0 && (
        <section className="py-16">
          <div className="container-page">
            <EmptyState
              icon={FiShoppingBag}
              title="Products coming soon"
              description="We're stocking the shelves. Check back shortly for the latest gadgets."
              actionLabel="Browse store"
              actionTo="/products"
            />
          </div>
        </section>
      )}

      {/* 6. Special Offers */}
      <section className="py-16">
        <div className="container-page">
          <SectionHeader align="center" eyebrow="Deals" title="Special Offers" description="Limited-time savings on the gear you love." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white shadow-card dark:border-white/10 sm:p-10">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-600/25 blur-3xl" />
              <div className="relative">
                <span className="badge"><FiTag className="mr-1" /> Save up to 30%</span>
                <h3 className="mt-4 text-2xl font-bold">Seasonal Tech Sale</h3>
                <p className="mt-2 max-w-sm text-slate-300">Chargers, power banks, and audio gear at their best prices.</p>
                <Link to="/products?sort=popularity" className="btn-primary mt-6">Shop the Sale</Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-700 to-brand-500 p-8 text-white shadow-card dark:border-white/10 sm:p-10">
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
              <div className="relative">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur"><FiZap /> Fresh drops</span>
                <h3 className="mt-4 text-2xl font-bold">New Arrivals Weekly</h3>
                <p className="mt-2 max-w-sm text-white/85">Be the first to grab the latest smart gadgets and accessories.</p>
                <Link to="/products?newArrival=true" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:-translate-y-0.5">
                  Explore New <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Why Choose TechGadgets */}
      <section className="bg-slate-50 py-16 dark:bg-slate-950/40">
        <div className="container-page">
          <SectionHeader align="center" eyebrow="Why Choose Us" title={`The ${SITE_NAME} Promise`} description="A premium shopping experience built on trust, quality, and service." />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Icon className="text-2xl" />
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Customer Reviews */}
      {reviews.length > 0 && (
        <section className="py-16">
          <div className="container-page">
            <SectionHeader align="center" eyebrow="Loved by customers" title="What Customers Say" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 3).map((r) => (
                <figure key={r._id} className="card p-6">
                  <StarRating rating={r.rating} />
                  <blockquote className="mt-4 text-slate-600 dark:text-slate-300">&ldquo;{r.comment}&rdquo;</blockquote>
                  <figcaption className="mt-4">
                    <span className="font-semibold">{r.name}</span>
                    {r.product && <span className="block text-xs text-slate-500 dark:text-slate-400">{r.product.title}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Newsletter */}
      <section className="bg-slate-50 py-16 dark:bg-slate-950/40">
        <div className="container-page">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft dark:border-white/10 dark:bg-slate-900 sm:p-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Stay in the Loop</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Get exclusive deals and new product alerts, straight to your inbox.</p>
            {subscribed ? (
              <p className="mt-6 inline-flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                <FiCheckCircle /> Thanks for subscribing!
              </p>
            ) : (
              <form onSubmit={handleNewsletter} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field flex-1"
                />
                <button type="submit" disabled={subscribing} className="btn-primary">
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
