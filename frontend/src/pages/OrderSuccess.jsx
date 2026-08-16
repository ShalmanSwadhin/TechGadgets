import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FiCheck,
  FiCheckCircle,
  FiClipboard,
  FiPhone,
  FiPackage,
  FiTruck,
  FiShoppingBag,
  FiFileText,
  FiUserPlus,
  FiMapPin,
  FiClock,
  FiArrowRight,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Logo from '../components/ui/Logo';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatPrice } from '../utils/format';
import {
  SITE_NAME,
  SITE_TAGLINE,
  SITE_PHONE,
  SITE_ADDRESS,
  SITE_WHATSAPP,
} from '../config/site';

const STEPS = [
  { key: 'received', label: 'Order Received', desc: 'We have your order', icon: FiCheckCircle },
  { key: 'review', label: 'Order Review', desc: 'Checking the details', icon: FiClipboard },
  { key: 'confirm', label: 'Phone Confirmation', desc: 'We give you a call', icon: FiPhone },
  { key: 'packaging', label: 'Careful Packaging', desc: 'Packed with care', icon: FiPackage },
  { key: 'delivery', label: 'Fast Delivery', desc: 'On its way to you', icon: FiTruck },
];

// Map order status to the currently active step in the timeline.
const STATUS_STEP = {
  pending: 1,
  processing: 3,
  shipped: 4,
  delivered: 5,
  cancelled: 1,
};

const CONFETTI_COLORS = ['#7c3aed', '#a855f7', '#8b5cf6', '#22d3ee', '#ffffff'];

// Glass button styled for the always-dark success background (theme-independent,
// so it stays readable whether the app is in light or dark mode).
const GLASS_BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 active:scale-[0.98]';

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.7,
        duration: 1.2 + Math.random() * 0.6,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      })),
    []
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-52 overflow-hidden motion-reduce:hidden"
    >
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-fall absolute top-0"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? '9999px' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

