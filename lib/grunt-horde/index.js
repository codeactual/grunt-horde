/**
 * Packageable, composable grunt configuration modules
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

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
exports.create = function create(grunt) { return new GruntHorde(grunt); };

/**
 * Extend GruntHorde.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extend = function extend(ext) { return extend(GruntHorde.prototype, ext); };

const extend = require('extend');

const path = require('path');
const util = require('util');
const sprintf = util.format;
const shelljs = require('shelljs');
const pathval = require('pathval');

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
GruntHorde.prototype.attack = function attack() {
  const self = this;

  // Save demand() k/v pairs set in Gruntfile.js. Assume they should
  // override any values originating in a file.
  const gruntFileOverrides = extend(true, {}, this.grunt.config.getRaw());

  // Merge late for leniency: allow `demand()` calls to happen after `loot()`.
  this.lootBatch.forEach(function forEachLootBatch(fn) { fn.call(self); });

  // Apply demand() k/v pairs
  this.grunt.initConfig(extend(
    true,
    {},
    this.config.initConfig,
    this.grunt.config.getRaw(),
    gruntFileOverrides
  ));

  Object.keys(this.config.loadTasks).forEach(function forEachTask(name) {
    if (self.config.loadTasks[name]) {
      self.grunt.loadTasks(name);
    }
  });

  Object.keys(this.config.loadNpmTasks).forEach(function forEachNpmTask(name) {
    if (self.config.loadNpmTasks[name]) {
      self.grunt.loadNpmTasks(name);
    }
  });

  Object.keys(this.config.registerTask).forEach(function forEachRegisterTask(name) {
    self.grunt.registerTask.apply(
      self.grunt,
      [name].concat(self.config.registerTask[name])
    );
  });

  Object.keys(this.config.registerMultiTask).forEach(function forEachMultiTask(name) {
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
GruntHorde.prototype.home = function home(cwd) {
  this.cwd = cwd;
  return this;
};

/**
 * Remove a configuration property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.demand('initConfig.x', 20);
 *     horde.kill('initConfig.x');
 *     console.log(grunt.config.getRaw().x); // undefined
 *     console.log(horde.learn('initConfig.x')); // undefined
 *
 * Emits:
 *
 * - `grunt-horde:kill` on every invocation.
 *
 * @param {string} key <section>.<key>
 * - Ex. `initConfig.x.y.z`, `registerTask.default`, etc.
 * - Sections: initConfig, loadNpmTasks, loadTasks, registerTask, registerMultiTask
 * @return {object} this
 * @see [Events](modules.md#events)
 */
GruntHorde.prototype.kill = function kill(key) {
  const parts = key.split('.'); // Ex. ['initConfig', 'x', 'y', 'z']
  const section = parts.shift(); // Leading 'initConfig'
  return this.configuredKill('Gruntfile', this, section, parts.join('.'));
};

/**
 * Same as GruntHorde.prototype.kill w/ additional audit-related params.
 *
 * @param {string} source Ex. `Gruntfile`
 * @param {object} context Custom return value
 * - To support Gruntfile.prototype.createModuleContext
 * - To allow chaining (in modules) to use a limited/bound context properties
 * @param {string} section Ex. `initConfig`, `registerTask`, etc.
 * @param {string} key <section>.<key>
 * - Ex. `initConfig.x.y.z`, `registerTask.default`, etc.
 * - Sections: initConfig, loadNpmTasks, loadTasks, registerTask, registerMultiTask
 * @return {object} this
 * @api private
 */
GruntHorde.prototype.configuredKill = function configuredKill(source, context, section, key) {
  key = key.replace('initConfig.', '');

  if (source !== 'Gruntfile' && this.frozenConfig[key]) {
    this.grunt.event.emit('grunt-horde:kill', source, section, key, 'frozen');
    return context;
  }

  const parts = key.split('.');
  const initConfig = this.grunt.config.getRaw();
  let mode = '';

  if (parts.length === 1) {
    if (section === 'initConfig') {
      Object.keys(initConfig).forEach(function forEachInitKey(initKey) {
        delete initConfig[initKey];
      });
    }
    this.config[section] = {};
  } else {
    const targetKey = parts.slice(-1)[0];
    let targetObj;
    const targetObjPath = parts.slice(0, -1).join('.');
    if (section === 'initConfig') {
      targetObj = pathval.get(initConfig, targetObjPath);
      if (targetObj) { delete targetObj[targetKey]; }
    } else {
      targetObj = pathval.get(this.config[section], targetObjPath);
      if (targetObj) { delete targetObj[targetKey]; }
    }
  }

  if (source === 'Gruntfile') {
    this.frozenConfig[key] = true;
    mode = 'freezing';
  }

  this.grunt.event.emit('grunt-horde:kill', source, section, key, mode);
  return context;
};

