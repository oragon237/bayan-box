/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        bayan: {
          50: '#f4f2ff',
          100: '#e9e5ff',
          200: '#d4ccff',
          300: '#b3a6ff',
          400: '#8f7aff',
          500: '#6f4bff',
          600: '#673de6',
          700: '#5731c4',
          800: '#452a9e',
          900: '#38277c',
        },
        ink: {
          50: '#f7f7f8',
          100: '#efeff1',
          200: '#e0e0e3',
          300: '#c4c4ca',
          400: '#9a9aa3',
          500: '#74747e',
          600: '#56565e',
          700: '#3d3d44',
          800: '#26262c',
          900: '#17171b',
        },
        amber: {
          400: '#ffd166',
          500: '#ffb703',
          600: '#e89b00',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(23 23 27 / 0.06), 0 1px 3px 0 rgb(23 23 27 / 0.10)',
        lift: '0 12px 32px -8px rgb(103 61 230 / 0.28)',
        'lift-dark': '0 12px 32px -8px rgb(0 0 0 / 0.45)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};