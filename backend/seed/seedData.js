export const categories = [
  'Power Banks',
  'Fast Chargers',
  'Turbo Fans',
  'Earbuds',
  'Headphones',
  'USB Cables',
  'Smart Gadgets',
  'Phone Accessories',
];

export const products = [
  {
    title: 'Anker PowerCore 20K Ultra Slim',
    description:
      'High-capacity 20000mAh power bank with PowerIQ 3.0, dual USB-C and USB-A ports. Charges iPhone 15 up to 4 times. Aircraft-safe certified.',
    category: 'Power Banks',
    brand: 'Anker',
    price: 59.99,
    discountPrice: 49.99,
    stock: 120,
    images: [
      'https://images.unsplash.com/photo-1609091839311-ffe793b64f5c?w=800&q=80',
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    ],
    featured: true,
    popularity: 450,
    specifications: {
      Capacity: '20000mAh',
      Output: '22.5W Max',
      Ports: '2x USB-C, 1x USB-A',
      Weight: '340g',
    },
  },
  {
    title: 'Baseus 65W GaN Fast Charger',
    description:
      'Compact GaN III charger with 2 USB-C and 1 USB-A. PD 3.0 and PPS support for laptops, tablets, and phones.',
    category: 'Fast Chargers',
    brand: 'Baseus',
    price: 45.99,
    discountPrice: 39.99,
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    ],
    featured: true,
    popularity: 380,
    specifications: {
      Power: '65W Total',
      Technology: 'GaN III',
      Ports: '2x USB-C + 1x USB-A',
    },
  },
  {
    title: 'JISULIFE Portable Turbo Fan Pro',
    description:
      'Handheld turbo fan with 4000mAh battery, 5 speed levels, and foldable design. Perfect for travel and outdoor events.',
    category: 'Turbo Fans',
    brand: 'JISULIFE',
    price: 29.99,
    discountPrice: 24.99,
    stock: 85,
    images: [
      'https://images.unsplash.com/photo-1631540577869-49c062a0a2b0?w=800&q=80',
    ],
    featured: true,
    popularity: 290,
    specifications: {
      Battery: '4000mAh',
      Speeds: '5 Levels',
      Runtime: 'Up to 16 hours',
    },
  },
  {
    title: 'SoundCore Liberty 4 NC Earbuds',
    description:
      'Adaptive ANC earbuds with LDAC hi-res audio, 50-hour playtime with case, and IPX4 water resistance.',
    category: 'Earbuds',
    brand: 'SoundCore',
    price: 99.99,
    discountPrice: 79.99,
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&q=80',
    ],
    featured: true,
    popularity: 520,
    specifications: {
      ANC: 'Adaptive 2.0',
      Codec: 'LDAC, AAC',
      Battery: '50h with case',
    },
  },
  {
    title: 'Sony WH-CH720N Wireless Headphones',
    description:
      'Lightweight over-ear headphones with V1 processor noise canceling, 35-hour battery, and multipoint connection.',
    category: 'Headphones',
    brand: 'Sony',
    price: 149.99,
    discountPrice: 119.99,
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    ],
    featured: true,
    popularity: 410,
    specifications: {
      Driver: '30mm',
      Battery: '35 hours',
      Weight: '192g',
    },
  },
  {
    title: 'Cable Matters USB-C to USB-C 100W 6ft',
    description:
      'Braided USB-C cable supporting 100W PD and 480Mbps data transfer. E-marker chip for safe fast charging.',
    category: 'USB Cables',
    brand: 'Cable Matters',
    price: 14.99,
    discountPrice: 11.99,
    stock: 500,
    images: [
      'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=800&q=80',
    ],
    featured: false,
    popularity: 180,
    specifications: {
      Length: '6 feet',
      Power: '100W PD',
      Material: 'Braided nylon',
    },
  },
  {
    title: 'Echo Dot Smart Speaker Gen 5',
    description:
      'Compact smart speaker with Alexa, improved audio, and Matter smart home support. Control your gadgets with voice.',
    category: 'Smart Gadgets',
    brand: 'Amazon',
    price: 49.99,
    discountPrice: 39.99,
    stock: 90,
    images: [
      'https://images.unsplash.com/photo-1543512214-318a755a207c?w=800&q=80',
    ],
    featured: true,
    popularity: 340,
    specifications: {
      Assistant: 'Alexa',
      Connectivity: 'Wi-Fi, Bluetooth',
      Protocol: 'Matter, Zigbee',
    },
  },
  {
    title: 'ESR HaloLock MagSafe Stand',
    description:
      'Adjustable MagSafe phone stand with 15W wireless charging. Strong magnets, portrait and landscape modes.',
    category: 'Phone Accessories',
    brand: 'ESR',
    price: 34.99,
    discountPrice: 27.99,
    stock: 175,
    images: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    ],
    featured: false,
    popularity: 220,
    specifications: {
      Charging: '15W MagSafe',
      Compatibility: 'iPhone 12+',
      Adjustability: '360° rotation',
    },
  },
  {
    title: 'RAVPower 10000mAh Mini Power Bank',
    description:
      'Pocket-sized 10000mAh power bank with 20W USB-C PD. Lightweight aluminum body, ideal for daily carry.',
    category: 'Power Banks',
    brand: 'RAVPower',
    price: 32.99,
    stock: 140,
    images: [
      'https://images.unsplash.com/photo-1609091839311-ffe793b64f5c?w=800&q=80',
    ],
    featured: false,
    popularity: 200,
    specifications: {
      Capacity: '10000mAh',
      Output: '20W PD',
      Weight: '180g',
    },
  },
  {
    title: 'Apple 20W USB-C Power Adapter',
    description:
      'Official Apple 20W USB-C adapter for fast charging iPhone and iPad. Compact and travel-friendly.',
    category: 'Fast Chargers',
    brand: 'Apple',
    price: 19.99,
    stock: 300,
    images: [
      'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
    ],
    featured: false,
    popularity: 500,
    specifications: {
      Power: '20W',
      Port: 'USB-C',
    },
  },
  {
    title: 'Nothing Ear (2) Wireless Earbuds',
    description:
      'Transparent design TWS earbuds with Hi-Res Audio, adaptive ANC, and personalized sound profiles via app.',
    category: 'Earbuds',
    brand: 'Nothing',
    price: 129.99,
    discountPrice: 99.99,
    stock: 75,
    images: [
      'https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=800&q=80',
    ],
    featured: true,
    popularity: 360,
    specifications: {
      Driver: '11.6mm',
      ANC: 'Adaptive',
      Battery: '36h with case',
    },
  },
  {
    title: 'Bose QuietComfort Ultra Headphones',
    description:
      'Premium spatial audio headphones with world-class noise cancellation and immersive audio modes.',
    category: 'Headphones',
    brand: 'Bose',
    price: 429.99,
    discountPrice: 379.99,
    stock: 35,
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
    ],
    featured: true,
    popularity: 280,
    specifications: {
      ANC: 'CustomTune',
      Battery: '24 hours',
      Audio: 'Spatial Immersive',
    },
  },
  {
    title: 'Anker USB-C Hub 7-in-1',
    description:
      'Aluminum USB-C hub with 4K HDMI, 100W PD pass-through, SD/microSD readers, and 3 USB 3.0 ports.',
    category: 'Smart Gadgets',
    brand: 'Anker',
    price: 54.99,
    discountPrice: 44.99,
    stock: 110,
    images: [
      'https://images.unsplash.com/photo-1625729418800-32b888b3f2c0?w=800&q=80',
    ],
    featured: false,
    popularity: 190,
    specifications: {
      Ports: '7-in-1',
      HDMI: '4K@30Hz',
      PD: '100W pass-through',
    },
  },
  {
    title: 'Spigen Tough Armor MagFit Case',
    description:
      'Military-grade drop protection case with MagSafe compatibility and raised camera lip for iPhone 15 Pro.',
    category: 'Phone Accessories',
    brand: 'Spigen',
    price: 24.99,
    discountPrice: 19.99,
    stock: 250,
    images: [
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&q=80',
    ],
    featured: false,
    popularity: 310,
    specifications: {
      Protection: 'MIL-STD-810G',
      MagSafe: 'Yes',
      Material: 'TPU + Polycarbonate',
    },
  },
  {
    title: 'SKG Portable Neck Fan',
    description:
      'Bladeless neck fan with 360° airflow, 3 speeds, and whisper-quiet motor. USB rechargeable for 8 hours.',
    category: 'Turbo Fans',
    brand: 'SKG',
    price: 35.99,
    stock: 95,
    images: [
      'https://images.unsplash.com/photo-1631540577869-49c062a0a2b0?w=800&q=80',
    ],
    featured: false,
    popularity: 150,
    specifications: {
      Type: 'Bladeless neck',
      Runtime: '8 hours',
      Speeds: '3',
    },
  },
  {
    title: 'Belkin BoostCharge Pro 3-in-1',
    description:
      'MagSafe charging stand for iPhone, Apple Watch, and AirPods. 15W fast wireless charging with premium build.',
    category: 'Phone Accessories',
    brand: 'Belkin',
    price: 149.99,
    discountPrice: 129.99,
    stock: 45,
    images: [
      'https://images.unsplash.com/photo-1591290619769-c4aaba70ec3e?w=800&q=80',
    ],
    featured: true,
    popularity: 170,
    specifications: {
      Charging: '15W MagSafe',
      Devices: '3 simultaneous',
    },
  },
];

export const sampleReviews = [
  {
    name: 'Alex Morgan',
    rating: 5,
    comment: 'Best power bank I have owned. Charges my MacBook and phone simultaneously.',
  },
  {
    name: 'Jordan Lee',
    rating: 5,
    comment: 'Incredible sound quality for the price. ANC works great on my commute.',
  },
  {
    name: 'Sam Patel',
    rating: 4,
    comment: 'Compact GaN charger replaced three bricks in my bag. Highly recommend.',
  },
];
