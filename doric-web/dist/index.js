
const Environment = {
    platform:"web"
};
/**++++++++SandBox++++++++*/
var doric = (function (exports) {
    'use strict';

    /*
     * Copyright [2019] [Doric.Pub]
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    let __uniqueId__ = 0;
    function uniqueId(prefix) {
        return `__${prefix}_${__uniqueId__++}__`;
    }

    function toString(message) {
        if (message instanceof Function) {
            return message.toString();
        }
        else if (message instanceof Object) {
            try {
                return JSON.stringify(message);
            }
            catch (e) {
                return message.toString();
            }
        }
        else if (message === undefined) {
            return "undefined";
        }
        else {
            return message.toString();
        }
    }
    function log(...args) {
        let out = "";
        for (let i = 0; i < arguments.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += toString(arguments[i]);
        }
        nativeLog('d', out);
    }
    function loge(...message) {
        let out = "";
        for (let i = 0; i < arguments.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += toString(arguments[i]);
        }
        nativeLog('e', out);
    }
    function logw(...message) {
        let out = "";
        for (let i = 0; i < arguments.length; i++) {
            if (i > 0) {
                out += ',';
            }
            out += toString(arguments[i]);
        }
        nativeLog('w', out);
    }

    /*! *****************************************************************************
    Copyright (C) Microsoft. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    var Reflect$1;
    (function (Reflect) {
        // Metadata Proposal
        // https://rbuckton.github.io/reflect-metadata/
        (function (factory) {
            var root = typeof global === "object" ? global :
                typeof self === "object" ? self :
                    typeof this === "object" ? this :
                        Function("return this;")();
            var exporter = makeExporter(Reflect);
            if (typeof root.Reflect === "undefined") {
                root.Reflect = Reflect;
            }
            else {
                exporter = makeExporter(root.Reflect, exporter);
            }
            factory(exporter);
            function makeExporter(target, previous) {
                return function (key, value) {
                    if (typeof target[key] !== "function") {
                        Object.defineProperty(target, key, { configurable: true, writable: true, value: value });
                    }
                    if (previous)
                        previous(key, value);
                };
            }
        })(function (exporter) {
            var hasOwn = Object.prototype.hasOwnProperty;
            // feature test for Symbol support
            var supportsSymbol = typeof Symbol === "function";
            var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
            var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
            var supportsCreate = typeof Object.create === "function"; // feature test for Object.create support
            var supportsProto = { __proto__: [] } instanceof Array; // feature test for __proto__ support
            var downLevel = !supportsCreate && !supportsProto;
            var HashMap = {
                // create an object in dictionary mode (a.k.a. "slow" mode in v8)
                create: supportsCreate
                    ? function () { return MakeDictionary(Object.create(null)); }
                    : supportsProto
                        ? function () { return MakeDictionary({ __proto__: null }); }
                        : function () { return MakeDictionary({}); },
                has: downLevel
                    ? function (map, key) { return hasOwn.call(map, key); }
                    : function (map, key) { return key in map; },
                get: downLevel
                    ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
                    : function (map, key) { return map[key]; },
            };
            // Load global or shim versions of Map, Set, and WeakMap
            var functionPrototype = Object.getPrototypeOf(Function);
            var usePolyfill = typeof process === "object" && process.env && process.env["REFLECT_METADATA_USE_MAP_POLYFILL"] === "true";
            var _Map = !usePolyfill && typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
            var _Set = !usePolyfill && typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
            var _WeakMap = !usePolyfill && typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
            // [[Metadata]] internal slot
            // https://rbuckton.github.io/reflect-metadata/#ordinary-object-internal-methods-and-internal-slots
            var Metadata = new _WeakMap();
            /**
             * Applies a set of decorators to a property of a target object.
             * @param decorators An array of decorators.
             * @param target The target object.
             * @param propertyKey (Optional) The property key to decorate.
             * @param attributes (Optional) The property descriptor for the target key.
             * @remarks Decorators are applied in reverse order.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     Example = Reflect.decorate(decoratorsArray, Example);
             *
             *     // property (on constructor)
             *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
             *
             *     // property (on prototype)
             *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
             *
             *     // method (on constructor)
             *     Object.defineProperty(Example, "staticMethod",
             *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
             *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
             *
             *     // method (on prototype)
             *     Object.defineProperty(Example.prototype, "method",
             *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
             *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
             *
             */
            function decorate(decorators, target, propertyKey, attributes) {
                if (!IsUndefined(propertyKey)) {
                    if (!IsArray(decorators))
                        throw new TypeError();
                    if (!IsObject(target))
                        throw new TypeError();
                    if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
                        throw new TypeError();
                    if (IsNull(attributes))
                        attributes = undefined;
                    propertyKey = ToPropertyKey(propertyKey);
                    return DecorateProperty(decorators, target, propertyKey, attributes);
                }
                else {
                    if (!IsArray(decorators))
                        throw new TypeError();
                    if (!IsConstructor(target))
                        throw new TypeError();
                    return DecorateConstructor(decorators, target);
                }
            }
            exporter("decorate", decorate);
            // 4.1.2 Reflect.metadata(metadataKey, metadataValue)
            // https://rbuckton.github.io/reflect-metadata/#reflect.metadata
            /**
             * A default metadata decorator factory that can be used on a class, class member, or parameter.
             * @param metadataKey The key for the metadata entry.
             * @param metadataValue The value for the metadata entry.
             * @returns A decorator function.
             * @remarks
             * If `metadataKey` is already defined for the target and target key, the
             * metadataValue for that key will be overwritten.
             * @example
             *
             *     // constructor
             *     @Reflect.metadata(key, value)
             *     class Example {
             *     }
             *
             *     // property (on constructor, TypeScript only)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         static staticProperty;
             *     }
             *
             *     // property (on prototype, TypeScript only)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         property;
             *     }
             *
             *     // method (on constructor)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         static staticMethod() { }
             *     }
             *
             *     // method (on prototype)
             *     class Example {
             *         @Reflect.metadata(key, value)
             *         method() { }
             *     }
             *
             */
            function metadata(metadataKey, metadataValue) {
                function decorator(target, propertyKey) {
                    if (!IsObject(target))
                        throw new TypeError();
                    if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
                        throw new TypeError();
                    OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
                }
                return decorator;
            }
            exporter("metadata", metadata);
            /**
             * Define a unique metadata entry on the target.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param metadataValue A value that contains attached metadata.
             * @param target The target object on which to define metadata.
             * @param propertyKey (Optional) The property key for the target.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     Reflect.defineMetadata("custom:annotation", options, Example);
             *
             *     // property (on constructor)
             *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
             *
             *     // property (on prototype)
             *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
             *
             *     // method (on constructor)
             *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
             *
             *     // method (on prototype)
             *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
             *
             *     // decorator factory as metadata-producing annotation.
             *     function MyAnnotation(options): Decorator {
             *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
             *     }
             *
             */
            function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
            }
            exporter("defineMetadata", defineMetadata);
            /**
             * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.hasMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function hasMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryHasMetadata(metadataKey, target, propertyKey);
            }
            exporter("hasMetadata", hasMetadata);
            /**
             * Gets a value indicating whether the target object has the provided metadata key defined.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function hasOwnMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
            }
            exporter("hasOwnMetadata", hasOwnMetadata);
            /**
             * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function getMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryGetMetadata(metadataKey, target, propertyKey);
            }
            exporter("getMetadata", getMetadata);
            /**
             * Gets the metadata value for the provided metadata key on the target object.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getOwnMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function getOwnMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
            }
            exporter("getOwnMetadata", getOwnMetadata);
            /**
             * Gets the metadata keys defined on the target object or its prototype chain.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns An array of unique metadata keys.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getMetadataKeys(Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getMetadataKeys(Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getMetadataKeys(Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getMetadataKeys(Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getMetadataKeys(Example.prototype, "method");
             *
             */
            function getMetadataKeys(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryMetadataKeys(target, propertyKey);
            }
            exporter("getMetadataKeys", getMetadataKeys);
            /**
             * Gets the unique metadata keys defined on the target object.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns An array of unique metadata keys.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.getOwnMetadataKeys(Example);
             *
             *     // property (on constructor)
             *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
             *
             */
            function getOwnMetadataKeys(target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                return OrdinaryOwnMetadataKeys(target, propertyKey);
            }
            exporter("getOwnMetadataKeys", getOwnMetadataKeys);
            /**
             * Deletes the metadata entry from the target object with the provided key.
             * @param metadataKey A key used to store and retrieve metadata.
             * @param target The target object on which the metadata is defined.
             * @param propertyKey (Optional) The property key for the target.
             * @returns `true` if the metadata entry was found and deleted; otherwise, false.
             * @example
             *
             *     class Example {
             *         // property declarations are not part of ES6, though they are valid in TypeScript:
             *         // static staticProperty;
             *         // property;
             *
             *         constructor(p) { }
             *         static staticMethod(p) { }
             *         method(p) { }
             *     }
             *
             *     // constructor
             *     result = Reflect.deleteMetadata("custom:annotation", Example);
             *
             *     // property (on constructor)
             *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
             *
             *     // property (on prototype)
             *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
             *
             *     // method (on constructor)
             *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
             *
             *     // method (on prototype)
             *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
             *
             */
            function deleteMetadata(metadataKey, target, propertyKey) {
                if (!IsObject(target))
                    throw new TypeError();
                if (!IsUndefined(propertyKey))
                    propertyKey = ToPropertyKey(propertyKey);
                var metadataMap = GetOrCreateMetadataMap(target, propertyKey, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                if (!metadataMap.delete(metadataKey))
                    return false;
                if (metadataMap.size > 0)
                    return true;
                var targetMetadata = Metadata.get(target);
                targetMetadata.delete(propertyKey);
                if (targetMetadata.size > 0)
                    return true;
                Metadata.delete(target);
                return true;
            }
            exporter("deleteMetadata", deleteMetadata);
            function DecorateConstructor(decorators, target) {
                for (var i = decorators.length - 1; i >= 0; --i) {
                    var decorator = decorators[i];
                    var decorated = decorator(target);
                    if (!IsUndefined(decorated) && !IsNull(decorated)) {
                        if (!IsConstructor(decorated))
                            throw new TypeError();
                        target = decorated;
                    }
                }
                return target;
            }
            function DecorateProperty(decorators, target, propertyKey, descriptor) {
                for (var i = decorators.length - 1; i >= 0; --i) {
                    var decorator = decorators[i];
                    var decorated = decorator(target, propertyKey, descriptor);
                    if (!IsUndefined(decorated) && !IsNull(decorated)) {
                        if (!IsObject(decorated))
                            throw new TypeError();
                        descriptor = decorated;
                    }
                }
                return descriptor;
            }
            function GetOrCreateMetadataMap(O, P, Create) {
                var targetMetadata = Metadata.get(O);
                if (IsUndefined(targetMetadata)) {
                    if (!Create)
                        return undefined;
                    targetMetadata = new _Map();
                    Metadata.set(O, targetMetadata);
                }
                var metadataMap = targetMetadata.get(P);
                if (IsUndefined(metadataMap)) {
                    if (!Create)
                        return undefined;
                    metadataMap = new _Map();
                    targetMetadata.set(P, metadataMap);
                }
                return metadataMap;
            }
            // 3.1.1.1 OrdinaryHasMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasmetadata
            function OrdinaryHasMetadata(MetadataKey, O, P) {
                var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
                if (hasOwn)
                    return true;
                var parent = OrdinaryGetPrototypeOf(O);
                if (!IsNull(parent))
                    return OrdinaryHasMetadata(MetadataKey, parent, P);
                return false;
            }
            // 3.1.2.1 OrdinaryHasOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryhasownmetadata
            function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return false;
                return ToBoolean(metadataMap.has(MetadataKey));
            }
            // 3.1.3.1 OrdinaryGetMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarygetmetadata
            function OrdinaryGetMetadata(MetadataKey, O, P) {
                var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
                if (hasOwn)
                    return OrdinaryGetOwnMetadata(MetadataKey, O, P);
                var parent = OrdinaryGetPrototypeOf(O);
                if (!IsNull(parent))
                    return OrdinaryGetMetadata(MetadataKey, parent, P);
                return undefined;
            }
            // 3.1.4.1 OrdinaryGetOwnMetadata(MetadataKey, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarygetownmetadata
            function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return undefined;
                return metadataMap.get(MetadataKey);
            }
            // 3.1.5.1 OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarydefineownmetadata
            function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ true);
                metadataMap.set(MetadataKey, MetadataValue);
            }
            // 3.1.6.1 OrdinaryMetadataKeys(O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinarymetadatakeys
            function OrdinaryMetadataKeys(O, P) {
                var ownKeys = OrdinaryOwnMetadataKeys(O, P);
                var parent = OrdinaryGetPrototypeOf(O);
                if (parent === null)
                    return ownKeys;
                var parentKeys = OrdinaryMetadataKeys(parent, P);
                if (parentKeys.length <= 0)
                    return ownKeys;
                if (ownKeys.length <= 0)
                    return parentKeys;
                var set = new _Set();
                var keys = [];
                for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
                    var key = ownKeys_1[_i];
                    var hasKey = set.has(key);
                    if (!hasKey) {
                        set.add(key);
                        keys.push(key);
                    }
                }
                for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
                    var key = parentKeys_1[_a];
                    var hasKey = set.has(key);
                    if (!hasKey) {
                        set.add(key);
                        keys.push(key);
                    }
                }
                return keys;
            }
            // 3.1.7.1 OrdinaryOwnMetadataKeys(O, P)
            // https://rbuckton.github.io/reflect-metadata/#ordinaryownmetadatakeys
            function OrdinaryOwnMetadataKeys(O, P) {
                var keys = [];
                var metadataMap = GetOrCreateMetadataMap(O, P, /*Create*/ false);
                if (IsUndefined(metadataMap))
                    return keys;
                var keysObj = metadataMap.keys();
                var iterator = GetIterator(keysObj);
                var k = 0;
                while (true) {
                    var next = IteratorStep(iterator);
                    if (!next) {
                        keys.length = k;
                        return keys;
                    }
                    var nextValue = IteratorValue(next);
                    try {
                        keys[k] = nextValue;
                    }
                    catch (e) {
                        try {
                            IteratorClose(iterator);
                        }
                        finally {
                            throw e;
                        }
                    }
                    k++;
                }
            }
            // 6 ECMAScript Data Typ0es and Values
            // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
            function Type(x) {
                if (x === null)
                    return 1 /* Null */;
                switch (typeof x) {
                    case "undefined": return 0 /* Undefined */;
                    case "boolean": return 2 /* Boolean */;
                    case "string": return 3 /* String */;
                    case "symbol": return 4 /* Symbol */;
                    case "number": return 5 /* Number */;
                    case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
                    default: return 6 /* Object */;
                }
            }
            // 6.1.1 The Undefined Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
            function IsUndefined(x) {
                return x === undefined;
            }
            // 6.1.2 The Null Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
            function IsNull(x) {
                return x === null;
            }
            // 6.1.5 The Symbol Type
            // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
            function IsSymbol(x) {
                return typeof x === "symbol";
            }
            // 6.1.7 The Object Type
            // https://tc39.github.io/ecma262/#sec-object-type
            function IsObject(x) {
                return typeof x === "object" ? x !== null : typeof x === "function";
            }
            // 7.1 Type Conversion
            // https://tc39.github.io/ecma262/#sec-type-conversion
            // 7.1.1 ToPrimitive(input [, PreferredType])
            // https://tc39.github.io/ecma262/#sec-toprimitive
            function ToPrimitive(input, PreferredType) {
                switch (Type(input)) {
                    case 0 /* Undefined */: return input;
                    case 1 /* Null */: return input;
                    case 2 /* Boolean */: return input;
                    case 3 /* String */: return input;
                    case 4 /* Symbol */: return input;
                    case 5 /* Number */: return input;
                }
                var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
                var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
                if (exoticToPrim !== undefined) {
                    var result = exoticToPrim.call(input, hint);
                    if (IsObject(result))
                        throw new TypeError();
                    return result;
                }
                return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
            }
            // 7.1.1.1 OrdinaryToPrimitive(O, hint)
            // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
            function OrdinaryToPrimitive(O, hint) {
                if (hint === "string") {
                    var toString_1 = O.toString;
                    if (IsCallable(toString_1)) {
                        var result = toString_1.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                    var valueOf = O.valueOf;
                    if (IsCallable(valueOf)) {
                        var result = valueOf.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                }
                else {
                    var valueOf = O.valueOf;
                    if (IsCallable(valueOf)) {
                        var result = valueOf.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                    var toString_2 = O.toString;
                    if (IsCallable(toString_2)) {
                        var result = toString_2.call(O);
                        if (!IsObject(result))
                            return result;
                    }
                }
                throw new TypeError();
            }
            // 7.1.2 ToBoolean(argument)
            // https://tc39.github.io/ecma262/2016/#sec-toboolean
            function ToBoolean(argument) {
                return !!argument;
            }
            // 7.1.12 ToString(argument)
            // https://tc39.github.io/ecma262/#sec-tostring
            function ToString(argument) {
                return "" + argument;
            }
            // 7.1.14 ToPropertyKey(argument)
            // https://tc39.github.io/ecma262/#sec-topropertykey
            function ToPropertyKey(argument) {
                var key = ToPrimitive(argument, 3 /* String */);
                if (IsSymbol(key))
                    return key;
                return ToString(key);
            }
            // 7.2 Testing and Comparison Operations
            // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
            // 7.2.2 IsArray(argument)
            // https://tc39.github.io/ecma262/#sec-isarray
            function IsArray(argument) {
                return Array.isArray
                    ? Array.isArray(argument)
                    : argument instanceof Object
                        ? argument instanceof Array
                        : Object.prototype.toString.call(argument) === "[object Array]";
            }
            // 7.2.3 IsCallable(argument)
            // https://tc39.github.io/ecma262/#sec-iscallable
            function IsCallable(argument) {
                // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
                return typeof argument === "function";
            }
            // 7.2.4 IsConstructor(argument)
            // https://tc39.github.io/ecma262/#sec-isconstructor
            function IsConstructor(argument) {
                // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
                return typeof argument === "function";
            }
            // 7.2.7 IsPropertyKey(argument)
            // https://tc39.github.io/ecma262/#sec-ispropertykey
            function IsPropertyKey(argument) {
                switch (Type(argument)) {
                    case 3 /* String */: return true;
                    case 4 /* Symbol */: return true;
                    default: return false;
                }
            }
            // 7.3 Operations on Objects
            // https://tc39.github.io/ecma262/#sec-operations-on-objects
            // 7.3.9 GetMethod(V, P)
            // https://tc39.github.io/ecma262/#sec-getmethod
            function GetMethod(V, P) {
                var func = V[P];
                if (func === undefined || func === null)
                    return undefined;
                if (!IsCallable(func))
                    throw new TypeError();
                return func;
            }
            // 7.4 Operations on Iterator Objects
            // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
            function GetIterator(obj) {
                var method = GetMethod(obj, iteratorSymbol);
                if (!IsCallable(method))
                    throw new TypeError(); // from Call
                var iterator = method.call(obj);
                if (!IsObject(iterator))
                    throw new TypeError();
                return iterator;
            }
            // 7.4.4 IteratorValue(iterResult)
            // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
            function IteratorValue(iterResult) {
                return iterResult.value;
            }
            // 7.4.5 IteratorStep(iterator)
            // https://tc39.github.io/ecma262/#sec-iteratorstep
            function IteratorStep(iterator) {
                var result = iterator.next();
                return result.done ? false : result;
            }
            // 7.4.6 IteratorClose(iterator, completion)
            // https://tc39.github.io/ecma262/#sec-iteratorclose
            function IteratorClose(iterator) {
                var f = iterator["return"];
                if (f)
                    f.call(iterator);
            }
            // 9.1 Ordinary Object Internal Methods and Internal Slots
            // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
            // 9.1.1.1 OrdinaryGetPrototypeOf(O)
            // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
            function OrdinaryGetPrototypeOf(O) {
                var proto = Object.getPrototypeOf(O);
                if (typeof O !== "function" || O === functionPrototype)
                    return proto;
                // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
                // Try to determine the superclass constructor. Compatible implementations
                // must either set __proto__ on a subclass constructor to the superclass constructor,
                // or ensure each class has a valid `constructor` property on its prototype that
                // points back to the constructor.
                // If this is not the same as Function.[[Prototype]], then this is definately inherited.
                // This is the case when in ES6 or when using __proto__ in a compatible browser.
                if (proto !== functionPrototype)
                    return proto;
                // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
                var prototype = O.prototype;
                var prototypeProto = prototype && Object.getPrototypeOf(prototype);
                if (prototypeProto == null || prototypeProto === Object.prototype)
                    return proto;
                // If the constructor was not a function, then we cannot determine the heritage.
                var constructor = prototypeProto.constructor;
                if (typeof constructor !== "function")
                    return proto;
                // If we have some kind of self-reference, then we cannot determine the heritage.
                if (constructor === O)
                    return proto;
                // we have a pretty good guess at the heritage.
                return constructor;
            }
            // naive Map shim
            function CreateMapPolyfill() {
                var cacheSentinel = {};
                var arraySentinel = [];
                var MapIterator = /** @class */ (function () {
                    function MapIterator(keys, values, selector) {
                        this._index = 0;
                        this._keys = keys;
                        this._values = values;
                        this._selector = selector;
                    }
                    MapIterator.prototype["@@iterator"] = function () { return this; };
                    MapIterator.prototype[iteratorSymbol] = function () { return this; };
                    MapIterator.prototype.next = function () {
                        var index = this._index;
                        if (index >= 0 && index < this._keys.length) {
                            var result = this._selector(this._keys[index], this._values[index]);
                            if (index + 1 >= this._keys.length) {
                                this._index = -1;
                                this._keys = arraySentinel;
                                this._values = arraySentinel;
                            }
                            else {
                                this._index++;
                            }
                            return { value: result, done: false };
                        }
                        return { value: undefined, done: true };
                    };
                    MapIterator.prototype.throw = function (error) {
                        if (this._index >= 0) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        throw error;
                    };
                    MapIterator.prototype.return = function (value) {
                        if (this._index >= 0) {
                            this._index = -1;
                            this._keys = arraySentinel;
                            this._values = arraySentinel;
                        }
                        return { value: value, done: true };
                    };
                    return MapIterator;
                }());
                return /** @class */ (function () {
                    function Map() {
                        this._keys = [];
                        this._values = [];
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    }
                    Object.defineProperty(Map.prototype, "size", {
                        get: function () { return this._keys.length; },
                        enumerable: true,
                        configurable: true
                    });
                    Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
                    Map.prototype.get = function (key) {
                        var index = this._find(key, /*insert*/ false);
                        return index >= 0 ? this._values[index] : undefined;
                    };
                    Map.prototype.set = function (key, value) {
                        var index = this._find(key, /*insert*/ true);
                        this._values[index] = value;
                        return this;
                    };
                    Map.prototype.delete = function (key) {
                        var index = this._find(key, /*insert*/ false);
                        if (index >= 0) {
                            var size = this._keys.length;
                            for (var i = index + 1; i < size; i++) {
                                this._keys[i - 1] = this._keys[i];
                                this._values[i - 1] = this._values[i];
                            }
                            this._keys.length--;
                            this._values.length--;
                            if (key === this._cacheKey) {
                                this._cacheKey = cacheSentinel;
                                this._cacheIndex = -2;
                            }
                            return true;
                        }
                        return false;
                    };
                    Map.prototype.clear = function () {
                        this._keys.length = 0;
                        this._values.length = 0;
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    };
                    Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
                    Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
                    Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
                    Map.prototype["@@iterator"] = function () { return this.entries(); };
                    Map.prototype[iteratorSymbol] = function () { return this.entries(); };
                    Map.prototype._find = function (key, insert) {
                        if (this._cacheKey !== key) {
                            this._cacheIndex = this._keys.indexOf(this._cacheKey = key);
                        }
                        if (this._cacheIndex < 0 && insert) {
                            this._cacheIndex = this._keys.length;
                            this._keys.push(key);
                            this._values.push(undefined);
                        }
                        return this._cacheIndex;
                    };
                    return Map;
                }());
                function getKey(key, _) {
                    return key;
                }
                function getValue(_, value) {
                    return value;
                }
                function getEntry(key, value) {
                    return [key, value];
                }
            }
            // naive Set shim
            function CreateSetPolyfill() {
                return /** @class */ (function () {
                    function Set() {
                        this._map = new _Map();
                    }
                    Object.defineProperty(Set.prototype, "size", {
                        get: function () { return this._map.size; },
                        enumerable: true,
                        configurable: true
                    });
                    Set.prototype.has = function (value) { return this._map.has(value); };
                    Set.prototype.add = function (value) { return this._map.set(value, value), this; };
                    Set.prototype.delete = function (value) { return this._map.delete(value); };
                    Set.prototype.clear = function () { this._map.clear(); };
                    Set.prototype.keys = function () { return this._map.keys(); };
                    Set.prototype.values = function () { return this._map.values(); };
                    Set.prototype.entries = function () { return this._map.entries(); };
                    Set.prototype["@@iterator"] = function () { return this.keys(); };
                    Set.prototype[iteratorSymbol] = function () { return this.keys(); };
                    return Set;
                }());
            }
            // naive WeakMap shim
            function CreateWeakMapPolyfill() {
                var UUID_SIZE = 16;
                var keys = HashMap.create();
                var rootKey = CreateUniqueKey();
                return /** @class */ (function () {
                    function WeakMap() {
                        this._key = CreateUniqueKey();
                    }
                    WeakMap.prototype.has = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? HashMap.has(table, this._key) : false;
                    };
                    WeakMap.prototype.get = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? HashMap.get(table, this._key) : undefined;
                    };
                    WeakMap.prototype.set = function (target, value) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                        table[this._key] = value;
                        return this;
                    };
                    WeakMap.prototype.delete = function (target) {
                        var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                        return table !== undefined ? delete table[this._key] : false;
                    };
                    WeakMap.prototype.clear = function () {
                        // NOTE: not a real clear, just makes the previous data unreachable
                        this._key = CreateUniqueKey();
                    };
                    return WeakMap;
                }());
                function CreateUniqueKey() {
                    var key;
                    do
                        key = "@@WeakMap@@" + CreateUUID();
                    while (HashMap.has(keys, key));
                    keys[key] = true;
                    return key;
                }
                function GetOrCreateWeakMapTable(target, create) {
                    if (!hasOwn.call(target, rootKey)) {
                        if (!create)
                            return undefined;
                        Object.defineProperty(target, rootKey, { value: HashMap.create() });
                    }
                    return target[rootKey];
                }
                function FillRandomBytes(buffer, size) {
                    for (var i = 0; i < size; ++i)
                        buffer[i] = Math.random() * 0xff | 0;
                    return buffer;
                }
                function GenRandomBytes(size) {
                    if (typeof Uint8Array === "function") {
                        if (typeof crypto !== "undefined")
                            return crypto.getRandomValues(new Uint8Array(size));
                        if (typeof msCrypto !== "undefined")
                            return msCrypto.getRandomValues(new Uint8Array(size));
                        return FillRandomBytes(new Uint8Array(size), size);
                    }
                    return FillRandomBytes(new Array(size), size);
                }
                function CreateUUID() {
                    var data = GenRandomBytes(UUID_SIZE);
                    // mark as random - RFC 4122 § 4.4
                    data[6] = data[6] & 0x4f | 0x40;
                    data[8] = data[8] & 0xbf | 0x80;
                    var result = "";
                    for (var offset = 0; offset < UUID_SIZE; ++offset) {
                        var byte = data[offset];
                        if (offset === 4 || offset === 6 || offset === 8)
                            result += "-";
                        if (byte < 16)
                            result += "0";
                        result += byte.toString(16).toLowerCase();
                    }
                    return result;
                }
            }
            // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
            function MakeDictionary(obj) {
                obj.__ = undefined;
                delete obj.__;
                return obj;
            }
        });
    })(Reflect$1 || (Reflect$1 = {}));

    /*
     * Copyright [2019] [Doric.Pub]
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function hookBeforeNativeCall(context) {
        if (context) {
            setContext(context);
            context.hookBeforeNativeCall();
        }
    }
    function getContext() {
        return Reflect.getMetadata('__doric_context__', global$1);
    }
    function setContext(context) {
        Reflect.defineMetadata('__doric_context__', context, global$1);
    }
    function jsCallResolve(contextId, callbackId, args) {
        const context = gContexts.get(contextId);
        if (context === undefined) {
            loge(`Cannot find context for context id:${contextId}`);
            return;
        }
        const callback = context.callbacks.get(callbackId);
        if (callback === undefined) {
            loge(`Cannot find call for context id:${contextId},callback id:${callbackId}`);
            return;
        }
        const argumentsList = [];
        for (let i = 2; i < arguments.length; i++) {
            argumentsList.push(arguments[i]);
        }
        hookBeforeNativeCall(context);
        Reflect.apply(callback.resolve, context, argumentsList);
        if (callback.retained !== true) {
            context.callbacks.delete(callbackId);
        }
    }
    function jsCallReject(contextId, callbackId, args) {
        const context = gContexts.get(contextId);
        if (context === undefined) {
            loge(`Cannot find context for context id:${contextId}`);
            return;
        }
        const callback = context.callbacks.get(callbackId);
        if (callback === undefined) {
            loge(`Cannot find call for context id:${contextId},callback id:${callbackId}`);
            return;
        }
        const argumentsList = [];
        for (let i = 2; i < arguments.length; i++) {
            argumentsList.push(arguments[i]);
        }
        hookBeforeNativeCall(context);
        Reflect.apply(callback.reject, context.entity, argumentsList);
        if (callback.retained !== true) {
            context.callbacks.delete(callbackId);
        }
    }
    class Context {
        hookBeforeNativeCall() {
            if (this.entity && Reflect.has(this.entity, 'hookBeforeNativeCall')) {
                Reflect.apply(Reflect.get(this.entity, 'hookBeforeNativeCall'), this.entity, []);
            }
        }
        hookAfterNativeCall() {
            if (this.entity && Reflect.has(this.entity, 'hookAfterNativeCall')) {
                Reflect.apply(Reflect.get(this.entity, 'hookAfterNativeCall'), this.entity, []);
            }
        }
        constructor(id) {
            this.callbacks = new Map;
            this.classes = new Map;
            this.id = id;
            return new Proxy(this, {
                get: (target, p) => {
                    if (Reflect.has(target, p)) {
                        return Reflect.get(target, p);
                    }
                    else {
                        const namespace = p;
                        return new Proxy({}, {
                            get: (target, p) => {
                                if (Reflect.has(target, p)) {
                                    return Reflect.get(target, p);
                                }
                                else {
                                    const context = this;
                                    return function () {
                                        const args = [];
                                        args.push(namespace);
                                        args.push(p);
                                        for (let arg of arguments) {
                                            args.push(arg);
                                        }
                                        return Reflect.apply(context.callNative, context, args);
                                    };
                                }
                            }
                        });
                    }
                }
            });
        }
        callNative(namespace, method, args) {
            const callbackId = uniqueId('callback');
            return new Promise((resolve, reject) => {
                this.callbacks.set(callbackId, {
                    resolve,
                    reject,
                });
                nativeBridge(this.id, namespace, method, callbackId, args);
            });
        }
        register(instance) {
            this.entity = instance;
        }
        function2Id(func) {
            const functionId = uniqueId('function');
            this.callbacks.set(functionId, {
                resolve: func,
                reject: () => { loge("This should not be called"); },
                retained: true,
            });
            return functionId;
        }
        removeFuncById(funcId) {
            this.callbacks.delete(funcId);
        }
    }
    const gContexts = new Map;
    const gModules = new Map;
    function allContexts() {
        return gContexts.values();
    }
    function jsObtainContext(id) {
        if (gContexts.has(id)) {
            const context = gContexts.get(id);
            setContext(context);
            return context;
        }
        else {
            const context = new Context(id);
            gContexts.set(id, context);
            setContext(context);
            return context;
        }
    }
    function jsReleaseContext(id) {
        const context = gContexts.get(id);
        const args = arguments;
        if (context) {
            timerInfos.forEach((v, k) => {
                if (v.context === context) {
                    if (global$1.nativeClearTimer === undefined) {
                        return Reflect.apply(_clearTimeout, undefined, args);
                    }
                    timerInfos.delete(k);
                    nativeClearTimer(k);
                }
            });
        }
        gContexts.delete(id);
    }
    function __require__(name) {
        if (gModules.has(name)) {
            return gModules.get(name);
        }
        else {
            if (nativeRequire(name)) {
                return gModules.get(name);
            }
            else {
                return undefined;
            }
        }
    }
    function jsRegisterModule(name, moduleObject) {
        gModules.set(name, moduleObject);
    }
    function jsCallEntityMethod(contextId, methodName, args) {
        const context = gContexts.get(contextId);
        if (context === undefined) {
            loge(`Cannot find context for context id:${contextId}`);
            return;
        }
        if (context.entity === undefined) {
            loge(`Cannot find holder for context id:${contextId}`);
            return;
        }
        if (Reflect.has(context.entity, methodName)) {
            const argumentsList = [];
            for (let i = 2; i < arguments.length; i++) {
                argumentsList.push(arguments[i]);
            }
            hookBeforeNativeCall(context);
            const ret = Reflect.apply(Reflect.get(context.entity, methodName), context.entity, argumentsList);
            return ret;
        }
        else {
            loge(`Cannot find method for context id:${contextId},method name is:${methodName}`);
        }
    }
    function pureCallEntityMethod(contextId, methodName, args) {
        const context = gContexts.get(contextId);
        if (context === undefined) {
            loge(`Cannot find context for context id:${contextId}`);
            return;
        }
        if (context.entity === undefined) {
            loge(`Cannot find holder for context id:${contextId}`);
            return;
        }
        if (Reflect.has(context.entity, methodName)) {
            const argumentsList = [];
            for (let i = 2; i < arguments.length; i++) {
                argumentsList.push(arguments[i]);
            }
            hookBeforeNativeCall(context);
            return Reflect.apply(Reflect.get(context.entity, methodName), context.entity, argumentsList);
        }
        else {
            loge(`Cannot find method for context id:${contextId},method name is:${methodName}`);
        }
    }
    function jsObtainEntry(contextId) {
        const context = jsObtainContext(contextId);
        const exportFunc = (constructor) => {
            context === null || context === void 0 ? void 0 : context.classes.set(constructor.name, constructor);
            const ret = new constructor;
            Reflect.set(ret, 'context', context);
            context === null || context === void 0 ? void 0 : context.register(ret);
            return constructor;
        };
        return function () {
            if (arguments.length === 1) {
                const args = arguments[0];
                if (args instanceof Array) {
                    args.forEach(clz => {
                        context === null || context === void 0 ? void 0 : context.classes.set(clz.name, clz);
                    });
                    return exportFunc;
                }
                else {
                    return exportFunc(args);
                }
            }
            else if (arguments.length === 2) {
                const srcContextId = arguments[0];
                const className = arguments[1];
                const srcContext = gContexts.get(srcContextId);
                if (srcContext) {
                    srcContext.classes.forEach((v, k) => {
                        context === null || context === void 0 ? void 0 : context.classes.set(k, v);
                    });
                    const clz = srcContext.classes.get(className);
                    if (clz) {
                        return exportFunc(clz);
                    }
                    else {
                        throw new Error(`Cannot find class:${className} in context:${srcContextId}`);
                    }
                }
                else {
                    throw new Error(`Cannot find context for ${srcContextId}`);
                }
            }
            else {
                throw new Error(`Entry arguments error:${arguments}`);
            }
        };
    }
    const global$1 = Function('return this')();
    if (global$1.Environment
        && (Environment.platform === 'Android'
            || Environment.platform === 'iOS'
            || Environment.platform === 'Qt')) {
        Reflect.set(global$1, "console", {
            warn: logw,
            error: loge,
            log: log
        });
    }
    let __timerId__ = 1;
    const timerInfos = new Map;
    const _setTimeout = global$1.setTimeout;
    const _setInterval = global$1.setInterval;
    const _clearTimeout = global$1.clearTimeout;
    const _clearInterval = global$1.clearInterval;
    const doricSetTimeout = function (handler, timeout, ...args) {
        if (global$1.nativeSetTimer === undefined) {
            return Reflect.apply(_setTimeout, undefined, arguments);
        }
        const id = __timerId__++;
        timerInfos.set(id, {
            callback: () => {
                Reflect.apply(handler, undefined, args);
                timerInfos.delete(id);
            },
            context: getContext(),
        });
        nativeSetTimer(id, timeout || 0, false);
        return id;
    };
    const doricSetInterval = function (handler, timeout, ...args) {
        if (global$1.nativeSetTimer === undefined) {
            return Reflect.apply(_setInterval, undefined, arguments);
        }
        const id = __timerId__++;
        timerInfos.set(id, {
            callback: () => {
                Reflect.apply(handler, undefined, args);
            },
            context: getContext(),
        });
        nativeSetTimer(id, timeout || 0, true);
        return id;
    };
    const doricClearTimeout = function (timerId) {
        if (global$1.nativeClearTimer === undefined) {
            return Reflect.apply(_clearTimeout, undefined, arguments);
        }
        timerInfos.delete(timerId);
        nativeClearTimer(timerId);
    };
    const doricClearInterval = function (timerId) {
        if (global$1.nativeClearTimer === undefined) {
            return Reflect.apply(_clearInterval, undefined, arguments);
        }
        timerInfos.delete(timerId);
        nativeClearTimer(timerId);
    };
    if (!global$1.setTimeout) {
        global$1.setTimeout = doricSetTimeout;
    }
    else {
        global$1.doricSetTimeout = doricSetTimeout;
    }
    if (!global$1.setInterval) {
        global$1.setInterval = doricSetInterval;
    }
    else {
        global$1.doricSetInterval = doricSetInterval;
    }
    if (!global$1.clearTimeout) {
        global$1.clearTimeout = doricClearTimeout;
    }
    else {
        global$1.doricClearTimeout = doricClearTimeout;
    }
    if (!global$1.clearInterval) {
        global$1.clearInterval = doricClearInterval;
    }
    else {
        global$1.doricClearInterval = doricClearInterval;
    }
    function jsCallbackTimer(timerId) {
        const timerInfo = timerInfos.get(timerId);
        if (timerInfo === undefined) {
            return;
        }
        if (timerInfo.callback instanceof Function) {
            setContext(timerInfo.context);
            hookBeforeNativeCall(timerInfo.context);
            Reflect.apply(timerInfo.callback, timerInfo.context, []);
        }
    }
    function jsHookAfterNativeCall() {
        const context = getContext();
        context === null || context === void 0 ? void 0 : context.hookAfterNativeCall();
    }

    exports.Context = Context;
    exports.__require__ = __require__;
    exports.allContexts = allContexts;
    exports.jsCallEntityMethod = jsCallEntityMethod;
    exports.jsCallReject = jsCallReject;
    exports.jsCallResolve = jsCallResolve;
    exports.jsCallbackTimer = jsCallbackTimer;
    exports.jsHookAfterNativeCall = jsHookAfterNativeCall;
    exports.jsObtainContext = jsObtainContext;
    exports.jsObtainEntry = jsObtainEntry;
    exports.jsRegisterModule = jsRegisterModule;
    exports.jsReleaseContext = jsReleaseContext;
    exports.pureCallEntityMethod = pureCallEntityMethod;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});

/**--------SandBox--------*/

