/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Purple is the brand ACCENT only (buttons, links, icons, focus,
        // badges) — never a page background. 600 = primary #7C3AED,
        // 500 = #8B5CF6, 400 = hover #A855F7.
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a855f7',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Neutral slate is intentionally left as Tailwind's default cool-gray
        // ramp so surfaces read as premium charcoal/graphite, not purple.
        surface: {
          light: '#f8fafc',
          dark: '#09090b',
        },
        accent: {
          // Technology cyan — used very sparingly (status dots, tiny highlights).
          cyan: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Neutral, near-black shadows for a premium hardware feel.
        soft: '0 4px 20px -6px rgba(2, 6, 23, 0.12)',
        card: '0 12px 34px -16px rgba(2, 6, 23, 0.35)',
        // Purple glow reserved for accent elements (primary buttons / CTA).
        glow: '0 10px 34px -10px rgba(124, 58, 237, 0.4)',
        'glow-sm': '0 6px 18px -8px rgba(124, 58, 237, 0.35)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
        // Dark charcoal/midnight hero with only a faint purple glow accent.
        'hero-gradient':
          'radial-gradient(48rem 40rem at 82% -12%, rgba(124,58,237,0.22), transparent 60%), radial-gradient(36rem 32rem at 4% 6%, rgba(34,211,238,0.05), transparent 55%), linear-gradient(160deg, #0f172a 0%, #0b0f1a 55%, #09090b 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
