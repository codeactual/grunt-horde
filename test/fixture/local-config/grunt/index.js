module.exports = function(grunt) {
  'use strict';

  return {
    initConfig: this.requireDir(__dirname + '/initConfig'),
    loadNpmTasks: this.require('./loadNpmTasks'),
    registerTask: this.require('./registerTask')
  };
};
