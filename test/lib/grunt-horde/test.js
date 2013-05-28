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
    this.gruntStub = this.stub(grunt);
    this.horde = new gruntHorde.create();
    this.home = '/path/to/proj';
  });

  describe('#attack', function() {
    beforeEach(function() {
      this.horde
        .follow(grunt)
        .loot(fixtureDir + '/base-config')
        .loot(fixtureDir + '/local-config');
    });

    it('should detect missing grunt instance', function() {
      (function() {
        (new gruntHorde.create()).attack();
      }).should.Throw(Error, 'grunt() value is missing');
    });

    it('should init config', function() {
      var expected = {iAmA: 'fake init config'};
      this.horde.config.initConfig = expected;
      this.horde.attack();
      this.gruntStub.initConfig.should.have.been.calledWithExactly(expected);
    });

    it('should load tasks', function() {
      var expected = {t1: true, t2: false, t3: true, t4: false};
      this.horde.config.loadTasks = expected;
      this.horde.attack();
      this.gruntStub.loadTasks.should.have.been.calledTwice;
      this.gruntStub.loadTasks.should.have.been.calledWithExactly('t1');
      this.gruntStub.loadTasks.should.have.been.calledWithExactly('t3');
    });

    it('should load npm tasks', function() {
      var expected = {t1: true, t2: false, t3: true, t4: false};
      this.horde.config.loadNpmTasks = expected;
      this.horde.attack();
      this.gruntStub.loadNpmTasks.should.have.been.calledTwice;
      this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('t1');
      this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('t3');
    });

    it('should register tasks', function() {
      var expected = {t1: ['t1 arg1', 't1 arg2'], t2: ['t2 arg1', 't2 arg2']};
      this.horde.config.registerTask = expected;
      this.horde.attack();
      this.gruntStub.registerTask.should.have.been.calledTwice;
      this.gruntStub.registerTask.should.have.been.calledWithExactly('t1', 't1 arg1', 't1 arg2');
      this.gruntStub.registerTask.should.have.been.calledWithExactly('t2', 't2 arg1', 't2 arg2');
    });

    it('should register multi tasks', function() {
      var expected = {t1: ['t1 arg1', 't1 arg2'], t2: ['t2 arg1', 't2 arg2']};
      this.horde.config.registerMultiTask = expected;
      this.horde.attack();
      this.gruntStub.registerMultiTask.should.have.been.calledTwice;
      this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('t1', 't1 arg1', 't1 arg2');
      this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('t2', 't2 arg1', 't2 arg2');
    });
  });

  describe('#follow', function() {
    it('should store grunt instance', function() {
      should.equal(this.horde.grunt, null);
      this.horde.follow(grunt);
      this.horde.grunt.should.deep.equal(grunt);
    });
  });

  describe('#home', function() {
    it('should store custom cwd', function() {
      this.horde.cwd.should.equal(process.cwd());
      this.horde.home(this.home);
      this.horde.cwd.should.equal(this.home);
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
