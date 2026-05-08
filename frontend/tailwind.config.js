/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        background: '#FAFAF9',
        card: '#FFFFFF',
        headline: '#0F0F0F',
        body: '#374151',
        accent: '#2563EB',
        'tag-bg': '#EFF6FF',
        border: '#E5E7EB',
        // Dark mode variants
        'dark-bg': '#0F1117',
        'dark-card': '#1A1D27',
        'dark-headline': '#F9FAFB',
        'dark-body': '#9CA3AF',
        'dark-accent': '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}