const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Add path alias resolution
config.resolver = {
  ...config.resolver,
  alias: {
    '@': path.resolve(projectRoot, 'src'),
    '@/database': path.resolve(projectRoot, 'src/database'),
    '@/features': path.resolve(projectRoot, 'src/features'),
    '@/shared': path.resolve(projectRoot, 'src/shared'),
  },
};

module.exports = config;

