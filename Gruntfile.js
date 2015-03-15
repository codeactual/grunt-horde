module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-shell');

  var mochaShelljsOpt = {stdout: true, stderr: false};

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js', 'lib/**/*.js']
        }
      },
      grunt: {
        files: {
          src: ['Gruntfile.js', 'config/**/*.js']
        }
      },
      tests: {
        options: {
          expr: true
        },
        files: {
          src: ['test/**/*.js']
        }
      },
      json: {
        files: {
          src: ['*.json']
        }
      }
    },
    shell: {
      options: {
        failOnError: true
      },
      test_lib: {
        options: mochaShelljsOpt,
        command: './node_modules/.bin/mocha --colors --recursive --reporter spec test/lib'
      },
      dox_lib: {
        command: './node_modules/.bin/apidox --input lib/grunt-horde/index.js --output docs/GruntHorde.md'
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('dox', ['shell:dox_lib']);
  grunt.registerTask('test', ['shell:test_lib']);
};
