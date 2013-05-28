/**
 * Organized grunt task configuration
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

/**
 * Reference to GruntHorde.
 */
exports.GruntHorde = GruntHorde;

/**
 * Create a new GruntHorde.
 *
 * @return {object}
 */
exports.create = function() { return new GruntHorde(); };

/**
 * Extend GruntHorde.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function(ext) { return extend(GruntHorde.prototype, ext); };

var requireComponent = require('../component/require');
var mergeDeep = requireComponent('assimilate').withStrategy('deep');
var clone = requireComponent('clone');
var extend = requireComponent('extend');

var path = require('path');
var shelljs = require('shelljs');

/**
 * GruntHorde constructor.
 *
 * Usage:
 *
 *     // Gruntfile.js
 *
 *     module.exports = function(grunt) {
 *       var horde = GruntHorde.create();
 *       horde
 *         .follow(grunt)
 *         .seek('./config/grunt')
 *         .loot('my-base-config-module')
 *         .attack();
 *     };
 *
 * Required before calling `attack()`:
 *
 * - `follow()`
 * - `seek()`
 *
 * Properties:
 *
 * - `{object} config` Gruntfile.js sections
 *   - `{object} initConfig`
 *   - `{object} loadNpmTasks`
 *   - `{object} loadTasks`
 *   - `{object} registerMultiTask`
 *   - `{object} registerTask`
 * - `{object} grunt` Module collected from Gruntfile.js
 * - `{string} home` Absolute path to project root dir w/out trailing slash
 * - `{string} seek` Absolute path to project-local grunt config dir w/out trailing slash
 */
function GruntHorde() {
  this.home = process.cwd();
  this.grunt = null;
  this.config = {
    initConfig: {},
    loadNpmTasks: {},
    loadTasks: {},
    registerMultiTask: {},
    registerTask: {}
  };
  this.seek = null;
}

GruntHorde.prototype.attack = function() {
  var self = this;

  var required = ['grunt', 'seek'];
  required.forEach(function(name) {
    if (!self[name]) {
      throw new Error(name + '() value is missing');
    }
  });

  // Merge project-local config w/ module-provided base configs (if any).
  this.loot(this.seek);

  this.grunt.initConfig(this.config.initConfig);

  Object.keys(this.config.loadTasks).forEach(function(name) {
    if (self.config.loadTasks[name]) {
      self.grunt.loadTasks(self.config.loadTasks[name]);
    }
  });

  Object.keys(this.config.loadNpmTasks).forEach(function(name) {
    if (self.config.loadNpmTasks[name]) {
      self.grunt.loadNpmTasks(self.config.loadNpmTasks[name]);
    }
  });

  Object.keys(this.config.registerTask).forEach(function(name) {
    self.grunt.registerTask.apply(self.grunt, self.config.registerTask[name]);
  });

  Object.keys(this.config.registerMultiTask).forEach(function(name) {
    self.grunt.registerMultiTask.apply(self.grunt, self.config.registerMultiTask[name]);
  });
};

GruntHorde.prototype.follow = function(grunt) {
  this.grunt = grunt;
};

GruntHorde.prototype.home = function(home) {
  this.home = home;
};

/**
 * Add a config module.
 *
 * - Module payloads are merged recursively to form a base config, last wins.
 * - Client project can then extend/overwrite the base via `seek()`.
 *
 * Usage:
 *
 *     horde.home('/proj/home');
 *     horde.loot('base'); // require('/proj/home/node_modules/base');
 *     horde.loot('./base'); // require('/proj/home/base.js');
 *     horde.loot('/path/to/base'); // require('/path/to/base');
 *
 * @param {string} name `require()` path, see `Usage`
 * @see GruntHorde.prototype.home
 * @see GruntHorde.prototype.seek
 */
GruntHorde.prototype.loot = function(name) {
  this.config = mergeDeep(this.config, this.dirToConfigObj(name));
};

GruntHorde.prototype.requireConfigModule = function(name) {
  if (/^\.\//.test(name)) {
    name = this.home + '/' + name;
  } else if (/^[^\/]/.test(name)) {
    name = this.home + '/node_modules/' + name;
  }

  return this.require(name);
};

GruntHorde.prototype.seek = function(seek) {
  this.seek = seek;
};

GruntHorde.prototype.require = function(name) {
  return require(name).apply(GruntHorde.createModuleContext(), this.grunt);
};

GruntHorde.prototype.requireIfExists = function(name) {
  if (shelljs.test('-e', name)) {
    return this.require(name);
  } else {
    return {};
  }
};

GruntHorde.prototype.requireDir = function(name) {
  var self = this;
  var index = {};
  var categorized = {};
  shelljs.ls(name + '/*.js').forEach(function(file) {
    if ('index.js' === file) { // Let it hold top-level keys
      index = self.require(file);
    } else { // All others go under top-level keys named after their files
      categorized = mergeDeep(categorized, self.require(file));
    }
  });
  return mergeDeep(index, categorized);
};

GruntHorde.prototype.requireDirIfExists = function(name) {
  if (shelljs.test('-e', name)) {
    return this.requireDir(name);
  } else {
    return {};
  }
};

GruntHorde.prototype.createModuleContext = function() {
  return {
    config: clone(this.grunt.config.getRaw()),
    path: path,
    require: this.require.bind(this),
    requireDir: this.requireDir.bind(this),
    shelljs: shelljs,
    t: this.t.bind(this)
  };
};

/**
 * Alias for `grunt.template.process()`.
 *
 * @see process http://gruntjs.com/api/grunt.template#grunt.template.process
 */
GruntHorde.prototype.t = function() {
  return this.grunt.template.process.apply(this.grunt, arguments);
};

/**
 * Using file layout conventions, convert a directory's contents into an
 * object for later merging into `this.config`.
 *
 * Directory types:
 *
 * - Base config module, ex. `node_modules/my-base-config`
 * - Project-local config module, ex. `config/grunt/`
 *
 * @param {string} name Absolute path to directory w/out trailing slash
 * @return {object}
 */
GruntHorde.prototype.dirToConfigObj = function(name) {
  var obj = {
    initConfig: this.requireDirIfExists(name + '/initConfig')
  };
  var files = ['loadTasks', 'loadNpmTasks', 'registerTask', 'registerMultiTask'];
  files.forEach(function(file) {
    obj[file] = this.requireIfExists(name + '/' + file + '.js');
  });
  return obj;
};
