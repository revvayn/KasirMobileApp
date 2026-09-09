/** @type {import('tailwindcss').Config} */
const appColors = require('./src/theme/colors');

module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: appColors,
      borderRadius: {
        card: '22px',   // setara radius.lg tema sebelumnya
      },
    },
  },
  plugins: [],
};
