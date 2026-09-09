// Jika kamu sudah punya metro.config.js sendiri, gabungkan bagian
// withNativeWind ini ke konfigurasi yang sudah ada — jangan menimpanya.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
