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
  theme: {
    extend: {
      boxShadow: {
        'glow-sm': '0px 0px 6px 1px rgba(0, 0, 0, 0.1)',
        'glow-md': '0px 0px 10px 3px rgba(0, 0, 0, 0.1)',
        'glow-lg': '0px 0px 15px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },

};
