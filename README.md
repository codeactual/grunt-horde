# grunt-horde

Packageable grunt configuration modules

- Store configuration files in NPM modules or plain directories.
- Separate files define values for `initConfig`, `loadNpmTask`, etc.
- Recursively merge configuration values collected from any number of modules/directories.

[![Build Status](https://travis-ci.org/codeactual/grunt-horde.png)](https://travis-ci.org/codeactual/grunt-horde)

## Example

### `Gruntfile.js`

- `loot` selects configuration modules whose payloads are marged recursively.
- `demand` updates the raw `grunt` config object.
- `attack` applies the configuration to `grunt`.

```js
module.exports = function(grunt) {
  var horde = GruntHorde.create();
  horde
    .loot('my-base-config')
    .loot('./config/grunt')
    .demand('pkg', grunt.file.readJSON('package.json'))
    .attack();
};
```

### `./node_modules/my-base-config/`

Loaded first, this module provides a baseline that later `loot` calls can update.

    initConfig/
        index.js
        jshint.js
        shell.js
    loadNpmTasks.js
    loadTasks.js
    registerTask.js
    registerMultiTask.js

[Module Documentation](docs/modules.md)

### `./config/grunt/`

Defines project-specific configs merged recursively over `my-base-config`.

    initConfig/
        uglify.js
    loadNpmTasks.js
    registerTask.js

[Module Documentation](docs/modules.md)

## Installation

### [NPM](https://npmjs.org/package/grunt-horde)

    npm install grunt-horde

## API

[Documentation](docs/GruntHorde.md)

## License

  MIT

## Tests

    npm test
