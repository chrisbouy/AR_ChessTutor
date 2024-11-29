// //const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://reactnative.dev/docs/metro
//  *
//  * 
//  */
// //@type {import('metro-config').MetroConfig}
// //const config = {};

// //module.exports = mergeConfig(getDefaultConfig(__dirname), config);

// // metro.config.js
// module.exports = {
//     watchFolders: ['.'],
//     watchman: true,
//   };
  
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
// metro.config.js
const path = require('path');
const config = getDefaultConfig(__dirname);

module.exports = {
  watchFolders: [
    // Include additional directories to watch
    path.resolve(__dirname, 'engines'),
  ],
};

module.exports = config;
