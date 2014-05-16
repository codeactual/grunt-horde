/*jshint expr:true*/
var sinon = require('sinon');
var chai = require('chai');
var fs = require('fs');
var path = require('path');
var util = require('util');
var sprintf = util.format;
var grunt = require('grunt');
var shelljs = require('shelljs');

var should = chai.should();
chai.config.includeStack = true;
chai.use(require('sinon-chai'));

var gruntHorde = require('../../..');
var GruntHorde = gruntHorde.GruntHorde;
var fixtureDir = __dirname + '/../../fixture';

var requireComponent = require('../../../lib/component/require');
var mergeDeep = requireComponent('assimilate').withStrategy('deep');
var teaProp = requireComponent('tea-properties');

require('sinon-doublist')(sinon, 'mocha');
require('sinon-doublist-fs')('mocha');

describe('GruntHorde', function() {
  'use strict';

  beforeEach(function() {
    // Clean up prior test's modifications to static config object.
    var gruntRawConfig = grunt.config.getRaw();
    Object.keys(gruntRawConfig).forEach(function(key) {
      delete gruntRawConfig[key];
    });

    this.horde = gruntHorde.create(grunt);

    this.origPathSep = path.sep;
    this.nonInitSection = 'registerTask';
    this.sectionKey = 'x.y.z';
    this.nonInitKey = this.nonInitSection + '.' + this.sectionKey;
    this.initKey = 'initConfig.' + this.sectionKey;
    this.val = 20;
    this.val2 = 21;
    this.initKeyValObj = {};
    teaProp.set(this.initKeyValObj, this.sectionKey, this.val);
    this.config = {iAmA: 'fake config obj'};
    this.cwd = process.cwd();
    this.home = '/path/to/proj';
    this.modDirPath = '/path/to/nowhere';
    this.modInitFile = '/path/to/nowhere/initConfig/jshint.js';
    this.modNonInitFile = '/path/to/nowhere/' + this.nonInitSection + '.js';
    this.gruntStub = this.stub(grunt);
  });

  afterEach(function() {
    path.sep = this.origPathSep;
    grunt.event.removeAllListeners('grunt-horde:demand');
    grunt.event.removeAllListeners('grunt-horde:kill');
  });

  describe('#attack', function() {
    it('should init config', function() {
      var expected = {iAmA: 'fake init config'};
      this.horde.demand(this.initKey, this.val);
      this.horde.config.initConfig = expected;
      this.horde.attack();
      this.gruntStub.initConfig.should.have.been.calledWithExactly(
        mergeDeep({}, expected, this.initKeyValObj)
      );
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
    beforeEach(function() {
      this.dir = './rel/path/to/config/dir';
      this.dirToConfigObjStub = this.stub(this.horde, 'dirToConfigObj');
      this.stubTree(this.horde.resolveRequire(this.dir) + '/');
    });

    it('should merge in configs from dir', function() {
      this.dirToConfigObjStub
        .withArgs(this.dir)
        .returns({initConfig: {a: 'one', b: 2, c: ['x', 'y']}});
      this.horde.config.initConfig = {a: 1, b: 'two', c: ['z'], d: 4};
      this.horde.loot(this.dir);
      this.horde.attack();
      this.horde.config.initConfig.should.deep.equal({a: 'one', b: 2, c: ['x', 'y'], d: 4});
    });

    it('should load tasks dir if present', function() {
      var taskFile = this.horde.resolveRequire(this.dir + '/tasks/tasks-1.js');
      var expected = {};
      expected[path.dirname(taskFile)] = true;
      this.stubTree(taskFile);
      this.horde.loot(this.dir);
      this.horde.attack();
      this.horde.config.loadTasks.should.deep.equal(expected);
    });
  });

  describe('#resolveRequire', function() {
    describe('linux support', function() {
      beforeEach(function() {
        var os = require('os');
        this.stub(os, 'type').returns('Linux');
        path.sep = '/';
      });

      it('should detect relative path', function() {
        this.horde.resolveRequire('./config/grunt').should.equal(this.cwd + '/config/grunt');
      });

      it('should detect installed module name', function() {
        this.horde.resolveRequire('mod').should.equal(this.cwd + '/node_modules/mod');
      });

      it('should detect absolute nix path', function() {
        this.horde.resolveRequire('/path/to/mod').should.equal('/path/to/mod');
      });
    });

    describe('windows support', function() {
      beforeEach(function() {
        var os = require('os');
        this.stub(os, 'type').returns('Windows');
        path.sep = '\\';

        this.cwd = 'C:\\path\\to\\mod';
        this.horde.home(this.cwd);

        // path.js assigns private `isWindows`, so we can't magically use the
        // Windows version of `normalize`. Here we'll just cover the minimum
        // behaviors for these cases. See 0.11.13:
        // https://github.com/joyent/node/blob/99c9930ad626e2796af23def7cac19b65c608d18/lib/path.js#L23
        this.stub(path, 'normalize', function(p) {
          // Strip leading:
          // - ./
          // - .\
          // - ../
          // - ..\
          p = p.replace(/^\.{1,2}[\/\\]/, '');

          // Convert slashes to NT-style to mimic Windows API
          // http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx
          p = p.replace(/\//g, '\\');
          return p;
        });
      });

      it('should detect relative path with backward slashes', function() {
        this.horde.resolveRequire('.\\config\\grunt').should.equal(this.cwd + '\\config\\grunt');
      });

      //
      it('should detect relative path with forward slashes', function() {
        this.horde.resolveRequire('./config/grunt').should.equal(this.cwd + '\\config\\grunt');
      });

      it('should detect installed module name', function() {
        this.horde.resolveRequire('mod').should.equal(this.cwd + '\\node_modules\\mod');
      });

      it('should detect absolute win path', function() {
        this.horde.resolveRequire('C:\\path\\to\\mod').should.equal('C:\\path\\to\\mod');
      });
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

    it('should inject usable assimilate ref in context', function() {
      var mergeDeep = this.horde.createModuleContext().assimilate.withStrategy('deep');
      mergeDeep({a: {b: {c: {d: 1}}}}, {a: {b: {c: {e: 2}}}}).should.deep.equal({a: {b: {c: {d: 1, e: 2}}}});
    });

    it('should inject usable semver ref in context', function() {
      var ctx = this.horde.createModuleContext();
      var version = '0.10.28';
      ctx.age.satisfies(version, '>=0.6').should.be.ok;
      ctx.age.satisfies(version, '>=0.100').should.not.be.ok;
    });

    it('should pass grunt as arg', function() {
      this.output.grunt.should.deep.equal(grunt);
    });

    it('should convert missing return value to empty object', function() {
      this.horde.require(fixtureDir + '/debug-module/no-return.js').should.deep.equal({});
    });
  });

  describe('#requireIfExists', function() {
    it('should test resolved path', function() {
      var stub = this.stub(shelljs, 'test');
      stub.returns(false);
      this.horde.requireIfExists('./rel/path/file.js');
      stub.should.have.been.calledWithExactly('-e', this.cwd + '/rel/path/file.js');
    });

    it('should return loaded config if exists', function() {
      this.stubFile(this.modDirPath).make();
      var stub = this.stub(this.horde, 'require');
      stub.withArgs(this.modDirPath).returns(this.config);
      this.horde.requireIfExists(this.modDirPath).should.deep.equal(this.config);
    });

    it('should return empty config if absent', function() {
      this.horde.requireIfExists(this.modDirPath).should.deep.equal({});
    });
  });

  describe('#requireDir', function() {
    beforeEach(function() {
      // Fake dir scan
      this.files = ['index.js', 'jshint.js'];
      this.lsStub = this.stub(shelljs, 'ls');
      this.lsStub.withArgs(this.modDirPath + '/*.js').returns(this.files);

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
      this.output = this.horde.requireDir(this.modDirPath);
    });

    it('should merge collected configs', function() {
      this.output.should.deep.equal(this.merged);
    });
  });

  describe('#requireDirIfExists', function() {
    it('should test resolved path', function() {
      var stub = this.stub(shelljs, 'test');
      stub.returns(false);
      this.horde.requireDirIfExists('./rel/path');
      stub.should.have.been.calledWithExactly('-d', this.cwd + '/rel/path');
    });

    it('should return loaded config if exists', function() {
      this.stubFile(this.modDirPath).readdir(['child']).make();
      var stub = this.stub(this.horde, 'requireDir');
      stub.withArgs(this.modDirPath).returns(this.config);
      this.horde.requireDirIfExists(this.modDirPath).should.deep.equal(this.config);
    });

    it('should return empty config if absent', function() {
      this.horde.requireIfExists(this.modDirPath).should.deep.equal({});
    });
  });

  describe('#createModuleContext', function() {
    it('should include expected properties', function() {
      var context = this.horde.createModuleContext(this.modInitFile);
      var config = grunt.config.getRaw();

      var setSpy = this.spy(teaProp, 'set');
      context.demand(this.initKey, this.val);
      setSpy.should.have.been.calledWithExactly(config, this.sectionKey, this.val);

      var getSpy = this.spy(teaProp, 'get');
      context.learn(this.initKey).should.equal(this.val);
      getSpy.should.have.been.calledWithExactly(config, this.sectionKey);

      var processSpy = this.spy(grunt.template, 'process');
      context.t('txt', {a: 1});
      processSpy.should.have.been.calledWithExactly('txt', {a: 1});

      context.kill(this.initKey);
      should.not.exist(context.learn(this.initKey));
    });

    it('should include #demand bound to source', function(testDone) {
      var self = this;
      var context = this.horde.createModuleContext(this.modInitFile);
      grunt.event.once('grunt-horde:demand', function(source, section, key, val) {
        source.should.equal(self.modInitFile);
        section.should.equal('initConfig');
        key.should.equal(self.sectionKey);
        val.should.equal(self.val);
        testDone();
      });
      context.demand(this.initKey, this.val);
    });

    it('should include #kill bound to source', function(testDone) {
      var self = this;
      var context = this.horde.createModuleContext(this.modInitFile);
      grunt.event.once('grunt-horde:kill', function(source, section, key) {
        source.should.equal(self.modInitFile);
        section.should.equal('initConfig');
        key.should.equal(self.sectionKey);
        testDone();
      });
      context.kill(this.initKey);
    });

    it('should emit non-initConfig section', function(testDone) {
      var self = this;
      var context = this.horde.createModuleContext(this.modNonInitFile);
      grunt.event.once('grunt-horde:kill', function(source, section) {
        section.should.equal(self.nonInitSection);
        testDone();
      });
      context.kill(this.initKey);
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

  describe('#kill', function() {
    it('should delete a top-level initConfig', function() {
      this.horde.demand(this.initKey, this.val);
      this.horde.kill('initConfig');
      this.horde.learn('initConfig').should.deep.equal({});
      this.horde.config.initConfig.should.deep.equal({});
      should.not.exist(this.horde.learn(this.initKey));
    });

    it('should delete a sub-level initConfig', function() {
      this.horde.demand(this.initKey, this.val);
      this.horde.kill(this.initKey);
      should.exist(this.horde.learn('initConfig'));
      should.not.exist(this.horde.learn(this.initKey));
    });

    it('should delete a top-level non-initConfig', function() {
      this.horde.demand(this.nonInitKey, this.val);
      this.horde.kill(this.nonInitSection);
      this.horde.learn(this.nonInitSection).should.deep.equal({});
      should.not.exist(this.horde.learn(this.nonInitKey));
    });

    it('should delete a sub-level non-initConfig', function() {
      this.horde.demand(this.nonInitKey, this.val);
      this.horde.kill(this.nonInitKey);
      should.exist(this.horde.learn(this.nonInitSection));
      should.not.exist(this.horde.learn(this.nonInitKey));
    });

    it('should emit event', function(testDone) {
      var self = this;
      grunt.event.once('grunt-horde:kill', function(source, section, key) {
        source.should.equal('Gruntfile');
        section.should.equal('initConfig');
        key.should.equal(self.sectionKey);
        testDone();
      });
      this.horde.kill(this.initKey);
    });

    it('should emit mode when value set by module', function(testDone) {
      grunt.event.once('grunt-horde:kill', function(source, section, key, mode) {
        mode.should.equal('');
        testDone();
      });
      this.horde.configuredKill(this.modDirPath, this.horde, 'initConfig', this.sectionKey);
    });

    it('should emit mode when value set by Gruntfile', function(testDone) {
      grunt.event.once('grunt-horde:kill', function(source, section, key, mode) {
        mode.should.equal('freezing');
        testDone();
      });
      this.horde.kill(this.initKey);
    });

    it('should emit mode when value already frozen', function(testDone) {
      this.horde.kill(this.initKey, this.val);
      grunt.event.once('grunt-horde:kill', function(source, section, key, mode) {
        mode.should.equal('frozen');
        testDone();
      });
      this.horde.configuredKill(this.modDirPath, this.horde, 'initConfig', this.sectionKey);
    });
  });

  describe('#demand', function() {
    it('should update initConfig', function() {
      this.horde.demand(this.initKey, this.val);
      var config = grunt.config.getRaw();
      config.x.y.z.should.equal(this.val);
      this.horde.learn(this.initKey).should.equal(this.val);
    });

    it('should update non-initConfig', function() {
      this.horde.demand(this.nonInitKey, this.val);
      this.horde.learn(this.nonInitKey).should.equal(this.val);
    });

    it('should emit event', function(testDone) {
      var self = this;
      grunt.event.once('grunt-horde:demand', function(source, section, key, val, mode) {
        source.should.equal('Gruntfile');
        section.should.equal('initConfig');
        key.should.equal(self.sectionKey);
        val.should.equal(self.val);
        mode.should.equal('freezing');
        testDone();
      });
      this.horde.demand(this.initKey, this.val);
    });

    it('should detect invalid key namespace', function(testDone) {
      var self = this;
      (function() {
        self.horde.demand('config', {key: 'value'});
      }).should.Throw(Error, '"config" does not exist');
      testDone();
    });
  });

  describe('#configuredDemand', function() {
    it('should prevent modules from updating Gruntfile value', function() {
      this.horde.configuredDemand('Gruntfile', this.horde, 'initConfig', this.sectionKey, this.val);
      this.horde.learn(this.initKey).should.equal(this.val);
      this.horde.configuredDemand(this.modDirPath, this.horde, 'initConfig', this.sectionKey, this.val2);
      this.horde.learn(this.initKey).should.equal(this.val);
    });

    it('should let Gruntfile update value again', function() {
      this.horde.configuredDemand('Gruntfile', this.horde, 'initConfig', this.sectionKey, this.val);
      this.horde.learn(this.initKey).should.equal(this.val);
      this.horde.configuredDemand('Gruntfile', this.horde, 'initConfig', this.sectionKey, this.val2);
      this.horde.learn(this.initKey).should.equal(this.val2);
    });

    it('should emit mode when value set by module', function(testDone) {
      grunt.event.once('grunt-horde:demand', function(source, section, key, val, mode) {
        mode.should.equal('');
        testDone();
      });
      this.horde.configuredDemand(this.modDirPath, this.horde, 'initConfig', this.sectionKey, this.val);
    });

    it('should emit mode when value set by Gruntfile', function(testDone) {
      grunt.event.once('grunt-horde:demand', function(source, section, key, val, mode) {
        mode.should.equal('freezing');
        testDone();
      });
      this.horde.demand(this.initKey, this.val);
    });

    it('should emit mode when value already frozen', function(testDone) {
      this.horde.demand(this.initKey, this.val);
      grunt.event.once('grunt-horde:demand', function(source, section, key, val, mode) {
        mode.should.equal('frozen');
        testDone();
      });
      this.horde.configuredDemand(this.modDirPath, this.horde, 'initConfig', this.sectionKey, this.val);
    });
  });

  describe('#integration', function() {
    describe('base config fixture', function() {
      beforeEach(function() {
        this.horde.loot(fixtureDir + '/base-config').attack();
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
            p2k2: {c: 3, d: [4]}
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

    describe('base config fixture with Gruntfile #demand', function() {
      it('should give lower precedence to initConfig', function() {
        this.horde
          .loot(fixtureDir + '/base-config')
          .demand('initConfig.i2.i2k1', 'overwritten')
          .attack();
        this.gruntStub.initConfig.should.have.been.calledWithExactly({
          i1: {i1k1: 'i1v1'},
          i2: {i2k1: 'overwritten'},
          plugin1: {
            p1k1: {a: 1, b: 2},
            p1k2: {c: 3, d: 4}
          },
          plugin2: {
            p2k1: {a: 1, b: 2},
            p2k2: {c: 3, d: [4]}
          }
        });
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
            p2k2: {c: 3, d: [4, 'merge']},
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
