import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { waitForBackendReady } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getLinePrice } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import AddressForm from '../components/address/AddressForm';
import { FiShoppingBag, FiShield, FiCheckCircle, FiTruck, FiHeadphones, FiClock } from 'react-icons/fi';
import { useSeo } from '../hooks/useSeo';
import { SITE_NAME } from '../config/site';

const TRUST_BADGES = [
  { icon: FiShield, label: 'Secure Checkout' },
  { icon: FiCheckCircle, label: 'Genuine Products' },
  { icon: FiTruck, label: 'Fast Delivery' },
  { icon: FiHeadphones, label: 'Customer Support' },
];

const BKASH_NUMBER = '01677953286';

const DELIVERY_ZONES = [
  { value: 'dhaka', label: 'Inside Dhaka City' },
  { value: 'subcity', label: 'Sub-City' },
  { value: 'outside', label: 'Outside Dhaka City' },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    deliveryMessageEnabled: false,
    deliveryChargeDhaka: 80,
    deliveryChargeSubCity: 100,
    deliveryChargeOutside: 130,
  });
  const [agreeDelivery, setAgreeDelivery] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState('dhaka');

  // Stable idempotency key for THIS checkout attempt. Reused across retries so
  // a lost response can never turn one checkout into two orders; the server
  // de-duplicates on this value. Regenerated only if this component remounts.
  const requestIdRef = useRef(null);
  if (!requestIdRef.current) {
    requestIdRef.current =
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
  // Extra guard against a concurrent double-submit (e.g. double click / Enter).
  const submittingRef = useRef(false);

  const total = subtotal;

  useSeo({ title: `Checkout | ${SITE_NAME}` });

  const [form, setForm] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    district: user?.address?.district || user?.address?.state || '',
    thana: user?.address?.thana || user?.address?.city || '',
    area: user?.address?.area || user?.address?.street || '',
    house: user?.address?.house || '',
    postalCode: user?.address?.postalCode || user?.address?.zipCode || '',
    deliveryInstructions: user?.address?.deliveryInstructions || '',
    country: user?.address?.country || 'Bangladesh',
    deliveryChargePhone: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setSettings(data.settings);
      } catch {
        // keep defaults
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        phone: user.phone || prev.phone,
        district: user.address?.district || user.address?.state || prev.district,
        thana: user.address?.thana || user.address?.city || prev.thana,
        area: user.address?.area || user.address?.street || prev.area,
        house: user.address?.house || prev.house,
        postalCode: user.address?.postalCode || user.address?.zipCode || prev.postalCode,
        deliveryInstructions: user.address?.deliveryInstructions || prev.deliveryInstructions,
      }));
    }
  }, [user]);

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={FiShoppingBag}
          title="Your cart is empty"
          actionLabel="Continue Shopping"
          actionTo="/products"
        />
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || submittingRef.current) return;
    if (settings.deliveryMessageEnabled && !agreeDelivery) {
      showToast('Please confirm you acknowledge delivery charges', 'error');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      // Gate the write: don't POST an order into a backend that is still
      // starting or mid-restart. If it doesn't become ready in time, tell the
      // user instead of firing a request that would hit a reset socket.
      const ready = await waitForBackendReady({ timeoutMs: 15000 });
      if (!ready) {
        showToast('The server is starting up. Please try again in a moment.', 'error');
        return;
      }

      const orderData = {
        clientRequestId: requestIdRef.current,
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          district: form.district,
          thana: form.thana,
          area: form.area,
          house: form.house,
          postalCode: form.postalCode,
          deliveryInstructions: form.deliveryInstructions,
          country: form.country,
        },
        deliveryZone,
        deliveryChargePhone: form.deliveryChargePhone,
      };

      if (!isAuthenticated) {
        orderData.items = items.map((i) => ({
          product: i.product._id,
          quantity: i.quantity,
          color: i.color,
        }));
      }

      // `_idempotent` lets the API client safely replay this write on a
      // transient failure — the server dedupes on clientRequestId.
      const { data } = await api.post('/orders', orderData, { _idempotent: true });
      await clearCart();
      showToast('Order placed successfully!');
      const tokenParam = data.order.guestAccessToken ? `?t=${data.order.guestAccessToken}` : '';
      navigate(`/order-success/${data.order._id}${tokenParam}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="container-page py-8 pb-28">
      <h1 className="section-title">Checkout</h1>
      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="card p-6">
          <AddressForm form={form} onChange={setForm} showCountry />
          <div className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="font-medium">Payment Method</p>
            <p className="mt-2 text-sm text-slate-500">Cash on Delivery (COD) — Pay when your order arrives</p>
          </div>
        </div>

        <div className="card h-fit p-6">
          <h2 className="font-semibold">Order Summary</h2>
          {settings.deliveryMessageEnabled && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <p>
                Delivery charge must be paid in advance before your order is confirmed —{' '}
                Inside Dhaka City is {formatPrice(settings.deliveryChargeDhaka)}, Sub-City is{' '}
                {formatPrice(settings.deliveryChargeSubCity)}, and Outside Dhaka City is{' '}
                {formatPrice(settings.deliveryChargeOutside)}.
              </p>
              <p className="mt-2 font-semibold">
                bKash — Send Money: {BKASH_NUMBER}
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Please provide the number you sent the delivery charge from below.
              </p>
            </div>
          )}

          <ul className="mt-4 space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            {items.map(({ product, quantity, color }) => (
              <li key={`${product._id}-${color || 'default'}`} className="flex justify-between text-sm">
                <span className="line-clamp-1 flex-1 pr-4">
                  {product.title}{color ? ` (${color})` : ''} × {quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(getLinePrice(product, color) * quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-lg font-bold dark:border-slate-800">
              <span>Total</span>
              <span className="text-brand-600">{formatPrice(total)}</span>
            </div>
            <p className="text-xs text-slate-400">Delivery charge is confirmed separately and not included above.</p>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Delivery location</label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {DELIVERY_ZONES.map((z) => (
                <label
                  key={z.value}
                  className={`flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-center text-xs font-medium transition ${
                    deliveryZone === z.value
                      ? 'border-brand-600 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryZone"
                    value={z.value}
                    checked={deliveryZone === z.value}
                    onChange={() => setDeliveryZone(z.value)}
                    className="sr-only"
                  />
                  {z.label}
                </label>
              ))}
            </div>
          </div>

          {settings.deliveryMessageEnabled && (
            <>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={agreeDelivery} onChange={(e) => setAgreeDelivery(e.target.checked)} />
                I confirm I understand delivery charges will apply to this order.
              </label>
              <div className="mt-4">
                <label className="text-sm font-medium">Delivery charge sender number</label>
                <input
                  required
                  value={form.deliveryChargePhone}
                  onChange={(e) => setForm({ ...form, deliveryChargePhone: e.target.value })}
                  placeholder="Enter the bKash number used to send delivery charge"
                  className="input-field mt-1"
                />
              </div>
            </>
          )}

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-white/5 dark:text-slate-200">
            <FiClock className="shrink-0 text-brand-500" />
            Delivery Timescale: 3–4 days
          </div>

          <button type="submit" disabled={loading} className="btn-primary mt-4 w-full">
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
