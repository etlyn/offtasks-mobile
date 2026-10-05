const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
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

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
