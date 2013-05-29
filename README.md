# grunt-horde

Organized grunt task configuration

- Separate files define payloads for `initConfig`, `loadNpmTask`, etc.
- Optionally load multiple modules whose payloads are recursively merged.

[![Build Status](https://travis-ci.org/codeactual/grunt-horde.png)](https://travis-ci.org/codeactual/grunt-horde)

## Example

### `Gruntfile.js`

Use `loot` to select configuration modules whose payloads are marged recursively, last wins.

```js
var horde = GruntHorde.create();
horde
  .loot('my-base-config-module')
  .loot('./config/grunt')
  .attack();
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
