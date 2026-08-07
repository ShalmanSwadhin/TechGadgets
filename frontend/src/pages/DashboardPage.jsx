import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { formatDate, formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/ui/EmptyState';
import AddressForm from '../components/address/AddressForm';
import { FiPackage } from 'react-icons/fi';
import { useSeo } from '../hooks/useSeo';
import { SITE_NAME } from '../config/site';

export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  useSeo({ title: `My Dashboard | ${SITE_NAME}` });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data.orders);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || {},
      });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile);
      showToast('Profile updated');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-violet-100 text-violet-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="container-page py-8 pb-28">
      <h1 className="section-title">My Dashboard</h1>
      <p className="mt-1 text-slate-500">Welcome back, {user?.name}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="card p-6">
          <h2 className="font-semibold">Profile</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <AddressForm
              form={profile.address || {}}
              onChange={(value) => setProfile({ ...profile, address: value })}
              showCountry={false}
              title="Delivery Address"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary mt-6">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div>
          <h2 className="font-semibold">Order History</h2>
          {loading ? (
            <div className="mt-6 flex justify-center"><Spinner /></div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={FiPackage}
              title="No orders yet"
              description="Your order history will appear here."
              actionLabel="Start Shopping"
              actionTo="/products"
            />
          ) : (
            <ul className="mt-4 space-y-4">
              {orders.map((order) => (
                <li key={order._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{formatDate(order.createdAt)}</span>
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize ${statusColor[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 font-bold">{formatPrice(order.totalPrice)}</p>
                  <p className="text-sm text-slate-500">{order.orderItems.length} item(s) · COD</p>
                  <Link to={`/orders/${order._id}`} className="mt-2 inline-block text-sm font-medium text-brand-600">
                    View details →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
