module.exports = function(grunt) {
  'use strict';

  return {
    dist: ['default', 'shell:dist', 'uglify:dist', 'dox'],
    test: ['build', 'shell:test_lib']
  };
};
