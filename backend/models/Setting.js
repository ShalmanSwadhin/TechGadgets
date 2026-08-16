import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  deliveryMessageEnabled: { type: Boolean, default: true },
  deliveryChargeDhaka: { type: Number, default: 80 },
  deliveryChargeSubCity: { type: Number, default: 100 },
  deliveryChargeOutside: { type: Number, default: 130 },
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
