import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const [userCount, productCount, orders, products] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments(),
    Order.find({}),
    Product.find({}).select('title stock category price'),
  ]);

  const totalSales = orders.reduce((sum, o) => sum + o.itemsPrice, 0);
  const lowStock = products.filter((p) => p.stock < 10);
  const categoryStats = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
  ]);

  res.json({
    success: true,
    stats: {
      users: userCount,
      products: productCount,
      orders: orders.length,
      totalSales,
      lowStock: lowStock.length,
      recentOrders: orders.slice(-5).reverse(),
      categoryStats,
      lowStockProducts: lowStock.slice(0, 5),
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
