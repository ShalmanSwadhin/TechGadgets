import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  deliveryMessageEnabled: { type: Boolean, default: true },
  deliveryChargeDhaka: { type: Number, default: 80 },
  deliveryChargeOutside: { type: Number, default: 150 },
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
