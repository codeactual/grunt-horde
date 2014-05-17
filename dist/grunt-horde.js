(function() {
    function require(name) {
        var module = require.modules[name];
        if (!module) throw new Error('failed to require "' + name + '"');
        if (!("exports" in module) && typeof module.definition === "function") {
            module.client = module.component = true;
            module.definition.call(this, module.exports = {}, module);
            delete module.definition;
        }
        return module.exports;
    }
    require.modules = {};
    require.register = function(name, definition) {
        require.modules[name] = {
            definition: definition
        };
    };
    require.define = function(name, exports) {
        require.modules[name] = {
            exports: exports
        };
    };
    require.register("codeactual~require-component@0.1.0", function(exports, module) {
        "use strict";
        module.exports = function(require) {
            function requireComponent(shortName) {
                var found;
                Object.keys(require.modules).forEach(function findComponent(fullName) {
                    if (found) {
                        return;
                    }
                    if (new RegExp("~" + shortName + "@").test(fullName)) {
                        found = fullName;
                    }
                });
                if (found) {
                    return require(found);
                } else {
                    return require(shortName);
                }
            }
            return {
                requireComponent: requireComponent
            };
        };
    });
    require.register("codeactual~extend@0.1.0", function(exports, module) {
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
    require.register("component~type@1.0.0", function(exports, module) {
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
    require.register("component~clone@0.1.0", function(exports, module) {
        var type;
        try {
            type = require("component~type@1.0.0");
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
    require.register("pluma~assimilate@0.4.0", function(exports, module) {
        var slice = Array.prototype.slice;
        function bind(fn, self) {
            var args = slice.call(arguments, 2);
            if (typeof Function.prototype.bind === "function") {
                return Function.prototype.bind.apply(fn, [ self ].concat(args));
            }
            return function() {
                return fn.apply(self, args.concat(slice.call(arguments, 0)));
            };
        }
        function simpleCopy(target, name, source) {
            target[name] = source[name];
        }
        function properCopy(target, name, source) {
            var descriptor = Object.getOwnPropertyDescriptor(source, name);
            Object.defineProperty(target, name, descriptor);
        }
        function ownProperties(obj) {
            return Object.getOwnPropertyNames(obj);
        }
        function allKeys(obj) {
            var keys = [];
            for (var name in obj) {
                keys.push(name);
            }
            return keys;
        }
        function ownKeys(obj) {
            var keys = [];
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    keys.push(name);
                }
            }
            return keys;
        }
        function assimilateWithStrategy(target) {
            var strategy = this, sources = slice.call(arguments, 1), i, source, names, j, name;
            if (target === undefined || target === null) {
                target = {};
            }
            for (i = 0; i < sources.length; i++) {
                source = sources[i];
                names = strategy.keysFn(source);
                for (j = 0; j < names.length; j++) {
                    name = names[j];
                    strategy.copyFn(target, name, source);
                }
            }
            return target;
        }
        var strategies = {
            DEFAULT: {
                keysFn: ownKeys,
                copyFn: simpleCopy
            },
            PROPER: {
                keysFn: ownProperties,
                copyFn: properCopy
            },
            INHERITED: {
                keysFn: allKeys,
                copyFn: simpleCopy
            },
            DEEP: {
                keysFn: ownKeys,
                copyFn: function recursiveCopy(target, name, source) {
                    var val = source[name];
                    var old = target[name];
                    if (typeof val === "object" && typeof old === "object") {
                        assimilateWithStrategy.call(strategies.DEEP, old, val);
                    } else {
                        simpleCopy(target, name, source);
                    }
                }
            },
            STRICT: {
                keysFn: ownKeys,
                copyFn: function strictCopy(target, name, source) {
                    if (source[name] !== undefined) {
                        simpleCopy(target, name, source);
                    }
                }
            },
            FALLBACK: {
                keysFn: function fallbackCopy(target, name, source) {
                    if (target[name] === undefined) {
                        simpleCopy(target, name, source);
                    }
                },
                copyFn: simpleCopy
            }
        };
        var assimilate = bind(assimilateWithStrategy, strategies.DEFAULT);
        assimilate.strategies = strategies;
        assimilate.withStrategy = function withStrategy(strategy) {
            if (typeof strategy === "string") {
                strategy = strategies[strategy.toUpperCase()];
            }
            if (!strategy) {
                throw new Error("Unknwon or invalid strategy:" + strategy);
            }
            if (typeof strategy.copyFn !== "function") {
                throw new Error("Strategy missing copy function:" + strategy);
            }
            if (typeof strategy.keysFn !== "function") {
                throw new Error("Strategy missing keys function:" + strategy);
            }
            return bind(assimilateWithStrategy, strategy);
        };
        module.exports = assimilate;
    });
    require.register("grunt-horde", function(exports, module) {
        module.exports = require("codeactual~require-component@0.1.0")(require);
    });
    if (typeof exports == "object") {
        module.exports = require("grunt-horde");
    } else if (typeof define == "function" && define.amd) {
        define([], function() {
            return require("grunt-horde");
        });
    } else {
        this["grunt-horde"] = require("grunt-horde");
    }
})();