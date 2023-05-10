const path = require('path');

/* eslint-disable no-undef */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [path.join(__dirname, 'packages/renderer/src/**/*.{js,jsx,ts,tsx}'), path.join(__dirname, './packages/renderer/index.html')],
  darkMode: 'media',
  mode: 'jit',
  corePlugins: {
    preflight: true,
  },
};