/**++++++++Lib++++++++*/
Reflect.apply(doric.jsRegisterModule,this,["doric",Reflect.apply(function(__module){(function(module,exports,require){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function obj2Model(obj, convertor) {
    if (obj instanceof Function) {
        return convertor(obj);
    }
    else if (obj instanceof Array) {
        return obj.map(e => obj2Model(e, convertor));
    }
    else if (obj instanceof Object) {
        if (Reflect.has(obj, 'toModel') && Reflect.get(obj, 'toModel') instanceof Function) {
            obj = Reflect.apply(Reflect.get(obj, 'toModel'), obj, []);
            return obj;
        }
        else {
            for (let key in obj) {
                const val = Reflect.get(obj, key);
                Reflect.set(obj, key, obj2Model(val, convertor));
            }
            return obj;
        }
    }
    else {
        return obj;
    }
}
class Mutable {
    constructor(v) {
        this.binders = new Set;
        this.get = () => {
            return this.val;
        };
        this.set = (v) => {
            this.val = v;
            this.binders.forEach(e => {
                Reflect.apply(e, undefined, [this.val]);
            });
        };
        this.val = v;
    }
    bind(binder) {
        this.binders.add(binder);
        Reflect.apply(binder, undefined, [this.val]);
    }
    static of(v) {
        return new Mutable(v);
    }
}

/*
 * Copyright [2019] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
let __uniqueId__ = 0;
function uniqueId(prefix) {
    return `__${prefix}_${__uniqueId__++}__`;
}

function toString(message) {
    if (message instanceof Function) {
        return message.toString();
    }
    else if (message instanceof Object) {
        try {
            return JSON.stringify(message);
        }
        catch (e) {
            return message.toString();
        }
    }
    else if (message === undefined) {
        return "undefined";
    }
    else {
        return message.toString();
    }
}
function log(...args) {
    let out = "";
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) {
            out += ',';
        }
        out += toString(arguments[i]);
    }
    nativeLog('d', out);
}
function loge(...message) {
    let out = "";
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) {
            out += ',';
        }
        out += toString(arguments[i]);
    }
    nativeLog('e', out);
}
function logw(...message) {
    let out = "";
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) {
            out += ',';
        }
        out += toString(arguments[i]);
    }
    nativeLog('w', out);
}

var __decorate$g = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$g = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const PROP_CONSIST = 1;
const PROP_INCONSIST = 2;
const PROP_KEY_VIEW_TYPE = "ViewType";
function Property(target, propKey) {
    Reflect.defineMetadata(propKey, PROP_CONSIST, target);
}
function InconsistProperty(target, propKey) {
    Reflect.defineMetadata(propKey, PROP_INCONSIST, target);
}
function ViewComponent(constructor) {
    const name = Reflect.getMetadata(PROP_KEY_VIEW_TYPE, constructor) || Object.getPrototypeOf(constructor).name;
    Reflect.defineMetadata(PROP_KEY_VIEW_TYPE, name, constructor);
}
class Ref {
    set current(v) {
        this.view = v;
    }
    get current() {
        if (!!!this.view) {
            throw new Error("Ref is empty");
        }
        return this.view;
    }
    apply(config) {
        if (this.view) {
            this.view.apply(config);
        }
    }
}
function createRef() {
    return new Ref;
}
class View {
    callback2Id(f) {
        const id = uniqueId('Function');
        this.callbacks.set(id, f);
        return id;
    }
    id2Callback(id) {
        let f = this.callbacks.get(id);
        if (f === undefined) {
            f = Reflect.get(this, id);
        }
        return f;
    }
    findViewByTag(tag) {
        if (tag === this.tag) {
            return this;
        }
        return undefined;
    }
    constructor() {
        this.width = 0;
        this.height = 0;
        this.x = 0;
        this.y = 0;
        this.viewId = uniqueId('ViewId');
        this.callbacks = new Map;
        /** Anchor end*/
        this.__dirty_props__ = {};
        this.nativeViewModel = {
            id: this.viewId,
            type: this.viewType(),
            props: this.__dirty_props__,
        };
        return new Proxy(this, {
            get: (target, p, receiver) => {
                return Reflect.get(target, p, receiver);
            },
            set: (target, p, v, receiver) => {
                const oldV = Reflect.get(target, p, receiver);
                const ret = Reflect.set(target, p, v, receiver);
                if (Reflect.getMetadata(p, target) === PROP_CONSIST && oldV !== v) {
                    receiver.onPropertyChanged(p.toString(), oldV, v);
                }
                else if (Reflect.getMetadata(p, target) === PROP_INCONSIST) {
                    receiver.onPropertyChanged(p.toString(), oldV, v);
                }
                return ret;
            }
        });
    }
    /** Anchor start*/
    get left() {
        return this.x;
    }
    set left(v) {
        this.x = v;
    }
    get right() {
        return this.x + this.width;
    }
    set right(v) {
        this.x = v - this.width;
    }
    get top() {
        return this.y;
    }
    set top(v) {
        this.y = v;
    }
    get bottom() {
        return this.y + this.height;
    }
    set bottom(v) {
        this.y = v - this.height;
    }
    get centerX() {
        return this.x + this.width / 2;
    }
    get centerY() {
        return this.y + this.height / 2;
    }
    set centerX(v) {
        this.x = v - this.width / 2;
    }
    set centerY(v) {
        this.y = v - this.height / 2;
    }
    get dirtyProps() {
        return this.__dirty_props__;
    }
    viewType() {
        const viewType = Reflect.getMetadata(PROP_KEY_VIEW_TYPE, this.constructor);
        return viewType || this.constructor.name;
    }
    onPropertyChanged(propKey, oldV, newV) {
        if (newV instanceof Function) {
            newV = this.callback2Id(newV);
        }
        else {
            newV = obj2Model(newV, (v) => this.callback2Id(v));
        }
        this.__dirty_props__[propKey] = newV;
    }
    clean() {
        for (const key in this.__dirty_props__) {
            if (Reflect.has(this.__dirty_props__, key)) {
                Reflect.deleteProperty(this.__dirty_props__, key);
            }
        }
    }
    isDirty() {
        return Reflect.ownKeys(this.__dirty_props__).length !== 0;
    }
    responseCallback(id, ...args) {
        const f = this.id2Callback(id);
        if (f instanceof Function) {
            const argumentsList = [];
            for (let i = 1; i < arguments.length; i++) {
                argumentsList.push(arguments[i]);
            }
            return Reflect.apply(f, this, argumentsList);
        }
        else {
            loge(`Cannot find callback:${id} for ${JSON.stringify(this.toModel())}`);
        }
    }
    toModel() {
        return this.nativeViewModel;
    }
    let(block) {
        block(this);
    }
    also(block) {
        block(this);
        return this;
    }
    apply(config) {
        for (let key in config) {
            Reflect.set(this, key, Reflect.get(config, key, config), this);
        }
        return this;
    }
    in(group) {
        group.addChild(this);
        return this;
    }
    nativeChannel(context, name) {
        let thisView = this;
        return function (args = undefined) {
            const viewIds = [];
            while (thisView != undefined) {
                viewIds.push(thisView.viewId);
                thisView = thisView.superview;
            }
            const params = {
                viewIds: viewIds.reverse(),
                name,
                args,
            };
            return context.callNative('shader', 'command', params);
        };
    }
    getWidth(context) {
        return this.nativeChannel(context, 'getWidth')();
    }
    getHeight(context) {
        return this.nativeChannel(context, 'getHeight')();
    }
    getX(context) {
        return this.nativeChannel(context, 'getX')();
    }
    getY(context) {
        return this.nativeChannel(context, 'getY')();
    }
    getLocationOnScreen(context) {
        return this.nativeChannel(context, "getLocationOnScreen")();
    }
    set props(props) {
        this.apply(props);
    }
    set parent(v) {
        this.in(v);
    }
    set ref(ref) {
        ref.current = this;
        this._ref = ref;
    }
    doAnimation(context, animation) {
        return this.nativeChannel(context, "doAnimation")(animation.toModel()).then((args) => {
            for (let key in args) {
                Reflect.set(this, key, Reflect.get(args, key, args), this);
                Reflect.deleteProperty(this.__dirty_props__, key);
            }
        });
    }
    clearAnimation(context, animation) {
        return this.nativeChannel(context, "clearAnimation")(animation.id).then(() => {
            this.__dirty_props__.translationX = this.translationX || 0;
            this.__dirty_props__.translationY = this.translationY || 0;
            this.__dirty_props__.scaleX = this.scaleX || 1;
            this.__dirty_props__.scaleY = this.scaleY || 1;
            this.__dirty_props__.rotation = this.rotation || 0;
        });
    }
    cancelAnimation(context, animation) {
        return this.nativeChannel(context, "cancelAnimation")(animation.id).then((args) => {
            for (let key in args) {
                Reflect.set(this, key, Reflect.get(args, key, args), this);
                Reflect.deleteProperty(this.__dirty_props__, key);
            }
        });
    }
    static isViewClass() {
        return true;
    }
}
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "width", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "height", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "x", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "y", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "backgroundColor", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "corners", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "border", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "shadow", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "alpha", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Boolean)
], View.prototype, "hidden", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "layoutConfig", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Function)
], View.prototype, "onClick", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "translationX", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "translationY", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "scaleX", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "scaleY", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "pivotX", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "pivotY", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "rotation", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "rotationX", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "rotationY", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Number)
], View.prototype, "perspective", void 0);
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], View.prototype, "flexConfig", void 0);
class Superview extends View {
    subviewById(id) {
        for (let v of this.allSubviews()) {
            if (v.viewId === id) {
                return v;
            }
        }
    }
    findViewByTag(tag) {
        if (tag === this.tag) {
            return this;
        }
        return this.findViewTraversal(this, tag);
    }
    findViewTraversal(view, tag) {
        for (let v of view.allSubviews()) {
            let find = v.findViewByTag(tag);
            if (find) {
                return find;
            }
        }
        return undefined;
    }
    isDirty() {
        if (super.isDirty()) {
            return true;
        }
        else {
            for (const v of this.allSubviews()) {
                if (v.isDirty()) {
                    return true;
                }
            }
        }
        return false;
    }
    clean() {
        for (let v of this.allSubviews()) {
            v.clean();
        }
        super.clean();
    }
    toModel() {
        const subviews = [];
        for (let v of this.allSubviews()) {
            if (v != undefined) {
                if (v.superview && v.superview !== this) {
                    //It had been added to another view, need to be marked totally
                    for (let key in v) {
                        if (Reflect.getMetadata(key, v) === PROP_CONSIST || Reflect.getMetadata(key, v) === PROP_INCONSIST) {
                            v.onPropertyChanged(key, undefined, Reflect.get(v, key));
                        }
                        if (v instanceof Superview) {
                            for (const subview of v.allSubviews()) {
                                subview.superview = {};
                            }
                        }
                        if (v instanceof Group) {
                            v.dirtyProps.children = v.children.map(e => e.viewId);
                        }
                    }
                }
                v.superview = this;
                if (v.isDirty()) {
                    subviews.push(v.toModel());
                }
            }
        }
        this.dirtyProps.subviews = subviews;
        return super.toModel();
    }
}
class Group extends Superview {
    constructor() {
        super(...arguments);
        this.children = new Proxy([], {
            set: (target, index, value) => {
                const ret = Reflect.set(target, index, value);
                // Let getDirty return true
                this.dirtyProps.children = target.map(e => e.viewId);
                return ret;
            }
        });
    }
    allSubviews() {
        return this.children;
    }
    addChild(view) {
        this.children.push(view);
    }
    removeChild(view) {
        const ret = this.children.filter(e => e !== view);
        this.children.length = 0;
        ret.forEach(e => this.addChild(e));
    }
    removeAllChildren() {
        this.children.length = 0;
    }
    addInnerElement(e) {
        if (e instanceof Array) {
            e.forEach(e => this.addInnerElement(e));
        }
        else if (e instanceof View) {
            this.addChild(e);
        }
        else if (!!e) {
            loge(`Not allowed to add ${typeof e}`);
        }
    }
    set innerElement(e) {
        this.addInnerElement(e);
    }
}
__decorate$g([
    Property,
    __metadata$g("design:type", Object)
], Group.prototype, "padding", void 0);

