// Setup NativeWind v4. Jika kamu sudah punya babel.config.js sendiri,
// gabungkan bagian "presets" ini ke file yang sudah ada — jangan menimpanya.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
