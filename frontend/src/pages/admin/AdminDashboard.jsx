import { useEffect, useState } from 'react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/format';
import { FiBox, FiTrendingUp, FiPackage, FiUsers } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then(({ data }) => setStats(data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get('/admin/settings');
        setSettings(data.settings);
      } catch {
        setSettings(null);
      }
    };
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-red-500">Failed to load dashboard</p>;
  }

  const cards = [
    { label: 'Total Sales', value: formatPrice(stats.totalSales), icon: FiTrendingUp, color: 'from-emerald-500 to-teal-500' },
    { label: 'Orders', value: stats.orders, icon: FiPackage, color: 'from-brand-500 to-violet-500' },
    { label: 'Products', value: stats.products, icon: FiBox, color: 'from-amber-500 to-orange-500' },
    { label: 'Customers', value: stats.users, icon: FiUsers, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-slate-500">Overview of your store performance</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card overflow-hidden">
            <div className={`bg-gradient-to-br ${color} p-4 text-white`}>
              <Icon className="text-2xl opacity-80" />
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Low Stock Alert ({stats.lowStock})</h2>
          <ul className="mt-4 space-y-2">
            {stats.lowStockProducts?.length ? (
              stats.lowStockProducts.map((p) => (
                <li key={p._id} className="flex justify-between text-sm">
                  <span className="line-clamp-1">{p.title}</span>
                  <span className="font-medium text-red-500">{p.stock} left</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500">All products well stocked</p>
            )}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Recent Orders</h2>
          <ul className="mt-4 space-y-2">
            {stats.recentOrders?.length ? (
              stats.recentOrders.map((o) => (
                <li key={o._id} className="flex justify-between text-sm">
                  <span>#{o._id.slice(-6)}</span>
                  <span className="capitalize">{o.status}</span>
                  <span className="font-medium">{formatPrice(o.totalPrice)}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-slate-500">No orders yet</p>
            )}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        <div className="card p-6">
          <h2 className="font-semibold">Shipping Settings</h2>
          {settings ? (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={settings.deliveryMessageEnabled} onChange={async (e) => {
                  try {
                    const { data } = await api.put('/admin/settings', { deliveryMessageEnabled: e.target.checked });
                    setSettings(data.settings);
                  } catch {}
                }} />
                Show delivery charge confirmation message to customers
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Inside Dhaka (BDT)</label>
                  <input type="number" value={settings.deliveryChargeDhaka} onChange={(e) => setSettings(s => ({ ...s, deliveryChargeDhaka: Number(e.target.value) }))} className="input-field mt-1" />
                </div>
                <div>
                  <label className="text-sm">Outside Dhaka (BDT)</label>
                  <input type="number" value={settings.deliveryChargeOutside} onChange={(e) => setSettings(s => ({ ...s, deliveryChargeOutside: Number(e.target.value) }))} className="input-field mt-1" />
                </div>
              </div>
              <div className="mt-4">
                <button className="btn-primary" onClick={async () => {
                  try {
                    const { data } = await api.put('/admin/settings', {
                      deliveryChargeDhaka: Number(settings.deliveryChargeDhaka),
                      deliveryChargeOutside: Number(settings.deliveryChargeOutside),
                    });
                    setSettings(data.settings);
                  } catch {}
                }}>Save settings</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Loading settings...</p>
          )}
        </div>
      </div>
    </div>
  );
}
