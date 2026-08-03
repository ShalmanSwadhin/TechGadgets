import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  FiDollarSign,
  FiShoppingBag,
  FiBox,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiArrowUp,
  FiArrowDown,
  FiPlus,
  FiDownload,
  FiBarChart2,
} from 'react-icons/fi';
import api from '../../services/api';
import { ProductCardSkeleton } from '../../components/ui/Skeleton';
import { formatPrice, formatDate, exportToCsv } from '../../utils/format';
import { visitorAnalytics } from '../../services/analytics';
import { useTheme } from '../../context/ThemeContext';

const RANGES = [
  { value: 7, label: 'Last 7 Days' },
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 365, label: 'This Year' },
];

const STATUS_META = {
  pending: { label: 'Pending', color: '#f59e0b' },
  processing: { label: 'Processing', color: '#8b5cf6' },
  shipped: { label: 'Shipped', color: '#22d3ee' },
  delivered: { label: 'Delivered', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const shortDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function fillDailySeries(series, range, valueKeys) {
  const map = new Map(series.map((d) => [d.date, d]));
  const out = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range - 1));
  const step = range > 120 ? 7 : 1; // thin out very long ranges
  for (let i = 0; i < range; i += step) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    const key = day.toISOString().slice(0, 10);
    const found = map.get(key) || {};
    const row = { label: shortDate(day) };
    valueKeys.forEach((k) => (row[k] = found[k] || 0));
    out.push(row);
  }
  return out;
}