const SPECIFIED = 1;
const START = 1 << 1;
const END = 1 << 2;
const SHIFT_X = 0;
const SHIFT_Y = 4;
const LEFT = (START | SPECIFIED) << SHIFT_X;
const RIGHT = (END | SPECIFIED) << SHIFT_X;
const TOP = (START | SPECIFIED) << SHIFT_Y;
const BOTTOM = (END | SPECIFIED) << SHIFT_Y;
const CENTER_X = SPECIFIED << SHIFT_X;
const CENTER_Y = SPECIFIED << SHIFT_Y;
const CENTER = CENTER_X | CENTER_Y;
class Gravity {
    constructor() {
        this.val = 0;
    }
    left() {
        const val = this.val | LEFT;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    right() {
        const val = this.val | RIGHT;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    top() {
        const val = this.val | TOP;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    bottom() {
        const val = this.val | BOTTOM;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    center() {
        const val = this.val | CENTER;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    centerX() {
        const val = this.val | CENTER_X;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    centerY() {
        const val = this.val | CENTER_Y;
        const ret = new Gravity;
        ret.val = val;
        return ret;
    }
    toModel() {
        return this.val;
    }
}
Gravity.origin = new Gravity;
Gravity.Center = Gravity.origin.center();
Gravity.CenterX = Gravity.origin.centerX();
Gravity.CenterY = Gravity.origin.centerY();
Gravity.Left = Gravity.origin.left();
Gravity.Right = Gravity.origin.right();
Gravity.Top = Gravity.origin.top();
Gravity.Bottom = Gravity.origin.bottom();
function gravity() {
    return new Gravity;
}

exports.LayoutSpec = void 0;
(function (LayoutSpec) {
    /**
     * Depends on what's been set on width or height.
    */
    LayoutSpec[LayoutSpec["JUST"] = 0] = "JUST";
    /**
     * Depends on it's content.
     */
    LayoutSpec[LayoutSpec["FIT"] = 1] = "FIT";
    /**
     * Extend as much as parent let it take.
     */
    LayoutSpec[LayoutSpec["MOST"] = 2] = "MOST";
})(exports.LayoutSpec || (exports.LayoutSpec = {}));
class LayoutConfigImpl {
    fit() {
        this.widthSpec = exports.LayoutSpec.FIT;
        this.heightSpec = exports.LayoutSpec.FIT;
        return this;
    }
    fitWidth() {
        this.widthSpec = exports.LayoutSpec.FIT;
        return this;
    }
    fitHeight() {
        this.heightSpec = exports.LayoutSpec.FIT;
        return this;
    }
    most() {
        this.widthSpec = exports.LayoutSpec.MOST;
        this.heightSpec = exports.LayoutSpec.MOST;
        return this;
    }
    mostWidth() {
        this.widthSpec = exports.LayoutSpec.MOST;
        return this;
    }
    mostHeight() {
        this.heightSpec = exports.LayoutSpec.MOST;
        return this;
    }
    just() {
        this.widthSpec = exports.LayoutSpec.JUST;
        this.heightSpec = exports.LayoutSpec.JUST;
        return this;
    }
    justWidth() {
        this.widthSpec = exports.LayoutSpec.JUST;
        return this;
    }
    justHeight() {
        this.heightSpec = exports.LayoutSpec.JUST;
        return this;
    }
    configWidth(w) {
        this.widthSpec = w;
        return this;
    }
    configHeight(h) {
        this.heightSpec = h;
        return this;
    }
    configMargin(m) {
        this.margin = m;
        return this;
    }
    configAlignment(a) {
        this.alignment = a;
        return this;
    }
    configWeight(w) {
        this.weight = w;
        return this;
    }
    configMaxWidth(v) {
        this.maxWidth = v;
        return this;
    }
    configMaxHeight(v) {
        this.maxHeight = v;
        return this;
    }
    configMinWidth(v) {
        this.minWidth = v;
        return this;
    }
    configMinHeight(v) {
        this.minHeight = v;
        return this;
    }
    toModel() {
        return {
            widthSpec: this.widthSpec,
            heightSpec: this.heightSpec,
            margin: this.margin,
            alignment: this.alignment ? this.alignment.toModel() : undefined,
            weight: this.weight,
            minWidth: this.minWidth,
            maxWidth: this.maxWidth,
            minHeight: this.minHeight,
            maxHeight: this.maxHeight
        };
    }
}
function layoutConfig() {
    return new LayoutConfigImpl;
}

var __decorate$f = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$f = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class Stack extends Group {
}
class Root extends Stack {
}
class LinearLayout extends Group {
}
__decorate$f([
    Property,
    __metadata$f("design:type", Number)
], LinearLayout.prototype, "space", void 0);
__decorate$f([
    Property,
    __metadata$f("design:type", Gravity)
], LinearLayout.prototype, "gravity", void 0);
class VLayout extends LinearLayout {
}
class HLayout extends LinearLayout {
}
function stack(views, config) {
    const ret = new Stack;
    ret.layoutConfig = layoutConfig().fit();
    for (let v of views) {
        ret.addChild(v);
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}
function hlayout(views, config) {
    const ret = new HLayout;
    ret.layoutConfig = layoutConfig().fit();
    for (let v of views) {
        ret.addChild(v);
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}
function vlayout(views, config) {
    const ret = new VLayout;
    ret.layoutConfig = layoutConfig().fit();
    for (let v of views) {
        ret.addChild(v);
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}
class FlexLayout extends Group {
}
function flexlayout(views, config) {
    const ret = new FlexLayout;
    ret.layoutConfig = layoutConfig().fit();
    for (let v of views) {
        ret.addChild(v);
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}

var __decorate$e = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$e = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
function NativeCall(target, propertyKey, descriptor) {
    const originVal = descriptor.value;
    descriptor.value = function () {
        const ret = Reflect.apply(originVal, this, arguments);
        return ret;
    };
    return descriptor;
}
class Panel {
    constructor() {
        this.destroyed = false;
        this.__root__ = new Root;
        this.headviews = new Map;
        this.onRenderFinishedCallback = [];
        this.__rendering__ = false;
        this.callingRenderFinishedCallback = false;
        this.snapshotEnabled = false;
        this.renderSnapshots = [];
    }
    onCreate() { }
    onDestroy() { }
    onShow() { }
    onHidden() { }
    onEnvChanged() {
        this.__root__.children.length = 0;
        this.build(this.__root__);
    }
    addHeadView(type, v) {
        let map = this.headviews.get(type);
        if (map) {
            map.set(v.viewId, v);
        }
        else {
            map = new Map;
            map.set(v.viewId, v);
            this.headviews.set(type, map);
        }
    }
    allHeadViews() {
        return this.headviews.values();
    }
    removeHeadView(type, v) {
        if (this.headviews.has(type)) {
            let map = this.headviews.get(type);
            if (map) {
                if (v instanceof View) {
                    map.delete(v.viewId);
                }
                else {
                    map.delete(v);
                }
            }
        }
    }
    clearHeadViews(type) {
        if (this.headviews.has(type)) {
            this.headviews.delete(type);
        }
    }
    getRootView() {
        return this.__root__;
    }
    getInitData() {
        return this.__data__;
    }
    __init__(data) {
        if (data) {
            this.__data__ = JSON.parse(data);
        }
    }
    __onCreate__() {
        this.onCreate();
    }
    __onDestroy__() {
        this.destroyed = true;
        this.onDestroy();
    }
    __onShow__() {
        this.onShow();
    }
    __onHidden__() {
        this.onHidden();
    }
    __build__(frame) {
        this.__root__.width = frame.width;
        this.__root__.height = frame.height;
        this.__root__.children.length = 0;
        this.build(this.__root__);
    }
    __onEnvChanged__() {
        this.onEnvChanged();
    }
    __response__(viewIds, callbackId) {
        const v = this.retrospectView(viewIds);
        if (v === undefined) {
            loge(`Cannot find view for ${viewIds}`);
        }
        else {
            const argumentsList = [callbackId];
            for (let i = 2; i < arguments.length; i++) {
                argumentsList.push(arguments[i]);
            }
            return Reflect.apply(v.responseCallback, v, argumentsList);
        }
    }
    retrospectView(ids) {
        return ids.reduce((acc, cur) => {
            if (acc === undefined) {
                if (cur === this.__root__.viewId) {
                    return this.__root__;
                }
                for (let map of this.headviews.values()) {
                    if (map.has(cur)) {
                        return map.get(cur);
                    }
                }
                return undefined;
            }
            else {
                if (Reflect.has(acc, "subviewById")) {
                    return Reflect.apply(Reflect.get(acc, "subviewById"), acc, [cur]);
                }
                return acc;
            }
        }, undefined);
    }
    __renderSnapshotDepth__() {
        return this.renderSnapshots.length;
    }
    __restoreRenderSnapshot__(idx) {
        return [...this.renderSnapshots].slice(0, idx);
    }
    __enableSnapshot__() {
        this.snapshotEnabled = true;
    }
    nativeRender(model) {
        if (this.snapshotEnabled) {
            this.renderSnapshots.push(JSON.parse(JSON.stringify(model)));
        }
        return this.context.callNative("shader", "render", model);
    }
    hookBeforeNativeCall() {
    }
    hookAfterNativeCall() {
        if (this.destroyed) {
            return;
        }
        const promises = [];
        if (this.__root__.isDirty()) {
            const model = this.__root__.toModel();
            promises.push(this.nativeRender(model));
            this.__root__.clean();
        }
        for (let map of this.headviews.values()) {
            for (let v of map.values()) {
                if (v.isDirty()) {
                    const model = v.toModel();
                    promises.push(this.nativeRender(model));
                    v.clean();
                }
            }
        }
        if (this.__rendering__) {
            //skip
            Promise.all(promises).then(_ => {
            });
        }
        else {
            this.__rendering__ = true;
            Promise.all(promises).then(_ => {
                this.__rendering__ = false;
                this.onRenderFinished();
            });
        }
    }
    __fetchEffectiveData__() {
        const diryData = [];
        if (this.destroyed) {
            return diryData;
        }
        if (this.__root__.isDirty()) {
            const model = this.__root__.toModel();
            diryData.push(JSON.parse(JSON.stringify(model)));
            this.__root__.clean();
        }
        for (let map of this.headviews.values()) {
            for (let v of map.values()) {
                if (v.isDirty()) {
                    const model = v.toModel();
                    diryData.push(JSON.parse(JSON.stringify(model)));
                    v.clean();
                }
            }
        }
        return diryData;
    }
    onRenderFinished() {
        this.callingRenderFinishedCallback = true;
        this.onRenderFinishedCallback.forEach(e => {
            e();
        });
        this.onRenderFinishedCallback.length = 0;
        this.callingRenderFinishedCallback = false;
    }
    addOnRenderFinishedCallback(cb) {
        if (this.callingRenderFinishedCallback) {
            loge("Do not call addOnRenderFinishedCallback recursively");
        }
        this.onRenderFinishedCallback.push(cb);
    }
}
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", [String]),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__init__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__onCreate__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__onDestroy__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__onShow__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__onHidden__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", [Object]),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__build__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__onEnvChanged__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", [Array, String]),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__response__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__renderSnapshotDepth__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", [Number]),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__restoreRenderSnapshot__", null);
__decorate$e([
    NativeCall,
    __metadata$e("design:type", Function),
    __metadata$e("design:paramtypes", []),
    __metadata$e("design:returntype", void 0)
], Panel.prototype, "__enableSnapshot__", null);

/**
 *  Store color as format AARRGGBB or RRGGBB
 */
class Color {
    constructor(v) {
        this._value = 0;
        this._value = v | 0x0;
    }
    static parse(str) {
        if (!str.startsWith("#")) {
            throw new Error(`Parse color error with ${str}`);
        }
        const val = parseInt(str.substr(1), 16);
        if (str.length === 7) {
            return new Color(val | 0xff000000);
        }
        else if (str.length === 9) {
            return new Color(val);
        }
        else {
            throw new Error(`Parse color error with ${str}`);
        }
    }
    static safeParse(str, defVal = Color.TRANSPARENT) {
        let color = defVal;
        try {
            color = Color.parse(str);
        }
        catch (e) {
        }
        finally {
            return color;
        }
    }
    alpha(v) {
        v = v * 255;
        return new Color((this._value & 0xffffff) | ((v & 0xff) << 24));
    }
    toModel() {
        return this._value;
    }
}
Color.BLACK = new Color(0xFF000000);
Color.DKGRAY = new Color(0xFF444444);
Color.GRAY = new Color(0xFF888888);
Color.LTGRAY = new Color(0xFFCCCCCC);
Color.WHITE = new Color(0xFFFFFFFF);
Color.RED = new Color(0xFFFF0000);
Color.GREEN = new Color(0xFF00FF00);
Color.BLUE = new Color(0xFF0000FF);
Color.YELLOW = new Color(0xFFFFFF00);
Color.CYAN = new Color(0xFF00FFFF);
Color.MAGENTA = new Color(0xFFFF00FF);
Color.TRANSPARENT = new Color(0);
exports.GradientOrientation = void 0;
(function (GradientOrientation) {
    /** draw the gradient from the top to the bottom */
    GradientOrientation[GradientOrientation["TOP_BOTTOM"] = 0] = "TOP_BOTTOM";
    /** draw the gradient from the top-right to the bottom-left */
    GradientOrientation[GradientOrientation["TR_BL"] = 1] = "TR_BL";
    /** draw the gradient from the right to the left */
    GradientOrientation[GradientOrientation["RIGHT_LEFT"] = 2] = "RIGHT_LEFT";
    /** draw the gradient from the bottom-right to the top-left */
    GradientOrientation[GradientOrientation["BR_TL"] = 3] = "BR_TL";
    /** draw the gradient from the bottom to the top */
    GradientOrientation[GradientOrientation["BOTTOM_TOP"] = 4] = "BOTTOM_TOP";
    /** draw the gradient from the bottom-left to the top-right */
    GradientOrientation[GradientOrientation["BL_TR"] = 5] = "BL_TR";
    /** draw the gradient from the left to the right */
    GradientOrientation[GradientOrientation["LEFT_RIGHT"] = 6] = "LEFT_RIGHT";
    /** draw the gradient from the top-left to the bottom-right */
    GradientOrientation[GradientOrientation["TL_BR"] = 7] = "TL_BR";
})(exports.GradientOrientation || (exports.GradientOrientation = {}));

/*
 * Copyright [2019] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
exports.RepeatMode = void 0;
(function (RepeatMode) {
    RepeatMode[RepeatMode["RESTART"] = 1] = "RESTART";
    RepeatMode[RepeatMode["REVERSE"] = 2] = "REVERSE";
})(exports.RepeatMode || (exports.RepeatMode = {}));
exports.FillMode = void 0;
(function (FillMode) {
    /**
     * The receiver is removed from the presentation when the animation is completed.
     */
    FillMode[FillMode["Removed"] = 0] = "Removed";
    /**
     * The receiver remains visible in its final state when the animation is completed.
     */
    FillMode[FillMode["Forward"] = 1] = "Forward";
    /**
     * The receiver clamps values before zero to zero when the animation is completed.
     */
    FillMode[FillMode["Backward"] = 2] = "Backward";
    /**
     * The receiver clamps values at both ends of the object’s time space
     */
    FillMode[FillMode["Both"] = 3] = "Both";
})(exports.FillMode || (exports.FillMode = {}));
exports.TimingFunction = void 0;
(function (TimingFunction) {
    /**
     * The system default timing function. Use this function to ensure that the timing of your animations matches that of most system animations.
     */
    TimingFunction[TimingFunction["Default"] = 0] = "Default";
    /**
     * Linear pacing, which causes an animation to occur evenly over its duration.
     */
    TimingFunction[TimingFunction["Linear"] = 1] = "Linear";
    /**
     * Ease-in pacing, which causes an animation to begin slowly and then speed up as it progresses.
     */
    TimingFunction[TimingFunction["EaseIn"] = 2] = "EaseIn";
    /**
     * Ease-out pacing, which causes an animation to begin quickly and then slow as it progresses.
     */
    TimingFunction[TimingFunction["EaseOut"] = 3] = "EaseOut";
    /**
     * Ease-in-ease-out pacing, which causes an animation to begin slowly, accelerate through the middle of its duration, and then slow again before completing.
     */
    TimingFunction[TimingFunction["EaseInEaseOut"] = 4] = "EaseInEaseOut";
})(exports.TimingFunction || (exports.TimingFunction = {}));
class Animation {
    constructor() {
        this.changeables = new Map;
        this.duration = 0;
        this.fillMode = exports.FillMode.Forward;
        this.id = uniqueId("Animation");
    }
    toModel() {
        const changeables = [];
        for (let e of this.changeables.values()) {
            changeables.push({
                key: e.key,
                fromValue: e.fromValue,
                toValue: e.toValue,
                keyFrames: e.keyFrames,
            });
        }
        return {
            type: this.constructor.name,
            delay: this.delay,
            duration: this.duration,
            changeables,
            repeatCount: this.repeatCount,
            repeatMode: this.repeatMode,
            fillMode: this.fillMode,
            timingFunction: this.timingFunction,
            id: this.id,
        };
    }
}
class ScaleAnimation extends Animation {
    constructor() {
        super();
        this.scaleXChangeable = {
            key: "scaleX",
            fromValue: 1,
            toValue: 1,
        };
        this.scaleYChangeable = {
            key: "scaleY",
            fromValue: 1,
            toValue: 1,
        };
        this.changeables.set("scaleX", this.scaleXChangeable);
        this.changeables.set("scaleY", this.scaleYChangeable);
    }
    set xKeyFrames(keyFrames) {
        this.scaleXChangeable.keyFrames = keyFrames;
    }
    set yKeyFrames(keyFrames) {
        this.scaleYChangeable.keyFrames = keyFrames;
    }
    set fromScaleX(v) {
        this.scaleXChangeable.fromValue = v;
    }
    get fromScaleX() {
        return this.scaleXChangeable.fromValue;
    }
    set toScaleX(v) {
        this.scaleXChangeable.toValue = v;
    }
    get toScaleX() {
        return this.scaleXChangeable.toValue;
    }
    set fromScaleY(v) {
        this.scaleYChangeable.fromValue = v;
    }
    get fromScaleY() {
        return this.scaleYChangeable.fromValue;
    }
    set toScaleY(v) {
        this.scaleYChangeable.toValue = v;
    }
    get toScaleY() {
        return this.scaleYChangeable.toValue;
    }
}
class TranslationAnimation extends Animation {
    constructor() {
        super();
        this.translationXChangeable = {
            key: "translationX",
            fromValue: 0,
            toValue: 0,
        };
        this.translationYChangeable = {
            key: "translationY",
            fromValue: 0,
            toValue: 0,
        };
        this.changeables.set("translationX", this.translationXChangeable);
        this.changeables.set("translationY", this.translationYChangeable);
    }
    set xKeyFrames(keyFrames) {
        this.translationXChangeable.keyFrames = keyFrames;
    }
    set yKeyFrames(keyFrames) {
        this.translationYChangeable.keyFrames = keyFrames;
    }
    set fromTranslationX(v) {
        this.translationXChangeable.fromValue = v;
    }
    get fromTranslationX() {
        return this.translationXChangeable.fromValue;
    }
    set toTranslationX(v) {
        this.translationXChangeable.toValue = v;
    }
    get toTranslationX() {
        return this.translationXChangeable.toValue;
    }
    set fromTranslationY(v) {
        this.translationYChangeable.fromValue = v;
    }
    get fromTranslationY() {
        return this.translationYChangeable.fromValue;
    }
    set toTranslationY(v) {
        this.translationYChangeable.toValue = v;
    }
    get toTranslationY() {
        return this.translationYChangeable.toValue;
    }
}
/**
 * Rotation range is [0..2]
 */
class RotationAnimation extends Animation {
    constructor() {
        super();
        this.rotationChaneable = {
            key: "rotation",
            fromValue: 1,
            toValue: 1,
        };
        this.changeables.set("rotation", this.rotationChaneable);
    }
    set fromRotation(v) {
        this.rotationChaneable.fromValue = v;
    }
    get fromRotation() {
        return this.rotationChaneable.fromValue;
    }
    set toRotation(v) {
        this.rotationChaneable.toValue = v;
    }
    get toRotation() {
        return this.rotationChaneable.toValue;
    }
    set keyFrames(keyFrames) {
        this.rotationChaneable.keyFrames = keyFrames;
    }
}
/**
 * Rotation range is [0..2]
 */
class RotationXAnimation extends Animation {
    constructor() {
        super();
        this.rotationChaneable = {
            key: "rotationX",
            fromValue: 1,
            toValue: 1,
        };
        this.changeables.set("rotationX", this.rotationChaneable);
    }
    set fromRotation(v) {
        this.rotationChaneable.fromValue = v;
    }
    get fromRotation() {
        return this.rotationChaneable.fromValue;
    }
    set toRotation(v) {
        this.rotationChaneable.toValue = v;
    }
    get toRotation() {
        return this.rotationChaneable.toValue;
    }
    set keyFrames(keyFrames) {
        this.rotationChaneable.keyFrames = keyFrames;
    }
}
/**
 * Rotation range is [0..2]
 */
class RotationYAnimation extends Animation {
    constructor() {
        super();
        this.rotationChaneable = {
            key: "rotationY",
            fromValue: 1,
            toValue: 1,
        };
        this.changeables.set("rotationY", this.rotationChaneable);
    }
    set fromRotation(v) {
        this.rotationChaneable.fromValue = v;
    }
    get fromRotation() {
        return this.rotationChaneable.fromValue;
    }
    set toRotation(v) {
        this.rotationChaneable.toValue = v;
    }
    get toRotation() {
        return this.rotationChaneable.toValue;
    }
    set keyFrames(keyFrames) {
        this.rotationChaneable.keyFrames = keyFrames;
    }
}
class BackgroundColorAnimation extends Animation {
    constructor() {
        super();
        this.backgroundColorChangeable = {
            key: "backgroundColor",
            fromValue: Color.TRANSPARENT._value,
            toValue: Color.TRANSPARENT._value,
        };
        this.changeables.set("backgroundColor", this.backgroundColorChangeable);
    }
    set fromColor(color) {
        this.backgroundColorChangeable.fromValue = color._value;
    }
    get fromColor() {
        return new Color(this.backgroundColorChangeable.fromValue);
    }
    set toColor(v) {
        this.backgroundColorChangeable.toValue = v._value;
    }
    get toColor() {
        return new Color(this.backgroundColorChangeable.toValue);
    }
    set keyFrames(keyFrames) {
        this.backgroundColorChangeable.keyFrames = keyFrames.map(e => { return { percent: e.percent, value: e.value.toModel() }; });
    }
}
/**
 * Alpha range is [0..1]
 */
class AlphaAnimation extends Animation {
    constructor() {
        super();
        this.opacityChangeable = {
            key: "alpha",
            fromValue: 1,
            toValue: 1,
        };
        this.changeables.set("alpha", this.opacityChangeable);
    }
    set from(v) {
        this.opacityChangeable.fromValue = v;
    }
    get from() {
        return this.opacityChangeable.fromValue;
    }
    set to(v) {
        this.opacityChangeable.toValue = v;
    }
    get to() {
        return this.opacityChangeable.toValue;
    }
    set keyFrames(keyFrames) {
        this.opacityChangeable.keyFrames = keyFrames;
    }
}
class AnimationSet {
    constructor() {
        this.animations = [];
        this._duration = 0;
        this.id = uniqueId("AnimationSet");
    }
    addAnimation(anim) {
        this.animations.push(anim);
    }
    get duration() {
        return this._duration;
    }
    set duration(v) {
        this._duration = v;
        this.animations.forEach(e => e.duration = v);
    }
    toModel() {
        return {
            animations: this.animations.map(e => {
                return e.toModel();
            }),
            delay: this.delay,
            id: this.id,
        };
    }
}

var __decorate$d = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$d = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.TruncateAt = void 0;
(function (TruncateAt) {
    TruncateAt[TruncateAt["End"] = 0] = "End";
    TruncateAt[TruncateAt["Middle"] = 1] = "Middle";
    TruncateAt[TruncateAt["Start"] = 2] = "Start";
    TruncateAt[TruncateAt["Clip"] = 3] = "Clip";
})(exports.TruncateAt || (exports.TruncateAt = {}));
class Text extends View {
    set innerElement(e) {
        this.text = e;
    }
}
__decorate$d([
    Property,
    __metadata$d("design:type", String)
], Text.prototype, "text", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Object)
], Text.prototype, "textColor", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "textSize", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "maxLines", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Gravity)
], Text.prototype, "textAlignment", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", String)
], Text.prototype, "fontStyle", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Object)
], Text.prototype, "font", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "maxWidth", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "maxHeight", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "lineSpacing", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Boolean)
], Text.prototype, "strikethrough", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Boolean)
], Text.prototype, "underline", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", String)
], Text.prototype, "htmlText", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Number)
], Text.prototype, "truncateAt", void 0);
__decorate$d([
    Property,
    __metadata$d("design:type", Object)
], Text.prototype, "padding", void 0);
function text(config) {
    const ret = new Text;
    ret.layoutConfig = layoutConfig().fit();
    ret.apply(config);
    return ret;
}

class Resource {
    constructor(type, identifier) {
        this.resId = uniqueId("resource");
        this.type = type;
        this.identifier = identifier;
    }
    toModel() {
        return {
            resId: this.resId,
            type: this.type,
            identifier: this.identifier,
        };
    }
}
class LocalResource extends Resource {
    constructor(path) {
        super("local", path);
    }
}
class RemoteResource extends Resource {
    constructor(url) {
        super("remote", url);
    }
    toModel() {
        return Object.assign(Object.assign({}, super.toModel()), { headers: this.headers });
    }
}
class Base64Resource extends Resource {
    constructor(content) {
        super("base64", content);
    }
}
/**
 * Resources belong to assets dir.
 */
class AssetsResource extends Resource {
    constructor(content) {
        super("doric_assets", content);
    }
}
class AndroidResource extends Resource {
}
class iOSResource extends Resource {
}
/**
 * This is for android platform
 */
class DrawableResource extends AndroidResource {
    constructor(name) {
        super("drawable", name);
    }
}
class RawResource extends AndroidResource {
    constructor(name) {
        super("raw", name);
    }
}
class AndroidAssetsResource extends AndroidResource {
    constructor(path) {
        super("android_assets", path);
    }
}
/**
 * This is for iOS platform
 */
class MainBundleResource extends iOSResource {
    constructor(fileName) {
        super("mainBundle", fileName);
    }
}
class BundleResource extends iOSResource {
    constructor(bundleName, fileName) {
        super("bundle", `${bundleName}://${fileName}`);
    }
}
class ArrayBufferResource extends Resource {
    constructor(data) {
        super("arrayBuffer", uniqueId("buffer"));
        this.data = data;
    }
    toModel() {
        const ret = super.toModel();
        ret.data = this.data;
        return ret;
    }
}

var __decorate$c = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$c = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.ScaleType = void 0;
(function (ScaleType) {
    ScaleType[ScaleType["ScaleToFill"] = 0] = "ScaleToFill";
    ScaleType[ScaleType["ScaleAspectFit"] = 1] = "ScaleAspectFit";
    ScaleType[ScaleType["ScaleAspectFill"] = 2] = "ScaleAspectFill";
    ScaleType[ScaleType["Tile"] = 3] = "Tile";
    ScaleType[ScaleType["ScaleAspectFitStart"] = 4] = "ScaleAspectFitStart";
    ScaleType[ScaleType["ScaleAspectFitEnd"] = 5] = "ScaleAspectFitEnd";
})(exports.ScaleType || (exports.ScaleType = {}));
class Image extends View {
    isAnimating(context) {
        return this.nativeChannel(context, "isAnimating")();
    }
    startAnimating(context) {
        return this.nativeChannel(context, "startAnimating")();
    }
    stopAnimating(context) {
        return this.nativeChannel(context, "stopAnimating")();
    }
    getImageInfo(context) {
        return this.nativeChannel(context, "getImageInfo")();
    }
    getImagePixels(context) {
        return this.nativeChannel(context, "getImagePixels")();
    }
    setImagePixels(context, image) {
        return this.nativeChannel(context, "setImagePixels")(image);
    }
}
__decorate$c([
    Property,
    __metadata$c("design:type", Object)
], Image.prototype, "imagePixels", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Resource)
], Image.prototype, "image", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "imageUrl", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "imageFilePath", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "imagePath", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "imageRes", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "imageBase64", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Number)
], Image.prototype, "scaleType", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Boolean)
], Image.prototype, "isBlur", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "placeHolderImage", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "placeHolderImageBase64", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Color
    /**
     * Display while image is failed to load
     * It can be file name in local path
     */
    )
], Image.prototype, "placeHolderColor", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "errorImage", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", String)
], Image.prototype, "errorImageBase64", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Color)
], Image.prototype, "errorColor", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Function)
], Image.prototype, "loadCallback", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Number)
], Image.prototype, "imageScale", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Object)
], Image.prototype, "stretchInset", void 0);
__decorate$c([
    Property,
    __metadata$c("design:type", Function)
], Image.prototype, "onAnimationEnd", void 0);
function image(config) {
    const ret = new Image;
    ret.layoutConfig = layoutConfig().fit();
    ret.apply(config);
    return ret;
}

function deepClone(nativeViewModel) {
    const ret = {
        id: nativeViewModel.id,
        type: nativeViewModel.type,
        props: Object.assign({}, nativeViewModel.props),
    };
    if (nativeViewModel.props.subviews) {
        ret.props.subviews = nativeViewModel.props.subviews
            .map(e => deepClone(e));
    }
    return ret;
}

/*
 * Copyright [2019] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate$b = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$b = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class ListItem extends Stack {
}
__decorate$b([
    Property,
    __metadata$b("design:type", String)
], ListItem.prototype, "identifier", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Array)
], ListItem.prototype, "actions", void 0);
class List extends Superview {
    constructor() {
        super(...arguments);
        this.cachedViews = new Map;
        this.itemCount = 0;
        this.batchCount = 15;
    }
    allSubviews() {
        const ret = [...this.cachedViews.values()];
        if (this.loadMoreView) {
            ret.push(this.loadMoreView);
        }
        return ret;
    }
    /**
     * @param {number} config.topOffset - 目标位置cell的顶部偏移量
     */
    scrollToItem(context, index, config) {
        const animated = config === null || config === void 0 ? void 0 : config.animated;
        const topOffset = config === null || config === void 0 ? void 0 : config.topOffset;
        return this.nativeChannel(context, 'scrollToItem')({ index, animated, topOffset });
    }
    /**
     * @param context
     * @returns Returns array of visible view's index.
     */
    findVisibleItems(context) {
        return this.nativeChannel(context, 'findVisibleItems')();
    }
    /**
     * @param context
     * @returns Returns array of completely visible view's index.
     */
    findCompletelyVisibleItems(context) {
        return this.nativeChannel(context, 'findCompletelyVisibleItems')();
    }
    /**
     * Reload all list items.
     * @param context
     * @returns
     */
    reload(context) {
        return this.nativeChannel(context, 'reload')();
    }
    reset() {
        this.cachedViews.clear();
        this.itemCount = 0;
    }
    getItem(itemIdx) {
        let view = this.renderItem(itemIdx);
        view.superview = this;
        this.cachedViews.set(`${itemIdx}`, view);
        return view;
    }
    renderBunchedItems(start, length) {
        const items = new Array(Math.max(0, Math.min(length, this.itemCount - start)))
            .fill(0).map((_, idx) => this.getItem(start + idx));
        const ret = items.map(e => deepClone(e.toModel()));
        items.forEach(e => e.clean());
        return ret;
    }
    toModel() {
        if (this.loadMoreView) {
            this.dirtyProps['loadMoreView'] = this.loadMoreView.viewId;
        }
        return super.toModel();
    }
}
__decorate$b([
    Property,
    __metadata$b("design:type", Object)
], List.prototype, "itemCount", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "renderItem", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Object)
], List.prototype, "batchCount", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "onLoadMore", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Boolean)
], List.prototype, "loadMore", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", ListItem)
], List.prototype, "loadMoreView", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "onScroll", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "onScrollEnd", void 0);
__decorate$b([
    InconsistProperty,
    __metadata$b("design:type", Number)
], List.prototype, "scrolledPosition", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Boolean)
], List.prototype, "scrollable", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Boolean)
], List.prototype, "bounces", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Boolean)
], List.prototype, "scrollsToTop", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Boolean)
], List.prototype, "canDrag", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "itemCanDrag", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "beforeDragging", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "onDragging", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Function)
], List.prototype, "onDragged", void 0);
__decorate$b([
    Property,
    __metadata$b("design:type", Number)
], List.prototype, "preloadItemCount", void 0);
function list(config) {
    const ret = new List;
    ret.apply(config);
    return ret;
}
function listItem(item, config) {
    return (new ListItem).also((it) => {
        it.layoutConfig = layoutConfig().fit();
        if (item instanceof View) {
            it.addChild(item);
        }
        else {
            item.forEach(e => {
                it.addChild(e);
            });
        }
        if (config) {
            it.apply(config);
        }
    });
}

var __decorate$a = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$a = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class SlideItem extends Stack {
}
__decorate$a([
    Property,
    __metadata$a("design:type", String)
], SlideItem.prototype, "identifier", void 0);
class Slider extends Superview {
    constructor() {
        super(...arguments);
        this.cachedViews = new Map;
        this.itemCount = 0;
        this.batchCount = 3;
    }
    allSubviews() {
        return this.cachedViews.values();
    }
    /**
     * Reload all list items.
     * @param context
     * @returns
     */
    reload(context) {
        return this.nativeChannel(context, 'reload')();
    }
    reset() {
        this.cachedViews.clear();
        this.itemCount = 0;
    }
    getItem(itemIdx) {
        let view = this.renderPage(itemIdx);
        view.superview = this;
        this.cachedViews.set(`${itemIdx}`, view);
        return view;
    }
    renderBunchedItems(start, length) {
        const items = new Array(Math.max(0, Math.min(length, this.itemCount - start)))
            .fill(0).map((_, idx) => this.getItem(start + idx));
        const ret = items.map(e => deepClone(e.toModel()));
        items.forEach(e => e.clean());
        return ret;
    }
    slidePage(context, page, smooth = false) {
        return this.nativeChannel(context, "slidePage")({ page, smooth });
    }
    getSlidedPage(context) {
        return this.nativeChannel(context, "getSlidedPage")();
    }
}
__decorate$a([
    Property,
    __metadata$a("design:type", Object)
], Slider.prototype, "itemCount", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Function)
], Slider.prototype, "renderPage", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Object)
], Slider.prototype, "batchCount", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Function)
], Slider.prototype, "onPageSlided", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Boolean)
], Slider.prototype, "loop", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Boolean)
], Slider.prototype, "scrollable", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Boolean)
], Slider.prototype, "bounces", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Boolean)
], Slider.prototype, "scrollsToTop", void 0);
__decorate$a([
    Property,
    __metadata$a("design:type", Object)
], Slider.prototype, "slideStyle", void 0);
__decorate$a([
    InconsistProperty,
    __metadata$a("design:type", Number)
], Slider.prototype, "slidePosition", void 0);
function slider(config) {
    const ret = new Slider;
    ret.apply(config);
    return ret;
}
function slideItem(item, config) {
    return (new SlideItem).also((it) => {
        it.layoutConfig = layoutConfig().most();
        if (item instanceof View) {
            it.addChild(item);
        }
        else {
            item.forEach(e => {
                it.addChild(e);
            });
        }
        if (config) {
            for (let key in config) {
                Reflect.set(it, key, Reflect.get(config, key, config), it);
            }
        }
    });
}

var __decorate$9 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$9 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
function scroller(content, config) {
    return (new Scroller).also(v => {
        v.layoutConfig = layoutConfig().fit();
        if (config) {
            v.apply(config);
        }
        v.content = content;
    });
}
class Scroller extends Superview {
    allSubviews() {
        return [this.content];
    }
    toModel() {
        this.dirtyProps.content = this.content.viewId;
        return super.toModel();
    }
    scrollTo(context, offset, animated) {
        return this.nativeChannel(context, "scrollTo")({ offset, animated });
    }
    scrollBy(context, offset, animated) {
        return this.nativeChannel(context, "scrollBy")({ offset, animated });
    }
    set innerElement(e) {
        this.content = e;
    }
}
__decorate$9([
    Property,
    __metadata$9("design:type", Object)
], Scroller.prototype, "contentOffset", void 0);
__decorate$9([
    Property,
    __metadata$9("design:type", Function)
], Scroller.prototype, "onScroll", void 0);
__decorate$9([
    Property,
    __metadata$9("design:type", Function)
], Scroller.prototype, "onScrollEnd", void 0);
__decorate$9([
    Property,
    __metadata$9("design:type", Boolean)
], Scroller.prototype, "scrollable", void 0);
__decorate$9([
    Property,
    __metadata$9("design:type", Boolean)
], Scroller.prototype, "bounces", void 0);
__decorate$9([
    Property,
    __metadata$9("design:type", Boolean)
], Scroller.prototype, "scrollsToTop", void 0);

var __decorate$8 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$8 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class Refreshable extends Superview {
    allSubviews() {
        const ret = [this.content];
        if (this.header) {
            ret.push(this.header);
        }
        return ret;
    }
    setRefreshable(context, refreshable) {
        return this.nativeChannel(context, 'setRefreshable')(refreshable);
    }
    setRefreshing(context, refreshing) {
        return this.nativeChannel(context, 'setRefreshing')(refreshing);
    }
    isRefreshable(context) {
        return this.nativeChannel(context, 'isRefreshable')();
    }
    isRefreshing(context) {
        return this.nativeChannel(context, 'isRefreshing')();
    }
    toModel() {
        this.dirtyProps.content = this.content.viewId;
        this.dirtyProps.header = (this.header || {}).viewId;
        return super.toModel();
    }
    set innerElement(e) {
        if (e instanceof View) {
            this.content = e;
        }
        else {
            this.header = e[0];
            this.content = e[1];
        }
    }
}
__decorate$8([
    Property,
    __metadata$8("design:type", Function)
], Refreshable.prototype, "onRefresh", void 0);
function refreshable(config) {
    const ret = new Refreshable;
    ret.layoutConfig = layoutConfig().fit();
    ret.apply(config);
    return ret;
}
function pullable(v, config) {
    Reflect.set(v, 'startAnimation', config.startAnimation);
    Reflect.set(v, 'stopAnimation', config.stopAnimation);
    Reflect.set(v, 'setPullingDistance', config.setPullingDistance);
    return v;
}

