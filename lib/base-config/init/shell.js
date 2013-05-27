module.exports = function(grunt) {
  'use strict';

  return {
    options: {
      failOnError: true
    },
    build: {
      command: 'component install --dev && component build --standalone gruntHorde --name grunt-horde --out dist --dev'
    }
  };
};
