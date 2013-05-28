module.exports = function(grunt) {
  'use strict';

  return {
    dist: {
      command: 'component build --standalone <%= instanceName %> --name <%= projName %> --out dist'
    },
    test_lib: {
      options: this.config.mochaShelljsOpt,
      command: 'mocha --colors --recursive --reporter spec test/lib'
    },
    dox_lib: {
      command: 'apidox --input lib/<%= projName %>/index.js --output docs/<%= klassName %>.md'
    }
  };
};
