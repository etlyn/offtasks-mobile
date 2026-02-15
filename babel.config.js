module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          'react-native-vector-icons/Feather': './src/components/icons/FeatherIcon',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
