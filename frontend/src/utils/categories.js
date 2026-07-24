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

// Gradients stay within the TechGadgets purple family (with one limited
// cyan accent) so the category grid matches the brand design system.
export const CATEGORIES = [
  { name: 'Power Banks', icon: FiBatteryCharging, color: 'from-brand-500 to-brand-700' },
  { name: 'Fast Chargers', icon: FiZap, color: 'from-violet-500 to-brand-600' },
  { name: 'Turbo Fans', icon: FiWind, color: 'from-brand-500 to-[#5de2ff]' },
  { name: 'Earbuds', icon: FiHeadphones, color: 'from-fuchsia-500 to-brand-600' },
  { name: 'Headphones', icon: FiMusic, color: 'from-brand-600 to-violet-500' },
  { name: 'USB Cables', icon: FiLink, color: 'from-slate-500 to-slate-700' },
  { name: 'Smart Gadgets', icon: FiCpu, color: 'from-brand-400 to-brand-700' },
  { name: 'Phone Accessories', icon: FiSmartphone, color: 'from-violet-600 to-brand-800' },
];
