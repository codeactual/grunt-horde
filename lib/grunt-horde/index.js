/**
 * Packageable grunt configuration modules
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
var util = require('util');
var sprintf = util.format;

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
 * - `{object} frozenConfig` Track `config` keys set in `Gruntfile.js`
 *   - Allow client project to override defaults set in modules.
 *   - Keys: `config` key names, values: not used
 * - `{string} [home=process.cwd]` Absolute path to project root dir w/out trailing slash
 * - `{object} grunt` Instance injected into Gruntfile.js
 * - `{array} lootBatch` Pending merge functions collected in Gruntfile.prototype.loot
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
  this.frozenConfig = {};
  this.grunt = grunt;
  this.lootBatch = [];
}

/**
 * Apply configuration.
 *
 * Run all supported `grunt` configuration methods.
 */
GruntHorde.prototype.attack = function() {
  var self = this;

  // Save demand() k/v pairs set in Gruntfile.js. Assume they should
  // override any values originating in a file.
  var gruntFileOverrides = clone(this.grunt.config.getRaw());

  // Merge late for leniency: allow `demand()` calls to happen after `loot()`.
  this.lootBatch.forEach(function(fn) { fn.call(self); });

  // Apply demand() k/v pairs
  this.grunt.initConfig(mergeDeep(
    {},
    this.config.initConfig,
    this.grunt.config.getRaw(),
    gruntFileOverrides
  ));

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
 * - Merge operation is deferred until GruntHorde.prototype.attack.
 * - Payloads are merged recursively, last wins.
 *
 * Supported module types:
 *
 * - Name of locally installed NPM package
 * - Relative path, ex. `./config/grunt/`
 * - Absolute path
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
 *   index.js
 *   jshint.js
 *   uglify.js
 *   shell.js
 * loadTasks.js
 * loadNpmTasks.js
 * registerTask.js
 * registerMultiTask.js
 * ```
 *
 * @param {string} name Module path, see `Usage` above for examples
 * @return {object} this
 * @see [Modules Documentation](modules.md)
 */
GruntHorde.prototype.loot = function(name) {
  this.lootBatch.push(function() {
    var resolved = this.resolveRequire(name);
    if (!shelljs.test('-d', this.resolveRequire(name))) {
      throw new GruntHordeError(
        sprintf("loot: no such module '%s' (resolved to '%s')", name, resolved)
      );
    }
    this.config = mergeDeep(this.config, this.dirToConfigObj(name));
  });
  return this;
};

/**
 * Get a raw `grunt.config` property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.demand('x.y.z', 20);
 *     console.log(grunt.config.getRaw().x.y.z); // 20
 *
 * @param {string} key
 * @return {mixed}
 */
GruntHorde.prototype.learn = function(key) {
  return teaProp.get(this.grunt.config.getRaw(), key);
};

/**
 * Set a raw `grunt.config` property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.demand('x.y.z', 20);
 *     console.log(horde.learn('x.y.z')); // 20
 *     console.log(grunt.config.getRaw().x.y.z); // 20
 *
 * Emits:
 *
 * - `grunt-horde:demand` on every invocation.
 *
 * @param {string} key
 * @param {mixed} val
 * @return {object} this
 * @see [Events](modules.md#events)
 */
GruntHorde.prototype.demand = function(key, val) {
  return this.configuredDemand('Gruntfile', this, key, val);
};

/**
 * Same as GruntHorde.prototype.demand w/ additional `source` param.
 *
 * @param {string} source Ex. 'Gruntfile'
 * @param {object} context Custom return value
 * - To support Gruntfile.prototype.createModuleContext
 * - To allow chaining (in modules) to use a limited/bound context properties
 * @param {string} key
 * @param {mixed} val
 * @param {boolean} frozen If true, only the `Gruntfile` source can later modify `key`
 * @return {object} this
 * @api private
 */
GruntHorde.prototype.configuredDemand = function(source, context, key, val) {
  context = context || this;
  if (source !== 'Gruntfile' && this.frozenConfig[key]) {
    this.grunt.event.emit('grunt-horde:demand', source, key, val, 'frozen');
    return context;
  }
  teaProp.set(this.grunt.config.getRaw(), key, val);
  var mode = '';
  if (source === 'Gruntfile') {
    this.frozenConfig[key] = true;
    mode = 'freezing';
  }
  this.grunt.event.emit('grunt-horde:demand', source, key, val, mode);
  return context;
};

/**
 * Define `this` for modules loaded w/ GruntHorde.prototype.require.
 *
 * @param {string} file Resolved module path
 * @return {object}
 * @api private
 */
GruntHorde.prototype.createModuleContext = function(file) {
  var context = {};
  context.learn = this.learn.bind(this);
  context.t = this.t.bind(this);
  context.demand = this.configuredDemand.bind(this, file, context);
  return context;
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
  name = this.resolveRequire(name);
  return require(name).call(this.createModuleContext(name), this.grunt);
};

/**
 * Lenient version of GruntHorde.prototype.require.
 *
 * @param {string} name
 * @return {object} `{}` if `name` does not exist
 * @api private
 */
GruntHorde.prototype.requireIfExists = function(name) {
  name = this.resolveRequire(name);
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
  name = this.resolveRequire(name);
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

function GruntHordeError(message) {
  this.name = 'GruntHordeError';
  this.message = message;
  this.stack = (new Error()).stack;
}
GruntHordeError.prototype = new Error();
GruntHordeError.prototype.constructor = GruntHordeError;
