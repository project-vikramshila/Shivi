/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/components/**/*.{js,ts,jsx,tsx}',
    './src/renderer/pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'shivi-pink': {
          50: '#faf5f8',
          100: '#f5e8f0',
          200: '#eecadb',
          300: '#e3aac6',
          400: '#da88b1',
          500: '#d1669c',
          600: '#b8438a',
          700: '#9d3275',
          800: '#7d2660',
          900: '#5d1a4b',
        },
        'shivi-dark': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        glow: '0 0 20px rgba(209, 102, 156, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(209, 102, 156, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(209, 102, 156, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
