# General

## [loot()](GruntHorde.md)

- May be used to load any number of modules.
- Payloads collected [merged recursively](https://github.com/pluma/assimilate), last wins.
- Layout and content of module files must follow [conventions](#modulefiles).

# Variables

## Using `demand()` from `Gruntfile.js` and module contexts

[demand()](GruntHorde.md) operates the same in both situations: it updates the raw `grunt` config object. This offer two main benefits:

- Templates: Values are available for standard `<%= keyName %>` substitution or via [t()](#contextproperties).
- Programmatic use: For example, values set in `Gruntfile.js` or any `initConfig/` file can be accessed elsewhere w/ [learn()](#contextproperties).

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

> Get the value of a `grunt.config.getRaw()` property. [Deep property selection](https://github.com/qualiancy/tea-properties) is supported.

### `demand(key, val)`

> Set the value of a `grunt.config.getRaw()` property. [Deep property selection](https://github.com/qualiancy/tea-properties) is supported.

- Emits `grunt-horde:demand`. See [events](#events).

### `t(template [, options])`

> Alias for [grunt.template.process](http://gruntjs.com/api/grunt.template#grunt.template.process).

# Events

Subscribe through the [grunt.event](http://gruntjs.com/api/grunt.event) API.

## `grunt-horde:demand`

> Fires on every `set()` invocation.

Receives arguments:

- `{string} source` Ex. 'Gruntfile' or '/path/to/initConfig/jshint.js'
- `{string} key` Config key, ex. `x.y.z`
- `{string} val` Config val, ex. `20`
