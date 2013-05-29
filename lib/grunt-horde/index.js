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
var teaProp = requireComponent('tea-properties');

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
 *         .loot('my-base-config-module')
 *         .loot('./config/grunt')
 *         .attack();
 *     };
 *
 * Required before calling `attack()`:
 *
 * - `follow()`
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
 */
function GruntHorde() {
  this.cwd = process.cwd();
  this.grunt = null;
  this.config = {
    initConfig: {},
    loadNpmTasks: {},
    loadTasks: {},
    registerMultiTask: {},
    registerTask: {}
  };
}

GruntHorde.prototype.attack = function() {
  var self = this;

  var required = ['grunt'];
  required.forEach(function(name) {
    if (!self[name]) {
      throw new Error(name + '() value is missing');
    }
  });

  this.grunt.initConfig(this.config.initConfig);

  Object.keys(this.config.loadTasks).forEach(function(name) {
    if (self.config.loadTasks[name]) {
      self.grunt.loadTasks(name);
    }
  });

  Object.keys(this.config.loadNpmTasks).forEach(function(name) {
    if (self.config.loadNpmTasks[name]) {
      self.grunt.loadNpmTasks(name);
    }
  });

  Object.keys(this.config.registerTask).forEach(function(name) {
    self.grunt.registerTask.apply(
      self.grunt,
      [name].concat(self.config.registerTask[name])
    );
  });

  Object.keys(this.config.registerMultiTask).forEach(function(name) {
    self.grunt.registerMultiTask.apply(
      self.grunt,
      [name].concat(self.config.registerMultiTask[name])
    );
  });
};

GruntHorde.prototype.follow = function(grunt) {
  this.grunt = grunt;
  return this;
};

GruntHorde.prototype.home = function(cwd) {
  this.cwd = cwd;
  return this;
};

/**
 * Merge in configs defined by the given module.
 *
 * Module payloads are merged recursively, last wins.
 *
 * Example sources:
 *
 * - Base config module, ex. `node_modules/my-base-config`
 * - Project-local config module that overrides the base, ex. `config/grunt/`
 *
 * Usage:
 *
 *     horde.home('/proj/home');
 *     horde.loot('base'); // require('/proj/home/node_modules/base');
 *     horde.loot('./base'); // require('/proj/home/base.js');
 *     horde.loot('/path/to/base'); // require('/path/to/base');
 *
 * @param {string} name Module path, see `Usage` above for examples
 * @see GruntHorde.prototype.home
 */
GruntHorde.prototype.loot = function(name) {
  this.config = mergeDeep(this.config, this.dirToConfigObj(name));
  return this;
};

GruntHorde.prototype.getConfig = function(key) {
  return teaProp.get(this.grunt.config.getRaw(), key);
};

GruntHorde.prototype.setConfig = function(key, val) {
  teaProp.set(this.grunt.config.getRaw(), key, val);
};

/**
 *
 * @api private
 */
GruntHorde.prototype.createModuleContext = function() {
  return {
    config: clone(this.grunt.config.getRaw()),
    path: path,
    shelljs: shelljs,
    t: this.t.bind(this)
  };
};

/**
 * Using file layout conventions, convert a directory's contents into an
 * object for later merging into `this.config`.
 *
 * @param {string} name Absolute path to directory w/out trailing slash
 * @return {object}
 * @api private
 */
GruntHorde.prototype.dirToConfigObj = function(name) {
  var self = this;
  var obj = {
    initConfig: this.requireDirIfExists(name + '/initConfig')
  };
  var files = ['loadTasks', 'loadNpmTasks', 'registerTask', 'registerMultiTask'];
  files.forEach(function(file) {
    obj[file] = self.requireIfExists(name + '/' + file + '.js');
  });
  return obj;
};

/**
 *
 * @api private
 */
GruntHorde.prototype.require = function(name) {
  return require(this.resolveRequire(name)).call(
    this.createModuleContext(), this.grunt
  );
};

GruntHorde.prototype.requireIfExists = function(name) {
  if (shelljs.test('-e', name)) {
    return this.require(name);
  } else {
    return {};
  }
};

/**
 *
 * @api private
 */
GruntHorde.prototype.requireDir = function(name) {
  var config = shelljs.ls(this.resolveRequire(name) + '/*.js').reduce(
    GruntHorde.reduceDirToConfig.bind(this), {index: {}, categorized: {}}
  );
  return mergeDeep(config.index, config.categorized);
};

/**
 *
 * @api private
 */
GruntHorde.prototype.requireDirIfExists = function(name) {
  if (shelljs.test('-e', name)) {
    return this.requireDir(name);
  } else {
    return {};
  }
};

/**
 *
 * See GruntHorde.prototype.loot for examples.
 *
 * @api private
 */
GruntHorde.prototype.resolveRequire = function(name) {
  if (/^\.\//.test(name)) {
    name = path.normalize(this.cwd + '/' + name);
  } else if (/^[^\/]/.test(name)) {
    name = this.cwd + '/node_modules/' + name;
  }
  return name;
};

/**
 * Alias for `grunt.template.process()`.
 *
 * @see process http://gruntjs.com/api/grunt.template#grunt.template.process
 * @api private
 */
GruntHorde.prototype.t = function() {
  return this.grunt.template.process.apply(this.grunt, arguments);
};

/**
 *
 * @api private
 */
GruntHorde.reduceDirToConfig = function(memo, file) {
  if ('index.js' === path.basename(file)) { // Let it hold top-level keys
    memo.index = this.require(file);
  } else { // All others go under top-level keys named after their files
    var config = {};
    config[path.basename(file, '.js')] = this.require(file);
    memo.categorized = mergeDeep(memo.categorized, config);
  }
  return memo;
};
