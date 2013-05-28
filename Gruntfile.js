module.exports = function(grunt) {
  'use strict';

  var horde = require('./lib/grunt-horde').create();
  horde
    .follow(grunt)
    .seek('./config/grunt')
    .loot('./lib/base-config') // Just to dogfood
    .attack();
};
