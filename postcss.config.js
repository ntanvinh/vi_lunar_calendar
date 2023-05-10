/* eslint-disable no-undef */
const path = require('path');
module.exports = {
  plugins: {
    autoprefixer: {},
    tailwindcss: {
      config: path.join(__dirname, 'tailwind.config.js'),
    },
  },
};
