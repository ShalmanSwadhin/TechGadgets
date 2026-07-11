/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f0ff',
          200: '#bce5ff',
          300: '#8ed4ff',
          400: '#59b8ff',
          500: '#3399ff',
          600: '#1a7af5',
          700: '#1462e1',
          800: '#1750b6',
          900: '#19458f',
          950: '#142b57',
        },
        surface: {
          light: '#f8fafc',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 23, 42, 0.08)',
        card: '0 8px 30px -12px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