/**
 * Get a configuration property. Supports `x.y.z` property paths.
 *
 * Usage:
 *
 *     horde.demand('initConfig.x.y.z', 20);
 *     horde.learn('initConfig.x.y.z'); // 20
 *
 * @param {string} key <section>.<key>
 * - Ex. `initConfig.x.y.z`, `registerTask.default`, etc.
 * - Sections: initConfig, loadNpmTasks, loadTasks, registerTask, registerMultiTask
 * @return {mixed}
 */
GruntHorde.prototype.learn = function learn(key) {
  const parts = key.split('.'); // Ex. ['initConfig', 'x', 'y', 'z']
  const section = parts[0]; // Ex. initConfig

  if (section === 'initConfig') {
    if (parts.length === 1) {
      return this.grunt.config.getRaw();
    } else {
      parts.shift(); // Remove leading 'initConfig'
      return pathval.get(this.grunt.config.getRaw(), parts.join('.'));
    }
  } else {
    return pathval.get(this.config, key);
  }
};

/**
 * Load a config module. Merge in its payload.
 *
 * - Merge operation is deferred until GruntHorde.prototype.attack.
 * - Payloads are merged recursively, last wins.
 * - Loads `tasks/`, if present, with `grunt.loadTasks`.
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
 *   eslint.js
 *   uglify.js
 *   shell.js
 * tasks/
 *   precommit.js
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
GruntHorde.prototype.loot = function loot(name) {
  this.lootBatch.push(function lootBatchStep() {
    const resolved = this.resolveRequire(name);
    if (!shelljs.test('-d', resolved)) {
      throw new GruntHordeError(
        sprintf("loot: no such module '%s' (resolved to '%s')", name, resolved)
      );
    }

    this.config = extend(true, this.config, this.dirToConfigObj(name));

    const tasksDir = resolved + path.sep + 'tasks';
    if (shelljs.test('-d', tasksDir)) {
      this.config.loadTasks[tasksDir] = true;
    }
  });
  return this;
};

/**
 * Set a configuration property. Supports `x.y.z` property paths.
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
 * @param {string} key <section>.<key>
 * - Ex. `initConfig.x.y.z`, `registerTask.default`, etc.
 * - Sections: initConfig, loadNpmTasks, loadTasks, registerTask, registerMultiTask
 * @param {mixed} val
 * @return {object} this
 * @see [Events](modules.md#events)
 */
GruntHorde.prototype.demand = function demand(key, val) {
  const parts = key.split('.'); // Ex. ['initConfig', 'x', 'y', 'z']
  const section = parts.shift(); // Leading 'initConfig'
  return this.configuredDemand('Gruntfile', this, section, parts.join('.'), val);
};

/**
 * Same as GruntHorde.prototype.demand w/ additional audit-related params.
 *
 * @param {string} source Ex. `Gruntfile`
 * @param {object} context Custom return value
 * - To support Gruntfile.prototype.createModuleContext
 * - To allow chaining (in modules) to use a limited/bound context properties
 * @param {string} section Ex. `initConfig`, `registerTask`, etc.
 * @param {string} key Ex. `x.y.z`
 * @param {mixed} val
 * @param {boolean} frozen If true, only the `Gruntfile` source can later modify `key`
 * @return {object} this
 * @api private
 */
GruntHorde.prototype.configuredDemand = function configuredDemand(source, context, section, key, val) {
  context = context || this;
  key = key.replace('initConfig.', '');

  if (source !== 'Gruntfile' && this.frozenConfig[key]) {
    this.grunt.event.emit('grunt-horde:demand', source, section, key, val, 'frozen');
    return context;
  }

  let mode = '';

  if (section === 'initConfig') {
    pathval.set(this.grunt.config.getRaw(), key, val);
  } else {
    if (this.config[section]) {
      pathval.set(this.config[section], key, val);
    } else {
      throw new Error(sprintf(
        'demand() key namespace "%s" does not exist, valid namespaces: %s',
        section, Object.keys(this.config).join(', ')
      ));
    }
  }

  if (source === 'Gruntfile') {
    this.frozenConfig[key] = true;
    mode = 'freezing';
  }

  this.grunt.event.emit('grunt-horde:demand', source, section, key, val, mode);
  return context;
};

