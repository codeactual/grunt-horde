module.exports = function(grunt) {
  'use strict';

  return {
    options: {
      failOnError: true
    },
    build: {
      command: 'component install --dev && component build --standalone <%= instanceName %> --name <%= projName %> --out dist --dev'
    }
  };
};