function StatCard({ icon: Icon, label, value, sub, trend, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  };
  const up = trend >= 0;
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="text-lg" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {typeof trend === 'number' && (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {up ? <FiArrowUp /> : <FiArrowDown />} {Math.abs(trend)}%
          </span>
        )}
        {sub && <span className="text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { dark } = useTheme();
  const [range, setRange] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState(null);
  const [stockTab, setStockTab] = useState('all');
  const [visitor, setVisitor] = useState({ available: false });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/admin/analytics?range=${range}`)
      .then(({ data: res }) => active && setData(res.analytics))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range]);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setSettings(data.settings)).catch(() => {});
    visitorAnalytics.fetchVisitorMetrics().then(setVisitor).catch(() => {});
  }, []);

  const chart = useMemo(
    () => ({
      grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      axis: dark ? '#94a3b8' : '#64748b',
      tooltip: {
        backgroundColor: dark ? '#161b22' : '#ffffff',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)'}`,
        borderRadius: '0.75rem',
        color: dark ? '#e2e8f0' : '#0f172a',
        fontSize: '12px',
      },
    }),
    [dark]
  );

  const salesData = useMemo(
    () => (data ? fillDailySeries(data.salesSeries, range, ['revenue', 'orders']) : []),
    [data, range]
  );
  const customerData = useMemo(
    () => (data ? fillDailySeries(data.customerSeries, range, ['count']) : []),
    [data, range]
  );
  const monthlyData = useMemo(() => {
    if (!data) return [];
    const map = new Map(data.monthlyRevenue.map((m) => [m.month, m.revenue]));
    return MONTHS.map((label, i) => ({ label, revenue: map.get(i + 1) || 0 }));
  }, [data]);
  const statusData = useMemo(
    () =>
      data
        ? Object.entries(data.statusCounts)
            .map(([k, v]) => ({ name: STATUS_META[k].label, value: v, color: STATUS_META[k].color }))
            .filter((s) => s.value > 0)
        : [],
    [data]
  );

  const stockList = useMemo(() => {
    if (!data) return [];
    const list = data.lowStockProducts;
    if (stockTab === 'under5') return list.filter((p) => p.stock > 0 && p.stock < 5);
    if (stockTab === 'out') return list.filter((p) => p.stock === 0);
    return list;
  }, [data, stockTab]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card p-8 text-center">
        <FiBarChart2 className="mx-auto text-3xl text-slate-400" />
        <p className="mt-3 font-semibold">Could not load analytics</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  const s = data.summary;
  const totalStatus = statusData.reduce((sum, d) => sum + d.value, 0);

  const summaryCards = [
    { icon: FiDollarSign, label: 'Total Revenue', value: formatPrice(s.revenue.total), sub: `${formatPrice(s.revenue.today)} today`, trend: s.revenue.trend },
    { icon: FiShoppingBag, label: 'Total Orders', value: s.orders.total, sub: `${s.orders.today} today`, trend: s.orders.trend },
    { icon: FiBox, label: 'Products', value: s.products.total, sub: 'In catalog' },
    { icon: FiUsers, label: 'Customers', value: s.customers.total, sub: 'Registered' },
    { icon: FiClock, label: 'Pending Orders', value: s.pendingOrders, sub: 'Awaiting fulfilment', tone: 'amber' },
    { icon: FiCheckCircle, label: 'Delivered', value: s.deliveredOrders, sub: 'Completed', tone: 'emerald' },
    { icon: FiAlertTriangle, label: 'Low Stock', value: s.lowStock, sub: 'Under 10 units', tone: 'amber' },
    { icon: FiXCircle, label: 'Out of Stock', value: s.outOfStock, sub: 'Needs restock', tone: 'rose' },
  ];

  const exports = [
    { label: 'Revenue (daily)', run: () => exportToCsv('revenue', salesData.map((d) => ({ date: d.label, revenue: d.revenue, orders: d.orders }))) },
    { label: 'Top products', run: () => exportToCsv('top-products', data.bestSellers.map((p) => ({ product: p.title, units: p.units, revenue: p.revenue, stock: p.stock }))) },
    { label: 'Inventory (low stock)', run: () => exportToCsv('inventory', data.lowStockProducts.map((p) => ({ product: p.title, category: p.category, stock: p.stock }))) },
    { label: 'Category revenue', run: () => exportToCsv('category-revenue', data.categoryRevenue.map((c) => ({ category: c.category, revenue: c.revenue, units: c.units }))) },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Understand how your store is performing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  range === r.value
                    ? 'bg-brand-gradient text-white shadow-glow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <details className="group relative">
            <summary className="btn-secondary cursor-pointer list-none">
              <FiDownload /> Export
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-card dark:border-white/10 dark:bg-slate-900">
              {exports.map((e) => (
                <button
                  key={e.label}
                  type="button"
                  onClick={e.run}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-white/5"
                >
                  {e.label}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link to="/admin/products" className="btn-primary"><FiPlus /> Add Product</Link>
        <Link to="/admin/orders" className="btn-secondary"><FiShoppingBag /> View Orders</Link>
        <Link to="/admin/users" className="btn-secondary"><FiUsers /> Manage Users</Link>
        <Link to="/admin/products" className="btn-secondary"><FiBox /> Inventory</Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Revenue chart */}
      <ChartCard title="Revenue Over Time" subtitle={RANGES.find((r) => r.value === range)?.label}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={salesData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatPrice(v).replace(/\.00$/, '')} />
            <Tooltip contentStyle={chart.tooltip} formatter={(v) => [formatPrice(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2.5} fill="url(#revFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Orders + Customers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Orders Placed" subtitle="Orders over the selected period">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={chart.tooltip} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
              <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth" subtitle="New registrations">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={customerData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={chart.tooltip} formatter={(v) => [v, 'New customers']} />
              <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Status + Category */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Order Status" subtitle="Distribution across all orders">
          {statusData.length ? (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chart.tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="w-full space-y-2 sm:w-48">
                {statusData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{Math.round((d.value / totalStatus) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No orders yet.</p>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Category" subtitle="Top performing categories">
          {data.categoryRevenue.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.categoryRevenue.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => formatPrice(v).replace(/\.00$/, '')} />
                <YAxis type="category" dataKey="category" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={110} />
                <Tooltip contentStyle={chart.tooltip} formatter={(v) => [formatPrice(v), 'Revenue']} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
                <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No sales data yet.</p>
          )}
        </ChartCard>
      </div>

      {/* Monthly revenue */}
      <ChartCard title="Revenue by Month" subtitle={`${new Date().getFullYear()} performance`}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: chart.axis, fontSize: 12 }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatPrice(v).replace(/\.00$/, '')} />
            <Tooltip contentStyle={chart.tooltip} formatter={(v) => [formatPrice(v), 'Revenue']} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
            <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Best sellers + Low stock */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Best Selling Products</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Top 10 by units sold</p>
          <div className="mt-4 overflow-x-auto">
            {data.bestSellers.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 text-right font-medium">Units</th>
                    <th className="pb-2 text-right font-medium">Revenue</th>
                    <th className="pb-2 text-right font-medium">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.bestSellers.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2.5 pr-2"><span className="line-clamp-1">{p.title}</span></td>
                      <td className="py-2.5 text-right font-medium">{p.units}</td>
                      <td className="py-2.5 text-right">{formatPrice(p.revenue)}</td>
                      <td className={`py-2.5 text-right font-medium ${p.stock === 0 ? 'text-rose-500' : p.stock < 10 ? 'text-amber-500' : 'text-slate-500'}`}>{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">No sales recorded yet.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Low Stock Alerts</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Restock before you sell out</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs dark:border-white/10">
              {[
                { k: 'all', l: 'Under 10' },
                { k: 'under5', l: 'Under 5' },
                { k: 'out', l: 'Out' },
              ].map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setStockTab(t.k)}
                  className={`rounded-md px-2.5 py-1 font-medium transition ${stockTab === t.k ? 'bg-slate-100 dark:bg-white/10' : 'text-slate-500'}`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
            {stockList.length ? (
              stockList.slice(0, 8).map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium">{p.title}</p>
                    <p className="text-xs text-slate-400">{p.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.stock === 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                    <Link to="/admin/products" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">Edit</Link>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-12 text-center text-sm text-slate-500">All products are well stocked.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Latest orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Latest Orders</h2>
          <Link to="/admin/orders" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">View all</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          {data.recentOrders.length ? (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 text-center font-medium">Items</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                  <th className="pb-2 text-center font-medium">Payment</th>
                  <th className="pb-2 text-center font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {data.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="py-3 font-medium">#{String(o._id).slice(-6)}</td>
                    <td className="py-3"><span className="line-clamp-1">{o.customer}</span></td>
                    <td className="py-3 text-center">{o.items}</td>
                    <td className="py-3 text-right font-medium">{formatPrice(o.amount)}</td>
                    <td className="py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${o.isPaid ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                        {o.isPaid ? 'Paid' : 'COD'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${STATUS_META[o.status]?.color}1a`, color: STATUS_META[o.status]?.color }}>
                        {STATUS_META[o.status]?.label || o.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-500">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No orders yet.</p>
          )}
        </div>
      </div>

      {/* Recent customers + Visitor analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Customers</h2>
            <Link to="/admin/users" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">View all</Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
            {data.recentCustomers.length ? (
              data.recentCustomers.map((u) => (
                <li key={u._id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    {u.name?.[0]?.toUpperCase() || 'U'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{u.name}</p>
                    <p className="line-clamp-1 text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(u.createdAt)}</span>
                </li>
              ))
            ) : (
              <li className="py-12 text-center text-sm text-slate-500">No customers yet.</li>
            )}
          </ul>
        </div>

        <div className="card flex flex-col p-6">
          <h2 className="font-semibold">Visitor Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Traffic & audience insights</p>
          {visitor.available ? (
            <div className="mt-4 grid flex-1 grid-cols-2 gap-4">
              {Object.entries(visitor.metrics || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-100 p-4 dark:bg-white/5">
                  <p className="text-xs capitalize text-slate-500">{k}</p>
                  <p className="text-xl font-bold">{v}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-10 text-center dark:border-white/10">
              <FiBarChart2 className="text-3xl text-slate-400" />
              <p className="mt-3 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Visitor analytics will appear after analytics integration (e.g. Google Analytics 4).
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping settings (existing functionality preserved) */}
      <div className="card p-6">
        <h2 className="font-semibold">Shipping Settings</h2>
        {settings ? (
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.deliveryMessageEnabled}
                onChange={async (e) => {
                  try {
                    const { data: res } = await api.put('/admin/settings', { deliveryMessageEnabled: e.target.checked });
                    setSettings(res.settings);
                  } catch {
                    /* ignore */
                  }
                }}
              />
              Show delivery charge confirmation message to customers
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm">Inside Dhaka (BDT)</label>
                <input type="number" value={settings.deliveryChargeDhaka} onChange={(e) => setSettings((st) => ({ ...st, deliveryChargeDhaka: Number(e.target.value) }))} className="input-field mt-1" />
              </div>
              <div>
                <label className="text-sm">Outside Dhaka (BDT)</label>
                <input type="number" value={settings.deliveryChargeOutside} onChange={(e) => setSettings((st) => ({ ...st, deliveryChargeOutside: Number(e.target.value) }))} className="input-field mt-1" />
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={async () => {
                try {
                  const { data: res } = await api.put('/admin/settings', {
                    deliveryChargeDhaka: Number(settings.deliveryChargeDhaka),
                    deliveryChargeOutside: Number(settings.deliveryChargeOutside),
                  });
                  setSettings(res.settings);
                } catch {
                  /* ignore */
                }
              }}
            >
              Save settings
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading settings...</p>
        )}
      </div>
    </div>
  );
}
