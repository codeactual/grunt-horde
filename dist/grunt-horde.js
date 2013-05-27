;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-configurable.js/index.js", Function("exports, require, module",
"\n/**\n * Make `obj` configurable.\n *\n * @param {Object} obj\n * @return {Object} the `obj`\n * @api public\n */\n\nmodule.exports = function(obj){\n\n  /**\n   * Mixin settings.\n   */\n\n  obj.settings = {};\n\n  /**\n   * Set config `name` to `val`, or\n   * multiple with an object.\n   *\n   * @param {String|Object} name\n   * @param {Mixed} val\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.set = function(name, val){\n    if (1 == arguments.length) {\n      for (var key in name) {\n        this.set(key, name[key]);\n      }\n    } else {\n      this.settings[name] = val;\n    }\n\n    return this;\n  };\n\n  /**\n   * Get setting `name`.\n   *\n   * @param {String} name\n   * @return {Mixed}\n   * @api public\n   */\n\n  obj.get = function(name){\n    return this.settings[name];\n  };\n\n  /**\n   * Enable `name`.\n   *\n   * @param {String} name\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.enable = function(name){\n    return this.set(name, true);\n  };\n\n  /**\n   * Disable `name`.\n   *\n   * @param {String} name\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.disable = function(name){\n    return this.set(name, false);\n  };\n\n  /**\n   * Check if `name` is enabled.\n   *\n   * @param {String} name\n   * @return {Boolean}\n   * @api public\n   */\n\n  obj.enabled = function(name){\n    return !! this.get(name);\n  };\n\n  /**\n   * Check if `name` is disabled.\n   *\n   * @param {String} name\n   * @return {Boolean}\n   * @api public\n   */\n\n  obj.disabled = function(name){\n    return ! this.get(name);\n  };\n\n  return obj;\n};//@ sourceURL=visionmedia-configurable.js/index.js"
));
require.register("codeactual-extend/index.js", Function("exports, require, module",
"\nmodule.exports = function extend (object) {\n    // Takes an unlimited number of extenders.\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    // For each extender, copy their properties on our object.\n    for (var i = 0, source; source = args[i]; i++) {\n        if (!source) continue;\n        for (var property in source) {\n            object[property] = source[property];\n        }\n    }\n\n    return object;\n};//@ sourceURL=codeactual-extend/index.js"
));
require.register("grunt-horde/lib/component/main.js", Function("exports, require, module",
"module.exports = {requireComponent: require};\n//@ sourceURL=grunt-horde/lib/component/main.js"
));
require.alias("visionmedia-configurable.js/index.js", "grunt-horde/deps/configurable.js/index.js");
require.alias("visionmedia-configurable.js/index.js", "configurable.js/index.js");

require.alias("codeactual-extend/index.js", "grunt-horde/deps/extend/index.js");
require.alias("codeactual-extend/index.js", "extend/index.js");

require.alias("grunt-horde/lib/component/main.js", "grunt-horde/index.js");

if (typeof exports == "object") {
  module.exports = require("grunt-horde");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("grunt-horde"); });
} else {
  this["gruntHorde"] = require("grunt-horde");
}})();