function DetailRow({ label, value, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-2.5 ${className}`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  );
}

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const guestToken = searchParams.get('t') || '';
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`, { params: guestToken ? { token: guestToken } : undefined });
        if (active) setOrder(data.order);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, guestToken]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-hero-gradient">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-hero-gradient px-4 text-center text-white">
        <p className="text-lg font-semibold">We couldn&apos;t load your order</p>
        <p className="max-w-md text-sm text-slate-300">
          {error || 'This order could not be found. If you just placed it, please check your orders or contact us.'}
        </p>
        <Link to="/products" className="btn-primary mt-2">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const currentIndex = STATUS_STEP[order.status] ?? 1;
  const orderNumber = order._id.slice(-8).toUpperCase();
  const addr = order.shippingAddress || {};
  const addressLine = [addr.house, addr.area, addr.thana, addr.district, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="relative overflow-hidden bg-hero-gradient text-white">
      <Confetti />

      <div className="container-page relative z-10 py-14 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {/* Branding */}
          <div className="animate-fade-in-scale flex flex-col items-center text-center">
            <Logo to="" size="lg" withText textClassName="text-2xl font-display font-bold tracking-tight" />
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-brand-300">
              {SITE_TAGLINE}
            </p>
          </div>

          {/* Success header */}
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <span className="animate-ring-pulse absolute inset-0 rounded-full bg-brand-500/40" />
              <span className="absolute inset-0 rounded-full bg-brand-500/10 blur-xl" />
              <span className="animate-check-pop relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient shadow-glow ring-1 ring-white/20">
                <FiCheck className="h-12 w-12 text-white" strokeWidth={3} />
              </span>
            </div>

            <h1 className="mt-8 font-display text-3xl font-bold sm:text-4xl">
              🎉 Your Order Has Been Confirmed!
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">
              Thank you for choosing {SITE_NAME}. Every order means a lot to us, and we&apos;re
              genuinely grateful that you&apos;ve trusted us with your purchase. Our goal isn&apos;t
              just to sell electronics — it&apos;s to deliver products you can rely on and a shopping
              experience you&apos;ll remember. Welcome to the {SITE_NAME} family.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-slate-200 backdrop-blur">
                <FiFileText className="h-4 w-4 text-brand-300" />
                Order <span className="font-semibold text-white">#{orderNumber}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-slate-200 backdrop-blur">
                <FiClock className="h-4 w-4 text-brand-300" />
                Confirmation call within 24 hours
              </span>
            </div>
          </div>

          {/* Gradient divider */}
          <div className="mx-auto mt-12 h-px w-full max-w-md bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" />

          {/* Next steps timeline */}
          <section className="mt-12">
            <h2 className="text-center font-display text-xl font-semibold">What happens next</h2>
            <div className="relative mt-8">
              <div className="absolute left-6 top-6 hidden h-0.5 w-[calc(100%-3rem)] bg-white/10 md:block" />
              <ol className="relative grid gap-6 md:grid-cols-5">
                {STEPS.map((step, i) => {
                  const done = i < currentIndex;
                  const current = i === currentIndex;
                  const Icon = step.icon;
                  return (
                    <li key={step.key} className="flex items-center gap-4 md:flex-col md:text-center">
                      <span
                        className={[
                          'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 transition',
                          done
                            ? 'bg-brand-gradient text-white ring-white/20 shadow-glow-sm'
                            : current
                              ? 'bg-white/10 text-brand-200 ring-brand-400/70'
                              : 'bg-white/5 text-slate-400 ring-white/10',
                        ].join(' ')}
                      >
                        {current && (
                          <span className="animate-ring-pulse absolute inset-0 rounded-full bg-brand-400/40" />
                        )}
                        <Icon className="relative h-5 w-5" />
                      </span>
                      <div className="md:mt-3">
                        <p
                          className={`text-sm font-semibold ${
                            done || current ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">{step.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* Order details */}
          <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">Order Summary</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold capitalize text-brand-200 ring-1 ring-brand-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                {order.status}
              </span>
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <div className="divide-y divide-white/5">
                <DetailRow label="Order Number" value={`#${orderNumber}`} />
                <DetailRow label="Order Date" value={formatDate(order.createdAt)} />
                <DetailRow label="Customer" value={addr.fullName || '—'} />
                <DetailRow label="Phone" value={addr.phone || '—'} />
              </div>
              <div className="divide-y divide-white/5">
                <DetailRow label="Payment" value="Cash on Delivery" />
                <DetailRow label="Delivery Address" value={addressLine || '—'} />
                {order.deliveryChargePhone ? (
                  <DetailRow label="Delivery charge sender" value={order.deliveryChargePhone} />
                ) : null}
              </div>
            </div>

            {/* Items */}
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-sm font-semibold text-slate-200">Items Ordered</p>
              <ul className="mt-4 space-y-4">
                {order.orderItems.map((item) => (
                  <li key={item._id || item.product} className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{item.title}</p>
                      {item.color && <p className="text-xs text-slate-400">Color: {item.color}</p>}
                      <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totals */}
            <div className="mt-6 space-y-2 border-t border-white/10 pt-6 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-medium text-white">{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Delivery Charge</span>
                <span className="font-medium text-brand-200">To be confirmed</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>

            {/* Delivery note */}
            <div className="mt-6 rounded-2xl border border-brand-500/25 bg-brand-500/10 p-4">
              <p className="text-sm leading-relaxed text-slate-200">
                Delivery charges are confirmed based on your delivery location before shipment. Our
                team will contact you shortly to confirm your order and the final delivery cost.
              </p>
            </div>
          </section>

          {/* Support card */}
          <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl sm:p-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-display text-xl font-semibold">Need any help?</h2>
                <p className="mt-1 text-sm text-slate-300">
                  We&apos;re happy to help with anything about your order.
                </p>
                <div className="mt-4 space-y-2 text-sm text-slate-200">
                  <p className="flex items-center gap-2">
                    <FaWhatsapp className="h-4 w-4 text-[#25D366]" />
                    WhatsApp: <span className="font-semibold text-white">{SITE_PHONE}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <FiMapPin className="mt-0.5 h-4 w-4 text-brand-300" />
                    <span>{SITE_ADDRESS}</span>
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/${SITE_WHATSAPP}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-[#25D366]/60 sm:w-auto"
              >
                <FaWhatsapp className="h-5 w-5" />
                Chat on WhatsApp
              </a>
            </div>
          </section>

          {/* Guest account nudge */}
          {!isAuthenticated && (
            <div className="mt-8 flex flex-col items-start gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-brand-600/15 to-transparent p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/20 text-brand-200">
                  <FiUserPlus className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">Track future orders more easily</p>
                  <p className="mt-1 text-sm text-slate-300">
                    Create an account with the same phone number you used at checkout to view and
                    track all your orders in one place.
                  </p>
                </div>
              </div>
              <Link to="/register" className={`${GLASS_BTN} w-full shrink-0 sm:w-auto`}>
                Create an Account
              </Link>
            </div>
          )}

          {/* Call to action */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/products" className="btn-primary w-full justify-center sm:w-auto">
              <FiShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard" className={`${GLASS_BTN} w-full sm:w-auto`}>
                <FiFileText className="h-4 w-4" />
                View My Orders
              </Link>
            ) : null}
            <Link
              to={`/orders/${order._id}${guestToken ? `?t=${guestToken}` : ''}`}
              className={`${GLASS_BTN} w-full sm:w-auto`}
            >
              Track My Order
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