var ValueType;
(function (ValueType) {
    ValueType[ValueType["Undefined"] = 0] = "Undefined";
    ValueType[ValueType["Point"] = 1] = "Point";
    ValueType[ValueType["Percent"] = 2] = "Percent";
    ValueType[ValueType["Auto"] = 3] = "Auto";
})(ValueType || (ValueType = {}));
class FlexTypedValue {
    constructor(type) {
        this.value = 0;
        this.type = type;
    }
    static percent(v) {
        const ret = new FlexTypedValue(ValueType.Percent);
        ret.value = v;
        return ret;
    }
    static point(v) {
        const ret = new FlexTypedValue(ValueType.Point);
        ret.value = v;
        return ret;
    }
    toModel() {
        return {
            type: this.type,
            value: this.value,
        };
    }
}
FlexTypedValue.Auto = new FlexTypedValue(ValueType.Auto);
exports.FlexDirection = void 0;
(function (FlexDirection) {
    FlexDirection[FlexDirection["COLUMN"] = 0] = "COLUMN";
    FlexDirection[FlexDirection["COLUMN_REVERSE"] = 1] = "COLUMN_REVERSE";
    FlexDirection[FlexDirection["ROW"] = 2] = "ROW";
    FlexDirection[FlexDirection["ROW_REVERSE"] = 3] = "ROW_REVERSE";
})(exports.FlexDirection || (exports.FlexDirection = {}));
exports.Align = void 0;
(function (Align) {
    Align[Align["AUTO"] = 0] = "AUTO";
    Align[Align["FLEX_START"] = 1] = "FLEX_START";
    Align[Align["CENTER"] = 2] = "CENTER";
    Align[Align["FLEX_END"] = 3] = "FLEX_END";
    Align[Align["STRETCH"] = 4] = "STRETCH";
    Align[Align["BASELINE"] = 5] = "BASELINE";
    Align[Align["SPACE_BETWEEN"] = 6] = "SPACE_BETWEEN";
    Align[Align["SPACE_AROUND"] = 7] = "SPACE_AROUND";
})(exports.Align || (exports.Align = {}));
exports.Justify = void 0;
(function (Justify) {
    Justify[Justify["FLEX_START"] = 0] = "FLEX_START";
    Justify[Justify["CENTER"] = 1] = "CENTER";
    Justify[Justify["FLEX_END"] = 2] = "FLEX_END";
    Justify[Justify["SPACE_BETWEEN"] = 3] = "SPACE_BETWEEN";
    Justify[Justify["SPACE_AROUND"] = 4] = "SPACE_AROUND";
    Justify[Justify["SPACE_EVENLY"] = 5] = "SPACE_EVENLY";
})(exports.Justify || (exports.Justify = {}));
exports.Direction = void 0;
(function (Direction) {
    Direction[Direction["INHERIT"] = 0] = "INHERIT";
    Direction[Direction["LTR"] = 1] = "LTR";
    Direction[Direction["RTL"] = 2] = "RTL";
})(exports.Direction || (exports.Direction = {}));
exports.PositionType = void 0;
(function (PositionType) {
    PositionType[PositionType["RELATIVE"] = 0] = "RELATIVE";
    PositionType[PositionType["ABSOLUTE"] = 1] = "ABSOLUTE";
})(exports.PositionType || (exports.PositionType = {}));
exports.Wrap = void 0;
(function (Wrap) {
    Wrap[Wrap["NO_WRAP"] = 0] = "NO_WRAP";
    Wrap[Wrap["WRAP"] = 1] = "WRAP";
    Wrap[Wrap["WRAP_REVERSE"] = 2] = "WRAP_REVERSE";
})(exports.Wrap || (exports.Wrap = {}));
exports.OverFlow = void 0;
(function (OverFlow) {
    OverFlow[OverFlow["VISIBLE"] = 0] = "VISIBLE";
    OverFlow[OverFlow["HIDDEN"] = 1] = "HIDDEN";
    OverFlow[OverFlow["SCROLL"] = 2] = "SCROLL";
})(exports.OverFlow || (exports.OverFlow = {}));
exports.Display = void 0;
(function (Display) {
    Display[Display["FLEX"] = 0] = "FLEX";
    Display[Display["NONE"] = 1] = "NONE";
})(exports.Display || (exports.Display = {}));

exports.jsx = void 0;
(function (jsx) {
    function createElement(constructor, config, ...children) {
        var _a;
        if (!!constructor.isViewClass) {
            const e = new constructor();
            if (e instanceof Fragment) {
                return children;
            }
            e.layoutConfig = (_a = e.layoutConfig) !== null && _a !== void 0 ? _a : layoutConfig().fit();
            if (config) {
                e.apply(config);
            }
            if (children && children.length > 0) {
                if (children.length === 1) {
                    children = children[0];
                }
                if (Reflect.has(e, "innerElement")) {
                    Reflect.set(e, "innerElement", children, e);
                }
                else {
                    throw new Error(`Do not support ${constructor.name} for ${children}`);
                }
            }
            return e;
        }
        else {
            const f = constructor;
            const args = config !== null && config !== void 0 ? config : {};
            if (children && children.length > 0) {
                if (children.length === 1) {
                    children = children[0];
                }
                args.innerElement = children;
            }
            const e = Reflect.apply(f, undefined, [args]);
            if (e instanceof Fragment) {
                return children;
            }
            return e;
        }
    }
    jsx.createElement = createElement;
    class Fragment extends Group {
    }
    jsx.Fragment = Fragment;
})(exports.jsx || (exports.jsx = {}));

var __decorate$7 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$7 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class FlowLayoutItem extends Stack {
}
__decorate$7([
    Property,
    __metadata$7("design:type", String)
], FlowLayoutItem.prototype, "identifier", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayoutItem.prototype, "fullSpan", void 0);
class FlowLayout extends Superview {
    constructor() {
        super(...arguments);
        this.cachedViews = new Map;
        this.columnCount = 2;
        this.itemCount = 0;
        this.batchCount = 15;
    }
    allSubviews() {
        const ret = [...this.cachedViews.values()];
        if (this.loadMoreView) {
            ret.push(this.loadMoreView);
        }
        return ret;
    }
    /**
     * @param context
     * @returns Returns array of visible view's index.
     */
    findVisibleItems(context) {
        return this.nativeChannel(context, 'findVisibleItems')();
    }
    /**
     * @param context
     * @returns Returns array of completely visible view's index.
     */
    findCompletelyVisibleItems(context) {
        return this.nativeChannel(context, 'findCompletelyVisibleItems')();
    }
    /**
     * Reload all list items.
     * @param context
     * @returns
     */
    reload(context) {
        return this.nativeChannel(context, 'reload')();
    }
    reset() {
        this.cachedViews.clear();
        this.itemCount = 0;
    }
    getItem(itemIdx) {
        let view = this.renderItem(itemIdx);
        view.superview = this;
        this.cachedViews.set(`${itemIdx}`, view);
        return view;
    }
    renderBunchedItems(start, length) {
        const items = new Array(Math.max(0, Math.min(length, this.itemCount - start)))
            .fill(0).map((_, idx) => this.getItem(start + idx));
        const ret = items.map(e => deepClone(e.toModel()));
        items.forEach(e => e.clean());
        return ret;
    }
    toModel() {
        if (this.loadMoreView) {
            this.dirtyProps['loadMoreView'] = this.loadMoreView.viewId;
        }
        return super.toModel();
    }
}
__decorate$7([
    Property,
    __metadata$7("design:type", Object)
], FlowLayout.prototype, "columnCount", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Number)
], FlowLayout.prototype, "columnSpace", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Number)
], FlowLayout.prototype, "rowSpace", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Object)
], FlowLayout.prototype, "itemCount", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "renderItem", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Object)
], FlowLayout.prototype, "batchCount", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "onLoadMore", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayout.prototype, "loadMore", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", FlowLayoutItem)
], FlowLayout.prototype, "loadMoreView", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "onScroll", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "onScrollEnd", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayout.prototype, "scrollable", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayout.prototype, "bounces", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayout.prototype, "scrollsToTop", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Boolean)
], FlowLayout.prototype, "canDrag", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "itemCanDrag", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "beforeDragging", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "onDragging", void 0);
__decorate$7([
    Property,
    __metadata$7("design:type", Function)
], FlowLayout.prototype, "onDragged", void 0);
function flowlayout(config) {
    const ret = new FlowLayout;
    for (let key in config) {
        Reflect.set(ret, key, Reflect.get(config, key, config), ret);
    }
    return ret;
}
function flowItem(item, config) {
    return (new FlowLayoutItem).also((it) => {
        it.layoutConfig = layoutConfig().fit();
        if (item instanceof View) {
            it.addChild(item);
        }
        else {
            item.forEach(e => {
                it.addChild(e);
            });
        }
        if (config) {
            it.apply(config);
        }
    });
}

var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$6 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.ReturnKeyType = void 0;
(function (ReturnKeyType) {
    ReturnKeyType[ReturnKeyType["Default"] = 0] = "Default";
    ReturnKeyType[ReturnKeyType["Done"] = 1] = "Done";
    ReturnKeyType[ReturnKeyType["Search"] = 2] = "Search";
    ReturnKeyType[ReturnKeyType["Next"] = 3] = "Next";
    ReturnKeyType[ReturnKeyType["Go"] = 4] = "Go";
    ReturnKeyType[ReturnKeyType["Send"] = 5] = "Send";
})(exports.ReturnKeyType || (exports.ReturnKeyType = {}));
class Input extends View {
    getText(context) {
        return this.nativeChannel(context, 'getText')();
    }
    setSelection(context, start, end = start) {
        return this.nativeChannel(context, 'setSelection')({
            start,
            end,
        });
    }
    getSelection(context) {
        return this.nativeChannel(context, 'getSelection')();
    }
    requestFocus(context) {
        return this.nativeChannel(context, 'requestFocus')();
    }
    releaseFocus(context) {
        return this.nativeChannel(context, 'releaseFocus')();
    }
}
__decorate$6([
    InconsistProperty,
    __metadata$6("design:type", String)
], Input.prototype, "text", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Color)
], Input.prototype, "textColor", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Number)
], Input.prototype, "textSize", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", String)
], Input.prototype, "font", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", String)
], Input.prototype, "hintText", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", String)
], Input.prototype, "hintFont", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Number)
], Input.prototype, "inputType", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Color)
], Input.prototype, "hintTextColor", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Boolean)
], Input.prototype, "multiline", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Gravity)
], Input.prototype, "textAlignment", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", String)
], Input.prototype, "fontStyle", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Function)
], Input.prototype, "onTextChange", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Function)
], Input.prototype, "onFocusChange", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Number)
], Input.prototype, "maxLength", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Boolean)
], Input.prototype, "password", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Boolean)
], Input.prototype, "editable", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Number)
], Input.prototype, "returnKeyType", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Function)
], Input.prototype, "onSubmitEditing", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Boolean)
], Input.prototype, "enableHorizontalScrollBar", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Boolean)
], Input.prototype, "enableVerticalScrollBar", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Function)
], Input.prototype, "beforeTextChange", void 0);
__decorate$6([
    Property,
    __metadata$6("design:type", Object)
], Input.prototype, "padding", void 0);
exports.InputType = void 0;
(function (InputType) {
    InputType[InputType["Default"] = 0] = "Default";
    InputType[InputType["Number"] = 1] = "Number";
    InputType[InputType["Decimal"] = 2] = "Decimal";
    InputType[InputType["Alphabet"] = 3] = "Alphabet";
    InputType[InputType["Phone"] = 4] = "Phone";
})(exports.InputType || (exports.InputType = {}));
function input(config) {
    const ret = new Input;
    ret.layoutConfig = layoutConfig().just();
    ret.apply(config);
    return ret;
}

var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$5 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class NestedSlider extends Group {
    addSlideItem(view) {
        this.addChild(view);
    }
    slidePage(context, page, smooth = false) {
        return this.nativeChannel(context, "slidePage")({ page, smooth });
    }
    getSlidedPage(context) {
        return this.nativeChannel(context, "getSlidedPage")();
    }
}
__decorate$5([
    Property,
    __metadata$5("design:type", Function)
], NestedSlider.prototype, "onPageSlided", void 0);
__decorate$5([
    Property,
    __metadata$5("design:type", Boolean)
], NestedSlider.prototype, "scrollable", void 0);
__decorate$5([
    Property,
    __metadata$5("design:type", Boolean)
], NestedSlider.prototype, "bounces", void 0);
__decorate$5([
    Property,
    __metadata$5("design:type", Boolean)
], NestedSlider.prototype, "scrollsToTop", void 0);
__decorate$5([
    InconsistProperty,
    __metadata$5("design:type", Number)
], NestedSlider.prototype, "slidePosition", void 0);

var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$4 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * @deprecated The class should not be used, please use GestureContainer class instead
 */
class Draggable extends Stack {
}
__decorate$4([
    Property,
    __metadata$4("design:type", Function)
], Draggable.prototype, "onDrag", void 0);
/**
 * @deprecated The function should not be used, please use gestureContainer function instead
 */
function draggable(views, config) {
    const ret = new Draggable;
    ret.layoutConfig = layoutConfig().fit();
    if (views instanceof View) {
        ret.addChild(views);
    }
    else {
        views.forEach(e => {
            ret.addChild(e);
        });
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}

var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$3 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class Switch extends View {
}
__decorate$3([
    InconsistProperty,
    __metadata$3("design:type", Boolean)
], Switch.prototype, "state", void 0);
__decorate$3([
    Property,
    __metadata$3("design:type", Function)
], Switch.prototype, "onSwitch", void 0);
__decorate$3([
    Property,
    __metadata$3("design:type", Color)
], Switch.prototype, "offTintColor", void 0);
__decorate$3([
    Property,
    __metadata$3("design:type", Color)
], Switch.prototype, "onTintColor", void 0);
__decorate$3([
    Property,
    __metadata$3("design:type", Color)
], Switch.prototype, "thumbTintColor", void 0);
function switchView(config) {
    const ret = new Switch;
    ret.layoutConfig = layoutConfig().just();
    ret.width = 50;
    ret.height = 30;
    ret.apply(config);
    return ret;
}

var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$2 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
exports.SwipeOrientation = void 0;
(function (SwipeOrientation) {
    SwipeOrientation[SwipeOrientation["LEFT"] = 0] = "LEFT";
    SwipeOrientation[SwipeOrientation["RIGHT"] = 1] = "RIGHT";
    SwipeOrientation[SwipeOrientation["TOP"] = 2] = "TOP";
    SwipeOrientation[SwipeOrientation["BOTTOM"] = 3] = "BOTTOM";
})(exports.SwipeOrientation || (exports.SwipeOrientation = {}));
class GestureContainer extends Stack {
}
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onSingleTap", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onDoubleTap", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onLongPress", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onPinch", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onPan", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onRotate", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onSwipe", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onTouchDown", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onTouchMove", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onTouchUp", void 0);
__decorate$2([
    Property,
    __metadata$2("design:type", Function)
], GestureContainer.prototype, "onTouchCancel", void 0);
function gestureContainer(views, config) {
    const ret = new GestureContainer;
    ret.layoutConfig = layoutConfig().fit();
    if (views instanceof View) {
        ret.addChild(views);
    }
    else {
        views.forEach(e => {
            ret.addChild(e);
        });
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}

var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata$1 = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class BlurEffect extends Stack {
}
__decorate$1([
    Property,
    __metadata$1("design:type", Object)
], BlurEffect.prototype, "effectiveRect", void 0);
__decorate$1([
    Property,
    __metadata$1("design:type", Number)
], BlurEffect.prototype, "radius", void 0);
class AeroEffect extends Stack {
}
__decorate$1([
    Property,
    __metadata$1("design:type", Object)
], AeroEffect.prototype, "effectiveRect", void 0);
__decorate$1([
    Property,
    __metadata$1("design:type", String)
], AeroEffect.prototype, "style", void 0);
function blurEffect(views, config) {
    const ret = new BlurEffect;
    ret.layoutConfig = layoutConfig().fit();
    if (views instanceof View) {
        ret.addChild(views);
    }
    else {
        views.forEach(e => {
            ret.addChild(e);
        });
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}
function aeroEffect(views, config) {
    const ret = new AeroEffect;
    ret.layoutConfig = layoutConfig().fit();
    if (views instanceof View) {
        ret.addChild(views);
    }
    else {
        views.forEach(e => {
            ret.addChild(e);
        });
    }
    if (config) {
        ret.apply(config);
    }
    return ret;
}

/*
 * Copyright [2022] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
class HorizontalListItem extends Stack {
}
__decorate([
    Property,
    __metadata("design:type", String)
], HorizontalListItem.prototype, "identifier", void 0);
class HorizontalList extends Superview {
    constructor() {
        super(...arguments);
        this.cachedViews = new Map;
        this.itemCount = 0;
        this.batchCount = 15;
    }
    allSubviews() {
        const ret = [...this.cachedViews.values()];
        if (this.loadMoreView) {
            ret.push(this.loadMoreView);
        }
        return ret;
    }
    scrollToItem(context, index, config) {
        const animated = config === null || config === void 0 ? void 0 : config.animated;
        return this.nativeChannel(context, 'scrollToItem')({ index, animated, });
    }
    /**
     * @param context
     * @returns Returns array of visible view's index.
     */
    findVisibleItems(context) {
        return this.nativeChannel(context, 'findVisibleItems')();
    }
    /**
     * @param context
     * @returns Returns array of completely visible view's index.
     */
    findCompletelyVisibleItems(context) {
        return this.nativeChannel(context, 'findCompletelyVisibleItems')();
    }
    /**
     * Reload all list items.
     * @param context
     * @returns
     */
    reload(context) {
        return this.nativeChannel(context, 'reload')();
    }
    reset() {
        this.cachedViews.clear();
        this.itemCount = 0;
    }
    getItem(itemIdx) {
        let view = this.renderItem(itemIdx);
        view.superview = this;
        this.cachedViews.set(`${itemIdx}`, view);
        return view;
    }
    renderBunchedItems(start, length) {
        const items = new Array(Math.max(0, Math.min(length, this.itemCount - start)))
            .fill(0).map((_, idx) => this.getItem(start + idx));
        const ret = items.map(e => deepClone(e.toModel()));
        items.forEach(e => e.clean());
        return ret;
    }
    toModel() {
        if (this.loadMoreView) {
            this.dirtyProps['loadMoreView'] = this.loadMoreView.viewId;
        }
        return super.toModel();
    }
}
__decorate([
    Property,
    __metadata("design:type", Object)
], HorizontalList.prototype, "itemCount", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "renderItem", void 0);
__decorate([
    Property,
    __metadata("design:type", Object)
], HorizontalList.prototype, "batchCount", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "onLoadMore", void 0);
__decorate([
    Property,
    __metadata("design:type", Boolean)
], HorizontalList.prototype, "loadMore", void 0);
__decorate([
    Property,
    __metadata("design:type", HorizontalListItem)
], HorizontalList.prototype, "loadMoreView", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "onScroll", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "onScrollEnd", void 0);
__decorate([
    Property,
    __metadata("design:type", Number)
], HorizontalList.prototype, "scrolledPosition", void 0);
__decorate([
    Property,
    __metadata("design:type", Boolean)
], HorizontalList.prototype, "scrollable", void 0);
__decorate([
    Property,
    __metadata("design:type", Boolean)
], HorizontalList.prototype, "bounces", void 0);
__decorate([
    Property,
    __metadata("design:type", Boolean)
], HorizontalList.prototype, "scrollsToTop", void 0);
__decorate([
    Property,
    __metadata("design:type", Boolean)
], HorizontalList.prototype, "canDrag", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "itemCanDrag", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "beforeDragging", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "onDragging", void 0);
__decorate([
    Property,
    __metadata("design:type", Function)
], HorizontalList.prototype, "onDragged", void 0);
function horizontalList(config) {
    const ret = new HorizontalList;
    ret.apply(config);
    return ret;
}
function horizontalListItem(item, config) {
    return (new HorizontalListItem).also((it) => {
        it.layoutConfig = layoutConfig().fit();
        if (item instanceof View) {
            it.addChild(item);
        }
        else {
            item.forEach(e => {
                it.addChild(e);
            });
        }
        if (config) {
            it.apply(config);
        }
    });
}

function modal(context) {
    return {
        toast: (msg, gravity = Gravity.Bottom) => {
            context.callNative('modal', 'toast', {
                msg,
                gravity: gravity.toModel(),
            });
        },
        alert: (arg) => {
            if (typeof arg === 'string') {
                return context.callNative('modal', 'alert', { msg: arg });
            }
            else {
                return context.callNative('modal', 'alert', arg);
            }
        },
        confirm: (arg) => {
            if (typeof arg === 'string') {
                return context.callNative('modal', 'confirm', { msg: arg });
            }
            else {
                return context.callNative('modal', 'confirm', arg);
            }
        },
        prompt: (arg) => {
            return context.callNative('modal', 'prompt', arg);
        },
    };
}

function navbar(context) {
    const entity = context.entity;
    let panel = undefined;
    if (entity instanceof Panel) {
        panel = entity;
    }
    return {
        isHidden: () => {
            return context.callNative('navbar', 'isHidden');
        },
        setHidden: (hidden) => {
            return context.callNative('navbar', 'setHidden', { hidden, });
        },
        setTitle: (title) => {
            return context.callNative('navbar', 'setTitle', { title, });
        },
        setBgColor: (color) => {
            return context.callNative('navbar', 'setBgColor', { color: color.toModel(), });
        },
        setLeft: (view) => {
            if (panel) {
                panel.clearHeadViews("navbar_left");
                panel.addHeadView("navbar_left", view);
            }
            return context.callNative('navbar', 'setLeft', view.toModel());
        },
        setRight: (view) => {
            if (panel) {
                panel.clearHeadViews("navbar_right");
                panel.addHeadView("navbar_right", view);
            }
            return context.callNative('navbar', 'setRight', view.toModel());
        },
        setCenter: (view) => {
            if (panel) {
                panel.clearHeadViews("navbar_center");
                panel.addHeadView("navbar_center", view);
            }
            return context.callNative('navbar', 'setCenter', view.toModel());
        },
    };
}

function internalScheme(context, panelClass) {
    return `_internal_://export?class=${encodeURIComponent(panelClass.name)}&context=${context.id}`;
}
function navigator(context) {
    const moduleName = "navigator";
    return {
        push: (source, config) => {
            if (typeof source === 'function') {
                source = internalScheme(context, source);
            }
            if (config && config.extra) {
                config.extra = JSON.stringify(config.extra);
            }
            return context.callNative(moduleName, 'push', {
                source, config
            });
        },
        pop: (animated = true) => {
            return context.callNative(moduleName, 'pop', { animated });
        },
        popSelf: (animated = true) => {
            return context.callNative(moduleName, 'popSelf', { animated });
        },
        popToRoot: (animated = true) => {
            return context.callNative(moduleName, 'popToRoot', { animated });
        },
        openUrl: (url) => {
            return context.callNative(moduleName, "openUrl", url);
        },
    };
}

function transformRequest(request) {
    let url = request.url || "";
    if (request.params !== undefined) {
        const queryStrings = [];
        for (let key in request.params) {
            queryStrings.push(`${key}=${encodeURIComponent(request.params[key])}`);
        }
        request.url = `${request.url}${url.indexOf('?') >= 0 ? '&' : '?'}${queryStrings.join('&')}`;
    }
    if (typeof request.data === 'object') {
        request.data = JSON.stringify(request.data);
    }
    return request;
}
function network(context) {
    return {
        request: (config) => {
            return context.callNative('network', 'request', transformRequest(config));
        },
        get: (url, config) => {
            let finalConfig = config;
            if (finalConfig === undefined) {
                finalConfig = {};
            }
            finalConfig.url = url;
            finalConfig.method = "get";
            return context.callNative('network', 'request', transformRequest(finalConfig));
        },
        post: (url, data, config) => {
            let finalConfig = config;
            if (finalConfig === undefined) {
                finalConfig = {};
            }
            finalConfig.url = url;
            finalConfig.method = "post";
            if (data !== undefined) {
                finalConfig.data = data;
            }
            return context.callNative('network', 'request', transformRequest(finalConfig));
        },
        put: (url, data, config) => {
            let finalConfig = config;
            if (finalConfig === undefined) {
                finalConfig = {};
            }
            finalConfig.url = url;
            finalConfig.method = "put";
            if (data !== undefined) {
                finalConfig.data = data;
            }
            return context.callNative('network', 'request', transformRequest(finalConfig));
        },
        delete: (url, data, config) => {
            let finalConfig = config;
            if (finalConfig === undefined) {
                finalConfig = {};
            }
            finalConfig.url = url;
            finalConfig.method = "delete";
            return context.callNative('network', 'request', transformRequest(finalConfig));
        },
    };
}

function storage(context) {
    return {
        setItem: (key, value, zone) => {
            return context.callNative('storage', 'setItem', { key, value, zone });
        },
        getItem: (key, zone) => {
            return context.callNative('storage', 'getItem', { key, zone });
        },
        remove: (key, zone) => {
            return context.callNative('storage', 'remove', { key, zone });
        },
        clear: (zone) => {
            return context.callNative('storage', 'clear', { zone });
        },
    };
}

function popover(context) {
    const entity = context.entity;
    let panel = undefined;
    if (entity instanceof Panel) {
        panel = entity;
    }
    return {
        show: (view) => {
            if (panel) {
                panel.addHeadView("popover", view);
            }
            return context.callNative('popover', 'show', view.toModel());
        },
        dismiss: (view = undefined) => {
            if (panel) {
                if (view) {
                    panel.removeHeadView("popover", view);
                }
                else {
                    panel.clearHeadViews("popover");
                }
            }
            return context.callNative('popover', 'dismiss', view ? { id: view.viewId } : undefined);
        },
    };
}

/*
 * Copyright [2019] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function take(target) {
    return (block) => {
        block(target);
    };
}
function takeNonNull(target) {
    return (block) => {
        if (target !== undefined) {
            return block(target);
        }
    };
}
function takeNull(target) {
    return (block) => {
        if (target === undefined) {
            return block();
        }
    };
}
function takeLet(target) {
    return (block) => {
        return block(target);
    };
}
function takeAlso(target) {
    return (block) => {
        block(target);
        return target;
    };
}
function takeIf(target) {
    return (predicate) => {
        return predicate(target) ? target : undefined;
    };
}
function takeUnless(target) {
    return (predicate) => {
        return predicate(target) ? undefined : target;
    };
}
function repeat(action) {
    return (times) => {
        for (let i = 0; i < times; i++) {
            action(i);
        }
    };
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Only supports x,y,width,height,corner(just for four corners),rotation,bgColor,
 * @param panel @see Panel
 */
function animate(context) {
    const entity = context.entity;
    if (entity instanceof Panel) {
        let panel = entity;
        return (args) => __awaiter$1(this, void 0, void 0, function* () {
            yield context.callNative('animate', 'submit');
            args.animations();
            return takeLet(panel.getRootView())(root => {
                if (root.isDirty()) {
                    const model = root.toModel();
                    model.duration = args.duration;
                    const ret = context.callNative('animate', 'animateRender', model);
                    root.clean();
                    return ret;
                }
                for (let map of panel.allHeadViews()) {
                    for (let v of map.values()) {
                        if (v.isDirty()) {
                            const model_1 = v.toModel();
                            model_1.duration = args.duration;
                            const ret_1 = context.callNative('animate', 'animateRender', model_1);
                            v.clean();
                            return ret_1;
                        }
                    }
                }
                throw new Error('Cannot find any animated elements');
            });
        });
    }
    else {
        return (args) => {
            return Promise.reject(`Cannot find panel in Context:${context.id}`);
        };
    }
}

function notification(context) {
    return {
        /**
         * @param androidSystem: when set true, using global broadcast instead of local broadcast by default
         * @param iosUsingObject: when set true, using object instead of userInfo by default
         */
        publish: (args) => {
            if (args.data !== undefined) {
                args.data = JSON.stringify(args.data);
            }
            return context.callNative('notification', 'publish', args);
        },
        /**
         * @param androidSystem: when set true, using global broadcast instead of local broadcast by default
         * @param iosUsingObject: when set true, using object instead of userInfo by default
         */
        subscribe: (args) => {
            args.callback = context.function2Id(args.callback);
            return context.callNative('notification', 'subscribe', args);
        },
        unsubscribe: (subscribeId) => {
            context.removeFuncById(subscribeId);
            return context.callNative('notification', 'unsubscribe', subscribeId);
        }
    };
}

exports.StatusBarMode = void 0;
(function (StatusBarMode) {
    StatusBarMode[StatusBarMode["LIGHT"] = 0] = "LIGHT";
    StatusBarMode[StatusBarMode["DARK"] = 1] = "DARK";
})(exports.StatusBarMode || (exports.StatusBarMode = {}));
function statusbar(context) {
    return {
        setHidden: (hidden) => {
            return context.callNative('statusbar', 'setHidden', { hidden });
        },
        setMode: (mode) => {
            return context.callNative('statusbar', 'setMode', { mode });
        },
        setColor: (color) => {
            return context.callNative('statusbar', 'setColor', { color: color.toModel() });
        },
    };
}

function viewIdChains(view) {
    const viewIds = [];
    let thisView = view;
    while (thisView != undefined) {
        viewIds.push(thisView.viewId);
        thisView = thisView.superview;
    }
    return viewIds.reverse();
}
function coordinator(context) {
    return {
        verticalScrolling: (argument) => {
            if (context.entity instanceof Panel) {
                const panel = context.entity;
                panel.addOnRenderFinishedCallback(() => {
                    argument.scrollable = viewIdChains(argument.scrollable);
                    if (argument.target instanceof View) {
                        argument.target = viewIdChains(argument.target);
                    }
                    if (argument.changing.start instanceof Color) {
                        argument.changing.start = argument.changing.start.toModel();
                    }
                    if (argument.changing.end instanceof Color) {
                        argument.changing.end = argument.changing.end.toModel();
                    }
                    context.callNative("coordinator", "verticalScrolling", argument);
                });
            }
        },
        observeScrollingInterval: (argument) => {
            if (context.entity instanceof Panel) {
                const panel = context.entity;
                panel.addOnRenderFinishedCallback(() => {
                    argument.scrollable = viewIdChains(argument.scrollable);
                    argument.onScrolledInterval = context.function2Id(argument.onScrolledInterval);
                    context.callNative("coordinator", "observeScrollingInterval", argument);
                });
            }
        },
    };
}

function notch(context) {
    return {
        inset: () => {
            return context.callNative('notch', 'inset', {});
        }
    };
}

function keyboard(context) {
    return {
        subscribe: (callback) => {
            return context.callNative('keyboard', 'subscribe', context.function2Id(callback));
        },
        unsubscribe: (subscribeId) => {
            context.removeFuncById(subscribeId);
            return context.callNative('keyboard', 'unsubscribe', subscribeId);
        }
    };
}

function resourceLoader(context) {
    return {
        load: (resource) => {
            return context.callNative('resourceLoader', 'load', resource.toModel());
        },
    };
}

/*
 * Copyright [2021] [Doric.Pub]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function imageDecoder(context) {
    return {
        getImageInfo: (resource) => {
            return context.callNative('imageDecoder', 'getImageInfo', resource);
        },
        decodeToPixels: (resource) => __awaiter(this, void 0, void 0, function* () {
            return context.callNative('imageDecoder', 'decodeToPixels', resource);
        }),
    };
}

class Observable {
    constructor(provider, clz) {
        this.observers = new Set;
        this.provider = provider;
        this.clz = clz;
    }
    addObserver(observer) {
        this.observers.add(observer);
    }
    removeObserver(observer) {
        this.observers.delete(observer);
    }
    update(updater) {
        const oldV = this.provider.acquire(this.clz);
        const newV = updater(oldV);
        if (newV !== undefined) {
            this.provider.provide(newV);
        }
        for (let observer of this.observers) {
            observer(newV);
        }
    }
}
class Provider {
    constructor() {
        this.provision = new Map;
        this.observableMap = new Map;
    }
    provide(obj) {
        this.provision.set(obj.constructor, obj);
    }
    acquire(clz) {
        const ret = this.provision.get(clz);
        return ret;
    }
    remove(clz) {
        this.provision.delete(clz);
    }
    clear() {
        this.provision.clear();
    }
    observe(clz) {
        let observable = this.observableMap.get(clz);
        if (observable === undefined) {
            observable = new Observable(this, clz);
            this.observableMap.set(clz, observable);
        }
        return observable;
    }
}

class ViewHolder {
}
class ViewModel {
    constructor(obj, v) {
        this.state = obj;
        this.viewHolder = v;
    }
    getState() {
        return this.state;
    }
    getViewHolder() {
        return this.viewHolder;
    }
    updateState(setter) {
        setter(this.state);
        this.onBind(this.state, this.viewHolder);
    }
    attach(view) {
        this.viewHolder.build(view);
        this.onAttached(this.state, this.viewHolder);
        this.onBind(this.state, this.viewHolder);
    }
}
class VMPanel extends Panel {
    getViewModel() {
        return this.vm;
    }
    build(root) {
        this.vh = new (this.getViewHolderClass());
        this.vm = new (this.getViewModelClass())(this.getState(), this.vh);
        this.vm.context = this.context;
        this.vm.attach(root);
    }
}

class Module extends Panel {
    constructor() {
        super(...arguments);
        this.unmounted = false;
    }
    get provider() {
        var _a;
        return this.__provider || ((_a = this.superPanel) === null || _a === void 0 ? void 0 : _a.provider);
    }
    set provider(provider) {
        this.__provider = provider;
    }
    mount() {
        var _a;
        if (this.unmounted) {
            this.unmounted = false;
            (_a = this.superPanel) === null || _a === void 0 ? void 0 : _a.onStructureChanged(this, true);
            this.onMounted();
        }
    }
    unmount() {
        var _a;
        if (!this.unmounted) {
            this.unmounted = true;
            (_a = this.superPanel) === null || _a === void 0 ? void 0 : _a.onStructureChanged(this, false);
            this.onUnmounted();
        }
    }
    get mounted() {
        return !this.unmounted;
    }
    /**
     * Dispatch message to other modules.
     * @param message which is sent out
     */
    dispatchMessage(message) {
        var _a;
        (_a = this.superPanel) === null || _a === void 0 ? void 0 : _a.dispatchMessage(message);
    }
    /**
     * Dispatched messages can be received by override this method.
     * @param message recevied message
     */
    onMessage(message) { }
    /**
     * Called when this module is mounted
     */
    onMounted() { }
    /**
     * Called when this module is unmounted
     */
    onUnmounted() { }
}
class VMModule extends Module {
    getViewModel() {
        return this.vm;
    }
    build(root) {
        this.vh = new (this.getViewHolderClass());
        this.vm = new (this.getViewModelClass())(this.getState(), this.vh);
        this.vm.context = this.context;
        this.vm.attach(root);
    }
}
class ModularPanel extends Module {
    constructor() {
        super();
        this.modules = this.setupModules().map(e => {
            const instance = new e;
            if (instance instanceof Module) {
                instance.superPanel = this;
            }
            return instance;
        });
    }
    dispatchMessage(message) {
        if (this.superPanel) {
            this.superPanel.dispatchMessage(message);
        }
        else {
            this.onMessage(message);
        }
    }
    get mountedModules() {
        return this.modules.filter(e => !(e instanceof Module) || e.mounted);
    }
    onMessage(message) {
        this.mountedModules.forEach(e => {
            if (e instanceof Module) {
                e.onMessage(message);
            }
        });
    }
    onStructureChanged(module, mounted) {
        if (this.superPanel) {
            this.superPanel.onStructureChanged(module, mounted);
        }
        else {
            if (!!!this.scheduledRebuild) {
                this.scheduledRebuild = setTimeout(() => {
                    this.scheduledRebuild = undefined;
                    this.getRootView().children.length = 0;
                    this.build(this.getRootView());
                }, 0);
            }
        }
    }
    build(root) {
        const groupView = this.setupShelf(root);
        this.mountedModules.forEach(e => {
            Reflect.set(e, "__root__", groupView);
            e.build(groupView);
        });
    }
    onCreate() {
        super.onCreate();
        this.mountedModules.forEach(e => {
            e.context = this.context;
            e.onCreate();
        });
    }
    onDestroy() {
        super.onDestroy();
        this.mountedModules.forEach(e => {
            e.onDestroy();
        });
    }
    onShow() {
        super.onShow();
        this.mountedModules.forEach(e => {
            e.onShow();
        });
    }
    onHidden() {
        super.onHidden();
        this.mountedModules.forEach(e => {
            e.onHidden();
        });
    }
    onRenderFinished() {
        super.onRenderFinished();
        this.mountedModules.forEach(e => {
            e.onRenderFinished();
        });
    }
}

