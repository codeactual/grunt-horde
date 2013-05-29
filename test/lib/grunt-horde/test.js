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

var requireComponent = require('../../../lib/component/require');
var teaProp = requireComponent('tea-properties');

require('sinon-doublist')(sinon, 'mocha');
require('sinon-doublist-fs')('mocha');

describe('GruntHorde', function() {
  'use strict';

  beforeEach(function() {
    this.horde = gruntHorde.create();

    this.key = 'x.y.z';
    this.val = 20;
    this.config = {iAmA: 'fake config obj'};
    this.cwd = process.cwd();
    this.home = '/path/to/proj';
    this.modPath = '/path/to/nowhere';
    this.gruntStub = this.stub(grunt);
  });

  describe('#attack', function() {
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
      this.output.grunt.should.deep.equal(grunt);
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
      var context = this.horde.createModuleContext();
      var config = grunt.config.getRaw();

      var setSpy = this.spy(teaProp, 'set');
      context.set(this.key, this.val);
      setSpy.should.have.been.calledWithExactly(config, this.key, this.val);

      var getSpy = this.spy(teaProp, 'get');
      context.get(this.key).should.equal(this.val);
      getSpy.should.have.been.calledWithExactly(config, this.key);

      var processSpy = this.spy(grunt.template, 'process');
      context.t('txt', {a: 1});
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
      out.should.deep.equal({index: {}, categorized: {'non-index1': this.nonIndexMod1}});
      out = GruntHorde.reduceDirToConfig.call(this.horde, out, 'non-index2.js');
      out.should.deep.equal({
        index: {},
        categorized: {'non-index1': {c: 3}, 'non-index2': {d: 4}}
      });
    });
  });

  describe('#setConfig', function() {
    it('should update config', function() {
      this.horde.setConfig(this.key, this.val);
      var config = grunt.config.getRaw();
      config.x.y.z.should.equal(this.val);
      this.horde.getConfig(this.key).should.equal(this.val);
    });

    it('should emit event', function(testDone) {
      var self = this;
      grunt.event.on('grunt-horde:set-config', function(key, val) {
        key.should.equal(self.key);
        val.should.equal(self.val);
        testDone();
      });
      this.horde.setConfig(this.key, this.val);
    });
  });

  describe('#integration', function() {
    describe('base config fixture', function() {
      beforeEach(function() {
        this.horde
          .loot(fixtureDir + '/base-config')
          .attack();
      });

      it('should init config', function() {
        this.gruntStub.initConfig.should.have.been.calledWithExactly({
          i1: {i1k1: 'i1v1'},
          i2: {i2k1: 'i2v1'},
          plugin1: {
            p1k1: {a: 1, b: 2},
            p1k2: {c: 3, d: 4}
          },
          plugin2: {
            p2k1: {a: 1, b: 2},
            p2k2: {c: 3, d: 4}
          }
        });
      });

      it('should load tasks', function() {
        this.gruntStub.loadTasks.should.have.been.calledTwice;
        this.gruntStub.loadTasks.should.have.been.calledWithExactly('path/to/tasks1');
        this.gruntStub.loadTasks.should.have.been.calledWithExactly('path/to/tasks2');
      });

      it('should load npm tasks', function() {
        this.gruntStub.loadNpmTasks.should.have.been.calledTwice;
        this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('npm-task-1');
        this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('npm-task-2');
      });

      it('should register tasks', function() {
        this.gruntStub.registerTask.should.have.been.calledTwice;
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task1', ['task1step1', 'task1step2']);
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task2', ['task2step1', 'task2step2']);
      });

      it('should register multi tasks', function() {
        this.gruntStub.registerMultiTask.should.have.been.calledTwice;
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi1', 'multi1 desc', sinon.match.func);
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi2', 'multi2 desc', sinon.match.func);
      });
    });

    describe('merged config fixtures', function() {
      beforeEach(function() {
        this.horde
          .loot(fixtureDir + '/base-config')
          .loot(fixtureDir + '/local-config')
          .attack();
      });

      it('should init config', function() {
        this.gruntStub.initConfig.should.have.been.calledWithExactly({
          i1: {i1k1: 'i1v1 - overwritten'},
          i2: {i2k1: 'i2v1'},
          i3: {i3k1: 'i3v1'},
          i4: {i4k1: 'i4v1'},
          plugin1: {
            p1k1: {a: 1, b: 'overwritten'},
            p1k2: {c: 3, d: 4},
            p1k3: {e: 5, f: 6},
            p1k4: {g: 7, h: 8}
          },
          plugin2: {
            p2k1: {a: 1, b: 2},
            p2k2: {c: 3, d: 'overwritten'},
            p2k3: {e: 5, f: 6},
            p2k4: {g: 7, h: 8}
          }
        });
      });

      it('should load tasks', function() {
        this.gruntStub.loadTasks.should.have.been.calledThrice;
        this.gruntStub.loadTasks.should.have.been.calledWithExactly('path/to/tasks2');
        this.gruntStub.loadTasks.should.have.been.calledWithExactly('path/to/tasks3');
        this.gruntStub.loadTasks.should.have.been.calledWithExactly('path/to/tasks4');
      });

      it('should load npm tasks', function() {
        this.gruntStub.loadNpmTasks.should.have.been.calledThrice;
        this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('npm-task-1');
        this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('npm-task-3');
        this.gruntStub.loadNpmTasks.should.have.been.calledWithExactly('npm-task-4');
      });

      it('should register tasks', function() {
        this.gruntStub.registerTask.callCount.should.equal(4);
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task1', ['task1step1 - overwritten', 'task1step2']);
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task2', ['task2step1', 'task2step2']);
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task3', ['task3step1', 'task3step2']);
        this.gruntStub.registerTask.should.have.been.calledWithExactly('task4', ['task4step1', 'task4step2']);
      });

      it('should register multi tasks', function() {
        this.gruntStub.registerMultiTask.callCount.should.equal(4);
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi1', 'multi1 desc', sinon.match.func);
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi2', 'multi2 desc - overwritten', sinon.match.func);
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi3', 'multi3 desc', sinon.match.func);
        this.gruntStub.registerMultiTask.should.have.been.calledWithExactly('multi4', 'multi4 desc', sinon.match.func);
      });
    });
  });
});
