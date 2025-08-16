const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for monorepo
config.watchFolders = [
  // Include shared package
  require('path').resolve(__dirname, '../shared'),
];

// Resolve modules from shared package
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
  require('path').resolve(__dirname, '../shared/node_modules'),
  require('path').resolve(__dirname, '../../node_modules'),
];

module.exports = config;