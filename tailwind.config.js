/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A1628',
        'navy-light': '#0D1F3C',
        teal: '#00C2A8',
        'teal-dark': '#00A891',
        gold: '#C9A84C',
        'gold-light': '#D4B86A',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
