const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add path alias resolution
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@/database': path.resolve(__dirname, 'src/database'),
    '@/features': path.resolve(__dirname, 'src/features'),
    '@/shared': path.resolve(__dirname, 'src/shared'),
  },
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
  },
};

module.exports = config;

