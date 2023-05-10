/**
 * But currently electron-builder doesn't support ESM configs
 * @see https://github.com/develar/read-config-file/issues/10
 */

/**
 * @type {() => import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = async function() {
  const {getVersion} = await import('./version/getVersion.mjs');

  return {
    productName: 'Vi Lunar Calendar',
    executableName: 'Vi Lunar Calendar',
    asar: true,
    appId: 'me.ntanvinh.vi_lunar_calendar',
    compression: 'maximum',
    asarUnpack: '**\\*.{node,dll}',
    files: ['packages/**/dist/**', 'packages/**/assets/**'],
    mac: {
      type: 'distribution',
      category: 'Utilities',
      electronLanguages: ['en', 'vi'],
      darkModeSupport: true,
      target: {
        target: 'default',
        arch: [
          'arm64',
          'x64',
        ],
      },
      hardenedRuntime: true,
      gatekeeperAssess: false,
    },
    dmg: {
      contents: [
        {
          x: 130,
          y: 220,
        },
        {
          x: 410,
          y: 220,
          type: 'link',
          path: '/Applications',
        },
      ],
    },
    win: {
      target: [
        'nsis',
      ],
    },
    linux: {
      target: [
        'AppImage',
      ],
    },
    directories: {
      buildResources: 'buildResources',
      output: 'dist',
    },
    extraResources: [
      './assets/**',
    ],
    publish: {
      provider: 'github',
      owner: 'ntanvinh',
      repo: 'vi_lunar_calendar',
    },
    extraMetadata: {
      version: getVersion(),
    },
  };
};
