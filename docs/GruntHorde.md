Organized grunt task configuration

_Source: [lib/grunt-horde/index.js](../lib/grunt-horde/index.js)_

<a name="tableofcontents"></a>

- <a name="toc_exportsgrunthorde"></a><a name="toc_exports"></a>[exports.GruntHorde](#exportsgrunthorde)
- <a name="toc_exportscreategrunt"></a>[exports.create](#exportscreategrunt)
- <a name="toc_exportsextendext"></a>[exports.extend](#exportsextendext)
- <a name="toc_grunthorde"></a>[GruntHorde](#grunthorde)
- <a name="toc_grunthordeprototypeattack"></a><a name="toc_grunthordeprototype"></a>[GruntHorde.prototype.attack](#grunthordeprototypeattack)
- <a name="toc_grunthordeprototypehomecwd"></a>[GruntHorde.prototype.home](#grunthordeprototypehomecwd)
- <a name="toc_grunthordeprototypelootname"></a>[GruntHorde.prototype.loot](#grunthordeprototypelootname)
- <a name="toc_grunthordeprototypegetconfigkey"></a>[GruntHorde.prototype.getConfig](#grunthordeprototypegetconfigkey)
- <a name="toc_grunthordeprototypesetconfigkey-val"></a>[GruntHorde.prototype.setConfig](#grunthordeprototypesetconfigkey-val)

<a name="exports"></a>

# exports.GruntHorde()

> Reference to [GruntHorde](#grunthorde).

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.create(grunt)

> Create a new [GruntHorde](#grunthorde).

**Parameters:**

- `{object} grunt` Instance injected into Gruntfile.js

**Return:**

`{object}`

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.extend(ext)

> Extend [GruntHorde](#grunthorde).prototype.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# GruntHorde()

> GruntHorde constructor.

**Usage:**

```js
// Gruntfile.js
module.exports = function(grunt) {
  require('grunt-horde')
    .create(grunt)
    .loot('my-base-config-module')
    .loot('./config/grunt')
    .attack();
};
```

**Properties:**

- `{object} config` Gruntfile.js values indexed by `grunt` method name
  - `{object} initConfig`
  - `{object} loadNpmTasks`
  - `{object} loadTasks`
  - `{object} registerMultiTask`
  - `{object} registerTask`
- `{string} [home=process.cwd]` Absolute path to project root dir w/out trailing slash
- `{object} grunt` Instance injected into Gruntfile.js

<sub>Go: [TOC](#tableofcontents)</sub>

<a name="grunthordeprototype"></a>

# GruntHorde.prototype.attack()

> Apply configuration.

Run all supported `grunt` configuration methods.

<sub>Go: [TOC](#tableofcontents) | [GruntHorde.prototype](#toc_grunthordeprototype)</sub>

# GruntHorde.prototype.home(cwd)

> Set working directory used to resolve relative paths.

**Parameters:**

- `{string} cwd`

**Return:**

`{object}` this

<sub>Go: [TOC](#tableofcontents) | [GruntHorde.prototype](#toc_grunthordeprototype)</sub>

# GruntHorde.prototype.loot(name)

> Load a config module. Merge in its payload.

- Payloads are merged recursively, last wins.

**Example sources:**

- Base config module, ex. `node_modules/my-base-config`
- Project-local config module that overrides the base, ex. `config/grunt/`

**Usage:**

```js
horde.home('/proj/home');
horde.loot('base'); // require('/proj/home/node_modules/base');
horde.loot('./base'); // require('/proj/home/base.js');
horde.loot('/path/to/base'); // require('/path/to/base');
```

**Example layout:**

```
initConfig/
```js
index.js
jshint.js
uglify.js
shell.js
```

loadTasks.js
loadNpmTasks.js
registerTask.js
registerMultiTask.js
```

**Parameters:**

- `{string} name` Module path, see `Usage` above for examples

**Return:**

`{object}` this

<sub>Go: [TOC](#tableofcontents) | [GruntHorde.prototype](#toc_grunthordeprototype)</sub>

# GruntHorde.prototype.getConfig(key)

> Get a `grunt.config` property. Supports `x.y.z` property paths.

**Usage:**

```js
horde.setConfig('x.y.z', 20);
console.log(grunt.config.getRaw().x.y.z); // 20
```

**Parameters:**

- `{string} key`

**Return:**

`{mixed}`

<sub>Go: [TOC](#tableofcontents) | [GruntHorde.prototype](#toc_grunthordeprototype)</sub>

# GruntHorde.prototype.setConfig(key, val)

> Set a `grunt.config` property. Supports `x.y.z` property paths.

**Usage:**

```js
horde.setConfig('x.y.z', 20);
console.log(horde.getConfig('x.y.z')); // 20
console.log(grunt.config.getRaw().x.y.z); // 20
```

**Parameters:**

- `{string} key`
- `{mixed} val`

**Return:**

`{object}` this

**See:**

- [Events](modules.md#events)

<sub>Go: [TOC](#tableofcontents) | [GruntHorde.prototype](#toc_grunthordeprototype)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_