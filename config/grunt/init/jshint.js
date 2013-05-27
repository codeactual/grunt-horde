module.exports = function(grunt) {
  'use strict';

  return {
    grunt: {
      files: {
        src: ['Gruntfile.js']
      }
    },
    tests: {
      options: {
        expr: true
      },
      files: {
        src: ['test/lib/**/*.js']
      }
    },
    json: {
      files: {
        src: ['*.json']
      }
    }
  };
};
