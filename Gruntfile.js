module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
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
    uglify: {
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
    },
    shell: {
      options: {
        failOnError: true
      },
      install: {
        command: './node_modules/.bin/component install'
      },
      dist: {
        command: './node_modules/.bin/component build --umd --name grunt-horde --out dist'
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
  grunt.registerTask('build', ['default', 'shell:dist']);
  grunt.registerTask('dist', ['default', 'shell:dist', 'uglify:dist', 'dox']);
  grunt.registerTask('test', ['build', 'shell:test_lib']);
};