exports.AeroEffect = AeroEffect;
exports.AlphaAnimation = AlphaAnimation;
exports.AndroidAssetsResource = AndroidAssetsResource;
exports.AndroidResource = AndroidResource;
exports.AnimationSet = AnimationSet;
exports.ArrayBufferResource = ArrayBufferResource;
exports.AssetsResource = AssetsResource;
exports.BOTTOM = BOTTOM;
exports.BackgroundColorAnimation = BackgroundColorAnimation;
exports.Base64Resource = Base64Resource;
exports.BlurEffect = BlurEffect;
exports.BundleResource = BundleResource;
exports.CENTER = CENTER;
exports.CENTER_X = CENTER_X;
exports.CENTER_Y = CENTER_Y;
exports.Color = Color;
exports.Draggable = Draggable;
exports.DrawableResource = DrawableResource;
exports.FlexLayout = FlexLayout;
exports.FlexTypedValue = FlexTypedValue;
exports.FlowLayout = FlowLayout;
exports.FlowLayoutItem = FlowLayoutItem;
exports.GestureContainer = GestureContainer;
exports.Gravity = Gravity;
exports.Group = Group;
exports.HLayout = HLayout;
exports.HorizontalList = HorizontalList;
exports.HorizontalListItem = HorizontalListItem;
exports.Image = Image;
exports.InconsistProperty = InconsistProperty;
exports.Input = Input;
exports.LEFT = LEFT;
exports.LayoutConfigImpl = LayoutConfigImpl;
exports.List = List;
exports.ListItem = ListItem;
exports.LocalResource = LocalResource;
exports.MainBundleResource = MainBundleResource;
exports.ModularPanel = ModularPanel;
exports.Module = Module;
exports.Mutable = Mutable;
exports.NativeCall = NativeCall;
exports.NestedSlider = NestedSlider;
exports.Observable = Observable;
exports.Panel = Panel;
exports.Property = Property;
exports.Provider = Provider;
exports.RIGHT = RIGHT;
exports.RawResource = RawResource;
exports.Ref = Ref;
exports.Refreshable = Refreshable;
exports.RemoteResource = RemoteResource;
exports.Resource = Resource;
exports.Root = Root;
exports.RotationAnimation = RotationAnimation;
exports.RotationXAnimation = RotationXAnimation;
exports.RotationYAnimation = RotationYAnimation;
exports.ScaleAnimation = ScaleAnimation;
exports.Scroller = Scroller;
exports.SlideItem = SlideItem;
exports.Slider = Slider;
exports.Stack = Stack;
exports.Superview = Superview;
exports.Switch = Switch;
exports.TOP = TOP;
exports.Text = Text;
exports.TranslationAnimation = TranslationAnimation;
exports.VLayout = VLayout;
exports.VMModule = VMModule;
exports.VMPanel = VMPanel;
exports.View = View;
exports.ViewComponent = ViewComponent;
exports.ViewHolder = ViewHolder;
exports.ViewModel = ViewModel;
exports.aeroEffect = aeroEffect;
exports.animate = animate;
exports.blurEffect = blurEffect;
exports.coordinator = coordinator;
exports.createRef = createRef;
exports.draggable = draggable;
exports.flexlayout = flexlayout;
exports.flowItem = flowItem;
exports.flowlayout = flowlayout;
exports.gestureContainer = gestureContainer;
exports.gravity = gravity;
exports.hlayout = hlayout;
exports.horizontalList = horizontalList;
exports.horizontalListItem = horizontalListItem;
exports.iOSResource = iOSResource;
exports.image = image;
exports.imageDecoder = imageDecoder;
exports.input = input;
exports.internalScheme = internalScheme;
exports.keyboard = keyboard;
exports.layoutConfig = layoutConfig;
exports.list = list;
exports.listItem = listItem;
exports.log = log;
exports.loge = loge;
exports.logw = logw;
exports.modal = modal;
exports.navbar = navbar;
exports.navigator = navigator;
exports.network = network;
exports.notch = notch;
exports.notification = notification;
exports.obj2Model = obj2Model;
exports.popover = popover;
exports.pullable = pullable;
exports.refreshable = refreshable;
exports.repeat = repeat;
exports.resourceLoader = resourceLoader;
exports.scroller = scroller;
exports.slideItem = slideItem;
exports.slider = slider;
exports.stack = stack;
exports.statusbar = statusbar;
exports.storage = storage;
exports.switchView = switchView;
exports.take = take;
exports.takeAlso = takeAlso;
exports.takeIf = takeIf;
exports.takeLet = takeLet;
exports.takeNonNull = takeNonNull;
exports.takeNull = takeNull;
exports.takeUnless = takeUnless;
exports.text = text;
exports.uniqueId = uniqueId;
exports.vlayout = vlayout;

})(__module,__module.exports,doric.__require__);
return __module.exports;
},this,[{exports:{}}])]);
/**--------Lib--------*/
    
