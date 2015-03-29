# grunt-horde

Packageable, composable grunt configuration modules

- Use `Gruntfile.js` to define the composition at a high-level.
- Reuse common configuration by storing them as modules.
- Customize the merged configuration with a [composition API](docs/modules.md#composition-api).
- More easily maintain sections like [initConfig](http://gruntjs.com/api/grunt#grunt.initconfig), [loadNpmTasks](http://gruntjs.com/api/grunt#grunt.loadnpmtasks), and [registerTask](http://gruntjs.com/api/grunt.task#grunt.task.registertask) in individual files.
- Access convenient aliases for template expansion, object merging, and semver.
- Load configurations from regular directories or local NPM modules.

[![Build Status](https://travis-ci.org/codeactual/grunt-horde.png)](https://travis-ci.org/codeactual/grunt-horde)

## Example

### `Gruntfile.js`

> Define the composition at a high-level: the modules to merge, in what order, and final customization.

```js
module.exports = function(grunt) {
  var horde = require('grunt-horde').create(grunt);
  horde
    .loot('my-base-config')
    .loot('./config/grunt')
    .demand('initConfig.eslint.options', {envs: ['node', 'es6']})
    .attack();
};
```

### `./node_modules/my-base-config/`

> Loaded first, this module provides a baseline.

    initConfig/
        index.js
        eslint.js
        shell.js
    tasks/
        precommit.js
    loadNpmTasks.js
    loadTasks.js
    registerTask.js
    registerMultiTask.js

```js
// initConfig/eslint.js
module.exports = function() {
  return {
    src: {
      files: {
        src: ['index.js', 'lib/**/*.js']
      }
    }
  };
};
```

### `./config/grunt/`

> Defines project-specific configs that are [merged recursively](https://github.com/justmoon/node-extend) with `./node_modules/my-base-config`.

    initConfig/
        eslint.js
    loadNpmTasks.js
    registerTask.js

```js
// initConfig/eslint.js
module.exports = function() {
  return {
    src: {
      files: {
        test: ['test/**/*.js']
      }
    }
  };
};
```

Now `initConfig.eslint` contains both `src` (from `./node_modules/my-base-config`) and `test` (from `./config/grunt`).

## Installation

### [NPM](https://www.npmjs.com/package/grunt-horde)

    npm install grunt-horde

## Documentation

### Usage

- [Introduction](http://codeactual.github.io/06/02/2013/introducing-grunt-horde.html)
- Modules
  - [Composition API](docs/modules.md#composition-api)
  - [Files](docs/modules.md#module-files)
  - [Examples](docs/modules.md#examples)
  - [Tips](docs/modules.md#tips)
  - [Events](docs/modules.md#events)

### Development

- [API](docs/GruntHorde.md)
- [Notes](docs/development.md)

## License

  MIT

## Tests

    npm test
