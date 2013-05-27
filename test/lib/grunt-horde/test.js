/*jshint expr:true*/
var sinon = require('sinon');
var chai = require('chai');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var gruntHorde = require('../../..');

require('sinon-doublist')(sinon, 'mocha');

describe('GruntHorde', function() {
  'use strict';

  beforeEach(function() {
    this.gruntHorde = new gruntHorde.create();
  });

  describe('#method', function() {
    it.skip('should do something', function() {
    });
  });
});
