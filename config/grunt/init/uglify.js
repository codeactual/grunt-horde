module.exports = function() {
  'use strict';

  return {
    dist: {
      options: {
        compress: false,
        mangle: false,
        beautify: true
      },
      files: {
        'dist/grunt-horde.js': 'dist/grunt-horde.js'
      }
    }
  };
};
