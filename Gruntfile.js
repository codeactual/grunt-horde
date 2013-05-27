module.exports = function(grunt) {
  'use strict';

  var horde = require('./lib/grunt-horde').create();
  horde
    .follow(grunt)
    .seek('./config/grunt')
    .loot('./lib/base-config') // Use loot() just to dogfood
    .decree('projName', 'grunt-horde')
    .decree('instanceName', 'gruntHorde')
    .decree('klassName', 'GruntHorde')

    // TODO expose pairs as variables in addition to template replacement
    .decree('mochaShelljsOpt', {stdout: true, stderr: false})
    .attack();
};
