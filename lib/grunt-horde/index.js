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
var extend = requireComponent('extend');
var configurable = requireComponent('configurable.js');

/**
 * GruntHorde constructor.
 *
 * Usage:
 *
 *     var gruntHorde = GruntHorde.create();
 *     gruntHorde.set('...', ...);
 *
 * Configuration:
 *
 * - `{type} [...=default]` ...
 *
 * Properties:
 *
 * - `{type} ...` ...
 */
function GruntHorde() {
  this.settings = {
  };
}

configurable(GruntHorde.prototype);
