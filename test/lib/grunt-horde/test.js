/*jshint expr:true*/
var sinon = require('sinon');
var chai = require('chai');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;
var grunt = require('grunt');
var shelljs = require('shelljs');

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var gruntHorde = require('../../..');
var GruntHorde = gruntHorde.GruntHorde;
var fixtureDir = __dirname + '/../../fixture';

require('sinon-doublist')(sinon, 'mocha');
require('sinon-doublist-fs')('mocha');

describe('GruntHorde', function() {
  'use strict';

  beforeEach(function() {
    this.horde = new gruntHorde.create();

    this.config = {iAmA: 'fake config obj'};
    this.cwd = process.cwd();
    this.home = '/path/to/proj';
    this.modPath = '/path/to/nowhere';
    this.gruntStub = this.stub(grunt);

    this.horde.follow(grunt);
  });

  describe('#attack', function() {
    beforeEach(function() {
      this.horde
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
      var horde = new gruntHorde.create();
      should.equal(horde.grunt, null);
      horde.follow(grunt);
      horde.grunt.should.deep.equal(grunt);
    });
  });

  describe('#home', function() {
    it('should store custom cwd', function() {
      this.horde.cwd.should.equal(this.cwd);
      this.horde.home(this.home);
      this.horde.cwd.should.equal(this.home);
    });
  });

  describe('#loot', function() {
    it('should merge in configs from dir', function() {
      var name = './rel/path/to/config/dir';
      var configObj = {a: 'one', b: 2, c: ['x', 'y']};

      this.stub = this.stub(this.horde, 'dirToConfigObj');
      this.stub.withArgs(name).returns(configObj);

      this.horde.config = {a: 1, b: 'two', c: ['z']};
      this.horde.loot(name);
      this.horde.config.should.deep.equal({a: 'one', b: 2, c: ['x', 'y']});
    });
  });

  describe('#resolveRequire', function() {
    it('should detect relative path', function() {
      this.horde.resolveRequire('./config/grunt').should.equal(this.cwd + '/config/grunt');
    });

    it('should detect installed module name', function() {
      this.horde.resolveRequire('mod').should.equal(this.cwd + '/node_modules/mod');
    });

    it('should detect absolute path', function() {
      this.horde.resolveRequire('/path/to/mod').should.equal('/path/to/mod');
    });
  });

  describe('#require', function() {
    beforeEach(function() {
      this.name = fixtureDir + '/debug-module/debug';
      this.output = this.horde.require(this.name).debug;
    });

    it('should inject custom context', function() {
      this.output.context.should.deep.equal(Object.keys(this.horde.createModuleContext()));
    });

    it('should pass grunt as arg', function() {
      this.output.grunt.should.deep.equal(this.horde.grunt);
    });
  });

  describe('#requireIfExists', function() {
    it('should return loaded config if exists', function() {
      this.stubFile(this.modPath).make();
      var stub = this.stub(this.horde, 'require');
      stub.withArgs(this.modPath).returns(this.config);
      this.horde.requireIfExists(this.modPath).should.deep.equal(this.config);
    });

    it('should return empty config if absent', function() {
      this.horde.requireIfExists(this.modPath).should.deep.equal({});
    });
  });


  describe('#requireDir', function() {
    beforeEach(function() {
      // Fake dir scan
      this.files = ['index.js', 'jshint.js'];
      this.lsStub = this.stub(shelljs, 'ls');
      this.lsStub.withArgs(this.modPath + '/*.js').returns(this.files);

      // Fake dir-to-config-obj conversion
      this.reduceOut = {
        index: {iKey1: 1, iKey2: 2},
        categorized: {jshint: {jKey1: 3, jKey2: 4}}
      };
      this.merged = {iKey1: 1, iKey2: 2, jshint: {jKey1: 3, jKey2: 4}};
      this.reduceFn = {iAmA: 'fake fn'};
      this.reduceDirBindStub = this.stub(GruntHorde.reduceDirToConfig, 'bind');
      this.reduceDirBindStub.withArgs(this.horde).returns(this.reduceFn);
      this.reduceStub = this.stub(Array.prototype, 'reduce');
      this.reduceStub.withArgs(this.reduceFn, sinon.match.object).returns(this.reduceOut);

      // Use above stubs to verify expected steps
      this.output = this.horde.requireDir(this.modPath);
    });

    it('should merge collected configs', function() {
      this.output.should.deep.equal(this.merged);
    });
  });

  describe('#requireDirIfExists', function() {
    it('should return loaded config if exists', function() {
      this.stubFile(this.modPath).readdir(['child']).make();
      var stub = this.stub(this.horde, 'requireDir');
      stub.withArgs(this.modPath).returns(this.config);
      this.horde.requireDirIfExists(this.modPath).should.deep.equal(this.config);
    });

    it('should return empty config if absent', function() {
      this.horde.requireIfExists(this.modPath).should.deep.equal({});
    });
  });

  describe('#createModuleContext', function() {
    it('should include expected properties', function() {
      var con = this.horde.createModuleContext();
      con.config.should.deep.equal(this.horde.grunt.config.getRaw());

      con.path.should.deep.equal(require('path'));
      con.shelljs.should.deep.equal(require('shelljs'));

      var processSpy = this.spy(this.horde.grunt.template, 'process');
      con.t('txt', {a: 1});
      processSpy.should.have.been.calledWithExactly('txt', {a: 1});
    });
  });

  describe('#reduceDirToConfig', function() {
    beforeEach(function() {
      this.memo = {index: {}, categorized: {}};
      this.indexMod = {a: 1, b: 2};
      this.nonIndexMod1 = {c: 3};
      this.nonIndexMod2 = {d: 4};
      var stub = this.stub(this.horde, 'require');
      stub.withArgs('index.js').returns(this.indexMod);
      stub.withArgs('non-index1.js').returns(this.nonIndexMod1);
      stub.withArgs('non-index2.js').returns(this.nonIndexMod2);
    });

    it('should collect top-level keys', function() {
      var out = GruntHorde.reduceDirToConfig.call(this.horde, this.memo, 'index.js');
      out.should.deep.equal({index: this.indexMod, categorized:{}});
    });

    it('should collect file-categorized keys', function() {
      var out = GruntHorde.reduceDirToConfig.call(this.horde, this.memo, 'non-index1.js');
      out.should.deep.equal({index: {}, categorized: this.nonIndexMod1});
      out = GruntHorde.reduceDirToConfig.call(this.horde, out, 'non-index2.js');
      out.should.deep.equal({index: {}, categorized: {c: 3, d: 4}});
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
