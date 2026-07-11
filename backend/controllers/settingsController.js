import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  let s = await Setting.findOne();
  if (!s) {
    s = await Setting.create({});
  }
  res.json({ success: true, settings: s });
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
  let s = await Setting.findOne();
  if (!s) {
    s = await Setting.create({});
  }
  res.json({ success: true, settings: s });
});

export const updateSettings = asyncHandler(async (req, res) => {
  let s = await Setting.findOne();
  if (!s) {
    s = await Setting.create({});
  }
  const { deliveryMessageEnabled, deliveryChargeDhaka, deliveryChargeOutside } = req.body;
  if (typeof deliveryMessageEnabled === 'boolean') s.deliveryMessageEnabled = deliveryMessageEnabled;
  if (typeof deliveryChargeDhaka === 'number') s.deliveryChargeDhaka = deliveryChargeDhaka;
  if (typeof deliveryChargeOutside === 'number') s.deliveryChargeOutside = deliveryChargeOutside;
  await s.save();
  res.json({ success: true, settings: s });
});