var doric_web = (function (exports, axios, sandbox) {
	'use strict';

	function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

	var axios__default = /*#__PURE__*/_interopDefaultLegacy(axios);

	function createCommonjsModule(fn, basedir, module) {
		return module = {
		  path: basedir,
		  exports: {},
		  require: function (path, base) {
	      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
	    }
		}, fn(module, module.exports), module.exports;
	}

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
	}

	var smoothscroll = createCommonjsModule(function (module, exports) {
	/* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */
	(function () {

	  // polyfill
	  function polyfill() {
	    // aliases
	    var w = window;
	    var d = document;

	    // return if scroll behavior is supported and polyfill is not forced
	    if (
	      'scrollBehavior' in d.documentElement.style &&
	      w.__forceSmoothScrollPolyfill__ !== true
	    ) {
	      return;
	    }

	    // globals
	    var Element = w.HTMLElement || w.Element;
	    var SCROLL_TIME = 468;

	    // object gathering original scroll methods
	    var original = {
	      scroll: w.scroll || w.scrollTo,
	      scrollBy: w.scrollBy,
	      elementScroll: Element.prototype.scroll || scrollElement,
	      scrollIntoView: Element.prototype.scrollIntoView
	    };

	    // define timing method
	    var now =
	      w.performance && w.performance.now
	        ? w.performance.now.bind(w.performance)
	        : Date.now;

	    /**
	     * indicates if a the current browser is made by Microsoft
	     * @method isMicrosoftBrowser
	     * @param {String} userAgent
	     * @returns {Boolean}
	     */
	    function isMicrosoftBrowser(userAgent) {
	      var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

	      return new RegExp(userAgentPatterns.join('|')).test(userAgent);
	    }

	    /*
	     * IE has rounding bug rounding down clientHeight and clientWidth and
	     * rounding up scrollHeight and scrollWidth causing false positives
	     * on hasScrollableSpace
	     */
	    var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

	    /**
	     * changes scroll position inside an element
	     * @method scrollElement
	     * @param {Number} x
	     * @param {Number} y
	     * @returns {undefined}
	     */
	    function scrollElement(x, y) {
	      this.scrollLeft = x;
	      this.scrollTop = y;
	    }

	    /**
	     * returns result of applying ease math function to a number
	     * @method ease
	     * @param {Number} k
	     * @returns {Number}
	     */
	    function ease(k) {
	      return 0.5 * (1 - Math.cos(Math.PI * k));
	    }

	    /**
	     * indicates if a smooth behavior should be applied
	     * @method shouldBailOut
	     * @param {Number|Object} firstArg
	     * @returns {Boolean}
	     */
	    function shouldBailOut(firstArg) {
	      if (
	        firstArg === null ||
	        typeof firstArg !== 'object' ||
	        firstArg.behavior === undefined ||
	        firstArg.behavior === 'auto' ||
	        firstArg.behavior === 'instant'
	      ) {
	        // first argument is not an object/null
	        // or behavior is auto, instant or undefined
	        return true;
	      }

	      if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
	        // first argument is an object and behavior is smooth
	        return false;
	      }

	      // throw error when behavior is not supported
	      throw new TypeError(
	        'behavior member of ScrollOptions ' +
	          firstArg.behavior +
	          ' is not a valid value for enumeration ScrollBehavior.'
	      );
	    }

	    /**
	     * indicates if an element has scrollable space in the provided axis
	     * @method hasScrollableSpace
	     * @param {Node} el
	     * @param {String} axis
	     * @returns {Boolean}
	     */
	    function hasScrollableSpace(el, axis) {
	      if (axis === 'Y') {
	        return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
	      }

	      if (axis === 'X') {
	        return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
	      }
	    }

	    /**
	     * indicates if an element has a scrollable overflow property in the axis
	     * @method canOverflow
	     * @param {Node} el
	     * @param {String} axis
	     * @returns {Boolean}
	     */
	    function canOverflow(el, axis) {
	      var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

	      return overflowValue === 'auto' || overflowValue === 'scroll';
	    }

	    /**
	     * indicates if an element can be scrolled in either axis
	     * @method isScrollable
	     * @param {Node} el
	     * @param {String} axis
	     * @returns {Boolean}
	     */
	    function isScrollable(el) {
	      var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
	      var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

	      return isScrollableY || isScrollableX;
	    }

	    /**
	     * finds scrollable parent of an element
	     * @method findScrollableParent
	     * @param {Node} el
	     * @returns {Node} el
	     */
	    function findScrollableParent(el) {
	      while (el !== d.body && isScrollable(el) === false) {
	        el = el.parentNode || el.host;
	      }

	      return el;
	    }

	    /**
	     * self invoked function that, given a context, steps through scrolling
	     * @method step
	     * @param {Object} context
	     * @returns {undefined}
	     */
	    function step(context) {
	      var time = now();
	      var value;
	      var currentX;
	      var currentY;
	      var elapsed = (time - context.startTime) / SCROLL_TIME;

	      // avoid elapsed times higher than one
	      elapsed = elapsed > 1 ? 1 : elapsed;

	      // apply easing to elapsed time
	      value = ease(elapsed);

	      currentX = context.startX + (context.x - context.startX) * value;
	      currentY = context.startY + (context.y - context.startY) * value;

	      context.method.call(context.scrollable, currentX, currentY);

	      // scroll more if we have not reached our destination
	      if (currentX !== context.x || currentY !== context.y) {
	        w.requestAnimationFrame(step.bind(w, context));
	      }
	    }

	    /**
	     * scrolls window or element with a smooth behavior
	     * @method smoothScroll
	     * @param {Object|Node} el
	     * @param {Number} x
	     * @param {Number} y
	     * @returns {undefined}
	     */
	    function smoothScroll(el, x, y) {
	      var scrollable;
	      var startX;
	      var startY;
	      var method;
	      var startTime = now();

	      // define scroll context
	      if (el === d.body) {
	        scrollable = w;
	        startX = w.scrollX || w.pageXOffset;
	        startY = w.scrollY || w.pageYOffset;
	        method = original.scroll;
	      } else {
	        scrollable = el;
	        startX = el.scrollLeft;
	        startY = el.scrollTop;
	        method = scrollElement;
	      }

	      // scroll looping over a frame
	      step({
	        scrollable: scrollable,
	        method: method,
	        startTime: startTime,
	        startX: startX,
	        startY: startY,
	        x: x,
	        y: y
	      });
	    }

	    // ORIGINAL METHODS OVERRIDES
	    // w.scroll and w.scrollTo
	    w.scroll = w.scrollTo = function() {
	      // avoid action when no arguments are passed
	      if (arguments[0] === undefined) {
	        return;
	      }

	      // avoid smooth behavior if not required
	      if (shouldBailOut(arguments[0]) === true) {
	        original.scroll.call(
	          w,
	          arguments[0].left !== undefined
	            ? arguments[0].left
	            : typeof arguments[0] !== 'object'
	              ? arguments[0]
	              : w.scrollX || w.pageXOffset,
	          // use top prop, second argument if present or fallback to scrollY
	          arguments[0].top !== undefined
	            ? arguments[0].top
	            : arguments[1] !== undefined
	              ? arguments[1]
	              : w.scrollY || w.pageYOffset
	        );

	        return;
	      }

	      // LET THE SMOOTHNESS BEGIN!
	      smoothScroll.call(
	        w,
	        d.body,
	        arguments[0].left !== undefined
	          ? ~~arguments[0].left
	          : w.scrollX || w.pageXOffset,
	        arguments[0].top !== undefined
	          ? ~~arguments[0].top
	          : w.scrollY || w.pageYOffset
	      );
	    };

	    // w.scrollBy
	    w.scrollBy = function() {
	      // avoid action when no arguments are passed
	      if (arguments[0] === undefined) {
	        return;
	      }

	      // avoid smooth behavior if not required
	      if (shouldBailOut(arguments[0])) {
	        original.scrollBy.call(
	          w,
	          arguments[0].left !== undefined
	            ? arguments[0].left
	            : typeof arguments[0] !== 'object' ? arguments[0] : 0,
	          arguments[0].top !== undefined
	            ? arguments[0].top
	            : arguments[1] !== undefined ? arguments[1] : 0
	        );

	        return;
	      }

	      // LET THE SMOOTHNESS BEGIN!
	      smoothScroll.call(
	        w,
	        d.body,
	        ~~arguments[0].left + (w.scrollX || w.pageXOffset),
	        ~~arguments[0].top + (w.scrollY || w.pageYOffset)
	      );
	    };

	    // Element.prototype.scroll and Element.prototype.scrollTo
	    Element.prototype.scroll = Element.prototype.scrollTo = function() {
	      // avoid action when no arguments are passed
	      if (arguments[0] === undefined) {
	        return;
	      }

	      // avoid smooth behavior if not required
	      if (shouldBailOut(arguments[0]) === true) {
	        // if one number is passed, throw error to match Firefox implementation
	        if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
	          throw new SyntaxError('Value could not be converted');
	        }

	        original.elementScroll.call(
	          this,
	          // use left prop, first number argument or fallback to scrollLeft
	          arguments[0].left !== undefined
	            ? ~~arguments[0].left
	            : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
	          // use top prop, second argument or fallback to scrollTop
	          arguments[0].top !== undefined
	            ? ~~arguments[0].top
	            : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
	        );

	        return;
	      }

	      var left = arguments[0].left;
	      var top = arguments[0].top;

	      // LET THE SMOOTHNESS BEGIN!
	      smoothScroll.call(
	        this,
	        this,
	        typeof left === 'undefined' ? this.scrollLeft : ~~left,
	        typeof top === 'undefined' ? this.scrollTop : ~~top
	      );
	    };

	    // Element.prototype.scrollBy
	    Element.prototype.scrollBy = function() {
	      // avoid action when no arguments are passed
	      if (arguments[0] === undefined) {
	        return;
	      }

	      // avoid smooth behavior if not required
	      if (shouldBailOut(arguments[0]) === true) {
	        original.elementScroll.call(
	          this,
	          arguments[0].left !== undefined
	            ? ~~arguments[0].left + this.scrollLeft
	            : ~~arguments[0] + this.scrollLeft,
	          arguments[0].top !== undefined
	            ? ~~arguments[0].top + this.scrollTop
	            : ~~arguments[1] + this.scrollTop
	        );

	        return;
	      }

	      this.scroll({
	        left: ~~arguments[0].left + this.scrollLeft,
	        top: ~~arguments[0].top + this.scrollTop,
	        behavior: arguments[0].behavior
	      });
	    };

	    // Element.prototype.scrollIntoView
	    Element.prototype.scrollIntoView = function() {
	      // avoid smooth behavior if not required
	      if (shouldBailOut(arguments[0]) === true) {
	        original.scrollIntoView.call(
	          this,
	          arguments[0] === undefined ? true : arguments[0]
	        );

	        return;
	      }

	      // LET THE SMOOTHNESS BEGIN!
	      var scrollableParent = findScrollableParent(this);
	      var parentRects = scrollableParent.getBoundingClientRect();
	      var clientRects = this.getBoundingClientRect();

	      if (scrollableParent !== d.body) {
	        // reveal element inside parent
	        smoothScroll.call(
	          this,
	          scrollableParent,
	          scrollableParent.scrollLeft + clientRects.left - parentRects.left,
	          scrollableParent.scrollTop + clientRects.top - parentRects.top
	        );

	        // reveal parent in viewport unless is fixed
	        if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
	          w.scrollBy({
	            left: parentRects.left,
	            top: parentRects.top,
	            behavior: 'smooth'
	          });
	        }
	      } else {
	        // reveal element in viewport
	        w.scrollBy({
	          left: clientRects.left,
	          top: clientRects.top,
	          behavior: 'smooth'
	        });
	      }
	    };
	  }

	  {
	    // commonjs
	    module.exports = { polyfill: polyfill };
	  }

	}());
	});

	var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	const loaders = [
	    {
	        filter: () => true,
	        request: (source) => __awaiter$2(void 0, void 0, void 0, function* () {
	            const result = yield axios__default["default"].get(source);
	            return result.data;
	        })
	    }
	];
	function registerDoricJSLoader(loader) {
	    loaders.push(loader);
	}
	function loadDoricJSBundle(source) {
	    return __awaiter$2(this, void 0, void 0, function* () {
	        const matched = loaders.filter(e => e.filter(source));
	        if (matched.length > 0) {
	            return matched[matched.length - 1].request(source);
	        }
	        throw new Error(`Cannot find matched loader for '${source}'`);
	    });
	}

	class DoricPlugin {
	    constructor(context) {
	        this.context = context;
	    }
	    onTearDown() {
	    }
	}

	var GradientOrientation;
	(function (GradientOrientation) {
	    /** draw the gradient from the top to the bottom */
	    GradientOrientation[GradientOrientation["TOP_BOTTOM"] = 0] = "TOP_BOTTOM";
	    /** draw the gradient from the top-right to the bottom-left */
	    GradientOrientation[GradientOrientation["TR_BL"] = 1] = "TR_BL";
	    /** draw the gradient from the right to the left */
	    GradientOrientation[GradientOrientation["RIGHT_LEFT"] = 2] = "RIGHT_LEFT";
	    /** draw the gradient from the bottom-right to the top-left */
	    GradientOrientation[GradientOrientation["BR_TL"] = 3] = "BR_TL";
	    /** draw the gradient from the bottom to the top */
	    GradientOrientation[GradientOrientation["BOTTOM_TOP"] = 4] = "BOTTOM_TOP";
	    /** draw the gradient from the bottom-left to the top-right */
	    GradientOrientation[GradientOrientation["BL_TR"] = 5] = "BL_TR";
	    /** draw the gradient from the left to the right */
	    GradientOrientation[GradientOrientation["LEFT_RIGHT"] = 6] = "LEFT_RIGHT";
	    /** draw the gradient from the top-left to the bottom-right */
	    GradientOrientation[GradientOrientation["TL_BR"] = 7] = "TL_BR";
	})(GradientOrientation || (GradientOrientation = {}));
	function toRGBAString(color) {
	    let strs = [];
	    for (let i = 0; i < 32; i += 8) {
	        strs.push(((color >> i) & 0xff));
	    }
	    strs = strs.reverse();
	    /// RGBAd
	    return `rgba(${strs[1]},${strs[2]},${strs[3]},${strs[0] / 255})`;
	}
	function generateGradientColorDesc(colors, locations) {
	    if (!locations) {
	        return colors.join(', ');
	    }
	    if (colors.length !== locations.length) {
	        throw new Error("Colors and locations arrays must have the same length.");
	    }
	    const gradientStops = colors.map((color, index) => `${color} ${locations[index] * 100}%`);
	    return gradientStops.join(", ");
	}
	function generateGradientOrientationDesc(orientation) {
	    switch (orientation) {
	        case GradientOrientation.TR_BL:
	            return 'to bottom left';
	        case GradientOrientation.RIGHT_LEFT:
	            return 'to left';
	        case GradientOrientation.BR_TL:
	            return 'to top left';
	        case GradientOrientation.BOTTOM_TOP:
	            return 'to top';
	        case GradientOrientation.BL_TR:
	            return 'to top right';
	        case GradientOrientation.LEFT_RIGHT:
	            return 'to right';
	        case GradientOrientation.TL_BR:
	            return 'to bottom right';
	        default:
	            return 'to bottom';
	    }
	}

	exports.LayoutSpec = void 0;
	(function (LayoutSpec) {
	    LayoutSpec[LayoutSpec["EXACTLY"] = 0] = "EXACTLY";
	    LayoutSpec[LayoutSpec["WRAP_CONTENT"] = 1] = "WRAP_CONTENT";
	    LayoutSpec[LayoutSpec["AT_MOST"] = 2] = "AT_MOST";
	})(exports.LayoutSpec || (exports.LayoutSpec = {}));
	const SPECIFIED = 1;
	const START = 1 << 1;
	const END = 1 << 2;
	const SHIFT_X = 0;
	const SHIFT_Y = 4;
	const LEFT = (START | SPECIFIED) << SHIFT_X;
	const RIGHT = (END | SPECIFIED) << SHIFT_X;
	const TOP = (START | SPECIFIED) << SHIFT_Y;
	const BOTTOM = (END | SPECIFIED) << SHIFT_Y;
	const CENTER_X = SPECIFIED << SHIFT_X;
	const CENTER_Y = SPECIFIED << SHIFT_Y;
	const CENTER = CENTER_X | CENTER_Y;
	function toPixelString(v) {
	    return `${v}px`;
	}
	function pixelString2Number(v) {
	    return parseFloat(v.substring(0, v.indexOf("px")));
	}
	class DoricViewNode {
	    constructor(context) {
	        this.viewId = "";
	        this.viewType = "View";
	        this.layoutConfig = {
	            widthSpec: exports.LayoutSpec.EXACTLY,
	            heightSpec: exports.LayoutSpec.EXACTLY,
	            alignment: 0,
	            weight: 0,
	            margin: {
	                left: 0,
	                right: 0,
	                top: 0,
	                bottom: 0
	            },
	            maxWidth: -1,
	            maxHeight: -1,
	            minWidth: -1,
	            minHeight: -1
	        };
	        this.padding = {
	            left: 0,
	            right: 0,
	            top: 0,
	            bottom: 0,
	        };
	        this.frameWidth = 0;
	        this.frameHeight = 0;
	        this.offsetX = 0;
	        this.offsetY = 0;
	        this._originDisplay = "";
	        this.transform = {};
	        this.context = context;
	    }
	    init(superNode) {
	        if (superNode) {
	            this.superNode = superNode;
	            if (this instanceof DoricSuperNode) {
	                this.reusable = superNode.reusable;
	            }
	        }
	        this.view = this.build();
	        this._originDisplay = this.view.style.display;
	    }
	    get paddingLeft() {
	        return this.padding.left || 0;
	    }
	    get paddingRight() {
	        return this.padding.right || 0;
	    }
	    get paddingTop() {
	        return this.padding.top || 0;
	    }
	    get paddingBottom() {
	        return this.padding.bottom || 0;
	    }
	    get borderWidth() {
	        var _a;
	        return ((_a = this.border) === null || _a === void 0 ? void 0 : _a.width) || 0;
	    }
	    blend(props) {
	        this.view.id = `${this.viewId}`;
	        for (let key in props) {
	            this.blendProps(this.view, key, props[key]);
	        }
	        this.onBlending();
	        this.layout();
	    }
	    onBlending() {
	        this.updateTransform();
	    }
	    onBlended() {
	    }
	    configBorder() {
	        if (this.border) {
	            this.applyCSSStyle({
	                borderStyle: "solid",
	                borderWidth: toPixelString(this.border.width),
	                borderColor: toRGBAString(this.border.color),
	            });
	        }
	    }
	    configWidth() {
	        let width;
	        switch (this.layoutConfig.widthSpec) {
	            case exports.LayoutSpec.WRAP_CONTENT:
	                width = "max-content";
	                break;
	            case exports.LayoutSpec.AT_MOST:
	                width = "100%";
	                break;
	            case exports.LayoutSpec.EXACTLY:
	            default:
	                width = toPixelString(this.frameWidth
	                    - this.paddingLeft - this.paddingRight
	                    - this.borderWidth * 2);
	                break;
	        }
	        this.applyCSSStyle({ width });
	    }
	    configSizeConstraints() {
	        if (this.layoutConfig.maxWidth && this.layoutConfig.maxWidth !== -1) {
	            this.applyCSSStyle({ maxWidth: toPixelString(this.layoutConfig.maxWidth) });
	        }
	        else {
	            this.view.style.removeProperty('max-width');
	        }
	        if (this.layoutConfig.maxHeight && this.layoutConfig.maxHeight !== -1) {
	            this.applyCSSStyle({ maxHeight: toPixelString(this.layoutConfig.maxHeight) });
	        }
	        else {
	            this.view.style.removeProperty('max-height');
	        }
	        if (this.layoutConfig.minWidth && this.layoutConfig.minWidth !== -1) {
	            this.applyCSSStyle({ minWidth: toPixelString(this.layoutConfig.minWidth) });
	        }
	        else {
	            this.view.style.removeProperty('min-width');
	        }
	        if (this.layoutConfig.minHeight && this.layoutConfig.minHeight !== -1) {
	            this.applyCSSStyle({ minHeight: toPixelString(this.layoutConfig.minHeight) });
	        }
	        else {
	            this.view.style.removeProperty('min-height');
	        }
	    }
	    configHeight() {
	        let height;
	        switch (this.layoutConfig.heightSpec) {
	            case exports.LayoutSpec.WRAP_CONTENT:
	                height = "max-content";
	                break;
	            case exports.LayoutSpec.AT_MOST:
	                height = "100%";
	                break;
	            case exports.LayoutSpec.EXACTLY:
	            default:
	                height = toPixelString(this.frameHeight
	                    - this.paddingTop - this.paddingBottom
	                    - this.borderWidth * 2);
	                break;
	        }
	        this.applyCSSStyle({ height });
	    }
	    configMargin() {
	        if (this.layoutConfig.margin) {
	            this.applyCSSStyle({
	                marginLeft: toPixelString(this.layoutConfig.margin.left || 0),
	                marginRight: toPixelString(this.layoutConfig.margin.right || 0),
	                marginTop: toPixelString(this.layoutConfig.margin.top || 0),
	                marginBottom: toPixelString(this.layoutConfig.margin.bottom || 0),
	            });
	        }
	    }
	    configPadding() {
	        if (this.padding) {
	            this.applyCSSStyle({
	                paddingLeft: toPixelString(this.paddingLeft),
	                paddingRight: toPixelString(this.paddingRight),
	                paddingTop: toPixelString(this.paddingTop),
	                paddingBottom: toPixelString(this.paddingBottom),
	            });
	        }
	    }
	    layout() {
	        this.configMargin();
	        this.configBorder();
	        this.configPadding();
	        this.configWidth();
	        this.configHeight();
	        this.configSizeConstraints();
	    }
	    blendProps(v, propName, prop) {
	        switch (propName) {
	            case "border":
	                this.border = prop;
	                break;
	            case "padding":
	                this.padding = prop;
	                break;
	            case 'width':
	                this.frameWidth = prop;
	                break;
	            case 'height':
	                this.frameHeight = prop;
	                break;
	            case 'backgroundColor':
	                this.backgroundColor = prop;
	                break;
	            case 'layoutConfig':
	                const layoutConfig = prop;
	                for (let key in layoutConfig) {
	                    Reflect.set(this.layoutConfig, key, Reflect.get(layoutConfig, key, layoutConfig));
	                }
	                break;
	            case 'x':
	                this.offsetX = prop;
	                break;
	            case 'y':
	                this.offsetY = prop;
	                break;
	            case 'onClick':
	                this.view.onclick = (event) => {
	                    this.callJSResponse(prop);
	                    event.stopPropagation();
	                };
	                break;
	            case 'corners':
	                if (typeof prop === 'object') {
	                    this.applyCSSStyle({
	                        borderTopLeftRadius: toPixelString(prop.leftTop),
	                        borderTopRightRadius: toPixelString(prop.rightTop),
	                        borderBottomRightRadius: toPixelString(prop.rightBottom),
	                        borderBottomLeftRadius: toPixelString(prop.leftBottom),
	                    });
	                }
	                else {
	                    this.applyCSSStyle({ borderRadius: toPixelString(prop) });
	                }
	                break;
	            case 'shadow':
	                const opacity = prop.opacity || 0;
	                let boxShadow;
	                if (opacity > 0) {
	                    const offsetX = prop.offsetX || 0;
	                    const offsetY = prop.offsetY || 0;
	                    const shadowColor = prop.color || 0xff000000;
	                    const shadowRadius = prop.radius;
	                    const alpha = opacity * 255;
	                    boxShadow = `${toPixelString(offsetX)} ${toPixelString(offsetY)} ${toPixelString(shadowRadius)} ${toRGBAString((shadowColor & 0xffffff) | ((alpha & 0xff) << 24))} `;
	                }
	                else {
	                    boxShadow = "";
	                }
	                this.applyCSSStyle({
	                    boxShadow,
	                });
	                break;
	            case 'alpha':
	                this.applyCSSStyle({
	                    opacity: `${prop}`,
	                });
	                break;
	            case 'rotation':
	                this.transform.rotation = prop;
	                break;
	            case 'rotationX':
	                this.transform.rotationX = prop;
	                break;
	            case 'rotationY':
	                this.transform.rotationY = prop;
	                break;
	            case 'scaleX':
	                this.transform.scaleX = prop;
	                break;
	            case 'scaleY':
	                this.transform.scaleY = prop;
	                break;
	            case 'translationX':
	                this.transform.translateX = prop;
	                break;
	            case 'translationY':
	                this.transform.translateY = prop;
	                break;
	            case 'pivotX':
	                if (this.transformOrigin) {
	                    this.transformOrigin.x = prop;
	                }
	                else {
	                    this.transformOrigin = {
	                        x: prop,
	                        y: 0.5,
	                    };
	                }
	                break;
	            case 'pivotY':
	                if (this.transformOrigin) {
	                    this.transformOrigin.y = prop;
	                }
	                else {
	                    this.transformOrigin = {
	                        x: 0.5,
	                        y: prop,
	                    };
	                }
	                break;
	            case 'hidden':
	                this.applyCSSStyle({
	                    display: prop === true ? "none" : this._originDisplay
	                });
	                break;
	            default:
	                console.error(`Cannot blend prop for ${propName}`);
	                break;
	        }
	    }
	    set backgroundColor(v) {
	        if (typeof v === 'number') {
	            this.applyCSSStyle({ backgroundColor: toRGBAString(v) });
	        }
	        else {
	            let colorsParam = [];
	            const { start, end, colors, locations, orientation = 0 } = v;
	            if (colors) {
	                colorsParam = colors.map((c) => {
	                    return toRGBAString(c);
	                });
	            }
	            else if (typeof start === 'number' && typeof end === 'number') {
	                colorsParam.push(...[toRGBAString(start), toRGBAString(end)]);
	            }
	            this.applyCSSStyle({ backgroundImage: `linear-gradient(${generateGradientOrientationDesc(orientation)}, ${generateGradientColorDesc(colorsParam, locations)})` });
	        }
	    }
	    static create(context, type) {
	        const viewNodeClass = acquireViewNode(type);
	        if (viewNodeClass === undefined) {
	            console.error(`Cannot find ViewNode for ${type}`);
	            return undefined;
	        }
	        const ret = new viewNodeClass(context);
	        ret.viewType = type;
	        return ret;
	    }
	    getIdList() {
	        const ids = [];
	        let viewNode = this;
	        do {
	            ids.push(viewNode.viewId);
	            viewNode = viewNode.superNode;
	        } while (viewNode);
	        return ids.reverse();
	    }
	    callJSResponse(funcId, ...args) {
	        const argumentsList = ['__response__', this.getIdList(), funcId];
	        for (let i = 1; i < arguments.length; i++) {
	            argumentsList.push(arguments[i]);
	        }
	        return Reflect.apply(this.context.invokeEntityMethod, this.context, argumentsList);
	    }
	    pureCallJSResponse(funcId, ...args) {
	        const argumentsList = ['__response__', this.getIdList(), funcId];
	        for (let i = 1; i < arguments.length; i++) {
	            argumentsList.push(arguments[i]);
	        }
	        return Reflect.apply(this.context.pureInvokeEntityMethod, this.context, argumentsList);
	    }
	    updateTransform() {
	        this.applyCSSStyle({
	            transform: Object.entries(this.transform).filter((e) => !!e[1]).map((e) => {
	                const v = e[1] || 0;
	                switch (e[0]) {
	                    case "translateX":
	                        return `translateX(${v}px)`;
	                    case "scaleX":
	                        return `scaleX(${v})`;
	                    case "scaleY":
	                        return `scaleY(${v})`;
	                    case "rotation":
	                        return `rotate(${v / 2}turn)`;
	                    case "rotationX":
	                        return `rotateX(${v / 2}turn)`;
	                    case "rotationY":
	                        return `rotateY(${v / 2}turn)`;
	                    default:
	                        console.error(`Do not support transform ${e[0]}`);
	                        return "";
	                }
	            }).join(" ")
	        });
	    }
	    updateTransformOrigin() {
	        if (this.transformOrigin) {
	            this.applyCSSStyle({
	                transformOrigin: `${Math.round(this.transformOrigin.x * 100)}% ${Math.round(this.transformOrigin.y * 100)}%`
	            });
	        }
	    }
	    applyCSSStyle(cssStyle) {
	        if (this.context.inAnimation()) {
	            this.context.addAnimation(this, cssStyle);
	        }
	        else {
	            for (let v in cssStyle) {
	                Reflect.set(this.view.style, v, cssStyle[v]);
	            }
	        }
	    }
	    /** ++++++++++call from doric ++++++++++*/
	    getWidth() {
	        return this.view.offsetWidth;
	    }
	    getHeight() {
	        return this.view.offsetHeight;
	    }
	    setWidth(v) {
	        this.view.style.width = toPixelString(v);
	    }
	    setHeight(v) {
	        this.view.style.height = toPixelString(v);
	    }
	    getX() {
	        return this.view.offsetLeft;
	    }
	    getY() {
	        return this.view.offsetTop;
	    }
	    setX(v) {
	        this.view.style.left = toPixelString(v);
	    }
	    setY(v) {
	        this.view.style.top = toPixelString(v);
	    }
	    getBackgroundColor() {
	        return this.view.style.backgroundColor;
	    }
	    setBackgroundColor(v) {
	        this.backgroundColor = v;
	    }
	    getAlpha() {
	        return parseFloat(this.view.style.opacity);
	    }
	    setAlpha(v) {
	        this.view.style.opacity = `${v}`;
	    }
	    getCorners() {
	        return parseFloat(this.view.style.borderRadius);
	    }
	    setCorners(v) {
	        this.view.style.borderRadius = toPixelString(v);
	    }
	    getLocationOnScreen() {
	        const rect = this.view.getClientRects()[0];
	        return {
	            x: rect.left,
	            y: rect.top,
	        };
	    }
	    getRotation() {
	        return this.transform.rotation;
	    }
	    setRotation(v) {
	        this.transform.rotation = v;
	        this.updateTransform();
	    }
	    getRotationX() {
	        return this.transform.rotationX;
	    }
	    setRotationX(v) {
	        this.transform.rotationX = v;
	        this.updateTransform();
	    }
	    getRotationY() {
	        return this.transform.rotationY;
	    }
	    setRotationY(v) {
	        this.transform.rotationY = v;
	        this.updateTransform();
	    }
	    getTranslationX() {
	        return this.transform.translateX;
	    }
	    setTranslationX(v) {
	        this.transform.translateX = v;
	        this.updateTransform();
	    }
	    getTranslationY() {
	        return this.transform.translateY;
	    }
	    setTranslationY(v) {
	        this.transform.translateY = v;
	        this.updateTransform();
	    }
	    getScaleX() {
	        return this.transform.scaleX;
	    }
	    setScaleX(v) {
	        this.transform.scaleX = v;
	        this.updateTransform();
	    }
	    getScaleY() {
	        return this.transform.scaleY;
	    }
	    setScaleY(v) {
	        this.transform.scaleY = v;
	        this.updateTransform();
	    }
	    getPivotX() {
	        var _a;
	        return ((_a = this.transformOrigin) === null || _a === void 0 ? void 0 : _a.x) || 0.5;
	    }
	    setPivotX(v) {
	        if (this.transformOrigin) {
	            this.transformOrigin.x = v;
	        }
	        else {
	            this.transformOrigin = {
	                x: v,
	                y: 0.5,
	            };
	        }
	        this.updateTransform();
	    }
	    getPivotY() {
	        var _a;
	        return ((_a = this.transformOrigin) === null || _a === void 0 ? void 0 : _a.y) || 0.5;
	    }
	    setPivotY(v) {
	        if (this.transformOrigin) {
	            this.transformOrigin.y = v;
	        }
	        else {
	            this.transformOrigin = {
	                x: 0.5,
	                y: v,
	            };
	        }
	        this.updateTransform();
	    }
	}
	class DoricSuperNode extends DoricViewNode {
	    constructor() {
	        super(...arguments);
	        this.reusable = false;
	        this.subModels = new Map;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'subviews') {
	            if (prop instanceof Array) {
	                prop.forEach((e) => {
	                    this.mixinSubModel(e);
	                    this.blendSubNode(e);
	                });
	            }
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    mixinSubModel(subNode) {
	        const oldValue = this.getSubModel(subNode.id);
	        if (oldValue) {
	            this.mixin(subNode, oldValue);
	        }
	        else {
	            this.subModels.set(subNode.id, subNode);
	        }
	    }
	    getSubModel(id) {
	        return this.subModels.get(id);
	    }
	    mixin(src, target) {
	        for (let key in src.props) {
	            if (key === "subviews") {
	                continue;
	            }
	            Reflect.set(target.props, key, Reflect.get(src.props, key));
	        }
	    }
	    clearSubModels() {
	        this.subModels.clear();
	    }
	    removeSubModel(id) {
	        this.subModels.delete(id);
	    }
	}
	class DoricGroupViewNode extends DoricSuperNode {
	    constructor() {
	        super(...arguments);
	        this.childNodes = [];
	        this.childViewIds = [];
	    }
	    init(superNode) {
	        super.init(superNode);
	        this.view.style.overflow = "hidden";
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'children') {
	            if (prop instanceof Array) {
	                this.childViewIds = prop;
	            }
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    blend(props) {
	        super.blend(props);
	    }
	    onBlending() {
	        super.onBlending();
	        this.configChildNode();
	    }
	    onBlended() {
	        super.onBlended();
	        this.childNodes.forEach(e => e.onBlended());
	    }
	    configChildNode() {
	        this.childViewIds.forEach((childViewId, index) => {
	            const model = this.getSubModel(childViewId);
	            if (model === undefined) {
	                return;
	            }
	            if (index < this.childNodes.length) {
	                const oldNode = this.childNodes[index];
	                if (oldNode.viewId === childViewId) ;
	                else {
	                    if (this.reusable) {
	                        if (oldNode.viewType === model.type) {
	                            //Same type,can be reused
	                            oldNode.viewId = childViewId;
	                            oldNode.blend(model.props);
	                        }
	                        else {
	                            //Replace this view
	                            this.view.removeChild(oldNode.view);
	                            const newNode = DoricViewNode.create(this.context, model.type);
	                            if (newNode === undefined) {
	                                return;
	                            }
	                            newNode.viewId = childViewId;
	                            newNode.init(this);
	                            newNode.blend(model.props);
	                            this.childNodes[index] = newNode;
	                            this.view.replaceChild(newNode.view, oldNode.view);
	                        }
	                    }
	                    else {
	                        //Find in remain nodes
	                        let position = -1;
	                        for (let start = index + 1; start < this.childNodes.length; start++) {
	                            if (childViewId === this.childNodes[start].viewId) {
	                                //Found
	                                position = start;
	                                break;
	                            }
	                        }
	                        if (position >= 0) {
	                            //Found swap idx,position
	                            const reused = this.childNodes[position];
	                            const abandoned = this.childNodes[index];
	                            this.childNodes[index] = reused;
	                            this.childNodes[position] = abandoned;
	                            this.view.removeChild(reused.view);
	                            this.view.insertBefore(reused.view, abandoned.view);
	                            this.view.removeChild(abandoned.view);
	                            if (position === this.view.childElementCount - 1) {
	                                this.view.appendChild(abandoned.view);
	                            }
	                            else {
	                                this.view.insertBefore(abandoned.view, this.view.children[position]);
	                            }
	                        }
	                        else {
	                            //Not found,insert
	                            const newNode = DoricViewNode.create(this.context, model.type);
	                            if (newNode === undefined) {
	                                return;
	                            }
	                            newNode.viewId = childViewId;
	                            newNode.init(this);
	                            newNode.blend(model.props);
	                            this.childNodes.splice(index, 0, newNode);
	                            this.view.insertBefore(newNode.view, this.view.children[index]);
	                        }
	                    }
	                }
	            }
	            else {
	                //Insert
	                const newNode = DoricViewNode.create(this.context, model.type);
	                if (newNode === undefined) {
	                    return;
	                }
	                newNode.viewId = childViewId;
	                newNode.init(this);
	                newNode.blend(model.props);
	                this.childNodes.push(newNode);
	                this.view.appendChild(newNode.view);
	            }
	        });
	        let size = this.childNodes.length;
	        for (let idx = this.childViewIds.length; idx < size; idx++) {
	            this.view.removeChild(this.childNodes[idx].view);
	        }
	        this.childNodes = this.childNodes.slice(0, this.childViewIds.length);
	    }
	    blendSubNode(model) {
	        var _a;
	        (_a = this.getSubNodeById(model.id)) === null || _a === void 0 ? void 0 : _a.blend(model.props);
	    }
	    getSubNodeById(viewId) {
	        return this.childNodes.filter(e => e.viewId === viewId)[0];
	    }
	}

	class ShaderPlugin extends DoricPlugin {
	    render(ret) {
	        var _a;
	        if (((_a = this.context.rootNode.viewId) === null || _a === void 0 ? void 0 : _a.length) > 0) {
	            const viewNode = this.context.targetViewNode(ret.id);
	            viewNode === null || viewNode === void 0 ? void 0 : viewNode.blend(ret.props);
	            viewNode === null || viewNode === void 0 ? void 0 : viewNode.onBlended();
	        }
	        else {
	            this.context.rootNode.viewId = ret.id;
	            this.context.rootNode.blend(ret.props);
	            this.context.rootNode.onBlended();
	        }
	    }
	    command(options) {
	        let viewNode = undefined;
	        for (let viewId of options.viewIds) {
	            if (!viewNode) {
	                viewNode = this.context.targetViewNode(viewId);
	            }
	            else {
	                if (viewNode instanceof DoricSuperNode) {
	                    viewNode = viewNode.getSubNodeById(viewId);
	                }
	            }
	        }
	        if (!viewNode) {
	            return Promise.reject("Cannot find opposite view");
	        }
	        else {
	            const target = viewNode;
	            return new Promise((resolve, reject) => {
	                try {
	                    const method = Reflect.get(target, options.name);
	                    if (!method) {
	                        reject(`"Cannot find plugin method in class:${target},method:${options.name}"`);
	                    }
	                    resolve(Reflect.apply(method, target, [options.args]));
	                }
	                catch (err) {
	                    reject(err);
	                }
	            });
	        }
	    }
	}

	class DoricStackNode extends DoricGroupViewNode {
	    build() {
	        const ret = document.createElement('div');
	        ret.style.position = "relative";
	        return ret;
	    }
	    layout() {
	        super.layout();
	        Promise.resolve().then(_ => {
	            this.configSize();
	            this.configOffset();
	        });
	    }
	    configSize() {
	        if (this.layoutConfig.widthSpec === exports.LayoutSpec.WRAP_CONTENT) {
	            const width = this.childNodes.reduce((prev, current) => {
	                const computedStyle = window.getComputedStyle(current.view);
	                return Math.max(prev, current.view.offsetWidth
	                    + pixelString2Number(computedStyle.marginLeft)
	                    + pixelString2Number(computedStyle.marginRight));
	            }, 0);
	            this.view.style.width = toPixelString(width);
	        }
	        if (this.layoutConfig.heightSpec === exports.LayoutSpec.WRAP_CONTENT) {
	            const height = this.childNodes.reduce((prev, current) => {
	                const computedStyle = window.getComputedStyle(current.view);
	                return Math.max(prev, current.view.offsetHeight
	                    + pixelString2Number(computedStyle.marginTop)
	                    + pixelString2Number(computedStyle.marginBottom));
	            }, 0);
	            this.view.style.height = toPixelString(height);
	        }
	    }
	    configOffset() {
	        this.childNodes.forEach(e => {
	            const position = "absolute";
	            let left = toPixelString(e.offsetX + this.paddingLeft);
	            let top = toPixelString(e.offsetY + this.paddingTop);
	            const gravity = e.layoutConfig.alignment;
	            if ((gravity & LEFT) === LEFT) {
	                left = toPixelString(0);
	            }
	            else if ((gravity & RIGHT) === RIGHT) {
	                //ignore marginLeft
	                const childMarginRight = pixelString2Number(window.getComputedStyle(e.view).marginRight);
	                left = toPixelString(this.view.offsetWidth - e.view.offsetWidth - childMarginRight);
	            }
	            else if ((gravity & CENTER_X) === CENTER_X) {
	                const childMarginLeft = pixelString2Number(window.getComputedStyle(e.view).marginLeft);
	                const childMarginRight = pixelString2Number(window.getComputedStyle(e.view).marginRight);
	                left = toPixelString(this.view.offsetWidth / 2 - e.view.offsetWidth / 2 + childMarginLeft - childMarginRight);
	            }
	            if ((gravity & TOP) === TOP) {
	                top = toPixelString(0);
	            }
	            else if ((gravity & BOTTOM) === BOTTOM) {
	                //ignore marginTop
	                const childMarginTop = pixelString2Number(window.getComputedStyle(e.view).marginBottom);
	                top = toPixelString(this.view.offsetHeight - e.view.offsetHeight - childMarginTop);
	            }
	            else if ((gravity & CENTER_Y) === CENTER_Y) {
	                const childMarginTop = pixelString2Number(window.getComputedStyle(e.view).marginTop);
	                const childMarginBottom = pixelString2Number(window.getComputedStyle(e.view).marginBottom);
	                top = toPixelString(this.view.offsetHeight / 2 - e.view.offsetHeight / 2 + childMarginTop - childMarginBottom);
	            }
	            e.applyCSSStyle({
	                position,
	                left,
	                top,
	            });
	        });
	    }
	}

	class DoricVLayoutNode extends DoricGroupViewNode {
	    constructor() {
	        super(...arguments);
	        this.space = 0;
	        this.gravity = 0;
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.display = "flex";
	        ret.style.flexDirection = "column";
	        ret.style.flexWrap = "nowrap";
	        return ret;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'space') {
	            this.space = prop;
	        }
	        else if (propName === 'gravity') {
	            this.gravity = prop;
	            if ((this.gravity & LEFT) === LEFT) {
	                this.view.style.alignItems = "flex-start";
	            }
	            else if ((this.gravity & RIGHT) === RIGHT) {
	                this.view.style.alignItems = "flex-end";
	            }
	            else if ((this.gravity & CENTER_X) === CENTER_X) {
	                this.view.style.alignItems = "center";
	            }
	            if ((this.gravity & TOP) === TOP) {
	                this.view.style.justifyContent = "flex-start";
	            }
	            else if ((this.gravity & BOTTOM) === BOTTOM) {
	                this.view.style.justifyContent = "flex-end";
	            }
	            else if ((this.gravity & CENTER_Y) === CENTER_Y) {
	                this.view.style.justifyContent = "center";
	            }
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    layout() {
	        super.layout();
	        this.childNodes.forEach((e, idx) => {
	            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
	            e.view.style.flexShrink = "0";
	            if ((_a = e.layoutConfig) === null || _a === void 0 ? void 0 : _a.weight) {
	                e.view.style.flex = `${(_b = e.layoutConfig) === null || _b === void 0 ? void 0 : _b.weight}`;
	            }
	            e.view.style.marginTop = toPixelString(((_d = (_c = e.layoutConfig) === null || _c === void 0 ? void 0 : _c.margin) === null || _d === void 0 ? void 0 : _d.top) || 0);
	            const bottomMargin = ((_f = (_e = e.layoutConfig) === null || _e === void 0 ? void 0 : _e.margin) === null || _f === void 0 ? void 0 : _f.bottom) || 0;
	            e.view.style.marginBottom = toPixelString((idx === this.childNodes.length - 1) ? bottomMargin : this.space + bottomMargin);
	            e.view.style.marginLeft = toPixelString(((_h = (_g = e.layoutConfig) === null || _g === void 0 ? void 0 : _g.margin) === null || _h === void 0 ? void 0 : _h.left) || 0);
	            e.view.style.marginRight = toPixelString(((_k = (_j = e.layoutConfig) === null || _j === void 0 ? void 0 : _j.margin) === null || _k === void 0 ? void 0 : _k.right) || 0);
	            if ((e.layoutConfig.alignment & LEFT) === LEFT) {
	                e.view.style.alignSelf = "flex-start";
	            }
	            else if ((e.layoutConfig.alignment & RIGHT) === RIGHT) {
	                e.view.style.alignSelf = "flex-end";
	            }
	            else if ((e.layoutConfig.alignment & CENTER_X) === CENTER_X) {
	                e.view.style.alignSelf = "center";
	            }
	        });
	    }
	}

	class DoricHLayoutNode extends DoricGroupViewNode {
	    constructor() {
	        super(...arguments);
	        this.space = 0;
	        this.gravity = 0;
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.display = "flex";
	        ret.style.flexDirection = "row";
	        ret.style.flexWrap = "nowrap";
	        return ret;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'space') {
	            this.space = prop;
	        }
	        else if (propName === 'gravity') {
	            this.gravity = prop;
	            this.gravity = prop;
	            if ((this.gravity & LEFT) === LEFT) {
	                this.view.style.justifyContent = "flex-start";
	            }
	            else if ((this.gravity & RIGHT) === RIGHT) {
	                this.view.style.justifyContent = "flex-end";
	            }
	            else if ((this.gravity & CENTER_X) === CENTER_X) {
	                this.view.style.justifyContent = "center";
	            }
	            if ((this.gravity & TOP) === TOP) {
	                this.view.style.alignItems = "flex-start";
	            }
	            else if ((this.gravity & BOTTOM) === BOTTOM) {
	                this.view.style.alignItems = "flex-end";
	            }
	            else if ((this.gravity & CENTER_Y) === CENTER_Y) {
	                this.view.style.alignItems = "center";
	            }
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    layout() {
	        super.layout();
	        this.childNodes.forEach((e, idx) => {
	            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
	            e.view.style.flexShrink = "0";
	            if ((_a = e.layoutConfig) === null || _a === void 0 ? void 0 : _a.weight) {
	                e.view.style.flex = `${(_b = e.layoutConfig) === null || _b === void 0 ? void 0 : _b.weight}`;
	            }
	            e.view.style.marginLeft = toPixelString(((_d = (_c = e.layoutConfig) === null || _c === void 0 ? void 0 : _c.margin) === null || _d === void 0 ? void 0 : _d.left) || 0);
	            const rightMargin = ((_f = (_e = e.layoutConfig) === null || _e === void 0 ? void 0 : _e.margin) === null || _f === void 0 ? void 0 : _f.right) || 0;
	            e.view.style.marginRight = toPixelString((idx === this.childNodes.length - 1) ? rightMargin : this.space + rightMargin);
	            e.view.style.marginTop = toPixelString(((_h = (_g = e.layoutConfig) === null || _g === void 0 ? void 0 : _g.margin) === null || _h === void 0 ? void 0 : _h.top) || 0);
	            e.view.style.marginBottom = toPixelString(((_k = (_j = e.layoutConfig) === null || _j === void 0 ? void 0 : _j.margin) === null || _k === void 0 ? void 0 : _k.bottom) || 0);
	            if ((e.layoutConfig.alignment & TOP) === TOP) {
	                e.view.style.alignSelf = "flex-start";
	            }
	            else if ((e.layoutConfig.alignment & BOTTOM) === BOTTOM) {
	                e.view.style.alignSelf = "flex-end";
	            }
	            else if ((e.layoutConfig.alignment & CENTER_Y) === CENTER_Y) {
	                e.view.style.alignSelf = "center";
	            }
	        });
	    }
	}

	class DoricTextNode extends DoricViewNode {
	    constructor() {
	        super(...arguments);
	        this.maxLines = 0;
	    }
	    build() {
	        const div = document.createElement('div');
	        div.style.display = "flex";
	        div.style.overflow = "hidden";
	        this.textElement = document.createElement('span');
	        div.appendChild(this.textElement);
	        div.style.justifyContent = "center";
	        div.style.alignItems = "center";
	        return div;
	    }
	    blendProps(v, propName, prop) {
	        switch (propName) {
	            case 'text':
	                this.textElement.innerText = prop;
	                break;
	            case 'textSize':
	                v.style.fontSize = toPixelString(prop);
	                break;
	            case 'textColor':
	                v.style.color = toRGBAString(prop);
	                break;
	            case 'textAlignment':
	                const gravity = prop;
	                if ((gravity & LEFT) === LEFT) {
	                    v.style.justifyContent = "flex-start";
	                }
	                else if ((gravity & RIGHT) === RIGHT) {
	                    v.style.justifyContent = "flex-end";
	                }
	                else if ((gravity & CENTER_X) === CENTER_X) {
	                    v.style.justifyContent = "center";
	                }
	                if ((gravity & TOP) === TOP) {
	                    v.style.alignItems = "flex-start";
	                }
	                else if ((gravity & BOTTOM) === BOTTOM) {
	                    v.style.alignItems = "flex-end";
	                }
	                else if ((gravity & CENTER_Y) === CENTER_Y) {
	                    v.style.alignItems = "center";
	                }
	                break;
	            case "font":
	                this.view.style.fontFamily = prop;
	                break;
	            case "fontStyle":
	                switch (prop) {
	                    case "bold":
	                        v.style.fontWeight = "bold";
	                        v.style.fontStyle = "normal";
	                        break;
	                    case "italic":
	                        v.style.fontWeight = "normal";
	                        v.style.fontStyle = "italic";
	                        break;
	                    case "bold_italic":
	                        v.style.fontWeight = "bold";
	                        v.style.fontStyle = "italic";
	                        break;
	                    default:
	                        v.style.fontWeight = "normal";
	                        v.style.fontStyle = "normal";
	                        break;
	                }
	                break;
	            case "maxLines":
	                this.maxLines = prop;
	                this.view.style.whiteSpace = 'normal';
	                break;
	            case "maxWidth":
	                if (prop) {
	                    this.layoutConfig.maxWidth = prop;
	                }
	                else {
	                    this.layoutConfig.maxWidth = -1;
	                }
	                break;
	            case "maxHeight":
	                if (prop) {
	                    this.layoutConfig.maxHeight = prop;
	                }
	                else {
	                    this.layoutConfig.maxHeight = -1;
	                }
	                break;
	            default:
	                super.blendProps(v, propName, prop);
	                break;
	        }
	    }
	    layout() {
	        super.layout();
	        Promise.resolve().then(_ => {
	            this.configSize();
	        });
	    }
	    configSize() {
	        if (this.maxLines > 0) {
	            const computedStyle = window.getComputedStyle(this.view);
	            const lineHeight = this.defaultLineHeightInPixels(computedStyle);
	            this.view.style.lineHeight = lineHeight + 'px';
	            let allowedMaxLines = this.maxLines;
	            const contentHeight = this.view.clientHeight - pixelString2Number(computedStyle.paddingTop) - pixelString2Number(computedStyle.paddingBottom);
	            if (contentHeight > 0) {
	                const contentAllowedLines = Math.round(contentHeight / lineHeight);
	                allowedMaxLines = Math.min(this.maxLines, contentAllowedLines);
	            }
	            const originalLines = Math.round(this.originalHeight(computedStyle) / lineHeight);
	            if (originalLines > allowedMaxLines) {
	                this.textElement.innerText = this.truncationText(computedStyle, lineHeight, allowedMaxLines);
	            }
	        }
	    }
	    defaultLineHeightInPixels(style) {
	        const tempEle = document.createElement('div');
	        tempEle.style.font = style.font;
	        tempEle.innerText = "&nbsp;";
	        document.body.appendChild(tempEle);
	        const lineHeightInPixels = tempEle.offsetHeight;
	        document.body.removeChild(tempEle);
	        return lineHeightInPixels;
	    }
	    originalHeight(style) {
	        const tempEle = document.createElement('div');
	        tempEle.style.font = style.font;
	        tempEle.textContent = this.textElement.innerText;
	        tempEle.style.whiteSpace = style.whiteSpace;
	        tempEle.style.overflow = style.overflow;
	        tempEle.style.lineHeight = style.lineHeight;
	        tempEle.style.width = style.width;
	        document.body.appendChild(tempEle);
	        const height = tempEle.offsetHeight;
	        document.body.removeChild(tempEle);
	        return height;
	    }
	    truncationText(style, lineHeight, maxLines) {
	        const originalText = this.textElement.innerText;
	        let start = 0, end = originalText.length;
	        const tempEle = document.createElement('div');
	        tempEle.style.font = style.font;
	        tempEle.style.whiteSpace = style.whiteSpace;
	        tempEle.style.overflow = style.overflow;
	        tempEle.style.lineHeight = style.lineHeight;
	        tempEle.style.width = style.width;
	        document.body.appendChild(tempEle);
	        while (start <= end) {
	            const mid = Math.floor((start + end) / 2);
	            tempEle.textContent = originalText.slice(0, mid) + '...';
	            const lines = Math.round(tempEle.offsetHeight / lineHeight);
	            if (lines > maxLines) {
	                end = mid - 1;
	            }
	            else {
	                start = mid + 1;
	            }
	        }
	        document.body.removeChild(tempEle);
	        return `${originalText.slice(0, end) + '...'}`;
	    }
	}

	var ScaleType;
	(function (ScaleType) {
	    ScaleType[ScaleType["ScaleToFill"] = 0] = "ScaleToFill";
	    ScaleType[ScaleType["ScaleAspectFit"] = 1] = "ScaleAspectFit";
	    ScaleType[ScaleType["ScaleAspectFill"] = 2] = "ScaleAspectFill";
	})(ScaleType || (ScaleType = {}));
	const transparentBase64 = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==";
	class DoricImageNode extends DoricViewNode {
	    build() {
	        const ret = document.createElement('img');
	        ret.style.objectFit = 'fill';
	        return ret;
	    }
	    blend(props) {
	        this.placeHolderImage = props['placeHolderImage'];
	        this.placeHolderImageBase64 = props['placeHolderImageBase64'];
	        this.placeHolderColor = props['placeHolderColor'];
	        this.errorImage = props['errorImage'];
	        this.errorImageBase64 = props['errorImageBase64'];
	        this.errorColor = props['errorColor'];
	        this.stretchInset = props['stretchInset'];
	        super.blend(props);
	    }
	    blendProps(v, propName, prop) {
	        var _a;
	        switch (propName) {
	            case 'image':
	                (_a = resourceManager.load(prop)) === null || _a === void 0 ? void 0 : _a.then(e => {
	                    this.loadIntoTarget(v, e);
	                }).catch(e => {
	                    this.loadIntoTarget(v, '');
	                });
	                break;
	            case 'imageUrl':
	            case 'imageBase64':
	                this.loadIntoTarget(v, prop);
	                break;
	            case 'placeHolderImage':
	            case 'placeHolderImageBase64':
	            case 'placeHolderColor':
	            case 'errorImage':
	            case 'errorImageBase64':
	            case 'errorColor':
	                break;
	            case 'stretchInset':
	                break;
	            case 'loadCallback':
	                this.onloadFuncId = prop;
	                break;
	            case 'scaleType':
	                switch (prop) {
	                    case ScaleType.ScaleToFill:
	                        v.style.objectFit = "fill";
	                        break;
	                    case ScaleType.ScaleAspectFit:
	                        v.style.objectFit = "contain";
	                        break;
	                    case ScaleType.ScaleAspectFill:
	                        v.style.objectFit = "cover";
	                        break;
	                }
	                break;
	            case 'isBlur':
	                if (prop) {
	                    v.style.filter = 'blur(8px)';
	                }
	                else {
	                    v.style.filter = '';
	                }
	                break;
	            case 'hidden':
	                super.blendProps(v, propName, prop);
	                if (prop == true) {
	                    this.loadIntoTarget(v, '');
	                }
	                break;
	            default:
	                super.blendProps(v, propName, prop);
	                break;
	        }
	    }
	    loadIntoTarget(targetElement, src) {
	        if (src) {
	            this.clearStretchElementAttributes(targetElement);
	            this.loadPlaceHolder(targetElement);
	            let tempLoadElement = this.stretchInset ? document.createElement('img') : targetElement;
	            tempLoadElement.onload = () => {
	                if (this.stretchInset) {
	                    if (!this.resizeObserver) {
	                        this.resizeObserver = new ResizeObserver(entry => {
	                            this.onResize.call(this, { width: tempLoadElement.naturalWidth, height: tempLoadElement.naturalHeight });
	                        });
	                        this.resizeObserver.observe(targetElement);
	                    }
	                    this.onResize({ width: tempLoadElement.naturalWidth, height: tempLoadElement.naturalHeight });
	                }
	                //remove placeHolderColor
	                targetElement.style.removeProperty('background-color');
	                if (tempLoadElement.src === src && this.onloadFuncId) {
	                    this.callJSResponse(this.onloadFuncId, {
	                        width: tempLoadElement.naturalWidth,
	                        height: tempLoadElement.naturalHeight,
	                    });
	                }
	            };
	            tempLoadElement.onerror = () => {
	                this.clearStretchElementAttributes(targetElement);
	                const error = this.getError(targetElement.offsetWidth, targetElement.offsetHeight);
	                if (!error)
	                    return;
	                const same = src === error;
	                const srcLoadError = tempLoadElement.src.length === 0 || tempLoadElement.src === src;
	                if (same || !srcLoadError)
	                    return;
	                targetElement.src = error;
	                if (this.onloadFuncId) {
	                    this.callJSResponse(this.onloadFuncId);
	                }
	            };
	            Promise.resolve().then(e => {
	                tempLoadElement.src = src;
	                if (this.stretchInset) {
	                    this.loadImageWithStretch(targetElement, src, this.stretchInset);
	                }
	            });
	        }
	        else {
	            this.clearStretchElementAttributes(targetElement);
	            targetElement.style.display = 'none';
	            return;
	        }
	    }
	    loadImageWithStretch(v, src, stretchInset) {
	        v.src = transparentBase64;
	        v.style.borderImageSource = `url(${src})`;
	        v.style.borderImageSlice = `${stretchInset.top} ${stretchInset.right} ${stretchInset.bottom} ${stretchInset.left} fill`;
	    }
	    calculateStretchBorderWidth(originalSize, targetSize, stretchInset) {
	        const widthRatio = targetSize.width / originalSize.width;
	        const heightRatio = targetSize.height / originalSize.height;
	        const scaleFactor = Math.min(widthRatio, heightRatio);
	        const scaledStretchInset = {};
	        for (const key in stretchInset) {
	            scaledStretchInset[key] = Math.round(stretchInset[key] * scaleFactor);
	        }
	        return scaledStretchInset;
	    }
	    loadPlaceHolder(v) {
	        if (this.placeHolderImage) {
	            v.src = this.placeHolderImage;
	        }
	        else if (this.placeHolderImageBase64) {
	            v.src = this.placeHolderImageBase64;
	        }
	        else if (this.placeHolderColor) {
	            v.style.backgroundColor = toRGBAString(this.placeHolderColor);
	        }
	    }
	    clearStretchElementAttributes(v) {
	        v.style.removeProperty('background-color');
	        v.style.removeProperty('border-image-source');
	        v.style.removeProperty('border-image-slice');
	        v.style.removeProperty('border-image-width');
	    }
	    getError(width, height) {
	        if (this.errorImage) {
	            return this.errorImage;
	        }
	        else if (this.errorImageBase64) {
	            return this.errorImageBase64;
	        }
	        else if (this.errorColor && this.view) {
	            return this.createColoredCanvas(width, height, this.errorColor);
	        }
	        return null;
	    }
	    createColoredCanvas(width, height, color) {
	        const canvas = document.createElement('canvas');
	        canvas.width = width;
	        canvas.height = height;
	        const context = canvas.getContext('2d');
	        if (context) {
	            context.fillStyle = toRGBAString(color);
	            context.fillRect(0, 0, width, height);
	            return canvas.toDataURL('image/png');
	        }
	        return null;
	    }
	    onResize(originalSize) {
	        if (!this.stretchInset) {
	            return;
	        }
	        if (this.view.offsetWidth !== 0 || this.view.offsetHeight !== 0) {
	            const scaledStretchInset = this.calculateStretchBorderWidth({ width: originalSize.width, height: originalSize.height }, { width: this.view.offsetWidth, height: this.view.offsetHeight }, this.stretchInset);
	            const top = toPixelString(scaledStretchInset.top);
	            const right = toPixelString(scaledStretchInset.right);
	            const bottom = toPixelString(scaledStretchInset.bottom);
	            const left = toPixelString(scaledStretchInset.left);
	            this.view.style.borderImageWidth = `${top} ${right} ${bottom} ${left}`;
	        }
	    }
	}

	class DoricScrollerNode extends DoricSuperNode {
	    constructor() {
	        super(...arguments);
	        this.childViewId = "";
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.overflow = "scroll";
	        return ret;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'content') {
	            this.childViewId = prop;
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    blendSubNode(model) {
	        var _a;
	        (_a = this.childNode) === null || _a === void 0 ? void 0 : _a.blend(model.props);
	    }
	    getSubNodeById(viewId) {
	        return viewId === this.childViewId ? this.childNode : undefined;
	    }
	    onBlending() {
	        super.onBlending();
	        const model = this.getSubModel(this.childViewId);
	        if (model === undefined) {
	            return;
	        }
	        if (this.childNode) {
	            if (this.childNode.viewId === this.childViewId) ;
	            else {
	                if (this.reusable && this.childNode.viewType === model.type) {
	                    this.childNode.viewId = model.id;
	                    this.childNode.blend(model.props);
	                }
	                else {
	                    this.view.removeChild(this.childNode.view);
	                    const childNode = DoricViewNode.create(this.context, model.type);
	                    if (childNode === undefined) {
	                        return;
	                    }
	                    childNode.viewId = model.id;
	                    childNode.init(this);
	                    childNode.blend(model.props);
	                    this.view.appendChild(childNode.view);
	                    this.childNode = childNode;
	                }
	            }
	        }
	        else {
	            const childNode = DoricViewNode.create(this.context, model.type);
	            if (childNode === undefined) {
	                return;
	            }
	            childNode.viewId = model.id;
	            childNode.init(this);
	            childNode.blend(model.props);
	            this.view.appendChild(childNode.view);
	            this.childNode = childNode;
	        }
	    }
	    onBlended() {
	        var _a;
	        super.onBlended();
	        (_a = this.childNode) === null || _a === void 0 ? void 0 : _a.onBlended();
	    }
	}

	class ModalPlugin extends DoricPlugin {
	    toast(args) {
	        const toastElement = document.createElement('div');
	        toastElement.style.position = "absolute";
	        toastElement.style.textAlign = "center";
	        toastElement.style.width = "100%";
	        const textElement = document.createElement('span');
	        textElement.innerText = args.msg || "";
	        textElement.style.backgroundColor = "#777777";
	        textElement.style.color = "white";
	        textElement.style.paddingLeft = '20px';
	        textElement.style.paddingRight = '20px';
	        textElement.style.paddingTop = '10px';
	        textElement.style.paddingBottom = '10px';
	        toastElement.appendChild(textElement);
	        document.body.appendChild(toastElement);
	        const gravity = args.gravity || BOTTOM;
	        if ((gravity & TOP) == TOP) {
	            toastElement.style.top = toPixelString(30);
	        }
	        else if ((gravity & BOTTOM) == BOTTOM) {
	            toastElement.style.bottom = toPixelString(30);
	        }
	        else if ((gravity & CENTER_Y) == CENTER_Y) {
	            toastElement.style.top = toPixelString(document.body.offsetHeight / 2 - toastElement.offsetHeight / 2);
	        }
	        setTimeout(() => {
	            document.body.removeChild(toastElement);
	        }, 2000);
	        return Promise.resolve();
	    }
	    alert(args) {
	        window.alert(args.msg || "");
	        return Promise.resolve();
	    }
	    confirm(args) {
	        if (window.confirm(args.msg || "")) {
	            return Promise.resolve();
	        }
	        else {
	            return Promise.reject();
	        }
	    }
	    prompt(args) {
	        const result = window.prompt(args.msg || "", args.defaultText);
	        if (result) {
	            return Promise.resolve(result);
	        }
	        else {
	            return Promise.reject(result);
	        }
	    }
	}

	class StoragePlugin extends DoricPlugin {
	    setItem(args) {
	        localStorage.setItem(`${args.zone}_${args.key}`, args.value);
	        return Promise.resolve();
	    }
	    getItem(args) {
	        return Promise.resolve(localStorage.getItem(`${args.zone}_${args.key}`));
	    }
	    remove(args) {
	        localStorage.removeItem(`${args.zone}_${args.key}`);
	        return Promise.resolve();
	    }
	    clear(args) {
	        let removingKeys = [];
	        for (let i = 0; i < localStorage.length; i++) {
	            const key = localStorage.key(i);
	            if (key && key.startsWith(`${args.zone}_`)) {
	                removingKeys.push(key);
	            }
	        }
	        removingKeys.forEach(e => {
	            localStorage.removeItem(e);
	        });
	        return Promise.resolve();
	    }
	}

	class NavigatorPlugin extends DoricPlugin {
	    constructor() {
	        super(...arguments);
	        this.navigation = document.getElementsByTagName('doric-navigation')[0];
	    }
	    push(args) {
	        var _a;
	        if (this.navigation) {
	            const div = new DoricElement;
	            div.src = args.source;
	            div.alias = ((_a = args.config) === null || _a === void 0 ? void 0 : _a.alias) || args.source;
	            this.navigation.push(div);
	            return Promise.resolve();
	        }
	        else {
	            return Promise.reject('Not implemented');
	        }
	    }
	    pop() {
	        if (this.navigation) {
	            this.navigation.pop();
	            return Promise.resolve();
	        }
	        else {
	            return Promise.reject('Not implemented');
	        }
	    }
	}

	class PopoverPlugin extends DoricPlugin {
	    constructor(context) {
	        super(context);
	        this.fullScreen = document.createElement('div');
	        this.fullScreen.id = `PopOver__${context.contextId}`;
	        this.fullScreen.style.position = 'fixed';
	        this.fullScreen.style.top = '0px';
	        this.fullScreen.style.width = "100%";
	        this.fullScreen.style.height = "100%";
	    }
	    show(model) {
	        const viewNode = DoricViewNode.create(this.context, model.type);
	        if (viewNode === undefined) {
	            return Promise.reject(`Cannot create ViewNode for ${model.type}`);
	        }
	        viewNode.viewId = model.id;
	        viewNode.init();
	        viewNode.blend(model.props);
	        this.fullScreen.appendChild(viewNode.view);
	        let map = this.context.headNodes.get(PopoverPlugin.TYPE);
	        if (map) {
	            map.set(model.id, viewNode);
	        }
	        else {
	            map = new Map;
	            map.set(model.id, viewNode);
	            this.context.headNodes.set(PopoverPlugin.TYPE, map);
	        }
	        if (!document.body.contains(this.fullScreen)) {
	            document.body.appendChild(this.fullScreen);
	        }
	        return Promise.resolve();
	    }
	    dismiss(args) {
	        if (args) {
	            let map = this.context.headNodes.get(PopoverPlugin.TYPE);
	            if (map) {
	                const viewNode = map.get(args.id);
	                if (viewNode) {
	                    this.fullScreen.removeChild(viewNode.view);
	                }
	                if (map.size === 0) {
	                    document.body.removeChild(this.fullScreen);
	                }
	            }
	        }
	        else {
	            this.dismissAll();
	        }
	        return Promise.resolve();
	    }
	    dismissAll() {
	        let map = this.context.headNodes.get(PopoverPlugin.TYPE);
	        if (map) {
	            for (let node of map.values()) {
	                map.delete(node.viewId);
	                this.fullScreen.removeChild(node.view);
	            }
	        }
	        if (document.body.contains(this.fullScreen)) {
	            document.body.removeChild(this.fullScreen);
	        }
	    }
	    onTearDown() {
	        super.onTearDown();
	        this.dismissAll();
	    }
	}
	PopoverPlugin.TYPE = "popover";

	class DoricListItemNode extends DoricStackNode {
	    constructor(context) {
	        super(context);
	        this.reusable = true;
	    }
	}

	class DoricListNode extends DoricSuperNode {
	    constructor() {
	        super(...arguments);
	        this.itemCount = 0;
	        this.batchCount = 15;
	        this.loadMore = false;
	        this.childNodes = [];
	    }
	    blendProps(v, propName, prop) {
	        switch (propName) {
	            case "itemCount":
	                this.itemCount = prop;
	                break;
	            case "renderItem":
	                this.reset();
	                this.renderItemFuncId = prop;
	                break;
	            case "onLoadMore":
	                this.onLoadMoreFuncId = prop;
	                break;
	            case "onScroll":
	                this.onScrollFuncId = prop;
	                break;
	            case "loadMoreView":
	                this.loadMoreViewId = prop;
	                break;
	            case "batchCount":
	                this.batchCount = prop;
	                break;
	            case "loadMore":
	                this.loadMore = prop;
	                break;
	            case 'scrollable':
	                v.style.overflow = prop ? 'scroll' : 'hidden';
	                break;
	            default:
	                super.blendProps(v, propName, prop);
	                break;
	        }
	    }
	    reload() {
	        this.reset();
	        const ret = this.pureCallJSResponse("renderBunchedItems", 0, this.itemCount);
	        ret.forEach(e => {
	            const viewNode = DoricViewNode.create(this.context, e.type);
	            viewNode.viewId = e.id;
	            viewNode.init(this);
	            viewNode.blend(e.props);
	            this.view.appendChild(viewNode.view);
	            return viewNode;
	        });
	    }
	    reset() {
	        while (this.view.lastElementChild) {
	            this.view.removeChild(this.view.lastElementChild);
	        }
	        this.childNodes = [];
	    }
	    onBlending() {
	        super.onBlending();
	        if (this.childNodes.length !== this.itemCount) {
	            const ret = this.pureCallJSResponse("renderBunchedItems", this.childNodes.length, this.itemCount);
	            this.childNodes = this.childNodes.concat(ret.map(e => {
	                const viewNode = DoricViewNode.create(this.context, e.type);
	                viewNode.viewId = e.id;
	                viewNode.init(this);
	                viewNode.blend(e.props);
	                this.view.appendChild(viewNode.view);
	                return viewNode;
	            }));
	        }
	        if (this.loadMoreViewNode && this.view.contains(this.loadMoreViewNode.view)) {
	            this.view.removeChild(this.loadMoreViewNode.view);
	        }
	        if (this.loadMore) {
	            if (!this.loadMoreViewNode) {
	                const loadMoreViewModel = this.getSubModel(this.loadMoreViewId || "");
	                if (loadMoreViewModel) {
	                    this.loadMoreViewNode = DoricViewNode.create(this.context, loadMoreViewModel.type);
	                    this.loadMoreViewNode.viewId = loadMoreViewModel.id;
	                    this.loadMoreViewNode.init(this);
	                    this.loadMoreViewNode.blend(loadMoreViewModel.props);
	                }
	            }
	            if (this.loadMoreViewNode) {
	                this.view.appendChild(this.loadMoreViewNode.view);
	            }
	            if (this.view.scrollTop + this.view.offsetHeight === this.view.scrollHeight) {
	                this.onScrollToEnd();
	            }
	        }
	    }
	    blendSubNode(model) {
	        var _a;
	        (_a = this.getSubNodeById(model.id)) === null || _a === void 0 ? void 0 : _a.blend(model.props);
	    }
	    getSubNodeById(viewId) {
	        var _a;
	        if (viewId === this.loadMoreViewId) {
	            return this.loadMoreViewNode;
	        }
	        return (_a = this.childNodes.filter(e => e.viewId === viewId)) === null || _a === void 0 ? void 0 : _a[0];
	    }
	    onScrollToEnd() {
	        if (this.loadMore && this.onLoadMoreFuncId) {
	            this.callJSResponse(this.onLoadMoreFuncId);
	        }
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.overflow = "scroll";
	        ret.addEventListener("scroll", event => {
	            if (this.onScrollFuncId) {
	                this.callJSResponse(this.onScrollFuncId, { x: event.target.scrollLeft || 0, y: event.target.scrollTop });
	            }
	            if (this.loadMore) {
	                if (ret.scrollTop + ret.offsetHeight === ret.scrollHeight) {
	                    this.onScrollToEnd();
	                }
	            }
	        });
	        return ret;
	    }
	    onBlended() {
	        super.onBlended();
	        this.childNodes.forEach(e => e.onBlended());
	    }
	}

	class DoricDraggableNode extends DoricStackNode {
	    constructor() {
	        super(...arguments);
	        this.onDrag = "";
	        this.dragging = false;
	        this.lastX = 0;
	        this.lastY = 0;
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.ontouchstart = (event) => {
	            this.dragging = true;
	            this.lastX = event.targetTouches[0].clientX;
	            this.lastY = event.targetTouches[0].clientY;
	        };
	        ret.ontouchend = (event) => {
	            this.dragging = false;
	        };
	        ret.ontouchcancel = (event) => {
	            this.dragging = false;
	        };
	        ret.ontouchmove = (event) => {
	            if (this.dragging) {
	                this.offsetX += (event.targetTouches[0].clientX - this.lastX);
	                this.offsetY += (event.targetTouches[0].clientY - this.lastY);
	                this.callJSResponse(this.onDrag, this.offsetX, this.offsetY);
	                this.lastX = event.targetTouches[0].clientX;
	                this.lastY = event.targetTouches[0].clientY;
	            }
	        };
	        ret.onmousedown = (event) => {
	            this.dragging = true;
	            this.lastX = event.x;
	            this.lastY = event.y;
	        };
	        ret.onmousemove = (event) => {
	            if (this.dragging) {
	                this.offsetX += (event.x - this.lastX);
	                this.offsetY += (event.y - this.lastY);
	                this.callJSResponse(this.onDrag, this.offsetX, this.offsetY);
	                this.lastX = event.x;
	                this.lastY = event.y;
	            }
	        };
	        ret.onmouseup = (event) => {
	            this.dragging = false;
	        };
	        ret.onmouseout = (event) => {
	            this.dragging = false;
	        };
	        ret.style.position = "relative";
	        return ret;
	    }
	    blendProps(v, propName, prop) {
	        switch (propName) {
	            case 'onDrag':
	                this.onDrag = prop;
	                break;
	            default:
	                super.blendProps(v, propName, prop);
	                break;
	        }
	    }
	}

	class DoricRefreshableNode extends DoricSuperNode {
	    constructor() {
	        super(...arguments);
	        this.headerViewId = "";
	        this.contentViewId = "";
	        this.refreshable = true;
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.overflow = "hidden";
	        const header = document.createElement('div');
	        const content = document.createElement('div');
	        header.style.width = "100%";
	        header.style.height = "100%";
	        header.style.display = "flex";
	        header.style.alignItems = "flex-end";
	        header.style.justifyContent = "center";
	        content.style.width = "100%";
	        content.style.height = "100%";
	        ret.appendChild(header);
	        ret.appendChild(content);
	        let touchStart = 0;
	        ret.ontouchstart = (ev) => {
	            if (!this.refreshable) {
	                return;
	            }
	            touchStart = ev.touches[0].pageY;
	        };
	        ret.ontouchmove = (ev) => {
	            var _a;
	            if (!this.refreshable) {
	                return;
	            }
	            const offset = (ev.touches[0].pageY - touchStart) * 0.68;
	            ret.scrollTop = Math.max(0, header.offsetHeight - offset);
	            (_a = this.headerNode) === null || _a === void 0 ? void 0 : _a.callJSResponse("setPullingDistance", offset);
	        };
	        const touchend = () => {
	            var _a, _b;
	            if (!this.refreshable) {
	                return;
	            }
	            if (header.offsetHeight - ret.scrollTop >= (((_a = this.headerNode) === null || _a === void 0 ? void 0 : _a.getWidth()) || 0)) {
	                this.setRefreshing(true);
	                (_b = this.onRefreshCallback) === null || _b === void 0 ? void 0 : _b.call(this);
	            }
	            else {
	                // To idel
	                ret.scrollTo({
	                    top: header.offsetHeight,
	                    behavior: "smooth"
	                });
	            }
	        };
	        ret.ontouchcancel = () => {
	            touchend();
	        };
	        ret.ontouchend = () => {
	            touchend();
	        };
	        window.requestAnimationFrame(() => {
	            ret.scrollTop = header.offsetHeight;
	        });
	        this.headerContainer = header;
	        this.contentContainer = content;
	        return ret;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'content') {
	            this.contentViewId = prop;
	        }
	        else if (propName === 'header') {
	            this.headerViewId = prop;
	        }
	        else if (propName === 'onRefresh') {
	            this.onRefreshCallback = () => {
	                this.callJSResponse(prop);
	            };
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    blendSubNode(model) {
	        var _a;
	        (_a = this.getSubNodeById(model.id)) === null || _a === void 0 ? void 0 : _a.blend(model.props);
	    }
	    getSubNodeById(viewId) {
	        if (viewId === this.headerViewId) {
	            return this.headerNode;
	        }
	        else if (viewId === this.contentViewId) {
	            return this.contentNode;
	        }
	        return undefined;
	    }
	    onBlending() {
	        var _a, _b, _c, _d, _e, _f;
	        super.onBlending();
	        {
	            const headerModel = this.getSubModel(this.headerViewId);
	            if (headerModel) {
	                if (this.headerNode) {
	                    if (this.headerNode.viewId !== this.headerViewId) {
	                        if (this.reusable && this.headerNode.viewType === headerModel.type) {
	                            this.headerNode.viewId = headerModel.id;
	                            this.headerNode.blend(headerModel.props);
	                        }
	                        else {
	                            (_a = this.headerContainer) === null || _a === void 0 ? void 0 : _a.removeChild(this.headerNode.view);
	                            const headerNode = DoricViewNode.create(this.context, headerModel.type);
	                            if (headerNode) {
	                                headerNode.viewId = headerModel.id;
	                                headerNode.init(this);
	                                headerNode.blend(headerModel.props);
	                                (_b = this.headerContainer) === null || _b === void 0 ? void 0 : _b.appendChild(headerNode.view);
	                                this.headerNode = headerNode;
	                            }
	                        }
	                    }
	                }
	                else {
	                    const headerNode = DoricViewNode.create(this.context, headerModel.type);
	                    if (headerNode) {
	                        headerNode.viewId = headerModel.id;
	                        headerNode.init(this);
	                        headerNode.blend(headerModel.props);
	                        (_c = this.headerContainer) === null || _c === void 0 ? void 0 : _c.appendChild(headerNode.view);
	                        this.headerNode = headerNode;
	                    }
	                }
	            }
	        }
	        {
	            const contentModel = this.getSubModel(this.contentViewId);
	            if (contentModel) {
	                if (this.contentNode) {
	                    if (this.contentNode.viewId !== this.contentViewId) {
	                        if (this.reusable && this.contentNode.viewType === contentModel.type) {
	                            this.contentNode.viewId = contentModel.id;
	                            this.contentNode.blend(contentModel.props);
	                        }
	                        else {
	                            (_d = this.contentContainer) === null || _d === void 0 ? void 0 : _d.removeChild(this.contentNode.view);
	                            const contentNode = DoricViewNode.create(this.context, contentModel.type);
	                            if (contentNode) {
	                                contentNode.viewId = contentModel.id;
	                                contentNode.init(this);
	                                contentNode.blend(contentModel.props);
	                                (_e = this.contentContainer) === null || _e === void 0 ? void 0 : _e.appendChild(contentNode.view);
	                                this.contentNode = contentNode;
	                            }
	                        }
	                    }
	                }
	                else {
	                    const contentNode = DoricViewNode.create(this.context, contentModel.type);
	                    if (contentNode) {
	                        contentNode.viewId = contentModel.id;
	                        contentNode.init(this);
	                        contentNode.blend(contentModel.props);
	                        (_f = this.contentContainer) === null || _f === void 0 ? void 0 : _f.appendChild(contentNode.view);
	                        this.contentNode = contentNode;
	                    }
	                }
	            }
	        }
	    }
	    onBlended() {
	        super.onBlended();
	    }
	    setRefreshing(v) {
	        var _a;
	        if (!this.headerContainer || !this.headerNode) {
	            return;
	        }
	        if (v) {
	            this.view.scrollTo({
	                top: this.headerContainer.offsetHeight - this.headerNode.getHeight(),
	                behavior: "smooth"
	            });
	            this.headerNode.callJSResponse("startAnimation");
	        }
	        else {
	            this.view.scrollTo({
	                top: (_a = this.headerContainer) === null || _a === void 0 ? void 0 : _a.offsetHeight,
	                behavior: "smooth"
	            });
	            this.headerNode.callJSResponse("stopAnimation");
	        }
	    }
	    setRefreshable(v) {
	        this.refreshable = v;
	        if (!v) {
	            this.setRefreshing(false);
	        }
	    }
	}

	class AnimatePlugin extends DoricPlugin {
	    submit() {
	        return Promise.resolve();
	    }
	    animateRender(args) {
	        var _a;
	        this.context.animationSet = [];
	        if (((_a = this.context.rootNode.viewId) === null || _a === void 0 ? void 0 : _a.length) > 0) {
	            const viewNode = this.context.targetViewNode(args.id);
	            viewNode === null || viewNode === void 0 ? void 0 : viewNode.blend(args.props);
	            viewNode === null || viewNode === void 0 ? void 0 : viewNode.onBlended();
	        }
	        else {
	            this.context.rootNode.viewId = args.id;
	            this.context.rootNode.blend(args.props);
	            this.context.rootNode.onBlended();
	        }
	        return new Promise(resolve => {
	            Promise.resolve().then(() => {
	                var _a;
	                Promise.all(((_a = this.context.animationSet) === null || _a === void 0 ? void 0 : _a.map(e => {
	                    return new Promise(resolve => {
	                        const keyFrame = {};
	                        const ensureNonString = (key, value) => {
	                            if (!!value && value !== "") {
	                                return value;
	                            }
	                            switch ((key)) {
	                                case "backgroundColor":
	                                    return "transparent";
	                                case "transform":
	                                    return "none";
	                                default:
	                                    return "none";
	                            }
	                        };
	                        for (let k in e.keyFrame) {
	                            keyFrame[k] = ensureNonString(k, e.viewNode.view.style[k]);
	                            e.keyFrame[k] = ensureNonString(k, e.keyFrame[k]);
	                        }
	                        try {
	                            const animation = e.viewNode.view.animate([keyFrame, e.keyFrame], {
	                                duration: args.duration,
	                                fill: "forwards"
	                            });
	                            animation.onfinish = () => {
	                                Object.entries(e.keyFrame).forEach(entry => {
	                                    Reflect.set(e.viewNode.view.style, entry[0], entry[1]);
	                                });
	                                resolve(true);
	                            };
	                        }
	                        catch (e) {
	                            console.error(e);
	                        }
	                    });
	                })) || [])
	                    .then(() => {
	                    resolve(0);
	                })
	                    .finally(() => {
	                    this.context.animationSet = undefined;
	                });
	            });
	        });
	    }
	}

	class DoricSwitchNode extends DoricViewNode {
	    constructor() {
	        super(...arguments);
	        this.offTintColor = "#e6e6e6";
	        this.onTintColor = "#52d769";
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.position = "relative";
	        ret.style.width = "50px";
	        ret.style.height = "30px";
	        const input = document.createElement('input');
	        input.type = "checkbox";
	        input.style.display = "none";
	        const box = document.createElement('div');
	        box.style.width = "100%";
	        box.style.height = "100%";
	        box.style.backgroundColor = "#ccc";
	        box.style.borderRadius = "15px";
	        const span = document.createElement('span');
	        span.style.display = "inline-block";
	        span.style.height = "30px";
	        span.style.width = "30px";
	        span.style.borderRadius = "15px";
	        span.style.background = "#fff";
	        span.style.boxShadow = "0px 3px 3px #eee";
	        box.appendChild(span);
	        ret.appendChild(input);
	        ret.appendChild(box);
	        ret.onclick = () => {
	            try {
	                if (input.checked === false) {
	                    span.animate([{ transform: "translateX(0px)" }, { transform: "translateX(30px)" }], {
	                        duration: 200,
	                        fill: "forwards"
	                    });
	                    box.animate([{ backgroundColor: this.offTintColor }, { backgroundColor: this.onTintColor }], {
	                        duration: 200,
	                        fill: "forwards"
	                    });
	                    input.checked = true;
	                }
	                else {
	                    span.animate([{ transform: "translateX(30px)" }, { transform: "translateX(0px)" }], {
	                        duration: 200,
	                        fill: "forwards"
	                    });
	                    box.animate([{ backgroundColor: this.onTintColor }, { backgroundColor: this.offTintColor }], {
	                        duration: 200,
	                        fill: "forwards"
	                    });
	                    input.checked = false;
	                }
	                if (this.onSwitchFuncId) {
	                    this.callJSResponse(this.onSwitchFuncId, input.checked);
	                }
	            }
	            catch (e) {
	                alert(e);
	            }
	        };
	        this.input = input;
	        this.span = span;
	        this.box = box;
	        return ret;
	    }
	    setChecked(v) {
	        if (!this.input || !this.span || !this.box) {
	            return;
	        }
	        if (v) {
	            this.span.style.transform = "translateX(30px)";
	            this.box.style.backgroundColor = this.onTintColor;
	            this.input.checked = v;
	        }
	        else {
	            this.span.style.transform = "translateX(0px)";
	            this.box.style.backgroundColor = this.offTintColor;
	            this.input.checked = v;
	        }
	    }
	    blendProps(v, propName, prop) {
	        switch (propName) {
	            case "state":
	                this.setChecked(prop);
	                break;
	            case "onSwitch":
	                this.onSwitchFuncId = prop;
	                break;
	            case "offTintColor":
	                this.offTintColor = toRGBAString(prop);
	                this.setChecked(this.getState());
	                break;
	            case "onTintColor":
	                this.onTintColor = toRGBAString(prop);
	                this.setChecked(this.getState());
	                break;
	            case "thumbTintColor":
	                if (this.span) {
	                    this.span.style.backgroundColor = toRGBAString(prop);
	                }
	                break;
	            default:
	                super.blendProps(v, propName, prop);
	                break;
	        }
	    }
	    getState() {
	        var _a;
	        return ((_a = this.input) === null || _a === void 0 ? void 0 : _a.checked) || false;
	    }
	}

	class DoricSliderNode extends DoricSuperNode {
	    constructor() {
	        super(...arguments);
	        this.itemCount = 0;
	        this.renderPageFuncId = "";
	        this.batchCount = 15;
	        this.onPageSelectedFuncId = "";
	        this.loop = false;
	        this.childNodes = [];
	    }
	    blendProps(v, propName, prop) {
	        if (propName === 'itemCount') {
	            this.itemCount = prop;
	        }
	        else if (propName === 'renderPage') {
	            if (prop !== this.renderPageFuncId) {
	                this.childNodes = [];
	                this.renderPageFuncId = prop;
	            }
	        }
	        else if (propName === 'batchCount') {
	            this.batchCount = prop;
	        }
	        else if (propName === 'onPageSlided') {
	            this.onPageSelectedFuncId = prop;
	        }
	        else if (propName === 'loop') {
	            this.loop = prop;
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    blendSubNode(model) {
	        var _a;
	        (_a = this.getSubNodeById(model.id)) === null || _a === void 0 ? void 0 : _a.blend(model.props);
	    }
	    getSubNodeById(viewId) {
	        var _a;
	        return (_a = this.childNodes.filter(e => e.viewId === viewId)) === null || _a === void 0 ? void 0 : _a[0];
	    }
	    onBlending() {
	        super.onBlending();
	        if (this.childNodes.length !== this.itemCount) {
	            const ret = this.pureCallJSResponse("renderBunchedItems", this.childNodes.length, this.itemCount);
	            this.childNodes = this.childNodes.concat(ret.map(e => {
	                const viewNode = DoricViewNode.create(this.context, e.type);
	                viewNode.viewId = e.id;
	                viewNode.init(this);
	                viewNode.blend(e.props);
	                this.view.appendChild(viewNode.view);
	                return viewNode;
	            }));
	        }
	    }
	    build() {
	        const ret = document.createElement('div');
	        ret.style.overflow = "hidden";
	        ret.style.display = "inline";
	        ret.style.whiteSpace = "nowrap";
	        let touchStartX = 0;
	        let currentIndex = 0;
	        ret.ontouchstart = (ev) => {
	            currentIndex = Math.round(ret.scrollLeft / ret.offsetWidth);
	            touchStartX = ev.touches[0].pageX;
	        };
	        ret.ontouchmove = (ev) => {
	            const offsetX = (touchStartX - ev.touches[0].pageX) * 3;
	            ret.scrollTo({
	                left: currentIndex * ret.offsetWidth + offsetX
	            });
	        };
	        ret.ontouchcancel = ret.ontouchend = () => {
	            let originInndex = currentIndex;
	            currentIndex = Math.round(ret.scrollLeft / ret.offsetWidth);
	            ret.scrollTo({
	                left: currentIndex * ret.offsetWidth,
	                behavior: "smooth"
	            });
	            if (originInndex !== currentIndex) {
	                if (this.onPageSelectedFuncId.length > 0) {
	                    this.callJSResponse(this.onPageSelectedFuncId, currentIndex);
	                }
	            }
	        };
	        return ret;
	    }
	    getSlidedPage() {
	        return Math.round(this.view.scrollLeft / this.view.offsetWidth);
	    }
	    slidePage(params) {
	        if (params.smooth) {
	            this.view.scrollTo({
	                left: this.view.offsetWidth * params.page,
	                behavior: "smooth"
	            });
	        }
	        else {
	            this.view.scrollTo({
	                left: this.view.offsetWidth * params.page
	            });
	        }
	        if (this.onPageSelectedFuncId.length > 0) {
	            this.callJSResponse(this.onPageSelectedFuncId, params.page);
	        }
	    }
	}

	class DoricSlideItemNode extends DoricStackNode {
	    constructor(context) {
	        super(context);
	        this.reusable = true;
	    }
	    build() {
	        const ret = super.build();
	        ret.style.display = "inline-block";
	        ret.style.width = "100%";
	        ret.style.height = "100%";
	        return ret;
	    }
	}

	var NotificationCenter;
	(function (NotificationCenter) {
	    let receivers = [];
	    function publish(notification) {
	        receivers.filter(e => e.name === notification.name).forEach(e => {
	            e.callback(notification.data);
	        });
	    }
	    NotificationCenter.publish = publish;
	    function subscribe(receiver) {
	        receivers.push(receiver);
	    }
	    NotificationCenter.subscribe = subscribe;
	    function unsubscribe(receiver) {
	        receivers = receivers.filter(e => e !== receiver);
	    }
	    NotificationCenter.unsubscribe = unsubscribe;
	})(NotificationCenter || (NotificationCenter = {}));
	class NotificationPlugin extends DoricPlugin {
	    constructor() {
	        super(...arguments);
	        this.receivers = {};
	    }
	    publish(args) {
	        const key = `__doric__${args.biz || ""}#${args.name}`;
	        NotificationCenter.publish({
	            name: key,
	            data: !!args.data ? JSON.parse(args.data) : undefined
	        });
	        return true;
	    }
	    subscribe(args) {
	        const key = `__doric__${args.biz || ""}#${args.name}`;
	        const receiver = {
	            name: key,
	            callback: (data) => {
	                sandbox.jsCallResolve(this.context.contextId, args.callback, data);
	            }
	        };
	        this.receivers[args.callback] = receiver;
	        NotificationCenter.subscribe(receiver);
	        return args.callback;
	    }
	    unsubscribe(subscribeId) {
	        const recevier = this.receivers[subscribeId];
	        if (recevier) {
	            NotificationCenter.unsubscribe(recevier);
	            this.receivers[subscribeId] = undefined;
	            return true;
	        }
	        else {
	            return false;
	        }
	    }
	    onTearDown() {
	        Object.entries(this.receivers).map(e => e[1]).filter(e => !!e).forEach(e => {
	            if (e) {
	                NotificationCenter.unsubscribe(e);
	            }
	        });
	        this.receivers = {};
	    }
	}

	var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	class NetworkPlugin extends DoricPlugin {
	    request(args) {
	        return __awaiter$1(this, void 0, void 0, function* () {
	            let result;
	            let error;
	            if (args.method.toLowerCase() === "get") {
	                try {
	                    result = yield axios__default["default"].get(args.url, {
	                        headers: args.headers ? args.headers : {},
	                        timeout: args.timeout
	                    });
	                }
	                catch (exception) {
	                    error = exception;
	                }
	            }
	            else if (args.method.toLowerCase() === "post") {
	                try {
	                    result = yield axios__default["default"].post(args.url, args.data, {
	                        headers: args.headers ? args.headers : {},
	                        timeout: args.timeout
	                    });
	                }
	                catch (exception) {
	                    error = exception;
	                }
	            }
	            else if (args.method.toLowerCase() === "put") {
	                try {
	                    result = yield axios__default["default"].put(args.url, args.data, {
	                        headers: args.headers ? args.headers : {},
	                        timeout: args.timeout
	                    });
	                }
	                catch (exception) {
	                    error = exception;
	                }
	            }
	            else if (args.method.toLowerCase() === "delete") {
	                try {
	                    result = yield axios__default["default"].delete(args.url, {
	                        headers: args.headers ? args.headers : {},
	                        timeout: args.timeout
	                    });
	                }
	                catch (exception) {
	                    error = exception;
	                }
	            }
	            result.data = JSON.stringify(result.data);
	            if (result) {
	                return Promise.resolve(result);
	            }
	            if (error) {
	                return Promise.reject(error);
	            }
	        });
	    }
	}

	function getX(ev) {
	    return ev instanceof MouseEvent ? ev.pageX : ev.touches[0].pageX;
	}
	function getY(ev) {
	    return ev instanceof MouseEvent ? ev.pageY : ev.touches[0].pageY;
	}
	function NestedSliderView(props) {
	    const ret = document.createElement("div");
	    ret.style.overflow = "hidden";
	    ret.style.display = "inline";
	    ret.style.whiteSpace = "nowrap";
	    let touch = {
	        touchStartX: 0,
	        touchStartY: 0,
	        currentIndex: 0,
	        isDragging: false,
	        horizontal: true
	    };
	    ret.ontouchstart = ret.onmousedown = (ev) => {
	        if (!props.scrollable())
	            return;
	        touch = Object.assign(Object.assign({}, touch), { currentIndex: Math.round(ret.scrollLeft / ret.offsetWidth), touchStartX: getX(ev), touchStartY: getY(ev), isDragging: true });
	    };
	    ret.ontouchmove = ret.onmousemove = (ev) => {
	        if (!props.scrollable() || !touch.isDragging)
	            return;
	        if (!touch.horizontal) {
	            return;
	        }
	        if (Math.abs(getX(ev) - touch.touchStartX) < Math.abs(getY(ev) - touch.touchStartY)) {
	            touch.horizontal = false;
	            return;
	        }
	        const offsetX = (touch.touchStartX - getX(ev)) * 1.2;
	        ret.scrollTo({
	            left: touch.currentIndex * ret.offsetWidth + offsetX,
	        });
	    };
	    ret.onmouseup = ret.ontouchcancel = ret.ontouchend = () => {
	        if (!props.scrollable())
	            return;
	        touch = Object.assign(Object.assign({}, touch), { isDragging: false, horizontal: true });
	        let originIndex = touch.currentIndex;
	        if (Math.abs(ret.scrollLeft - originIndex * ret.offsetWidth) > ret.offsetWidth / 5) {
	            const positionOffset = Math.abs(ret.scrollLeft) > originIndex * ret.offsetWidth ? 1 : -1;
	            touch.currentIndex += positionOffset;
	        }
	        ret.scrollTo({
	            left: touch.currentIndex * ret.offsetWidth,
	            behavior: "smooth",
	        });
	        if (originIndex !== touch.currentIndex) {
	            if (props.onPageSelected) {
	                props.onPageSelected(touch.currentIndex);
	            }
	        }
	    };
	    return ret;
	}

	class DoricNestedSliderNode extends DoricGroupViewNode {
	    constructor() {
	        super(...arguments);
	        this.onPageSelectedFuncId = "";
	        this.scrollable = true;
	    }
	    blendProps(v, propName, prop) {
	        if (propName === "scrollable") {
	            this.scrollable = prop;
	        }
	        else if (propName === "onPageSlided") {
	            this.onPageSelectedFuncId = prop;
	        }
	        else if (propName === "slidePosition") {
	            setTimeout(() => {
	                this.slidePage({ page: prop, smooth: false });
	            });
	        }
	        else {
	            super.blendProps(v, propName, prop);
	        }
	    }
	    build() {
	        return NestedSliderView({
	            scrollable: () => this.scrollable, onPageSelected: index => {
	                if (this.onPageSelectedFuncId.length > 0) {
	                    this.callJSResponse(this.onPageSelectedFuncId, index);
	                }
	            }
	        });
	    }
	    layout() {
	        super.layout();
	        this.childNodes.forEach((e, idx) => {
	            e.view.style.display = "inline-block";
	            e.view.style.width = "100%";
	            e.view.style.height = "100%";
	        });
	    }
	    getSlidedPage() {
	        return Math.round(this.view.scrollLeft / this.view.offsetWidth);
	    }
	    slidePage(params) {
	        if (params.smooth) {
	            this.view.scrollTo({
	                left: this.view.offsetWidth * params.page,
	                behavior: "smooth",
	            });
	        }
	        else {
	            this.view.scrollTo({
	                left: this.view.offsetWidth * params.page,
	            });
	        }
	        if (this.onPageSelectedFuncId.length > 0) {
	            this.callJSResponse(this.onPageSelectedFuncId, params.page);
	        }
	    }
	}

	class DoricResourceManager {
	    constructor() {
	        this.resourceLoaders = new Map();
	    }
	    registerLoader(loader) {
	        this.resourceLoaders.set(loader.resourceType(), loader);
	    }
	    load(resource) {
	        var _a;
	        return (_a = this.resourceLoaders.get(resource.type)) === null || _a === void 0 ? void 0 : _a.load(resource.identifier);
	    }
	}

	const bundles = new Map;
	const plugins = new Map;
	const nodes = new Map;
	const resourceManager = new DoricResourceManager();
	function acquireJSBundle(name) {
	    return bundles.get(name);
	}
	function registerJSBundle(name, bundle) {
	    bundles.set(name, bundle);
	}
	function registerPlugin(name, plugin) {
	    plugins.set(name, plugin);
	}
	function acquirePlugin(name) {
	    return plugins.get(name);
	}
	function registerViewNode(name, node) {
	    nodes.set(name, node);
	}
	function acquireViewNode(name) {
	    return nodes.get(name);
	}
	registerPlugin('shader', ShaderPlugin);
	registerPlugin('modal', ModalPlugin);
	registerPlugin('storage', StoragePlugin);
	registerPlugin('navigator', NavigatorPlugin);
	registerPlugin('popover', PopoverPlugin);
	registerPlugin('animate', AnimatePlugin);
	registerPlugin('notification', NotificationPlugin);
	registerPlugin('network', NetworkPlugin);
	registerViewNode('Stack', DoricStackNode);
	registerViewNode('VLayout', DoricVLayoutNode);
	registerViewNode('HLayout', DoricHLayoutNode);
	registerViewNode('Text', DoricTextNode);
	registerViewNode('Image', DoricImageNode);
	registerViewNode('Scroller', DoricScrollerNode);
	registerViewNode('ListItem', DoricListItemNode);
	registerViewNode('List', DoricListNode);
	registerViewNode('Draggable', DoricDraggableNode);
	registerViewNode('Refreshable', DoricRefreshableNode);
	registerViewNode('Switch', DoricSwitchNode);
	registerViewNode('Slider', DoricSliderNode);
	registerViewNode('SlideItem', DoricSlideItemNode);
	registerViewNode('NestedSlider', DoricNestedSliderNode);

	function getScriptId(contextId) {
	    return `__doric_script_${contextId}`;
	}
	const originSetTimeout = window.setTimeout;
	const originClearTimeout = window.clearTimeout;
	const originSetInterval = window.setInterval;
	const originClearInterval = window.clearInterval;
	const timers = new Map;
	function injectGlobalObject(name, value) {
	    Reflect.set(window, name, value, window);
	}
	function loadJS(contextId, script) {
	    const scriptElement = document.createElement('script');
	    scriptElement.text = script;
	    scriptElement.id = getScriptId(contextId);
	    document.body.appendChild(scriptElement);
	}
	function packageModuleScript(name, content) {
	    return `Reflect.apply(doric.jsRegisterModule,this,["${name}",Reflect.apply(function(__module){(function(module,exports,require,setTimeout,setInterval,clearTimeout,clearInterval){
${content}
})(__module,__module.exports,doric.__require__,doricSetTimeout,doricSetInterval,doricClearTimeout,doricClearInterval);
return __module.exports;},this,[{exports:{}}])])`;
	}
	function packageCreateContext(contextId, content) {
	    return `//@ sourceURL=contextId_${contextId}.js
Reflect.apply(function(doric,context,Entry,require,exports,setTimeout,setInterval,clearTimeout,clearInterval){
${content}
},undefined,[undefined,doric.jsObtainContext("${contextId}"),doric.jsObtainEntry("${contextId}"),doric.__require__,{},doricSetTimeout,doricSetInterval,doricClearTimeout,doricClearInterval])`;
	}
	function initDoric() {
	    injectGlobalObject("Environment", {
	        platform: "web"
	    });
	    injectGlobalObject('nativeLog', (type, message) => {
	        switch (type) {
	            case 'd':
	                console.log(message);
	                break;
	            case 'w':
	                console.warn(message);
	                break;
	            case 'e':
	                console.error(message);
	                break;
	        }
	    });
	    injectGlobalObject('nativeRequire', (moduleName) => {
	        const bundle = acquireJSBundle(moduleName);
	        if (bundle === undefined || bundle.length === 0) {
	            console.log(`Cannot require JS Bundle :${moduleName}`);
	            return false;
	        }
	        else {
	            loadJS(moduleName, packageModuleScript(moduleName, bundle));
	            return true;
	        }
	    });
	    injectGlobalObject('nativeBridge', (contextId, namespace, method, callbackId, args) => {
	        const pluginClass = acquirePlugin(namespace);
	        const doricContext = getDoricContext(contextId);
	        if (pluginClass === undefined) {
	            console.error(`Cannot find Plugin:${namespace}`);
	            return false;
	        }
	        if (doricContext === undefined) {
	            console.error(`Cannot find Doric Context:${contextId}`);
	            return false;
	        }
	        let plugin = doricContext.pluginInstances.get(namespace);
	        if (plugin === undefined) {
	            plugin = new pluginClass(doricContext);
	            doricContext.pluginInstances.set(namespace, plugin);
	        }
	        if (!Reflect.has(plugin, method)) {
	            console.error(`Cannot find Method:${method} in plugin ${namespace}`);
	            return false;
	        }
	        const pluginMethod = Reflect.get(plugin, method, plugin);
	        if (typeof pluginMethod !== 'function') {
	            console.error(`Plugin ${namespace}'s property ${method}'s type is ${typeof pluginMethod} not function,`);
	        }
	        const ret = Reflect.apply(pluginMethod, plugin, [args]);
	        if (ret instanceof Promise) {
	            ret.then(e => {
	                sandbox.jsCallResolve(contextId, callbackId, e);
	                markNeedHook();
	            }, e => {
	                sandbox.jsCallReject(contextId, callbackId, e);
	                markNeedHook();
	            });
	        }
	        else if (ret !== undefined) {
	            Promise.resolve(ret).then((ret) => {
	                sandbox.jsCallResolve(contextId, callbackId, ret);
	                markNeedHook();
	            });
	        }
	        return true;
	    });
	    injectGlobalObject('nativeSetTimer', (timerId, time, repeat) => {
	        if (repeat) {
	            const handleId = originSetInterval(() => {
	                sandbox.jsCallbackTimer(timerId);
	                markNeedHook();
	            }, time);
	            timers.set(timerId, { handleId, repeat });
	        }
	        else {
	            const handleId = originSetTimeout(() => {
	                sandbox.jsCallbackTimer(timerId);
	                markNeedHook();
	            }, time);
	            timers.set(timerId, { handleId, repeat });
	        }
	    });
	    injectGlobalObject('nativeClearTimer', (timerId) => {
	        const timerInfo = timers.get(timerId);
	        if (timerInfo) {
	            if (timerInfo.repeat) {
	                originClearInterval(timerInfo.handleId);
	            }
	            else {
	                originClearTimeout(timerInfo.handleId);
	            }
	        }
	    });
	}
	function createContext(contextId, content) {
	    loadJS(contextId, packageCreateContext(contextId, content));
	}
	function destroyContext(contextId) {
	    sandbox.jsReleaseContext(contextId);
	    const scriptElement = document.getElementById(getScriptId(contextId));
	    if (scriptElement) {
	        document.body.removeChild(scriptElement);
	    }
	}
	let requesting = false;
	function markNeedHook() {
	    if (requesting) {
	        return;
	    }
	    requesting = true;
	    requestAnimationFrame(() => {
	        sandbox.jsHookAfterNativeCall();
	        requesting = false;
	    });
	}
	initDoric();

	const doricContexts = new Map;
	let __contextId__ = 0;
	function getContextId() {
	    return `context_${__contextId__++}`;
	}
	function getDoricContext(contextId) {
	    return doricContexts.get(contextId);
	}
	class DoricContext {
	    constructor(content) {
	        this.contextId = getContextId();
	        this.pluginInstances = new Map;
	        this.headNodes = new Map;
	        createContext(this.contextId, content);
	        doricContexts.set(this.contextId, this);
	        this.rootNode = new DoricStackNode(this);
	    }
	    targetViewNode(viewId) {
	        if (this.rootNode.viewId === viewId) {
	            return this.rootNode;
	        }
	        for (let nodes of this.headNodes.values()) {
	            if (nodes.has(viewId)) {
	                return nodes.get(viewId);
	            }
	        }
	    }
	    get panel() {
	        var _a;
	        return (_a = sandbox.jsObtainContext(this.contextId)) === null || _a === void 0 ? void 0 : _a.entity;
	    }
	    invokeEntityMethod(method, ...otherArgs) {
	        const argumentsList = [this.contextId];
	        for (let i = 0; i < arguments.length; i++) {
	            argumentsList.push(arguments[i]);
	        }
	        const ret = Reflect.apply(sandbox.jsCallEntityMethod, this.panel, argumentsList);
	        markNeedHook();
	        return ret;
	    }
	    pureInvokeEntityMethod(method, ...otherArgs) {
	        const argumentsList = [this.contextId];
	        for (let i = 0; i < arguments.length; i++) {
	            argumentsList.push(arguments[i]);
	        }
	        return Reflect.apply(sandbox.pureCallEntityMethod, this.panel, argumentsList);
	    }
	    init(data) {
	        this.invokeEntityMethod("__init__", data);
	    }
	    onCreate() {
	        this.invokeEntityMethod("__onCreate__");
	    }
	    onDestroy() {
	        this.invokeEntityMethod("__onDestroy__");
	    }
	    onShow() {
	        this.invokeEntityMethod("__onShow__");
	    }
	    onHidden() {
	        this.invokeEntityMethod("__onHidden__");
	    }
	    build(frame) {
	        this.invokeEntityMethod("__build__", frame);
	    }
	    inAnimation() {
	        return !!this.animationSet;
	    }
	    addAnimation(viewNode, keyFrame) {
	        var _a;
	        (_a = this.animationSet) === null || _a === void 0 ? void 0 : _a.push({
	            viewNode,
	            keyFrame,
	        });
	    }
	    teardown() {
	        for (let plugin of this.pluginInstances.values()) {
	            plugin.onTearDown();
	        }
	        destroyContext(this.contextId);
	    }
	}

	class DoricElement extends HTMLElement {
	    constructor() {
	        super();
	    }
	    get src() {
	        return this.getAttribute('src');
	    }
	    get alias() {
	        return this.getAttribute('alias');
	    }
	    set src(v) {
	        this.setAttribute('src', v);
	    }
	    set alias(v) {
	        this.setAttribute('alias', v);
	    }
	    get initData() {
	        return this.getAttribute('data');
	    }
	    set initData(v) {
	        this.setAttribute('data', v);
	    }
	    connectedCallback() {
	        if (this.src && this.context === undefined) {
	            loadDoricJSBundle(this.src).then(result => {
	                this.load(result);
	            });
	        }
	    }
	    disconnectedCallback() {
	    }
	    adoptedCallback() {
	    }
	    attributeChangedCallback() {
	    }
	    onDestroy() {
	        var _a, _b;
	        (_a = this.context) === null || _a === void 0 ? void 0 : _a.onDestroy();
	        (_b = this.context) === null || _b === void 0 ? void 0 : _b.teardown();
	    }
	    load(content) {
	        this.context = new DoricContext(content);
	        this.context.init(this.initData);
	        this.context.onCreate();
	        const divElement = document.createElement('div');
	        divElement.style.position = 'relative';
	        divElement.style.height = '100%';
	        this.append(divElement);
	        this.context.rootNode.view = divElement;
	        this.context.build({
	            width: divElement.offsetWidth,
	            height: divElement.offsetHeight,
	        });
	        this.context.onShow();
	    }
	}

	class NavigationElement extends HTMLElement {
	    constructor() {
	        super(...arguments);
	        this.elementStack = [];
	    }
	    get currentNode() {
	        for (let i = 0; i < this.childNodes.length; i++) {
	            if (this.childNodes[i] instanceof DoricElement) {
	                return this.childNodes[i];
	            }
	        }
	        return undefined;
	    }
	    push(element) {
	        const currentNode = this.currentNode;
	        if (currentNode) {
	            this.elementStack.push(currentNode);
	            this.replaceChild(element, currentNode);
	        }
	        else {
	            this.appendChild(element);
	        }
	    }
	    pop() {
	        const lastElement = this.elementStack.pop();
	        const currentNode = this.currentNode;
	        if (lastElement && currentNode) {
	            this.replaceChild(lastElement, currentNode);
	            currentNode.onDestroy();
	        }
	        else {
	            window.history.back();
	        }
	    }
	}

	var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	window.customElements.define('doric-div', DoricElement);
	window.customElements.define('doric-navigation', NavigationElement);
	smoothscroll.polyfill();
	registerDoricJSLoader({
	    filter: (source) => source.startsWith("assets://"),
	    request: (source) => __awaiter(void 0, void 0, void 0, function* () {
	        const ret = yield axios__default["default"].get(source.replace("assets://", `${window.location.href}/../../doric-demo/bundle/`));
	        return ret.data;
	    })
	});

	exports.BOTTOM = BOTTOM;
	exports.CENTER = CENTER;
	exports.CENTER_X = CENTER_X;
	exports.CENTER_Y = CENTER_Y;
	exports.DoricElement = DoricElement;
	exports.DoricGroupViewNode = DoricGroupViewNode;
	exports.DoricPlugin = DoricPlugin;
	exports.DoricSuperNode = DoricSuperNode;
	exports.DoricViewNode = DoricViewNode;
	exports.LEFT = LEFT;
	exports.NavigationElement = NavigationElement;
	exports.RIGHT = RIGHT;
	exports.TOP = TOP;
	exports.acquireJSBundle = acquireJSBundle;
	exports.acquirePlugin = acquirePlugin;
	exports.acquireViewNode = acquireViewNode;
	exports.createContext = createContext;
	exports.destroyContext = destroyContext;
	exports.injectGlobalObject = injectGlobalObject;
	exports.loadJS = loadJS;
	exports.markNeedHook = markNeedHook;
	exports.pixelString2Number = pixelString2Number;
	exports.registerJSBundle = registerJSBundle;
	exports.registerPlugin = registerPlugin;
	exports.registerViewNode = registerViewNode;
	exports.resourceManager = resourceManager;
	exports.toPixelString = toPixelString;

	Object.defineProperty(exports, '__esModule', { value: true });

	return exports;

})({}, axios, doric);
//# sourceMappingURL=index.js.map
