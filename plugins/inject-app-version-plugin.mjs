import {getVersion} from '../version/getVersion.mjs';

/**
 * Somehow inject app version to vite build context
 * @param {string} [root]
 * @return {import('vite').Plugin}
 */
export const injectAppVersion = root => ({
  name: 'inject-version',
  config: () => {
    process.env.VITE_APP_VERSION = getVersion(root);
  },
});
