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
