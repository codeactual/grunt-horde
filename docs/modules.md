# General

## [loot()](GruntHorde.md)

- May be used to load any number of modules.
- Payloads collected [merged recursively](https://github.com/pluma/assimilate), last wins.
- Layout and content of module files must follow [conventions](#module-files).
- Loads `tasks/`, if present, with `grunt.loadTasks`.

# Variables

## Using `demand()` from `Gruntfile.js` and module contexts

[demand()](GruntHorde.md) operates the same in both situations: it updates the raw `grunt` config object. This offer two main benefits:

- Templates: Values are available for standard `<%= keyName %>` substitution or via [t()](#context-properties).
- Programmatic use: For example, values set in `Gruntfile.js` or any `initConfig/` file can be accessed elsewhere w/ [learn()](#context-properties).

## Module `return` values

- You can safely omit `return` without side effect, ex. if your module only needs to use `demand/learn`.
- To removing a top-level config key, use [kill(key)](GruntHorde.md).

## Precedence

[demand()](GruntHorde.md) can be called from `Gruntfile.js` and any module file, but its effectiveness depends where it is used.

- Key/value pairs returned from modules loaded by `loot` (lowest)
- Key/value pairs set by `demand()` in modules loaded by `loot`
- Key/value pairs set by `demand()` in `Gruntfile.js` (highest)

Remidner: Sequence your `loot` calls based on module precendence, highest last.

## Use `learn/demand` to merge with existing value, rather than a last-wins overwrite

If `loot` has already loaded `moduleX` that defined `initConfig` key `dev.logs`, `moduleY` could include this:

```js
var orig = this.learn('initConfig.dev.logs');
this.demand('initConfig.dev.logs', orig.concat('tmp/request.log'));
```

# Module Files

## `initConfig/index.js`

> Defines top-level keys passed to `grunt.initConfig`.

```js
module.exports = function(grunt) {
  return {
    pkg: grunt.file.readJSON('package.json')
  };
};

```

## `initConfig/<name>.js`, ex. `initConfig/uglify.js`

> Defines the `uglify` section passed to `grunt.initConfig`.

```js
module.exports = function(grunt) {
  return {
    src: {
      options: {beautify: true},
      files: {'dist/grunt-horde.js': 'dist/grunt-horde.js'}
    }
  };
};

```

## `tasks/<name>.js`, ex. `tasks/precommit.js`

> Defines a module that will be discovered/loaded by `grunt.loadTasks`.

## `loadNpmTasks.js`

> `false` can be used to disable an NPM task enabled in a module earlier in the merge.

```js
module.exports = function(grunt) {
  return {
    'grunt-contrib-uglify': true
  };
};
```

## `loadTasks.js`

> `false` can be used to disable a task path enabled in a module earlier in the merge.

```js
module.exports = function(grunt) {
  return {
    'path/to/dev-tasks': true
  };
};
```

## `registerTask.js`

> Defines the arguments passed to `grunt.registerTask`.

```js
module.exports = function(grunt) {
  return {
    default: [['task1', 'task2']]
  };
};
```

## `registerMultiTask.js`

> Defines the arguments passed to `grunt.registerMultiTask`.

```js
module.exports = function(grunt) {
  var myMultiTask = require('./multi-tasks/secret-sauce.js');
  return {
    myMultiTask: ['some description', myMultiTask]
  };
};
```

# Context Properties

Every module file will receive these properties.

### `learn(key)`

> Alias for [GruntHorde.prototype.learn](GruntHorde.md).

### `demand(key, val)`

> Alias for [GruntHorde.prototype.demand](GruntHorde.md).

- `grunt-horde:demand` event will emit the module's filename in the `source` argument.

### `t(template [, options])`

> Alias for [grunt.template.process](http://gruntjs.com/api/grunt.template#grunt.template.process).

### `assimilate`

> Alias for the [module](https://github.com/pluma/assimilate) used in `grunt-horde` internally to merge objects. Included for convenience/consistency.

```js
var mergeDeep = assimilate.withStrategy('deep');
var result = mergeDeep(obj1, obj2);
```

# Events

Subscribe through the [grunt.event](http://gruntjs.com/api/grunt.event) API.

## `grunt-horde:demand`

> Fires on every `demand()` invocation.

Receives arguments:

- `{string} source` Ex. 'Gruntfile' or '/path/to/initConfig/jshint.js'
- `{string} section` Ex. `initConfig`, `registerTask`, etc.
- `{string} key` Config key, ex. `x.y.z`
- `{string} val` Config val, ex. `20`
- `{string} mode`
  - `''`: initial/updated value from module was accepted
  - `frozen`: new value from module was denied (already odified by `Gruntfile.js`)
  - `freezing`: value modified from `Gruntfile.js`

## `grunt-horde:kill`

> Fires on every `kill()` invocation.

Receives arguments:

- `{string} source` Ex. 'Gruntfile' or '/path/to/initConfig/jshint.js'
- `{string} section` Ex. `initConfig`, `registerTask`, etc.
- `{string} key` Config key, ex. `x.y.z`
- `{string} mode`
  - `''`: initial/updated value from module was accepted
  - `frozen`: new value from module was denied (already modified by `Gruntfile.js`)
  - `freezing`: value modified from `Gruntfile.js`

