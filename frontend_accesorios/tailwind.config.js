/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf7ee',
          100: '#f4ebd4',
          500: '#d97706',
          600: '#b45309',
          900: '#78350f',
        }
      }
    },
  },
  plugins: [],
}
