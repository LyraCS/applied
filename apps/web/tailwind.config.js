/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Semantic names come from the design system; components never use raw hex.
      colors: {
        primary: { DEFAULT: '#0369A1', light: '#0EA5E9' },
        accent: '#16A34A',
        surface: '#F0F9FF',
        ink: '#0C4A6E',
        muted: '#475569',
        line: '#BAE6FD',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Fira Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
