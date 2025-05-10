/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'app-bg': '#0f0f0f',
        'app-card': '#1a1a1a',
        'app-accent': '#6366f1', // indigo-500
        'app-border': '#27272a'
      },
      boxShadow: {
        glow: '0 0 15px rgba(99, 102, 241, 0.15)'
      }
    }
  },
  plugins: []
}
