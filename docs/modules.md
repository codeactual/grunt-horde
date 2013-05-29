# General

- `loot()` may be used to load any number of modules.
- Payloads collected by `loot()` are [merged recursively](https://github.com/pluma/assimilate), last wins.
-

# Context Properties

Every module file will receive these properties.

### `get(key)`

Get the value of a `grunt.config.getRaw()` property. [Deep property selection](https://github.com/qualiancy/tea-properties) is supported.

### `set(key, val)`

Set the value of a `grunt.config.getRaw()` property. [Deep property selection](https://github.com/qualiancy/tea-properties) is supported.

Emits `grunt-horde:set-config`. See [events](#events).

### `t(template [, options])`

Alias for [grunt.template.process](http://gruntjs.com/api/grunt.template#grunt.template.process).

# Module Files

## `initConfig/index.js`

Defines top-level keys passed to `grunt.initConfig`.

```js
module.exports = function(grunt) {
  return {
    pkg: grunt.file.readJSON('package.json')
  };
};

```

## `initConfig/<name>.js`, ex. `initConfig/uglify.js`

Defines the `uglify` section passed to `grunt.initConfig`.

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

`false` can be used to disable an NPM task enabled in a module earlier in the merge.

```js
module.exports = function(grunt) {
  return {
    'grunt-contrib-uglify': true
  };
};
```

## `loadTasks.js`

`false` can be used to disable a task path enabled in a module earlier in the merge.

```js
module.exports = function(grunt) {
  return {
    'path/to/dev-tasks': true
  };
};
```

## `registerTask.js`

Defines the arguments passed to `grunt.registerTask`.

```js
module.exports = function(grunt) {
  return {
    default: [['task1', 'task2']]
  };
};
```

## `registerMultiTask.js`

Defines the arguments passed to `grunt.registerMultiTask`.

```js
module.exports = function(grunt) {
  var myMultiTask = require('./multi-tasks/secret-sauce.js);
  return {
    myMultiTask: ['some description', myMultiTask]
  };
};
```

# Events

## `grunt-horde:set-config`

> Fires on every `set()` invocation.

Receives arguments:

- `{string} key` Config key, ex. `x.y.z`
- `{string} val` Config val, ex. `20`
