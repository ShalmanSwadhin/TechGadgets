import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const range = Math.min(Math.max(Number(req.query.range) || 30, 1), 365);

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (range - 1));

  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - range);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const yearStart = new Date(now.getFullYear(), 0, 1);

  const revShape = { revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } };
  const itemRevenue = { $multiply: ['$orderItems.price', '$orderItems.quantity'] };

  const [
    totalProducts,
    totalCustomers,
    totalsAgg,
    todayAgg,
    curAgg,
    prevAgg,
    statusAgg,
    stockProducts,
    salesSeries,
    customerSeries,
    monthlyRevenue,
    categoryRevenue,
    bestSellers,
    recentOrdersRaw,
    recentCustomers,
  ] = await Promise.all([
    Product.countDocuments(),
    User.countDocuments({ role: 'user' }),
    Order.aggregate([{ $group: { _id: null, ...revShape } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: todayStart } } }, { $group: { _id: null, ...revShape } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: null, ...revShape } }]),
    Order.aggregate([{ $match: { createdAt: { $gte: prevStart, $lt: start } } }, { $group: { _id: null, ...revShape } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Product.find({ stock: { $lt: 10 } }).select('title stock category').sort({ stock: 1 }).lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: 'user', createdAt: { $gte: start } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: yearStart } } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalPrice' } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$orderItems' },
      { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'p' } },
      { $group: { _id: { $ifNull: [{ $first: '$p.category' }, 'Other'] }, revenue: { $sum: itemRevenue }, units: { $sum: '$orderItems.quantity' } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          title: { $first: '$orderItems.title' },
          units: { $sum: '$orderItems.quantity' },
          revenue: { $sum: itemRevenue },
        },
      },
      { $sort: { units: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'p' } },
      { $addFields: { stock: { $ifNull: [{ $first: '$p.stock' }, 0] } } },
      { $project: { p: 0 } },
    ]),
    Order.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    User.find({ role: 'user' }).select('name email createdAt').sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const totals = totalsAgg[0] || { revenue: 0, orders: 0 };
  const today = todayAgg[0] || { revenue: 0, orders: 0 };
  const cur = curAgg[0] || { revenue: 0, orders: 0 };
  const prev = prevAgg[0] || { revenue: 0, orders: 0 };

  const pct = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : a > 0 ? 100 : 0);

  const statusCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  statusAgg.forEach((s) => {
    if (s._id in statusCounts) statusCounts[s._id] = s.count;
  });

  const recentOrders = recentOrdersRaw.map((o) => ({
    _id: o._id,
    customer: o.shippingAddress?.fullName || 'Guest',
    items: o.orderItems?.length || 0,
    amount: o.totalPrice,
    status: o.status,
    isPaid: o.isPaid,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt,
  }));

  res.json({
    success: true,
    range,
    analytics: {
      summary: {
        revenue: { total: totals.revenue, today: today.revenue, trend: pct(cur.revenue, prev.revenue) },
        orders: { total: totals.orders, today: today.orders, trend: pct(cur.orders, prev.orders) },
        products: { total: totalProducts },
        customers: { total: totalCustomers },
        pendingOrders: statusCounts.pending + statusCounts.processing,
        deliveredOrders: statusCounts.delivered,
        lowStock: stockProducts.filter((p) => p.stock > 0 && p.stock < 10).length,
        outOfStock: stockProducts.filter((p) => p.stock === 0).length,
      },
      salesSeries: salesSeries.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      customerSeries: customerSeries.map((d) => ({ date: d._id, count: d.count })),
      monthlyRevenue: monthlyRevenue.map((d) => ({ month: d._id, revenue: d.revenue })),
      statusCounts,
      categoryRevenue: categoryRevenue.map((c) => ({ category: c._id, revenue: c.revenue, units: c.units })),
      bestSellers,
      lowStockProducts: stockProducts,
      recentOrders,
      recentCustomers,
    },
  });
});

export const getAllUsers = asyncHandler(async (_req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
});

export const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot block admin users');
  }
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, user });
});
