/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        navy: { DEFAULT: '#0A1628', light: '#1A2B47' },
        gold: '#C9A84C',
        teal: { DEFAULT: '#00C2A8', dark: '#00A891' },
        charcoal: '#2A2A2A',
        'border-soft': '#E5E5E5',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
