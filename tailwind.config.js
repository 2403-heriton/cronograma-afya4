/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'afya-blue': '#0057B8',
        'afya-pink': '#CE0058',
        'soft-pink': '#FBE9F2',
        'light-mint': '#E6F9F2',
      },
      textShadow: {
        md: '0 2px 4px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
}