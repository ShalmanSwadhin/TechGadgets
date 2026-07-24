import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../context/ToastContext';
import { formatDate, formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({ deliveryMessageEnabled: false });
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [savingDeliveryPhone, setSavingDeliveryPhone] = useState(false);
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const [{ data: orderData }, { data: settingsData }] = await Promise.all([
          api.get(`/orders/${id}`),
          api.get('/settings'),
        ]);
        setOrder(orderData.order);
        setDeliveryPhone(orderData.order.deliveryChargePhone || '');
        setSettings(settingsData.settings || { deliveryMessageEnabled: false });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleDeliveryPhoneSave = async (e) => {
    e.preventDefault();
    if (!order) return;
    setSavingDeliveryPhone(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/delivery-charge`, { deliveryChargePhone: deliveryPhone.trim() });
      setOrder(data.order);
      setDeliveryPhone(data.order.deliveryChargePhone || '');
      showToast('Delivery charge number updated');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingDeliveryPhone(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-red-500">{error || 'Order not found'}</p>
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="btn-primary mt-4 inline-flex">
          {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 pb-28">
      <Link to={isAuthenticated ? "/dashboard" : "/"} className="text-sm text-brand-600 hover:underline">
        {isAuthenticated ? '← Back to orders' : '← Back to Home'}
      </Link>
      <h1 className="section-title mt-4">Order #{order._id.slice(-8).toUpperCase()}</h1>
      <p className="text-slate-500">Placed on {formatDate(order.createdAt)}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-4 space-y-4">
            {order.orderItems.map((item) => (
              <li key={item._id} className="flex gap-4">
                <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                  <p className="text-sm font-semibold text-brand-600">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold">Shipping</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.area}{order.shippingAddress.house ? `, ${order.shippingAddress.house}` : ''}<br />
              {order.shippingAddress.thana}, {order.shippingAddress.district}{order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}<br />
              {order.shippingAddress.country}
            </p>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Contact: {order.shippingAddress.phone}
            </p>
            {order.deliveryChargePhone && (
              <p className="mt-3 text-sm font-medium text-brand-600">
                Delivery charge sender number: {order.deliveryChargePhone}
              </p>
            )}
            {(settings.deliveryMessageEnabled || order.deliveryChargePhone) && (
              <form onSubmit={handleDeliveryPhoneSave} className="mt-4 space-y-2">
                <label className="text-sm font-medium">Update delivery charge sender number</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="Enter the number used to send delivery charge"
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={savingDeliveryPhone} className="btn-primary">
                    {savingDeliveryPhone ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="card p-6">
            <h2 className="font-semibold">Summary</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Items total</span>
                <span>{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingPrice)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 text-lg font-semibold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>Order total</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
            </div>
            <p className="mt-4 capitalize">Status: <span className="font-medium text-brand-600">{order.status}</span></p>
            <p className="mt-1">Payment: Cash on Delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
