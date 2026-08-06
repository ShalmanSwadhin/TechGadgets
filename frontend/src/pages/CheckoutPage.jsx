import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { waitForBackendReady } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getEffectivePrice } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import AddressForm from '../components/address/AddressForm';
import { FiShoppingBag, FiShield, FiCheckCircle, FiTruck, FiHeadphones } from 'react-icons/fi';

const TRUST_BADGES = [
  { icon: FiShield, label: 'Secure Checkout' },
  { icon: FiCheckCircle, label: 'Genuine Products' },
  { icon: FiTruck, label: 'Fast Delivery' },
  { icon: FiHeadphones, label: 'Customer Support' },
];

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ deliveryMessageEnabled: false, deliveryChargeDhaka: 80, deliveryChargeOutside: 150 });
  const [agreeDelivery, setAgreeDelivery] = useState(false);

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
        deliveryChargePhone: form.deliveryChargePhone,
      };

      if (!isAuthenticated) {
        orderData.items = items.map((i) => ({
          product: i.product._id,
          quantity: i.quantity,
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
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Delivery charge will be determined based on your delivery location and must be paid in advance before your order is confirmed. Inside Dhaka is taka 80 and Outside Dhaka is taka 150. Please provide the number used to send the delivery charge in the field below.
            </div>
          )}
          <ul className="mt-4 space-y-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            {items.map(({ product, quantity }) => (
              <li key={product._id} className="flex justify-between text-sm">
                <span className="line-clamp-1 flex-1 pr-4">
                  {product.title} × {quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(getEffectivePrice(product) * quantity)}
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
                  placeholder="Enter the number used to send delivery charge"
                  className="input-field mt-1"
                />
              </div>
            </>
          )}
          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
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
