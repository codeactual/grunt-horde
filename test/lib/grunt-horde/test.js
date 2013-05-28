/*jshint expr:true*/
var sinon = require('sinon');
var chai = require('chai');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;
var grunt = require('grunt');

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var gruntHorde = require('../../..');
var fixtureDir = __dirname + '/../../fixture';

require('sinon-doublist')(sinon, 'mocha');

describe('GruntHorde', function() {
  'use strict';

  beforeEach(function() {
    this.horde = new gruntHorde.create();
    this.gruntStub = this.stub(grunt);
    this.horde
      .follow(grunt)
      .loot(fixtureDir + '/base-config')
      .loot(fixtureDir + '/local-config')
      .attack();
  });

  describe('#attack', function() {
    it.skip('should detect missing grunt instance', function() {
    });

    it.skip('should init config', function() {
    });

    it.skip('should load tasks', function() {
      // Use mix of tasks with 0/1 as values
    });

    it.skip('should load npm tasks', function() {
      // Use mix of tasks with 0/1 as values
    });

    it.skip('should register tasks', function() {
    });

    it.skip('should register multi tasks', function() {
    });
  });

  describe('#follow', function() {
    it.skip('should store grunt instance', function() {
    });
  });

  describe('#home', function() {
    it.skip('should store custom cwd', function() {
    });
  });

  describe('#loot', function() {
    it.skip('should merge in configs from dir', function() {
    });
  });

  describe('#resolveRequireName', function() {
    it.skip('should detect relative path', function() {
    });

    it.skip('should detect installed module name', function() {
    });

    it.skip('should detect absolute path', function() {
    });
  });

  describe('#require', function() {
    it.skip('should inject custom context', function() {
    });

    it.skip('should pass grunt as arg', function() {
    });
  });

  describe('#requireIfExists', function() {
    it.skip('should return loaded config if exists', function() {
    });

    it.skip('should return empty config if absent', function() {
    });
  });


  describe('#requireDir', function() {
    it.skip('should reduce all top-level JS files', function() {
    });

    it.skip('should merge collected configs', function() {
    });
  });

  describe('#requireDirIfExists', function() {
    it.skip('should return loaded config if exists', function() {
    });

    it.skip('should return empty config if absent', function() {
    });
  });

  describe('#createModuleContext', function() {
    it.skip('should include expected properties', function() {
    });
  });

  describe('#reduceDirToConfig', function() {
    it.skip('should collect top-level keys', function() {
    });

    it.skip('should collect file-categorized keys', function() {
    });
  });

  describe('#t', function() {
    it.skip('should alias grunt method', function() {
    });
  });

  describe('#integration', function() {
    it.skip('should load only base config fixture', function() {
      // verify grunt stub use, as in #attack tests
    });

    it.skip('should load merged config fixtures', function() {
      // verify grunt stub use, as in #attack tests
    });
  });
});
