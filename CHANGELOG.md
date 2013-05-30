# 0.2.2

* feat(event): Add `mode` argument to `grunt-horde:demand` event payload to indicate whether write was accepted
* fix(loot): Throw error on no such dir
* fix(attack): Gruntfile demand() could not override modules
* fix(module): Let `learn` access k/v pairs added in prior `loot`

# 0.2.1

* fix(loot): Defer merge until `attack`

# 0.2.0

* Rename `set/setConfig` methods to `demand`
* Rename `get/getConfig` methods to `learn`
* Rename `grunt-horde:set-config` event to `grunt-horde:demand`
* Add `source` as 1st argument in `grunt-horde:demand` event payload
* fix(require): Resolve paths before existence checks
* fix(initConfig): `setConfig` k/v pairs were not merged

# 0.1.0

* Initial API: `home`, `loot`, `setConfig`, `getConfig`, `attack`
