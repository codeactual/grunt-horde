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

> Define the composition at a high-level: the modules to merge, in what order, and final project-specific customization.

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

### `./node_modules/my-base-config/`

> Loaded first, this module provides a baseline that later `loot` calls can update.

    initConfig/
        index.js
        jshint.js
        shell.js
    tasks/
        precommit.js
    loadNpmTasks.js
    loadTasks.js
    registerTask.js
    registerMultiTask.js

`initConfig/jshint.js`:

```js
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

> Defines project-specific configs merged recursively over `my-base-config`.

    initConfig/
        jshint.js
    loadNpmTasks.js
    registerTask.js

```js
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

Now `initConfig.jshint` contains both `src` (from `my-base-config`) and `test` (from `./config/grunt`) sections.

## Installation

### [NPM](https://npmjs.org/package/grunt-horde)

    npm install grunt-horde

## Documentation

- [Introduction](http://codeactual.github.io/06/02/2013/introducing-grunt-horde.html)
- [Writing Modules](docs/modules.md)
- [Composition API](#docs/modules.md#composition-api)
- [More Examples](docs/modules#examples)
- [Internal API](docs/GruntHorde.md)

## License

  MIT

## Tests

    npm test
