import {
  FiBatteryCharging,
  FiZap,
  FiWind,
  FiHeadphones,
  FiMusic,
  FiLink,
  FiCpu,
  FiSmartphone,
} from 'react-icons/fi';

export const CATEGORIES = [
  { name: 'Power Banks', icon: FiBatteryCharging, color: 'from-amber-500 to-orange-500' },
  { name: 'Fast Chargers', icon: FiZap, color: 'from-yellow-500 to-amber-500' },
  { name: 'Turbo Fans', icon: FiWind, color: 'from-cyan-500 to-blue-500' },
  { name: 'Earbuds', icon: FiHeadphones, color: 'from-violet-500 to-purple-500' },
  { name: 'Headphones', icon: FiMusic, color: 'from-pink-500 to-rose-500' },
  { name: 'USB Cables', icon: FiLink, color: 'from-slate-500 to-slate-600' },
  { name: 'Smart Gadgets', icon: FiCpu, color: 'from-emerald-500 to-teal-500' },
  { name: 'Phone Accessories', icon: FiSmartphone, color: 'from-brand-500 to-brand-700' },
];
