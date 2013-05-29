/**
 * Modular grunt configuration
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
 * @param {object} grunt Instance injected into Gruntfile.js
 * @return {object}
 */
exports.create = function(grunt) { return new GruntHorde(grunt); };

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
 *     module.exports = function(grunt) {
 *       require('grunt-horde')
 *         .create(grunt)
 *         .loot('my-base-config-module')
 *         .loot('./config/grunt')
 *         .attack();
 *     };
 *
 * Properties:
 *
 * - `{object} config` Gruntfile.js values indexed by `grunt` method name
 *   - `{object} initConfig`
 *   - `{object} loadNpmTasks`
 *   - `{object} loadTasks`
 *   - `{object} registerMultiTask`
 *   - `{object} registerTask`
 * - `{string} [home=process.cwd]` Absolute path to project root dir w/out trailing slash
 * - `{object} grunt` Instance injected into Gruntfile.js
 */
function GruntHorde(grunt) {
  this.cwd = process.cwd();
  this.config = {
    initConfig: {},
    loadNpmTasks: {},
    loadTasks: {},
    registerMultiTask: {},
    registerTask: {}
  };
  this.grunt = grunt;
}

/**
 * Apply configuration.
 *
 * Run all supported `grunt` configuration methods.
 *
 */
GruntHorde.prototype.attack = function() {
  var self = this;

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

/**
 * Set working directory used to resolve relative paths.
 *
 * @param {string} cwd
 * @return {object} this
 */
GruntHorde.prototype.home = function(cwd) {
  this.cwd = cwd;
  return this;
};

/**
 * Load a config module. Merge in its payload.
 *
 * - Payloads are merged recursively, last wins.
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
 * Example layout:
 *
 * ```
 * initConfig/
 *     index.js
 *     jshint.js
 *     uglify.js
 *     shell.js
 * loadTasks.js
 * loadNpmTasks.js
 * registerTask.js
 * registerMultiTask.js
 * ```
 *
 * @param {string} name Module path, see `Usage` above for examples
 * @return {object} this
 */
GruntHorde.prototype.loot = function(name) {
  this.config = mergeDeep(this.config, this.dirToConfigObj(name));
  return this;
};

/**
 * Get a `grunt.config` property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.setConfig('x.y.z', 20);
 *     console.log(grunt.config.getRaw().x.y.z); // 20
 *
 * @param {string} key
 * @return {mixed}
 */
GruntHorde.prototype.getConfig = function(key) {
  return teaProp.get(this.grunt.config.getRaw(), key);
};

/**
 * Set a `grunt.config` property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.setConfig('x.y.z', 20);
 *     console.log(horde.getConfig('x.y.z')); // 20
 *     console.log(grunt.config.getRaw().x.y.z); // 20
 *
 * @param {string} key
 * @param {mixed} val
 * @return {object} this
 * @see [Events](modules.md#events)
 */
GruntHorde.prototype.setConfig = function(key, val) {
  teaProp.set(this.grunt.config.getRaw(), key, val);
  this.grunt.event.emit('grunt-horde:set-config', key, val);
  return this;
};

/**
 * Define `this` for modules loaded w/ GruntHorde.prototype.require.
 *
 * @return {object}
 * @api private
 */
GruntHorde.prototype.createModuleContext = function() {
  return {
    get: this.getConfig.bind(this),
    set: this.setConfig.bind(this),
    t: this.t.bind(this)
  };
};

/**
 * Using file layout conventions, convert a directory's contents into an
 * object for later merging into `this.config`.
 *
 * See GruntHorde.prototype.loot for layout.
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
 * Load a module file.
 *
 * Example module:
 *
 *     module.exports = function(grunt) {
 *       // this.config, this.path, etc.
 *
 *       return { ... };
 *     };
 *
 * - Inject `grunt` as an argument to mimic Gruntfile.js.
 * - Inject `this` provided by GruntHorde.prototype.createModuleContext.
 *
 * @param {string} name
 * @return {object} Return value from the `module.exports` function
 * @api private
 */
GruntHorde.prototype.require = function(name) {
  return require(this.resolveRequire(name)).call(this.createModuleContext(), this.grunt);
};

/**
 * Lenient version of GruntHorde.prototype.require.
 *
 * @param {string} name
 * @return {object} `{}` if `name` does not exist
 * @api private
 */
GruntHorde.prototype.requireIfExists = function(name) {
  if (shelljs.test('-e', name)) {
    return this.require(name);
  } else {
    return {};
  }
};

/**
 * Load a directory (ex. `initConfig/`) of modules. Collect payloads into one object.
 *
 * - Non-`index.js` payloads are merged onto the `index.js` payload.
 *
 * @param {string} name
 * @return {object} Return values from the files' `module.exports` functions
 * - Indexed by base file name, ex. 'jshint'
 * @api private
 */
GruntHorde.prototype.requireDir = function(name) {
  var config = shelljs.ls(this.resolveRequire(name) + '/*.js').reduce(
    GruntHorde.reduceDirToConfig.bind(this), {index: {}, categorized: {}}
  );
  return mergeDeep(config.index, config.categorized);
};

/**
 * Lenient version of GruntHorde.prototype.requireDir.
 *
 * @param {string} name
 * @return {object} `{}` if `name` does not exist
 * @api private
 */
GruntHorde.prototype.requireDirIfExists = function(name) {
  if (shelljs.test('-d', name)) {
    return this.requireDir(name);
  } else {
    return {};
  }
};

/**
 * Resolve paths for GruntHorde.prototype.require.
 *
 * - Resolve relatives to `this.cwd`
 * - Detect absolutes
 * - Detect installed module names
 *
 * See GruntHorde.prototype.loot for examples.
 *
 * @param {string} name
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
 * `reduce()` iterator for GruntHorde.prototype.requireDir.
 *
 * - `index.js` defines top-level keys
 * - Non-`index.js` define keys held under top-level keys named after the file
 *
 * @api private
 */
GruntHorde.reduceDirToConfig = function(memo, file) {
  if ('index.js' === path.basename(file)) {
    memo.index = this.require(file);
  } else {
    var config = {};
    config[path.basename(file, '.js')] = this.require(file);
    memo.categorized = mergeDeep(memo.categorized, config);
  }
  return memo;
};
