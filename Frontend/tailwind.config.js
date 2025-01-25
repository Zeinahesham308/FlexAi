/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-light-green': '#dbebab',
        'brand-dark-green': '#1a4331',
      },
    },
  },
  plugins: [
    require("daisyui")
  ],
}

