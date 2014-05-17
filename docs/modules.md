- [Composition API](#composition-api)
- [Config Composition](#config-composition)
- [Module Files](#module-file-layout)
- [Examples](#module-examples)
- [Events](#events)

# Composition API

## `Gruntfile.js` (`GruntHorde`)

> Create an instance in your `Gruntfile.js` to define the composition at a high-level.

```js
module.exports = function(grunt) {
  var horde = require('grunt-horde').create(grunt);
  horde
    .loot('my-base-config')
    .loot('./config/grunt')
    .demand('initConfig.jshint.options', {node: true})
    .attack();
};
```

- `loot(name)`: Load a module and merge in its key/value pairs.
  - Relative path: `./path/to/mod`
  - Absolute path: `/path/to/mod`
  - Local `node_modules/mod`: `mod`
- `attack`: Apply your composition.

## `Gruntfile.js` (`GruntHorde`) and modules

- `demand(key, val)`: Modify the raw `grunt` config object.
- `learn(key)`: Read from the raw `grunt` config object.

`key` values are [string paths](https://github.com/chaijs/pathval) like `initConfig.jshint.options`.

## Module `exports` functions

- `this.demand(key, val)`: Setter for the raw `grunt` config object.
- `this.learn(key)`: Getter for the raw `grunt` config object.
- `this.t(template [, options])`: Alias for [grunt.template.process](http://gruntjs.com/api/grunt.template#grunt.template.process).
- `this.assimilate`: Alias for the [pluma/assimilate](https://github.com/pluma/assimilate) used in `grunt-horde` to merge objects (in `deep` mode).
  - Example:
- `this.age`: Alias for [semver](https://github.com/isaacs/node-semver).

## More on [loot()](GruntHorde.md#tableofcontents)

> `loot` is the main way to compose your configuration from modules.

- May be used to load any number of modules.
- Payloads collected [merged recursively](https://github.com/pluma/assimilate), last wins.
- Layout and content of module files must follow [conventions](#module-files).
- Loads `tasks/`, if present, with `grunt.loadTasks`.

## More on [demand()](GruntHorde.md#tableofcontents)

Using `demand()` from `Gruntfile.js` and module contexts

> Afterward you can optionally customize the merge result with `demand`.

[demand()](GruntHorde.md#tableofcontents) operates the same in both situations: it updates the raw `grunt` config object. This offer two main benefits:

- Templates: Values are available for standard `<%= keyName %>` substitution or via [t()](#context-properties).
- Programmatic use: For example, values set in `Gruntfile.js` or any `initConfig/` file can be accessed elsewhere w/ [learn()](#context-properties).
- `demand` is alias for [GruntHorde.prototype.demand](GruntHorde.md#tableofcontents).
- `demand` emits an [event](#events) for debugging.

## More on [learn()](GruntHorde.md#tableofcontents)

- `learn` is an alias for [GruntHorde.prototype.learn](GruntHorde.md#tableofcontents).

## More on `assimilate`

Example of object merging with `assimilate`:

```js
var mergeDeep = this.assimilate.withStrategy('deep');
var result = mergeDeep(obj1, obj2);
```

## More on `age`

Example of using `age` to adjust configuration based on semver:

```js
// Ex. in Gruntfile.js
this.demand('initConfig.harmony', this.age.satisfies(process.version, '>=0.11.9'));

// Ex. in initConfig/jshint.js
if (this.learn('initConfig.harmony')) {
  defaultOptions.esnext = true;
}
```

## Module `return` values

- You can safely omit `return` without side effect, ex. if your module only needs to use `demand/learn`.
- To removing a top-level config key, use [kill(key)](GruntHorde.md#tableofcontents).

## Precedence

[demand()](GruntHorde.md#tableofcontents) can be called from `Gruntfile.js` and any module file, but its effectiveness depends where it is used.

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

# Module File Layout

You can compose a module from any combination of these files.

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

# Examples

I combine these configurations in most of my projects and then customize, if needed, with a `./config/grunt` module.

## Configurations

- [node-component-grunt](https://github.com/codeactual/node-component-grunt)
- [node-lib-grunt](https://github.com/codeactual/node-lib-grunt)
- [node-bin-grunt](https://github.com/codeactual/node-bin-grunt)

## Dependent Projects

- [conjure](https://github.com/codeactual/conjure/blob/master/Gruntfile.js)
- [prankcall](https://github.com/codeactual/prankcall/blob/master/Gruntfile.js)
- [apidox](https://github.com/codeactual/apidox/blob/master/Gruntfile.js)

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

