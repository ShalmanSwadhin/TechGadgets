/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand purple ramp derived from the TechGadgets logo.
        // 700 = primary #6A0DAD, 550/500 = accent #8B1FD1, 300 = soft #C89BFF.
        brand: {
          50: '#f7edff',
          100: '#efdbff',
          200: '#deb8ff',
          300: '#c89bff',
          400: '#b06bf2',
          500: '#9b34e0',
          600: '#8215c9',
          700: '#6a0dad',
          800: '#4e0b80',
          900: '#370a5a',
          950: '#250540',
        },
        // Neutral ramp, tinted toward purple so every surface, border and
        // muted text reads as part of the brand instead of plain gray.
        slate: {
          50: '#faf7ff',
          100: '#f1ebfa',
          200: '#e1d6f0',
          300: '#c6b6de',
          400: '#a08bc2',
          500: '#7c68a0',
          600: '#5d4b7e',
          700: '#43315f',
          800: '#2e1a44',
          900: '#221133',
          950: '#120018',
        },
        surface: {
          light: '#f5eeff',
          dark: '#120018',
        },
        accent: {
          cyan: '#5de2ff',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -6px rgba(58, 12, 92, 0.18)',
        card: '0 10px 34px -14px rgba(58, 12, 92, 0.28)',
        glow: '0 10px 40px -8px rgba(139, 31, 209, 0.45)',
        'glow-sm': '0 6px 20px -6px rgba(139, 31, 209, 0.4)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6a0dad 0%, #8b1fd1 100%)',
        'brand-gradient-hover': 'linear-gradient(135deg, #7a12c4 0%, #a134e6 100%)',
        'hero-gradient':
          'radial-gradient(60rem 60rem at 12% -10%, rgba(139,31,209,0.35), transparent 60%), radial-gradient(50rem 50rem at 100% 0%, rgba(106,13,173,0.45), transparent 55%), linear-gradient(160deg, #1e0530 0%, #2a0740 45%, #120018 100%)',
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
