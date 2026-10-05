module.exports = {
  preset: 'react-native',
  transform: { '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest' },
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Load actual package icons lazily instead of its eager all-icons barrel.
    '^lucide-react-native$': '<rootDir>/src/test-utils/lucide-entry.cjs',
    '^@etlyn/etlyn-auth/react-native$': '<rootDir>/node_modules/@etlyn/etlyn-auth/lib/react-native.js',
    '^@etlyn/etlyn-auth$': '<rootDir>/node_modules/@etlyn/etlyn-auth/lib/index.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@env$': '<rootDir>/src/test-utils/env-mock.ts',
    '^react-native-vector-icons/(.*)$':
      '<rootDir>/__mocks__/react-native-vector-icons.js',
  },
  transformIgnorePatterns: [
    '/node_modules/lucide-react-native/dist/cjs/',
    'node_modules/(?!(@etlyn/etlyn-auth|@react-native|@react-native-community|react-native|@react-navigation|@react-native-async-storage|react-native-url-polyfill|react-native-gesture-handler|react-native-drawer-layout|react-native-reanimated|react-native-worklets|react-native-calendars|react-native-swipe-gestures|lucide-react-native)/)',
  ],
};
