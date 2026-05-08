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
        // Light mode — editorial cream palette
        background: '#F8F6F1',
        card: '#FFFFFF',
        headline: '#0D0D0D',
        body: '#2D2D2D',
        muted: '#6B7280',
        accent: '#B45309',       // warm amber — FT-ish
        'accent-blue': '#1D4ED8',
        'tag-bg': '#FEF3C7',
        border: '#DDD8CF',
        'border-strong': '#B8B0A0',
        masthead: '#0D1B2A',     // deep navy for header
        // Dark mode
        'dark-bg': '#0E0F11',
        'dark-card': '#17191E',
        'dark-headline': '#F0EDE8',
        'dark-body': '#A8A49D',
        'dark-muted': '#6B7280',
        'dark-accent': '#FBBF24',
        'dark-border': '#2A2C31',
        'dark-masthead': '#0D1B2A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"Lora"', 'Georgia', 'serif'],
      },
      fontSize: {
        'display': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}
