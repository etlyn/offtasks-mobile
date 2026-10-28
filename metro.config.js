const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const defaults = getDefaultConfig(__dirname);
const generatedDirectories = [
  'ios/Pods',
  'ios/build',
  'android/.gradle',
  'android/build',
  'android/app/build',
];
const generatedBuilds = generatedDirectories.map(directory => new RegExp(
  '^' + path.resolve(__dirname, directory).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[/\\\\]|$)',
));

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Native build output is never an app module. Keep Metro from crawling it
    // while Xcode writes DerivedData inside this SSD checkout.
    blockList: [
      ...(Array.isArray(defaults.resolver.blockList)
        ? defaults.resolver.blockList
        : [defaults.resolver.blockList]),
      ...generatedBuilds,
    ],
    unstable_enablePackageExports: true,
    resolveRequest(context, moduleName, platform) {
      // The auth SDK is ESM-only. Preserve Metro's import/require distinction
      // everywhere else, especially Babel's CommonJS runtime helpers.
      const authSDK = moduleName === '@etlyn/etlyn-auth' ||
        moduleName.startsWith('@etlyn/etlyn-auth/');
      return context.resolveRequest(authSDK ? {
        ...context,
        unstable_conditionNames: [...context.unstable_conditionNames, 'import'],
      } : context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaults, config);
