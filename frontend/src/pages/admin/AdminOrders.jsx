import { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatPrice } from '../../utils/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [phoneDrafts, setPhoneDrafts] = useState({});
  const [updatingPhoneId, setUpdatingPhoneId] = useState(null);
  const { showToast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders);
      setPhoneDrafts((prev) => {
        const next = { ...prev };
        data.orders.forEach((order) => {
          next[order._id] = order.deliveryChargePhone || '';
        });
        return next;
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      showToast('Order status updated');
      fetchOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateDeliveryChargePhone = async (orderId) => {
    const phone = (phoneDrafts[orderId] || '').trim();
    try {
      setUpdatingPhoneId(orderId);
      const { data } = await api.put(`/orders/${orderId}/delivery-charge`, { deliveryChargePhone: phone });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? { ...order, deliveryChargePhone: data.order.deliveryChargePhone } : order)));
      showToast('Delivery charge number updated');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingPhoneId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Orders</h1>
      <p className="text-slate-500">{orders.length} total orders</p>

      <div className="mt-6 space-y-4">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order._id;
          return (
            <div key={order._id} className="card p-6">
              <div
                className="flex cursor-pointer flex-wrap items-start justify-between gap-4"
                onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
              >
                <div>
                  <p className="font-semibold">Order #{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-medium">{order.user?.name}</span> · {order.user?.email}
                  </p>
                  <p className="text-sm text-slate-500">{order.user?.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-brand-600">{formatPrice(order.totalPrice)}</p>
                  <p className="text-sm text-slate-500">{order.orderItems.length} items · COD</p>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold">Shipping address</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {order.shippingAddress.fullName}<br />
                        {order.shippingAddress.area}{order.shippingAddress.house ? `, ${order.shippingAddress.house}` : ''}<br />
                        {order.shippingAddress.thana}, {order.shippingAddress.district}{order.shippingAddress.postalCode ? ` - ${order.shippingAddress.postalCode}` : ''}<br />
                        {order.shippingAddress.country}
                      </p>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Contact: {order.shippingAddress.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Delivery charge number</p>
                      <div className="mt-2 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={phoneDrafts[order._id] ?? ''}
                          onChange={(e) => setPhoneDrafts((prev) => ({ ...prev, [order._id]: e.target.value }))}
                          className="input-field min-w-[220px] flex-1"
                          placeholder="Enter sender number"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateDeliveryChargePhone(order._id);
                          }}
                          disabled={updatingPhoneId === order._id}
                          className="btn-primary"
                        >
                          {updatingPhoneId === order._id ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {order.deliveryChargePhone && (
                        <p className="mt-3 text-sm font-medium text-brand-600">Current: {order.deliveryChargePhone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="text-sm font-medium">Update status:</p>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      className="input-field max-w-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">Items</p>
                    <ul className="mt-2 space-y-2">
                      {order.orderItems.map((item) => (
                        <li key={item._id} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                          <span>{item.title} × {item.quantity}</span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
