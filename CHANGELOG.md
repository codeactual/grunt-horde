# 0.3.5

- fix(resolveRequire): Fixes #2, support Windows
- fix(windows): Replace remaining `/` with `path.sep`
- fix(resolveRequire): Normalize paths, simplify regex

# 0.3.4

- feat(module): Add `this.age` as alias to `semver`

# 0.3.3

- feat(module): Add `this.assimlate`
- chore(pkg): Upgrade NPM and component deps

# 0.3.2

- fix(docs): Corrections
- fix(demand): Throw on invalid key namespace
- chore(npm): Update deps

# 0.3.1

- feat(api): Auto-run `grunt.loadTasks` on a module's `tasks/` directory, if present.

# 0.3.0

- feat(api): Expose all config sections to `demand`, `learn`, `kill` in all files.
- feat(api): Allow `kill` to any key, not just top-level.
- feat(event): Add `section` argument to `grunt-horde:demand` payload.

# 0.2.2

- feat(event): Add `mode` argument to `grunt-horde:demand` event payload to indicate whether write was accepted
- feat(api): Add `kill` to remove top-level keys
- fix(loot): Throw error on no such dir
- fix(attack): Gruntfile demand() could not override modules
- fix(module): Let `learn` access k/v pairs added in prior `loot`
- fix(module): Missing `return` value would overwrite existing with `undefined`

# 0.2.1

- fix(loot): Defer merge until `attack`

# 0.2.0

- Rename `set/setConfig` methods to `demand`
- Rename `get/getConfig` methods to `learn`
- Rename `grunt-horde:set-config` event to `grunt-horde:demand`
- Add `source` as 1st argument in `grunt-horde:demand` event payload
- fix(require): Resolve paths before existence checks
- fix(initConfig): `setConfig` k/v pairs were not merged

# 0.1.0

- Initial API: `home`, `loot`, `setConfig`, `getConfig`, `attack`
