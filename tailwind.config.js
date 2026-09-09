/** @type {import('tailwindcss').Config} */
const appColors = require('./src/theme/colors');
const plugin = require('tailwindcss/plugin');

// Pemetaan kelas font-weight Tailwind ke file font Satoshi.
// Platform native tidak bisa "menebalkan" font file statis via fontWeight,
// jadi tiap bobot diarahkan ke file font yang berbeda.
const satoshiWeights = {
  thin: 'SatoshiLight',
  extralight: 'SatoshiLight',
  light: 'SatoshiLight',
  normal: 'SatoshiRegular',
  medium: 'SatoshiMedium',
  semibold: 'SatoshiMedium',
  bold: 'SatoshiBold',
  extrabold: 'SatoshiBlack',
  black: 'SatoshiBlack',
};

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
      fontFamily: {
        sans: ['SatoshiRegular', '-apple-system', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      const utilities = {};
      Object.entries(satoshiWeights).forEach(([weight, family]) => {
        utilities[`.font-${weight}`] = { fontFamily: family };
      });
      addUtilities(utilities);
    }),
  ],
};