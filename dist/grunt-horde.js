(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err;
        }
        var module = require.modules[resolved];
        if (!module.exports) {
            module.exports = {};
            module.client = module.component = true;
            module.call(this, module.exports, require.relative(resolved), module);
        }
        return module.exports;
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var index = path + "/index.js";
        var paths = [ path, path + ".js", path + ".json", path + "/index.js", path + "/index.json" ];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
        }
        if (require.aliases.hasOwnProperty(index)) {
            return require.aliases[index];
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop();
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i]);
            }
        }
        return curr.concat(segs).join("/");
    };
    require.register = function(path, definition) {
        require.modules[path] = definition;
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist');
        }
        require.aliases[to] = from;
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");
        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i;
            }
            return -1;
        }
        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path);
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path;
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path));
        };
        return localRequire;
    };
    require.register("codeactual-extend/index.js", function(exports, require, module) {
        module.exports = function extend(object) {
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, source; source = args[i]; i++) {
                if (!source) continue;
                for (var property in source) {
                    object[property] = source[property];
                }
            }
            return object;
        };
    });
    require.register("component-type/index.js", function(exports, require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(val) {
            switch (toString.call(val)) {
              case "[object Function]":
                return "function";

              case "[object Date]":
                return "date";

              case "[object RegExp]":
                return "regexp";

              case "[object Arguments]":
                return "arguments";

              case "[object Array]":
                return "array";

              case "[object String]":
                return "string";
            }
            if (val === null) return "null";
            if (val === undefined) return "undefined";
            if (val && val.nodeType === 1) return "element";
            if (val === Object(val)) return "object";
            return typeof val;
        };
    });
    require.register("component-clone/index.js", function(exports, require, module) {
        var type;
        try {
            type = require("type");
        } catch (e) {
            type = require("type-component");
        }
        module.exports = clone;
        function clone(obj) {
            switch (type(obj)) {
              case "object":
                var copy = {};
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        copy[key] = clone(obj[key]);
                    }
                }
                return copy;

              case "array":
                var copy = new Array(obj.length);
                for (var i = 0, l = obj.length; i < l; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;

              case "regexp":
                var flags = "";
                flags += obj.multiline ? "m" : "";
                flags += obj.global ? "g" : "";
                flags += obj.ignoreCase ? "i" : "";
                return new RegExp(obj.source, flags);

              case "date":
                return new Date(obj.getTime());

              default:
                return obj;
            }
        }
    });
    require.register("pluma-assimilate/dist/assimilate.js", function(exports, require, module) {
        var slice = Array.prototype.slice;
        function assimilateWithStrategy(strategy, copyInherited, target) {
            var sources = slice.call(arguments, 3), i, source, key;
            if (target === undefined || target === null) {
                target = {};
            }
            for (i = 0; i < sources.length; i++) {
                source = sources[i];
                if (source === undefined || source === null) continue;
                for (key in source) {
                    if (copyInherited || source.hasOwnProperty(key)) {
                        strategy(target, source, key, copyInherited);
                    }
                }
            }
            return target;
        }
        function assimilate() {
            var args = slice.call(arguments, 0);
            return assimilateWithStrategy.apply(this, [ assimilate.strategies.DEFAULT, false ].concat(args));
        }
        assimilate.withStrategy = function(strategy, copyInherited) {
            if (arguments.length === 1 && typeof strategy === "boolean") {
                copyInherited = strategy;
                strategy = "default";
            }
            if (typeof strategy === "string") {
                strategy = strategy.toUpperCase();
                if (typeof assimilate.strategies[strategy] === "function") {
                    strategy = assimilate.strategies[strategy];
                }
            }
            if (typeof strategy !== "function") {
                throw new Error("Unknown strategy or not a function: " + strategy);
            }
            return function() {
                var args = slice.call(arguments, 0);
                return assimilateWithStrategy.apply(this, [ strategy, !!copyInherited ].concat(args));
            };
        };
        assimilate.strategies = {
            DEFAULT: function(target, source, key) {
                target[key] = source[key];
            },
            DEEP: function(target, source, key, copyInherited) {
                var newValue = source[key];
                var oldValue = target[key];
                if (target.hasOwnProperty(key) && typeof newValue === "object" && typeof oldValue === "object") {
                    assimilateWithStrategy(assimilate.strategies.DEEP, copyInherited, oldValue, newValue);
                } else {
                    target[key] = newValue;
                }
            },
            STRICT: function(target, source, key) {
                var value = source[key];
                if (value !== undefined) {
                    target[key] = value;
                }
            },
            FALLBACK: function(target, source, key) {
                var oldValue = target[key];
                if (oldValue === undefined) {
                    target[key] = source[key];
                }
            }
        };
        module.exports = assimilate;
    });
    require.register("qualiancy-tea-properties/lib/properties.js", function(exports, require, module) {
        var exports = module.exports = {};
        exports.get = function(obj, path) {
            var parsed = parsePath(path);
            return getPathValue(parsed, obj);
        };
        exports.set = function(obj, path, val) {
            var parsed = parsePath(path);
            setPathValue(parsed, val, obj);
        };
        function defined(val) {
            return "undefined" === typeof val;
        }
        function parsePath(path) {
            var str = path.replace(/\[/g, ".["), parts = str.match(/(\\\.|[^.]+?)+/g);
            return parts.map(function(value) {
                var re = /\[(\d+)\]$/, mArr = re.exec(value);
                if (mArr) return {
                    i: parseFloat(mArr[1])
                }; else return {
                    p: value
                };
            });
        }
        function getPathValue(parsed, obj) {
            var tmp = obj, res;
            for (var i = 0, l = parsed.length; i < l; i++) {
                var part = parsed[i];
                if (tmp) {
                    if (!defined(part.p)) tmp = tmp[part.p]; else if (!defined(part.i)) tmp = tmp[part.i];
                    if (i == l - 1) res = tmp;
                } else {
                    res = undefined;
                }
            }
            return res;
        }
        function setPathValue(parsed, val, obj) {
            var tmp = obj;
            for (var i = 0, l = parsed.length; i < l; i++) {
                var part = parsed[i];
                if (!defined(tmp)) {
                    if (i == l - 1) {
                        if (!defined(part.p)) tmp[part.p] = val; else if (!defined(part.i)) tmp[part.i] = val;
                    } else {
                        if (!defined(part.p) && tmp[part.p]) tmp = tmp[part.p]; else if (!defined(part.i) && tmp[part.i]) tmp = tmp[part.i]; else {
                            var next = parsed[i + 1];
                            if (!defined(part.p)) {
                                tmp[part.p] = {};
                                tmp = tmp[part.p];
                            } else if (!defined(part.i)) {
                                tmp[part.i] = [];
                                tmp = tmp[part.i];
                            }
                        }
                    }
                } else {
                    if (i == l - 1) tmp = val; else if (!defined(part.p)) tmp = {}; else if (!defined(part.i)) tmp = [];
                }
            }
        }
    });
    require.register("grunt-horde/lib/component/main.js", function(exports, require, module) {
        module.exports = {
            requireComponent: require
        };
    });
    require.alias("codeactual-extend/index.js", "grunt-horde/deps/extend/index.js");
    require.alias("codeactual-extend/index.js", "extend/index.js");
    require.alias("component-clone/index.js", "grunt-horde/deps/clone/index.js");
    require.alias("component-clone/index.js", "clone/index.js");
    require.alias("component-type/index.js", "component-clone/deps/type/index.js");
    require.alias("pluma-assimilate/dist/assimilate.js", "grunt-horde/deps/assimilate/dist/assimilate.js");
    require.alias("pluma-assimilate/dist/assimilate.js", "grunt-horde/deps/assimilate/index.js");
    require.alias("pluma-assimilate/dist/assimilate.js", "assimilate/index.js");
    require.alias("pluma-assimilate/dist/assimilate.js", "pluma-assimilate/index.js");
    require.alias("qualiancy-tea-properties/lib/properties.js", "grunt-horde/deps/tea-properties/lib/properties.js");
    require.alias("qualiancy-tea-properties/lib/properties.js", "grunt-horde/deps/tea-properties/index.js");
    require.alias("qualiancy-tea-properties/lib/properties.js", "tea-properties/index.js");
    require.alias("qualiancy-tea-properties/lib/properties.js", "qualiancy-tea-properties/index.js");
    require.alias("grunt-horde/lib/component/main.js", "grunt-horde/index.js");
    if (typeof exports == "object") {
        module.exports = require("grunt-horde");
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("grunt-horde");
        });
    } else {
        this["gruntHorde"] = require("grunt-horde");
    }
})();