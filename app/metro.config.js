const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude the NestJS server workspace from Metro's file watcher
// This prevents Metro from crashing when server's temporary build files
// (like .webpack-* folders) are created/deleted during development
config.resolver.blockList = [
  // Exclude entire server workspace
  /\/server\/.*/,
  // Exclude temporary webpack folders
  /\.webpack-[^/]*\//,
];

module.exports = config;
