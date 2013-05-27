module.exports = function(grunt) {
  'use strict';

  return {
    dist: {
      command: 'component build --standalone gruntHorde --name grunt-horde --out dist'
    },
    test_lib: {
      options: this.decree.mochaShelljsOpt,
      command: 'mocha --colors --recursive --reporter spec test/lib'
    },
    dox_lib: {
      command: 'apidox --input lib/grunt-horde/index.js --output docs/GruntHorde.md'
    }
  };
};