/**
 * Define `this` for modules loaded w/ GruntHorde.prototype.require.
 *
 * @param {string} file Resolved module path
 * @return {object}
 * @api private
 */
GruntHorde.prototype.createModuleContext = function createModuleContext(file) {
  const section = /initConfig/.test(file) ? 'initConfig' : path.basename(file, '.js');
  const context = {};
  context.learn = this.learnInModule.bind(this);
  context.t = this.t.bind(this);
  context.demand = this.configuredDemand.bind(this, file, context, section);
  context.kill = this.configuredKill.bind(this, file, context, section);
  context.assimilate = extend;
  context.age = require('semver');
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
GruntHorde.prototype.dirToConfigObj = function dirToConfigObj(name) {
  const self = this;
  const obj = {
    initConfig: this.requireDirIfExists(name + path.sep + 'initConfig')
  };
  const files = ['loadTasks', 'loadNpmTasks', 'registerTask', 'registerMultiTask'];
  files.forEach(function forEachFile(file) {
    obj[file] = self.requireIfExists(name + path.sep + file + '.js');
  });
  return obj;
};

/**
 * `learn` wrapper that also exposes k/v pairs already collected in prior `loot`.
 *
 * Ex. let a module to manually `concat` values into preexisting array.
 *
 * @param {string} key <section>.<key>
 * - Ex. `initConfig.x.y.z`, `registerTask.default`, etc.
 * - Sections: initConfig, loadNpmTasks, loadTasks, registerTask, registerMultiTask
 * @return {mixed}
 * @api private
 */
GruntHorde.prototype.learnInModule = function learnInModule(key) {
  let value = this.learn(key);
  if (typeof value === 'undefined') {
    value = pathval.get(this.config, key);
  }
  return value;
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
GruntHorde.prototype.require = function internalRequire(name) {
  name = this.resolveRequire(name);
  return require(name).call(this.createModuleContext(name), this.grunt) || {};
};

/**
 * Lenient version of GruntHorde.prototype.require.
 *
 * @param {string} name
 * @return {object} `{}` if `name` does not exist
 * @api private
 */
GruntHorde.prototype.requireIfExists = function requireIfExists(name) {
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
 * - Indexed by base file name, ex. 'eslint'
 * @api private
 */
GruntHorde.prototype.requireDir = function requireDir(name) {
  const config = shelljs.ls(this.resolveRequire(name) + path.sep + '*.js').reduce(
    GruntHorde.reduceDirToConfig.bind(this), {index: {}, categorized: {}}
  );
  return extend(true, config.index, config.categorized);
};

/**
 * Lenient version of GruntHorde.prototype.requireDir.
 *
 * @param {string} name
 * @return {object} `{}` if `name` does not exist
 * @api private
 */
GruntHorde.prototype.requireDirIfExists = function requireDirIfExists(name) {
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
GruntHorde.prototype.resolveRequire = function resolveRequire(name) {
  const isWindows = /^win/i.test(require('os').type());
  const normalized = path.normalize(name);

  const re = {relative: /^\./};
  if (isWindows) {
    re.absolute = /^[a-zA-Z]:\\/; // Ex. Begins with `C:\`
  } else {
    re.absolute = /^\//; // Begins with `/`
  }

  if (re.relative.test(name)) {
    // Ex. cwd = /proj, name = ./mod, return = /proj/mod
    return this.cwd + path.sep + normalized;
  } else if (re.absolute.test(normalized)) {
    // Ex. cwd = /proj, name = /path/to/mod, return = /path/to/mod
    return normalized;
  }

  // Ex. cwd = /proj, name = mod, return = /proj/node_modules/mod
  return this.cwd + path.sep + 'node_modules' + path.sep + name;
};

/**
 * Alias for `grunt.template.process()`.
 *
 * @see process http://gruntjs.com/api/grunt.template#grunt.template.process
 * @api private
 */
GruntHorde.prototype.t = function t() {
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
GruntHorde.reduceDirToConfig = function reduceDirToConfig(memo, file) {
  if (path.basename(file) === 'index.js') {
    memo.index = this.require(file);
  } else {
    const config = {};
    config[path.basename(file, '.js')] = this.require(file);
    memo.categorized = extend(true, memo.categorized, config);
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
