# grunt-horde

Packageable grunt configuration modules

- Separate files define values for `initConfig`, `loadNpmTask`, etc.
- Store modules in regular directories or leverage NPM, ex. `npm install git://`.
- Compose configuration from multiple modules w/ recursive merging, cascading, etc.

[Introduction](http://codeactual.github.io/06/02/2013/introducing-grunt-horde.html)

[![Build Status](https://travis-ci.org/codeactual/grunt-horde.png)](https://travis-ci.org/codeactual/grunt-horde)

## Example

### `Gruntfile.js`

- `loot` selects configuration modules whose payloads are marged recursively.
- `demand` updates the raw `grunt` config object.
- `attack` applies the configuration to `grunt`.

```js
module.exports = function(grunt) {
  var horde = require('grunt-horde').create(grunt);
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
    tasks/
        precommit.js
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

## Documentation

- [Introduction](http://codeactual.github.io/06/02/2013/introducing-grunt-horde.html)
- [API](docs/GruntHorde.md)

## License

  MIT

## Tests

    npm test
