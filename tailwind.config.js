/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#204577',
          hover: '#2a5a8f',
        },
        accent: {
          DEFAULT: '#005c87',
          hover: '#004a6e',
        },
      },
    },
  },
  plugins: [],
}
