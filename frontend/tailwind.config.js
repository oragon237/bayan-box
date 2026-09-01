/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        // `bayan` is retained as a compatibility alias for the existing UI.
        // Its values are now the HABI teal scale, paired with cobalt as a
        // supporting utility color where the default Tailwind blue is used.
        bayan: {
          50: '#ecfdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.16)',
        lift: '0 16px 32px -12px rgb(13 148 136 / 0.36)',
        'lift-dark': '0 16px 36px -12px rgb(15 23 42 / 0.58)',
      },
      borderRadius: {
        '2xl': '1.125rem',
        '3xl': '1.75rem',
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
