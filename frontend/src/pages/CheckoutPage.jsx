import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getEffectivePrice } from '../utils/format';
import EmptyState from '../components/ui/EmptyState';
import AddressForm from '../components/address/AddressForm';
import { FiShoppingBag } from 'react-icons/fi';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({ deliveryMessageEnabled: false, deliveryChargeDhaka: 80, deliveryChargeOutside: 150 });
  const [agreeDelivery, setAgreeDelivery] = useState(false);

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
    if (settings.deliveryMessageEnabled && !agreeDelivery) {
      showToast('Please confirm you acknowledge delivery charges', 'error');
      return;
    }
    setLoading(true);
    try {
      const orderData = {
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

      const { data } = await api.post('/orders', orderData);
      await clearCart();
      showToast('Order placed successfully!');
      navigate(`/orders/${data.order._id}`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
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
        </div>
      </form>
    </div>
  );
}
