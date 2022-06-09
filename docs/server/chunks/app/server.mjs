import { v as vue_cjs_prod, r as require$$0, s as serverRenderer } from '../handlers/renderer.mjs';
import { hasProtocol, isEqual, withBase, withQuery } from 'ufo';
import { u as useRuntimeConfig$1 } from '../nitro/node-server.mjs';
import 'h3';
import 'unenv/runtime/mock/proxy';
import 'stream';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'ohmyfetch';
import 'radix3';
import 'unenv/runtime/fetch/index';
import 'hookable';
import 'scule';
import 'ohash';
import 'unstorage';
import 'fs';
import 'pathe';
import 'url';

var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
const suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^["{[]|^-?[0-9][0-9.]{0,14}$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor") {
    return;
  }
  return value;
}
function destr(val) {
  if (typeof val !== "string") {
    return val;
  }
  const _lval = val.toLowerCase();
  if (_lval === "true") {
    return true;
  }
  if (_lval === "false") {
    return false;
  }
  if (_lval === "null") {
    return null;
  }
  if (_lval === "nan") {
    return NaN;
  }
  if (_lval === "infinity") {
    return Infinity;
  }
  if (_lval === "undefined") {
    return void 0;
  }
  if (!JsonSigRx.test(val)) {
    return val;
  }
  try {
    if (suspectProtoRx.test(val) || suspectConstructorRx.test(val)) {
      return JSON.parse(val, jsonParseTransform);
    }
    return JSON.parse(val);
  } catch (_e) {
    return val;
  }
}
class FetchError extends Error {
  constructor() {
    super(...arguments);
    this.name = "FetchError";
  }
}
function createFetchError(request, error, response) {
  let message = "";
  if (request && response) {
    message = `${response.status} ${response.statusText} (${request.toString()})`;
  }
  if (error) {
    message = `${error.message} (${message})`;
  }
  const fetchError = new FetchError(message);
  Object.defineProperty(fetchError, "request", { get() {
    return request;
  } });
  Object.defineProperty(fetchError, "response", { get() {
    return response;
  } });
  Object.defineProperty(fetchError, "data", { get() {
    return response && response._data;
  } });
  return fetchError;
}
const payloadMethods = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(val) {
  if (val === void 0) {
    return false;
  }
  const t = typeof val;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(val)) {
    return true;
  }
  return val.constructor && val.constructor.name === "Object" || typeof val.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*`\-.^~]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift();
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  409,
  425,
  429,
  500,
  502,
  503,
  504
]);
function createFetch(globalOptions) {
  const { fetch: fetch2, Headers: Headers2 } = globalOptions;
  function onError(ctx) {
    if (ctx.options.retry !== false) {
      const retries = typeof ctx.options.retry === "number" ? ctx.options.retry : isPayloadMethod(ctx.options.method) ? 0 : 1;
      const responseCode = ctx.response && ctx.response.status || 500;
      if (retries > 0 && retryStatusCodes.has(responseCode)) {
        return $fetchRaw(ctx.request, __spreadProps(__spreadValues({}, ctx.options), {
          retry: retries - 1
        }));
      }
    }
    const err = createFetchError(ctx.request, ctx.error, ctx.response);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, $fetchRaw);
    }
    throw err;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _opts = {}) {
    const ctx = {
      request: _request,
      options: __spreadValues(__spreadValues({}, globalOptions.defaults), _opts),
      response: void 0,
      error: void 0
    };
    if (ctx.options.onRequest) {
      await ctx.options.onRequest(ctx);
    }
    if (typeof ctx.request === "string") {
      if (ctx.options.baseURL) {
        ctx.request = withBase(ctx.request, ctx.options.baseURL);
      }
      if (ctx.options.params) {
        ctx.request = withQuery(ctx.request, ctx.options.params);
      }
      if (ctx.options.body && isPayloadMethod(ctx.options.method)) {
        if (isJSONSerializable(ctx.options.body)) {
          ctx.options.body = typeof ctx.options.body === "string" ? ctx.options.body : JSON.stringify(ctx.options.body);
          ctx.options.headers = new Headers2(ctx.options.headers);
          if (!ctx.options.headers.has("content-type")) {
            ctx.options.headers.set("content-type", "application/json");
          }
          if (!ctx.options.headers.has("accept")) {
            ctx.options.headers.set("accept", "application/json");
          }
        }
      }
    }
    ctx.response = await fetch2(ctx.request, ctx.options).catch(async (error) => {
      ctx.error = error;
      if (ctx.options.onRequestError) {
        await ctx.options.onRequestError(ctx);
      }
      return onError(ctx);
    });
    const responseType = (ctx.options.parseResponse ? "json" : ctx.options.responseType) || detectResponseType(ctx.response.headers.get("content-type") || "");
    if (responseType === "json") {
      const data = await ctx.response.text();
      const parseFn = ctx.options.parseResponse || destr;
      ctx.response._data = parseFn(data);
    } else {
      ctx.response._data = await ctx.response[responseType]();
    }
    if (ctx.options.onResponse) {
      await ctx.options.onResponse(ctx);
    }
    if (!ctx.response.ok) {
      if (ctx.options.onResponseError) {
        await ctx.options.onResponseError(ctx);
      }
    }
    return ctx.response.ok ? ctx.response : onError(ctx);
  };
  const $fetch2 = function $fetch22(request, opts) {
    return $fetchRaw(request, opts).then((r) => r._data);
  };
  $fetch2.raw = $fetchRaw;
  $fetch2.create = (defaultOptions = {}) => createFetch(__spreadProps(__spreadValues({}, globalOptions), {
    defaults: __spreadValues(__spreadValues({}, globalOptions.defaults), defaultOptions)
  }));
  return $fetch2;
}
const _globalThis$2 = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}();
const fetch = _globalThis$2.fetch || (() => Promise.reject(new Error("[ohmyfetch] global.fetch is not supported!")));
const Headers = _globalThis$2.Headers;
const $fetch = createFetch({ fetch, Headers });
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
function serialCaller(hooks, args) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(void 0, args)), Promise.resolve(null));
}
function parallelCaller(hooks, args) {
  return Promise.all(hooks.map((hook) => hook.apply(void 0, args)));
}
class Hookable {
  constructor() {
    this._hooks = {};
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, fn) {
    if (!name || typeof fn !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let deprecatedHookObj;
    while (this._deprecatedHooks[name]) {
      const deprecatedHook = this._deprecatedHooks[name];
      if (typeof deprecatedHook === "string") {
        deprecatedHookObj = { to: deprecatedHook };
      } else {
        deprecatedHookObj = deprecatedHook;
      }
      name = deprecatedHookObj.to;
    }
    if (deprecatedHookObj) {
      if (!deprecatedHookObj.message) {
        console.warn(`${originalName} hook has been deprecated` + (deprecatedHookObj.to ? `, please use ${deprecatedHookObj.to}` : ""));
      } else {
        console.warn(deprecatedHookObj.message);
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(fn);
    return () => {
      if (fn) {
        this.removeHook(name, fn);
        fn = null;
      }
    };
  }
  hookOnce(name, fn) {
    let _unreg;
    let _fn = (...args) => {
      _unreg();
      _unreg = null;
      _fn = null;
      return fn(...args);
    };
    _unreg = this.hook(name, _fn);
    return _unreg;
  }
  removeHook(name, fn) {
    if (this._hooks[name]) {
      const idx = this._hooks[name].indexOf(fn);
      if (idx !== -1) {
        this._hooks[name].splice(idx, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = deprecated;
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
    return () => {
      removeFns.splice(0, removeFns.length).forEach((unreg) => unreg());
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  callHook(name, ...args) {
    return serialCaller(this._hooks[name] || [], args);
  }
  callHookParallel(name, ...args) {
    return parallelCaller(this._hooks[name] || [], args);
  }
  callHookWith(caller, name, ...args) {
    return caller(this._hooks[name] || [], args);
  }
}
function createHooks() {
  return new Hookable();
}
function createContext() {
  let currentInstance = null;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  return {
    use: () => currentInstance,
    set: (instance, replace2) => {
      if (!replace2) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = null;
      isSingleton = false;
    },
    call: (instance, cb) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return cb();
      } finally {
        if (!isSingleton) {
          currentInstance = null;
        }
      }
    },
    async callAsync(instance, cb) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = cb();
        if (!isSingleton) {
          currentInstance = null;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace() {
  const contexts = {};
  return {
    get(key) {
      if (!contexts[key]) {
        contexts[key] = createContext();
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey] || (_globalThis$1[globalKey] = createNamespace());
const getContext = (key) => defaultNamespace.get(key);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis$1[asyncHandlersKey] || (_globalThis$1[asyncHandlersKey] = /* @__PURE__ */ new Set());
function createMock(name, overrides = {}) {
  const fn = function() {
  };
  fn.prototype.name = name;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name}]`);
    },
    enumerate(_target) {
      return [];
    }
  });
}
const mockContext = createMock("mock");
function mock(warning) {
  console.warn(warning);
  return mockContext;
}
const unsupported = /* @__PURE__ */ new Set([
  "store",
  "spa",
  "fetchCounters"
]);
const todo = /* @__PURE__ */ new Set([
  "isHMR",
  "base",
  "payload",
  "from",
  "next",
  "error",
  "redirect",
  "redirected",
  "enablePreview",
  "$preview",
  "beforeNuxtRender",
  "beforeSerialize"
]);
const routerKeys = ["route", "params", "query"];
const staticFlags = {
  isClient: false,
  isServer: true,
  isDev: false,
  isStatic: void 0,
  target: "server",
  modern: false
};
const legacyPlugin = (nuxtApp) => {
  nuxtApp._legacyContext = new Proxy(nuxtApp, {
    get(nuxt, p) {
      if (unsupported.has(p)) {
        return mock(`Accessing ${p} is not supported in Nuxt 3.`);
      }
      if (todo.has(p)) {
        return mock(`Accessing ${p} is not yet supported in Nuxt 3.`);
      }
      if (routerKeys.includes(p)) {
        if (!("$router" in nuxtApp)) {
          return mock("vue-router is not being used in this project.");
        }
        switch (p) {
          case "route":
            return nuxt.$router.currentRoute.value;
          case "params":
          case "query":
            return nuxt.$router.currentRoute.value[p];
        }
      }
      if (p === "$config" || p === "env") {
        return useRuntimeConfig();
      }
      if (p in staticFlags) {
        return staticFlags[p];
      }
      if (p === "ssrContext") {
        return nuxt._legacyContext;
      }
      if (nuxt.ssrContext && p in nuxt.ssrContext) {
        return nuxt.ssrContext[p];
      }
      if (p === "nuxt") {
        return nuxt.payload;
      }
      if (p === "nuxtState") {
        return nuxt.payload.data;
      }
      if (p in nuxtApp.vueApp) {
        return nuxtApp.vueApp[p];
      }
      if (p in nuxtApp) {
        return nuxtApp[p];
      }
      return mock(`Accessing ${p} is not supported in Nuxt3.`);
    }
  });
};
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = __spreadValues({
    provide: void 0,
    globalName: "nuxt",
    payload: vue_cjs_prod.reactive(__spreadValues({
      data: {},
      state: {},
      _errors: {}
    }, { serverRendered: true })),
    isHydrating: false,
    _asyncDataPromises: {}
  }, options);
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  if (nuxtApp.ssrContext) {
    nuxtApp.ssrContext.nuxt = nuxtApp;
  }
  {
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    nuxtApp.ssrContext.payload = nuxtApp.payload;
  }
  {
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a;
      if (prop === "public") {
        return target.public;
      }
      return (_a = target[prop]) != null ? _a : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  let needsLegacyContext = false;
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return () => {
      };
    }
    if (isLegacyPlugin(plugin)) {
      needsLegacyContext = true;
      return (nuxtApp) => plugin(nuxtApp._legacyContext, nuxtApp.provide);
    }
    return plugin;
  });
  if (needsLegacyContext) {
    plugins2.unshift(legacyPlugin);
  }
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function isLegacyPlugin(plugin) {
  return !plugin[NuxtPluginIndicator];
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const vm = vue_cjs_prod.getCurrentInstance();
  if (!vm) {
    const nuxtAppInstance = nuxtAppCtx.use();
    if (!nuxtAppInstance) {
      throw new Error("nuxt instance unavailable");
    }
    return nuxtAppInstance;
  }
  return vm.appContext.app.$nuxt;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var vueRouter_cjs_prod = {};
/*!
  * vue-router v4.0.15
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var vue = require$$0;
  const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const PolySymbol = (name) => hasSymbol ? Symbol(name) : "_vr_" + name;
  const matchedRouteKey = /* @__PURE__ */ PolySymbol("rvlm");
  const viewDepthKey = /* @__PURE__ */ PolySymbol("rvd");
  const routerKey = /* @__PURE__ */ PolySymbol("r");
  const routeLocationKey = /* @__PURE__ */ PolySymbol("rl");
  const routerViewLocationKey = /* @__PURE__ */ PolySymbol("rvl");
  function isESModule(obj) {
    return obj.__esModule || hasSymbol && obj[Symbol.toStringTag] === "Module";
  }
  const assign = Object.assign;
  function applyToParams(fn, params) {
    const newParams = {};
    for (const key in params) {
      const value = params[key];
      newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
    }
    return newParams;
  }
  const noop = () => {
  };
  const TRAILING_SLASH_RE = /\/$/;
  const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
  function parseURL(parseQuery2, location2, currentLocation = "/") {
    let path, query = {}, searchString = "", hash = "";
    const searchPos = location2.indexOf("?");
    const hashPos = location2.indexOf("#", searchPos > -1 ? searchPos : 0);
    if (searchPos > -1) {
      path = location2.slice(0, searchPos);
      searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
      query = parseQuery2(searchString);
    }
    if (hashPos > -1) {
      path = path || location2.slice(0, hashPos);
      hash = location2.slice(hashPos, location2.length);
    }
    path = resolveRelativePath(path != null ? path : location2, currentLocation);
    return {
      fullPath: path + (searchString && "?") + searchString + hash,
      path,
      query,
      hash
    };
  }
  function stringifyURL(stringifyQuery2, location2) {
    const query = location2.query ? stringifyQuery2(location2.query) : "";
    return location2.path + (query && "?") + query + (location2.hash || "");
  }
  function stripBase(pathname, base) {
    if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
      return pathname;
    return pathname.slice(base.length) || "/";
  }
  function isSameRouteLocation(stringifyQuery2, a, b) {
    const aLastIndex = a.matched.length - 1;
    const bLastIndex = b.matched.length - 1;
    return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b.params) && stringifyQuery2(a.query) === stringifyQuery2(b.query) && a.hash === b.hash;
  }
  function isSameRouteRecord(a, b) {
    return (a.aliasOf || a) === (b.aliasOf || b);
  }
  function isSameRouteLocationParams(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length)
      return false;
    for (const key in a) {
      if (!isSameRouteLocationParamsValue(a[key], b[key]))
        return false;
    }
    return true;
  }
  function isSameRouteLocationParamsValue(a, b) {
    return Array.isArray(a) ? isEquivalentArray(a, b) : Array.isArray(b) ? isEquivalentArray(b, a) : a === b;
  }
  function isEquivalentArray(a, b) {
    return Array.isArray(b) ? a.length === b.length && a.every((value, i) => value === b[i]) : a.length === 1 && a[0] === b;
  }
  function resolveRelativePath(to, from) {
    if (to.startsWith("/"))
      return to;
    if (!to)
      return from;
    const fromSegments = from.split("/");
    const toSegments = to.split("/");
    let position = fromSegments.length - 1;
    let toPosition;
    let segment;
    for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
      segment = toSegments[toPosition];
      if (position === 1 || segment === ".")
        continue;
      if (segment === "..")
        position--;
      else
        break;
    }
    return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition - (toPosition === toSegments.length ? 1 : 0)).join("/");
  }
  var NavigationType;
  (function(NavigationType2) {
    NavigationType2["pop"] = "pop";
    NavigationType2["push"] = "push";
  })(NavigationType || (NavigationType = {}));
  var NavigationDirection;
  (function(NavigationDirection2) {
    NavigationDirection2["back"] = "back";
    NavigationDirection2["forward"] = "forward";
    NavigationDirection2["unknown"] = "";
  })(NavigationDirection || (NavigationDirection = {}));
  const START = "";
  function normalizeBase(base) {
    if (!base) {
      {
        base = "/";
      }
    }
    if (base[0] !== "/" && base[0] !== "#")
      base = "/" + base;
    return removeTrailingSlash(base);
  }
  const BEFORE_HASH_RE = /^[^#]+#/;
  function createHref(base, location2) {
    return base.replace(BEFORE_HASH_RE, "#") + location2;
  }
  const computeScrollPosition = () => ({
    left: window.pageXOffset,
    top: window.pageYOffset
  });
  let createBaseLocation = () => location.protocol + "//" + location.host;
  function createCurrentLocation(base, location2) {
    const { pathname, search, hash } = location2;
    const hashPos = base.indexOf("#");
    if (hashPos > -1) {
      let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
      let pathFromHash = hash.slice(slicePos);
      if (pathFromHash[0] !== "/")
        pathFromHash = "/" + pathFromHash;
      return stripBase(pathFromHash, "");
    }
    const path = stripBase(pathname, base);
    return path + search + hash;
  }
  function useHistoryListeners(base, historyState, currentLocation, replace2) {
    let listeners = [];
    let teardowns = [];
    let pauseState = null;
    const popStateHandler = ({ state }) => {
      const to = createCurrentLocation(base, location);
      const from = currentLocation.value;
      const fromState = historyState.value;
      let delta2 = 0;
      if (state) {
        currentLocation.value = to;
        historyState.value = state;
        if (pauseState && pauseState === from) {
          pauseState = null;
          return;
        }
        delta2 = fromState ? state.position - fromState.position : 0;
      } else {
        replace2(to);
      }
      listeners.forEach((listener) => {
        listener(currentLocation.value, from, {
          delta: delta2,
          type: NavigationType.pop,
          direction: delta2 ? delta2 > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
        });
      });
    };
    function pauseListeners() {
      pauseState = currentLocation.value;
    }
    function listen(callback) {
      listeners.push(callback);
      const teardown = () => {
        const index2 = listeners.indexOf(callback);
        if (index2 > -1)
          listeners.splice(index2, 1);
      };
      teardowns.push(teardown);
      return teardown;
    }
    function beforeUnloadListener() {
      const { history: history2 } = window;
      if (!history2.state)
        return;
      history2.replaceState(assign({}, history2.state, { scroll: computeScrollPosition() }), "");
    }
    function destroy() {
      for (const teardown of teardowns)
        teardown();
      teardowns = [];
      window.removeEventListener("popstate", popStateHandler);
      window.removeEventListener("beforeunload", beforeUnloadListener);
    }
    window.addEventListener("popstate", popStateHandler);
    window.addEventListener("beforeunload", beforeUnloadListener);
    return {
      pauseListeners,
      listen,
      destroy
    };
  }
  function buildState(back, current, forward, replaced = false, computeScroll = false) {
    return {
      back,
      current,
      forward,
      replaced,
      position: window.history.length,
      scroll: computeScroll ? computeScrollPosition() : null
    };
  }
  function useHistoryStateNavigation(base) {
    const { history: history2, location: location2 } = window;
    const currentLocation = {
      value: createCurrentLocation(base, location2)
    };
    const historyState = { value: history2.state };
    if (!historyState.value) {
      changeLocation(currentLocation.value, {
        back: null,
        current: currentLocation.value,
        forward: null,
        position: history2.length - 1,
        replaced: true,
        scroll: null
      }, true);
    }
    function changeLocation(to, state, replace3) {
      const hashIndex = base.indexOf("#");
      const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
      try {
        history2[replace3 ? "replaceState" : "pushState"](state, "", url);
        historyState.value = state;
      } catch (err) {
        {
          console.error(err);
        }
        location2[replace3 ? "replace" : "assign"](url);
      }
    }
    function replace2(to, data) {
      const state = assign({}, history2.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position });
      changeLocation(to, state, true);
      currentLocation.value = to;
    }
    function push(to, data) {
      const currentState = assign({}, historyState.value, history2.state, {
        forward: to,
        scroll: computeScrollPosition()
      });
      changeLocation(currentState.current, currentState, true);
      const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
      changeLocation(to, state, false);
      currentLocation.value = to;
    }
    return {
      location: currentLocation,
      state: historyState,
      push,
      replace: replace2
    };
  }
  function createWebHistory(base) {
    base = normalizeBase(base);
    const historyNavigation = useHistoryStateNavigation(base);
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
    function go(delta2, triggerListeners = true) {
      if (!triggerListeners)
        historyListeners.pauseListeners();
      history.go(delta2);
    }
    const routerHistory = assign({
      location: "",
      base,
      go,
      createHref: createHref.bind(null, base)
    }, historyNavigation, historyListeners);
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => historyNavigation.location.value
    });
    Object.defineProperty(routerHistory, "state", {
      enumerable: true,
      get: () => historyNavigation.state.value
    });
    return routerHistory;
  }
  function createMemoryHistory(base = "") {
    let listeners = [];
    let queue = [START];
    let position = 0;
    base = normalizeBase(base);
    function setLocation(location2) {
      position++;
      if (position === queue.length) {
        queue.push(location2);
      } else {
        queue.splice(position);
        queue.push(location2);
      }
    }
    function triggerListeners(to, from, { direction, delta: delta2 }) {
      const info = {
        direction,
        delta: delta2,
        type: NavigationType.pop
      };
      for (const callback of listeners) {
        callback(to, from, info);
      }
    }
    const routerHistory = {
      location: START,
      state: {},
      base,
      createHref: createHref.bind(null, base),
      replace(to) {
        queue.splice(position--, 1);
        setLocation(to);
      },
      push(to, data) {
        setLocation(to);
      },
      listen(callback) {
        listeners.push(callback);
        return () => {
          const index2 = listeners.indexOf(callback);
          if (index2 > -1)
            listeners.splice(index2, 1);
        };
      },
      destroy() {
        listeners = [];
        queue = [START];
        position = 0;
      },
      go(delta2, shouldTrigger = true) {
        const from = this.location;
        const direction = delta2 < 0 ? NavigationDirection.back : NavigationDirection.forward;
        position = Math.max(0, Math.min(position + delta2, queue.length - 1));
        if (shouldTrigger) {
          triggerListeners(this.location, from, {
            direction,
            delta: delta2
          });
        }
      }
    };
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => queue[position]
    });
    return routerHistory;
  }
  function createWebHashHistory(base) {
    base = location.host ? base || location.pathname + location.search : "";
    if (!base.includes("#"))
      base += "#";
    return createWebHistory(base);
  }
  function isRouteLocation(route) {
    return typeof route === "string" || route && typeof route === "object";
  }
  function isRouteName(name) {
    return typeof name === "string" || typeof name === "symbol";
  }
  const START_LOCATION_NORMALIZED = {
    path: "/",
    name: void 0,
    params: {},
    query: {},
    hash: "",
    fullPath: "/",
    matched: [],
    meta: {},
    redirectedFrom: void 0
  };
  const NavigationFailureSymbol = /* @__PURE__ */ PolySymbol("nf");
  exports.NavigationFailureType = void 0;
  (function(NavigationFailureType) {
    NavigationFailureType[NavigationFailureType["aborted"] = 4] = "aborted";
    NavigationFailureType[NavigationFailureType["cancelled"] = 8] = "cancelled";
    NavigationFailureType[NavigationFailureType["duplicated"] = 16] = "duplicated";
  })(exports.NavigationFailureType || (exports.NavigationFailureType = {}));
  const ErrorTypeMessages = {
    [1]({ location: location2, currentLocation }) {
      return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
    },
    [2]({ from, to }) {
      return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
    },
    [4]({ from, to }) {
      return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
    },
    [8]({ from, to }) {
      return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
    },
    [16]({ from, to }) {
      return `Avoided redundant navigation to current location: "${from.fullPath}".`;
    }
  };
  function createRouterError(type, params) {
    {
      return assign(new Error(ErrorTypeMessages[type](params)), {
        type,
        [NavigationFailureSymbol]: true
      }, params);
    }
  }
  function isNavigationFailure(error, type) {
    return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
  }
  const propertiesToLog = ["params", "query", "hash"];
  function stringifyRoute(to) {
    if (typeof to === "string")
      return to;
    if ("path" in to)
      return to.path;
    const location2 = {};
    for (const key of propertiesToLog) {
      if (key in to)
        location2[key] = to[key];
    }
    return JSON.stringify(location2, null, 2);
  }
  const BASE_PARAM_PATTERN = "[^/]+?";
  const BASE_PATH_PARSER_OPTIONS = {
    sensitive: false,
    strict: false,
    start: true,
    end: true
  };
  const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
  function tokensToParser(segments, extraOptions) {
    const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
    const score = [];
    let pattern = options.start ? "^" : "";
    const keys2 = [];
    for (const segment of segments) {
      const segmentScores = segment.length ? [] : [90];
      if (options.strict && !segment.length)
        pattern += "/";
      for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
        const token = segment[tokenIndex];
        let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
        if (token.type === 0) {
          if (!tokenIndex)
            pattern += "/";
          pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
          subSegmentScore += 40;
        } else if (token.type === 1) {
          const { value, repeatable, optional, regexp } = token;
          keys2.push({
            name: value,
            repeatable,
            optional
          });
          const re2 = regexp ? regexp : BASE_PARAM_PATTERN;
          if (re2 !== BASE_PARAM_PATTERN) {
            subSegmentScore += 10;
            try {
              new RegExp(`(${re2})`);
            } catch (err) {
              throw new Error(`Invalid custom RegExp for param "${value}" (${re2}): ` + err.message);
            }
          }
          let subPattern = repeatable ? `((?:${re2})(?:/(?:${re2}))*)` : `(${re2})`;
          if (!tokenIndex)
            subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
          if (optional)
            subPattern += "?";
          pattern += subPattern;
          subSegmentScore += 20;
          if (optional)
            subSegmentScore += -8;
          if (repeatable)
            subSegmentScore += -20;
          if (re2 === ".*")
            subSegmentScore += -50;
        }
        segmentScores.push(subSegmentScore);
      }
      score.push(segmentScores);
    }
    if (options.strict && options.end) {
      const i = score.length - 1;
      score[i][score[i].length - 1] += 0.7000000000000001;
    }
    if (!options.strict)
      pattern += "/?";
    if (options.end)
      pattern += "$";
    else if (options.strict)
      pattern += "(?:/|$)";
    const re = new RegExp(pattern, options.sensitive ? "" : "i");
    function parse(path) {
      const match = path.match(re);
      const params = {};
      if (!match)
        return null;
      for (let i = 1; i < match.length; i++) {
        const value = match[i] || "";
        const key = keys2[i - 1];
        params[key.name] = value && key.repeatable ? value.split("/") : value;
      }
      return params;
    }
    function stringify(params) {
      let path = "";
      let avoidDuplicatedSlash = false;
      for (const segment of segments) {
        if (!avoidDuplicatedSlash || !path.endsWith("/"))
          path += "/";
        avoidDuplicatedSlash = false;
        for (const token of segment) {
          if (token.type === 0) {
            path += token.value;
          } else if (token.type === 1) {
            const { value, repeatable, optional } = token;
            const param = value in params ? params[value] : "";
            if (Array.isArray(param) && !repeatable)
              throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
            const text = Array.isArray(param) ? param.join("/") : param;
            if (!text) {
              if (optional) {
                if (segment.length < 2 && segments.length > 1) {
                  if (path.endsWith("/"))
                    path = path.slice(0, -1);
                  else
                    avoidDuplicatedSlash = true;
                }
              } else
                throw new Error(`Missing required param "${value}"`);
            }
            path += text;
          }
        }
      }
      return path;
    }
    return {
      re,
      score,
      keys: keys2,
      parse,
      stringify
    };
  }
  function compareScoreArray(a, b) {
    let i = 0;
    while (i < a.length && i < b.length) {
      const diff = b[i] - a[i];
      if (diff)
        return diff;
      i++;
    }
    if (a.length < b.length) {
      return a.length === 1 && a[0] === 40 + 40 ? -1 : 1;
    } else if (a.length > b.length) {
      return b.length === 1 && b[0] === 40 + 40 ? 1 : -1;
    }
    return 0;
  }
  function comparePathParserScore(a, b) {
    let i = 0;
    const aScore = a.score;
    const bScore = b.score;
    while (i < aScore.length && i < bScore.length) {
      const comp = compareScoreArray(aScore[i], bScore[i]);
      if (comp)
        return comp;
      i++;
    }
    return bScore.length - aScore.length;
  }
  const ROOT_TOKEN = {
    type: 0,
    value: ""
  };
  const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
  function tokenizePath(path) {
    if (!path)
      return [[]];
    if (path === "/")
      return [[ROOT_TOKEN]];
    if (!path.startsWith("/")) {
      throw new Error(`Invalid path "${path}"`);
    }
    function crash(message) {
      throw new Error(`ERR (${state})/"${buffer}": ${message}`);
    }
    let state = 0;
    let previousState = state;
    const tokens = [];
    let segment;
    function finalizeSegment() {
      if (segment)
        tokens.push(segment);
      segment = [];
    }
    let i = 0;
    let char;
    let buffer = "";
    let customRe = "";
    function consumeBuffer() {
      if (!buffer)
        return;
      if (state === 0) {
        segment.push({
          type: 0,
          value: buffer
        });
      } else if (state === 1 || state === 2 || state === 3) {
        if (segment.length > 1 && (char === "*" || char === "+"))
          crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
        segment.push({
          type: 1,
          value: buffer,
          regexp: customRe,
          repeatable: char === "*" || char === "+",
          optional: char === "*" || char === "?"
        });
      } else {
        crash("Invalid state to consume buffer");
      }
      buffer = "";
    }
    function addCharToBuffer() {
      buffer += char;
    }
    while (i < path.length) {
      char = path[i++];
      if (char === "\\" && state !== 2) {
        previousState = state;
        state = 4;
        continue;
      }
      switch (state) {
        case 0:
          if (char === "/") {
            if (buffer) {
              consumeBuffer();
            }
            finalizeSegment();
          } else if (char === ":") {
            consumeBuffer();
            state = 1;
          } else {
            addCharToBuffer();
          }
          break;
        case 4:
          addCharToBuffer();
          state = previousState;
          break;
        case 1:
          if (char === "(") {
            state = 2;
          } else if (VALID_PARAM_RE.test(char)) {
            addCharToBuffer();
          } else {
            consumeBuffer();
            state = 0;
            if (char !== "*" && char !== "?" && char !== "+")
              i--;
          }
          break;
        case 2:
          if (char === ")") {
            if (customRe[customRe.length - 1] == "\\")
              customRe = customRe.slice(0, -1) + char;
            else
              state = 3;
          } else {
            customRe += char;
          }
          break;
        case 3:
          consumeBuffer();
          state = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i--;
          customRe = "";
          break;
        default:
          crash("Unknown state");
          break;
      }
    }
    if (state === 2)
      crash(`Unfinished custom RegExp for param "${buffer}"`);
    consumeBuffer();
    finalizeSegment();
    return tokens;
  }
  function createRouteRecordMatcher(record, parent, options) {
    const parser = tokensToParser(tokenizePath(record.path), options);
    const matcher = assign(parser, {
      record,
      parent,
      children: [],
      alias: []
    });
    if (parent) {
      if (!matcher.record.aliasOf === !parent.record.aliasOf)
        parent.children.push(matcher);
    }
    return matcher;
  }
  function createRouterMatcher(routes2, globalOptions) {
    const matchers = [];
    const matcherMap = /* @__PURE__ */ new Map();
    globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
    function getRecordMatcher(name) {
      return matcherMap.get(name);
    }
    function addRoute(record, parent, originalRecord) {
      const isRootAdd = !originalRecord;
      const mainNormalizedRecord = normalizeRouteRecord(record);
      mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
      const options = mergeOptions(globalOptions, record);
      const normalizedRecords = [
        mainNormalizedRecord
      ];
      if ("alias" in record) {
        const aliases2 = typeof record.alias === "string" ? [record.alias] : record.alias;
        for (const alias of aliases2) {
          normalizedRecords.push(assign({}, mainNormalizedRecord, {
            components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
            path: alias,
            aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
          }));
        }
      }
      let matcher;
      let originalMatcher;
      for (const normalizedRecord of normalizedRecords) {
        const { path } = normalizedRecord;
        if (parent && path[0] !== "/") {
          const parentPath = parent.record.path;
          const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
          normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
        }
        matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
        if (originalRecord) {
          originalRecord.alias.push(matcher);
        } else {
          originalMatcher = originalMatcher || matcher;
          if (originalMatcher !== matcher)
            originalMatcher.alias.push(matcher);
          if (isRootAdd && record.name && !isAliasRecord(matcher))
            removeRoute(record.name);
        }
        if ("children" in mainNormalizedRecord) {
          const children = mainNormalizedRecord.children;
          for (let i = 0; i < children.length; i++) {
            addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
          }
        }
        originalRecord = originalRecord || matcher;
        insertMatcher(matcher);
      }
      return originalMatcher ? () => {
        removeRoute(originalMatcher);
      } : noop;
    }
    function removeRoute(matcherRef) {
      if (isRouteName(matcherRef)) {
        const matcher = matcherMap.get(matcherRef);
        if (matcher) {
          matcherMap.delete(matcherRef);
          matchers.splice(matchers.indexOf(matcher), 1);
          matcher.children.forEach(removeRoute);
          matcher.alias.forEach(removeRoute);
        }
      } else {
        const index2 = matchers.indexOf(matcherRef);
        if (index2 > -1) {
          matchers.splice(index2, 1);
          if (matcherRef.record.name)
            matcherMap.delete(matcherRef.record.name);
          matcherRef.children.forEach(removeRoute);
          matcherRef.alias.forEach(removeRoute);
        }
      }
    }
    function getRoutes() {
      return matchers;
    }
    function insertMatcher(matcher) {
      let i = 0;
      while (i < matchers.length && comparePathParserScore(matcher, matchers[i]) >= 0 && (matcher.record.path !== matchers[i].record.path || !isRecordChildOf(matcher, matchers[i])))
        i++;
      matchers.splice(i, 0, matcher);
      if (matcher.record.name && !isAliasRecord(matcher))
        matcherMap.set(matcher.record.name, matcher);
    }
    function resolve(location2, currentLocation) {
      let matcher;
      let params = {};
      let path;
      let name;
      if ("name" in location2 && location2.name) {
        matcher = matcherMap.get(location2.name);
        if (!matcher)
          throw createRouterError(1, {
            location: location2
          });
        name = matcher.record.name;
        params = assign(paramsFromLocation(currentLocation.params, matcher.keys.filter((k) => !k.optional).map((k) => k.name)), location2.params);
        path = matcher.stringify(params);
      } else if ("path" in location2) {
        path = location2.path;
        matcher = matchers.find((m) => m.re.test(path));
        if (matcher) {
          params = matcher.parse(path);
          name = matcher.record.name;
        }
      } else {
        matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m) => m.re.test(currentLocation.path));
        if (!matcher)
          throw createRouterError(1, {
            location: location2,
            currentLocation
          });
        name = matcher.record.name;
        params = assign({}, currentLocation.params, location2.params);
        path = matcher.stringify(params);
      }
      const matched = [];
      let parentMatcher = matcher;
      while (parentMatcher) {
        matched.unshift(parentMatcher.record);
        parentMatcher = parentMatcher.parent;
      }
      return {
        name,
        path,
        params,
        matched,
        meta: mergeMetaFields(matched)
      };
    }
    routes2.forEach((route) => addRoute(route));
    return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher };
  }
  function paramsFromLocation(params, keys2) {
    const newParams = {};
    for (const key of keys2) {
      if (key in params)
        newParams[key] = params[key];
    }
    return newParams;
  }
  function normalizeRouteRecord(record) {
    return {
      path: record.path,
      redirect: record.redirect,
      name: record.name,
      meta: record.meta || {},
      aliasOf: void 0,
      beforeEnter: record.beforeEnter,
      props: normalizeRecordProps(record),
      children: record.children || [],
      instances: {},
      leaveGuards: /* @__PURE__ */ new Set(),
      updateGuards: /* @__PURE__ */ new Set(),
      enterCallbacks: {},
      components: "components" in record ? record.components || {} : { default: record.component }
    };
  }
  function normalizeRecordProps(record) {
    const propsObject = {};
    const props = record.props || false;
    if ("component" in record) {
      propsObject.default = props;
    } else {
      for (const name in record.components)
        propsObject[name] = typeof props === "boolean" ? props : props[name];
    }
    return propsObject;
  }
  function isAliasRecord(record) {
    while (record) {
      if (record.record.aliasOf)
        return true;
      record = record.parent;
    }
    return false;
  }
  function mergeMetaFields(matched) {
    return matched.reduce((meta2, record) => assign(meta2, record.meta), {});
  }
  function mergeOptions(defaults, partialOptions) {
    const options = {};
    for (const key in defaults) {
      options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
    }
    return options;
  }
  function isRecordChildOf(record, parent) {
    return parent.children.some((child) => child === record || isRecordChildOf(record, child));
  }
  const HASH_RE = /#/g;
  const AMPERSAND_RE = /&/g;
  const SLASH_RE = /\//g;
  const EQUAL_RE = /=/g;
  const IM_RE = /\?/g;
  const PLUS_RE = /\+/g;
  const ENC_BRACKET_OPEN_RE = /%5B/g;
  const ENC_BRACKET_CLOSE_RE = /%5D/g;
  const ENC_CARET_RE = /%5E/g;
  const ENC_BACKTICK_RE = /%60/g;
  const ENC_CURLY_OPEN_RE = /%7B/g;
  const ENC_PIPE_RE = /%7C/g;
  const ENC_CURLY_CLOSE_RE = /%7D/g;
  const ENC_SPACE_RE = /%20/g;
  function commonEncode(text) {
    return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
  }
  function encodeHash(text) {
    return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryValue(text) {
    return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryKey(text) {
    return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
  }
  function encodePath(text) {
    return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
  }
  function encodeParam(text) {
    return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
  }
  function decode(text) {
    try {
      return decodeURIComponent("" + text);
    } catch (err) {
    }
    return "" + text;
  }
  function parseQuery(search) {
    const query = {};
    if (search === "" || search === "?")
      return query;
    const hasLeadingIM = search[0] === "?";
    const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
    for (let i = 0; i < searchParams.length; ++i) {
      const searchParam = searchParams[i].replace(PLUS_RE, " ");
      const eqPos = searchParam.indexOf("=");
      const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
      const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
      if (key in query) {
        let currentValue = query[key];
        if (!Array.isArray(currentValue)) {
          currentValue = query[key] = [currentValue];
        }
        currentValue.push(value);
      } else {
        query[key] = value;
      }
    }
    return query;
  }
  function stringifyQuery(query) {
    let search = "";
    for (let key in query) {
      const value = query[key];
      key = encodeQueryKey(key);
      if (value == null) {
        if (value !== void 0) {
          search += (search.length ? "&" : "") + key;
        }
        continue;
      }
      const values = Array.isArray(value) ? value.map((v) => v && encodeQueryValue(v)) : [value && encodeQueryValue(value)];
      values.forEach((value2) => {
        if (value2 !== void 0) {
          search += (search.length ? "&" : "") + key;
          if (value2 != null)
            search += "=" + value2;
        }
      });
    }
    return search;
  }
  function normalizeQuery(query) {
    const normalizedQuery = {};
    for (const key in query) {
      const value = query[key];
      if (value !== void 0) {
        normalizedQuery[key] = Array.isArray(value) ? value.map((v) => v == null ? null : "" + v) : value == null ? value : "" + value;
      }
    }
    return normalizedQuery;
  }
  function useCallbacks() {
    let handlers = [];
    function add(handler) {
      handlers.push(handler);
      return () => {
        const i = handlers.indexOf(handler);
        if (i > -1)
          handlers.splice(i, 1);
      };
    }
    function reset() {
      handlers = [];
    }
    return {
      add,
      list: () => handlers,
      reset
    };
  }
  function registerGuard(record, name, guard) {
    const removeFromList = () => {
      record[name].delete(guard);
    };
    vue.onUnmounted(removeFromList);
    vue.onDeactivated(removeFromList);
    vue.onActivated(() => {
      record[name].add(guard);
    });
    record[name].add(guard);
  }
  function onBeforeRouteLeave(leaveGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "leaveGuards", leaveGuard);
  }
  function onBeforeRouteUpdate(updateGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "updateGuards", updateGuard);
  }
  function guardToPromiseFn(guard, to, from, record, name) {
    const enterCallbackArray = record && (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
    return () => new Promise((resolve, reject) => {
      const next = (valid) => {
        if (valid === false)
          reject(createRouterError(4, {
            from,
            to
          }));
        else if (valid instanceof Error) {
          reject(valid);
        } else if (isRouteLocation(valid)) {
          reject(createRouterError(2, {
            from: to,
            to: valid
          }));
        } else {
          if (enterCallbackArray && record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function")
            enterCallbackArray.push(valid);
          resolve();
        }
      };
      const guardReturn = guard.call(record && record.instances[name], to, from, next);
      let guardCall = Promise.resolve(guardReturn);
      if (guard.length < 3)
        guardCall = guardCall.then(next);
      guardCall.catch((err) => reject(err));
    });
  }
  function extractComponentsGuards(matched, guardType, to, from) {
    const guards = [];
    for (const record of matched) {
      for (const name in record.components) {
        let rawComponent = record.components[name];
        if (guardType !== "beforeRouteEnter" && !record.instances[name])
          continue;
        if (isRouteComponent(rawComponent)) {
          const options = rawComponent.__vccOpts || rawComponent;
          const guard = options[guardType];
          guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
        } else {
          let componentPromise = rawComponent();
          guards.push(() => componentPromise.then((resolved) => {
            if (!resolved)
              return Promise.reject(new Error(`Couldn't resolve component "${name}" at "${record.path}"`));
            const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
            record.components[name] = resolvedComponent;
            const options = resolvedComponent.__vccOpts || resolvedComponent;
            const guard = options[guardType];
            return guard && guardToPromiseFn(guard, to, from, record, name)();
          }));
        }
      }
    }
    return guards;
  }
  function isRouteComponent(component) {
    return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
  }
  function useLink2(props) {
    const router = vue.inject(routerKey);
    const currentRoute = vue.inject(routeLocationKey);
    const route = vue.computed(() => router.resolve(vue.unref(props.to)));
    const activeRecordIndex = vue.computed(() => {
      const { matched } = route.value;
      const { length } = matched;
      const routeMatched = matched[length - 1];
      const currentMatched = currentRoute.matched;
      if (!routeMatched || !currentMatched.length)
        return -1;
      const index2 = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
      if (index2 > -1)
        return index2;
      const parentRecordPath = getOriginalPath(matched[length - 2]);
      return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index2;
    });
    const isActive = vue.computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
    const isExactActive = vue.computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
    function navigate(e = {}) {
      if (guardEvent(e)) {
        return router[vue.unref(props.replace) ? "replace" : "push"](vue.unref(props.to)).catch(noop);
      }
      return Promise.resolve();
    }
    return {
      route,
      href: vue.computed(() => route.value.href),
      isActive,
      isExactActive,
      navigate
    };
  }
  const RouterLinkImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterLink",
    props: {
      to: {
        type: [String, Object],
        required: true
      },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: {
        type: String,
        default: "page"
      }
    },
    useLink: useLink2,
    setup(props, { slots }) {
      const link = vue.reactive(useLink2(props));
      const { options } = vue.inject(routerKey);
      const elClass = vue.computed(() => ({
        [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
        [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
      }));
      return () => {
        const children = slots.default && slots.default(link);
        return props.custom ? children : vue.h("a", {
          "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          onClick: link.navigate,
          class: elClass.value
        }, children);
      };
    }
  });
  const RouterLink = RouterLinkImpl;
  function guardEvent(e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      return;
    if (e.defaultPrevented)
      return;
    if (e.button !== void 0 && e.button !== 0)
      return;
    if (e.currentTarget && e.currentTarget.getAttribute) {
      const target = e.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(target))
        return;
    }
    if (e.preventDefault)
      e.preventDefault();
    return true;
  }
  function includesParams(outer, inner) {
    for (const key in inner) {
      const innerValue = inner[key];
      const outerValue = outer[key];
      if (typeof innerValue === "string") {
        if (innerValue !== outerValue)
          return false;
      } else {
        if (!Array.isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value !== outerValue[i]))
          return false;
      }
    }
    return true;
  }
  function getOriginalPath(record) {
    return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
  }
  const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
  const RouterViewImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterView",
    inheritAttrs: false,
    props: {
      name: {
        type: String,
        default: "default"
      },
      route: Object
    },
    compatConfig: { MODE: 3 },
    setup(props, { attrs, slots }) {
      const injectedRoute = vue.inject(routerViewLocationKey);
      const routeToDisplay = vue.computed(() => props.route || injectedRoute.value);
      const depth = vue.inject(viewDepthKey, 0);
      const matchedRouteRef = vue.computed(() => routeToDisplay.value.matched[depth]);
      vue.provide(viewDepthKey, depth + 1);
      vue.provide(matchedRouteKey, matchedRouteRef);
      vue.provide(routerViewLocationKey, routeToDisplay);
      const viewRef = vue.ref();
      vue.watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
        if (to) {
          to.instances[name] = instance;
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards;
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards;
            }
          }
        }
        if (instance && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
          (to.enterCallbacks[name] || []).forEach((callback) => callback(instance));
        }
      }, { flush: "post" });
      return () => {
        const route = routeToDisplay.value;
        const matchedRoute = matchedRouteRef.value;
        const ViewComponent = matchedRoute && matchedRoute.components[props.name];
        const currentName = props.name;
        if (!ViewComponent) {
          return normalizeSlot(slots.default, { Component: ViewComponent, route });
        }
        const routePropsOption = matchedRoute.props[props.name];
        const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
        const onVnodeUnmounted = (vnode) => {
          if (vnode.component.isUnmounted) {
            matchedRoute.instances[currentName] = null;
          }
        };
        const component = vue.h(ViewComponent, assign({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef
        }));
        return normalizeSlot(slots.default, { Component: component, route }) || component;
      };
    }
  });
  function normalizeSlot(slot, data) {
    if (!slot)
      return null;
    const slotContent = slot(data);
    return slotContent.length === 1 ? slotContent[0] : slotContent;
  }
  const RouterView = RouterViewImpl;
  function createRouter(options) {
    const matcher = createRouterMatcher(options.routes, options);
    const parseQuery$1 = options.parseQuery || parseQuery;
    const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
    const routerHistory = options.history;
    const beforeGuards = useCallbacks();
    const beforeResolveGuards = useCallbacks();
    const afterGuards = useCallbacks();
    const currentRoute = vue.shallowRef(START_LOCATION_NORMALIZED);
    let pendingLocation = START_LOCATION_NORMALIZED;
    const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
    const encodeParams = applyToParams.bind(null, encodeParam);
    const decodeParams = applyToParams.bind(null, decode);
    function addRoute(parentOrRoute, route) {
      let parent;
      let record;
      if (isRouteName(parentOrRoute)) {
        parent = matcher.getRecordMatcher(parentOrRoute);
        record = route;
      } else {
        record = parentOrRoute;
      }
      return matcher.addRoute(record, parent);
    }
    function removeRoute(name) {
      const recordMatcher = matcher.getRecordMatcher(name);
      if (recordMatcher) {
        matcher.removeRoute(recordMatcher);
      }
    }
    function getRoutes() {
      return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
    }
    function hasRoute(name) {
      return !!matcher.getRecordMatcher(name);
    }
    function resolve(rawLocation, currentLocation) {
      currentLocation = assign({}, currentLocation || currentRoute.value);
      if (typeof rawLocation === "string") {
        const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
        const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
        const href2 = routerHistory.createHref(locationNormalized.fullPath);
        return assign(locationNormalized, matchedRoute2, {
          params: decodeParams(matchedRoute2.params),
          hash: decode(locationNormalized.hash),
          redirectedFrom: void 0,
          href: href2
        });
      }
      let matcherLocation;
      if ("path" in rawLocation) {
        matcherLocation = assign({}, rawLocation, {
          path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
        });
      } else {
        const targetParams = assign({}, rawLocation.params);
        for (const key in targetParams) {
          if (targetParams[key] == null) {
            delete targetParams[key];
          }
        }
        matcherLocation = assign({}, rawLocation, {
          params: encodeParams(rawLocation.params)
        });
        currentLocation.params = encodeParams(currentLocation.params);
      }
      const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
      const hash = rawLocation.hash || "";
      matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
      const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path
      }));
      const href = routerHistory.createHref(fullPath);
      return assign({
        fullPath,
        hash,
        query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
      }, matchedRoute, {
        redirectedFrom: void 0,
        href
      });
    }
    function locationAsObject(to) {
      return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
    }
    function checkCanceledNavigation(to, from) {
      if (pendingLocation !== to) {
        return createRouterError(8, {
          from,
          to
        });
      }
    }
    function push(to) {
      return pushWithRedirect(to);
    }
    function replace2(to) {
      return push(assign(locationAsObject(to), { replace: true }));
    }
    function handleRedirectRecord(to) {
      const lastMatched = to.matched[to.matched.length - 1];
      if (lastMatched && lastMatched.redirect) {
        const { redirect } = lastMatched;
        let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
        if (typeof newTargetLocation === "string") {
          newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
          newTargetLocation.params = {};
        }
        return assign({
          query: to.query,
          hash: to.hash,
          params: to.params
        }, newTargetLocation);
      }
    }
    function pushWithRedirect(to, redirectedFrom) {
      const targetLocation = pendingLocation = resolve(to);
      const from = currentRoute.value;
      const data = to.state;
      const force = to.force;
      const replace3 = to.replace === true;
      const shouldRedirect = handleRedirectRecord(targetLocation);
      if (shouldRedirect)
        return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace: replace3
        }), redirectedFrom || targetLocation);
      const toLocation = targetLocation;
      toLocation.redirectedFrom = redirectedFrom;
      let failure;
      if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
        failure = createRouterError(16, { to: toLocation, from });
        handleScroll();
      }
      return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? isNavigationFailure(error, 2) ? error : markAsReady(error) : triggerError(error, toLocation, from)).then((failure2) => {
        if (failure2) {
          if (isNavigationFailure(failure2, 2)) {
            return pushWithRedirect(assign(locationAsObject(failure2.to), {
              state: data,
              force,
              replace: replace3
            }), redirectedFrom || toLocation);
          }
        } else {
          failure2 = finalizeNavigation(toLocation, from, true, replace3, data);
        }
        triggerAfterEach(toLocation, from, failure2);
        return failure2;
      });
    }
    function checkCanceledNavigationAndReject(to, from) {
      const error = checkCanceledNavigation(to, from);
      return error ? Promise.reject(error) : Promise.resolve();
    }
    function navigate(to, from) {
      let guards;
      const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
      guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
      for (const record of leavingRecords) {
        record.leaveGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards).then(() => {
        guards = [];
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
        for (const record of updatingRecords) {
          record.updateGuards.forEach((guard) => {
            guards.push(guardToPromiseFn(guard, to, from));
          });
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const record of to.matched) {
          if (record.beforeEnter && !from.matched.includes(record)) {
            if (Array.isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter)
                guards.push(guardToPromiseFn(beforeEnter, to, from));
            } else {
              guards.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        to.matched.forEach((record) => record.enterCallbacks = {});
        guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from);
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).catch((err) => isNavigationFailure(err, 8) ? err : Promise.reject(err));
    }
    function triggerAfterEach(to, from, failure) {
      for (const guard of afterGuards.list())
        guard(to, from, failure);
    }
    function finalizeNavigation(toLocation, from, isPush, replace3, data) {
      const error = checkCanceledNavigation(toLocation, from);
      if (error)
        return error;
      const isFirstNavigation = from === START_LOCATION_NORMALIZED;
      const state = {};
      if (isPush) {
        if (replace3 || isFirstNavigation)
          routerHistory.replace(toLocation.fullPath, assign({
            scroll: isFirstNavigation && state && state.scroll
          }, data));
        else
          routerHistory.push(toLocation.fullPath, data);
      }
      currentRoute.value = toLocation;
      handleScroll();
      markAsReady();
    }
    let removeHistoryListener;
    function setupListeners() {
      if (removeHistoryListener)
        return;
      removeHistoryListener = routerHistory.listen((to, _from, info) => {
        const toLocation = resolve(to);
        const shouldRedirect = handleRedirectRecord(toLocation);
        if (shouldRedirect) {
          pushWithRedirect(assign(shouldRedirect, { replace: true }), toLocation).catch(noop);
          return;
        }
        pendingLocation = toLocation;
        const from = currentRoute.value;
        navigate(toLocation, from).catch((error) => {
          if (isNavigationFailure(error, 4 | 8)) {
            return error;
          }
          if (isNavigationFailure(error, 2)) {
            pushWithRedirect(error.to, toLocation).then((failure) => {
              if (isNavigationFailure(failure, 4 | 16) && !info.delta && info.type === NavigationType.pop) {
                routerHistory.go(-1, false);
              }
            }).catch(noop);
            return Promise.reject();
          }
          if (info.delta)
            routerHistory.go(-info.delta, false);
          return triggerError(error, toLocation, from);
        }).then((failure) => {
          failure = failure || finalizeNavigation(toLocation, from, false);
          if (failure) {
            if (info.delta) {
              routerHistory.go(-info.delta, false);
            } else if (info.type === NavigationType.pop && isNavigationFailure(failure, 4 | 16)) {
              routerHistory.go(-1, false);
            }
          }
          triggerAfterEach(toLocation, from, failure);
        }).catch(noop);
      });
    }
    let readyHandlers = useCallbacks();
    let errorHandlers = useCallbacks();
    let ready;
    function triggerError(error, to, from) {
      markAsReady(error);
      const list = errorHandlers.list();
      if (list.length) {
        list.forEach((handler) => handler(error, to, from));
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
    function isReady() {
      if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
        return Promise.resolve();
      return new Promise((resolve2, reject) => {
        readyHandlers.add([resolve2, reject]);
      });
    }
    function markAsReady(err) {
      if (!ready) {
        ready = !err;
        setupListeners();
        readyHandlers.list().forEach(([resolve2, reject]) => err ? reject(err) : resolve2());
        readyHandlers.reset();
      }
      return err;
    }
    function handleScroll(to, from, isPush, isFirstNavigation) {
      return Promise.resolve();
    }
    const go = (delta2) => routerHistory.go(delta2);
    const installedApps = /* @__PURE__ */ new Set();
    const router = {
      currentRoute,
      addRoute,
      removeRoute,
      hasRoute,
      getRoutes,
      resolve,
      options,
      push,
      replace: replace2,
      go,
      back: () => go(-1),
      forward: () => go(1),
      beforeEach: beforeGuards.add,
      beforeResolve: beforeResolveGuards.add,
      afterEach: afterGuards.add,
      onError: errorHandlers.add,
      isReady,
      install(app) {
        const router2 = this;
        app.component("RouterLink", RouterLink);
        app.component("RouterView", RouterView);
        app.config.globalProperties.$router = router2;
        Object.defineProperty(app.config.globalProperties, "$route", {
          enumerable: true,
          get: () => vue.unref(currentRoute)
        });
        const reactiveRoute = {};
        for (const key in START_LOCATION_NORMALIZED) {
          reactiveRoute[key] = vue.computed(() => currentRoute.value[key]);
        }
        app.provide(routerKey, router2);
        app.provide(routeLocationKey, vue.reactive(reactiveRoute));
        app.provide(routerViewLocationKey, currentRoute);
        const unmountApp = app.unmount;
        installedApps.add(app);
        app.unmount = function() {
          installedApps.delete(app);
          if (installedApps.size < 1) {
            pendingLocation = START_LOCATION_NORMALIZED;
            removeHistoryListener && removeHistoryListener();
            removeHistoryListener = null;
            currentRoute.value = START_LOCATION_NORMALIZED;
            ready = false;
          }
          unmountApp();
        };
      }
    };
    return router;
  }
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
  }
  function extractChangingRecords(to, from) {
    const leavingRecords = [];
    const updatingRecords = [];
    const enteringRecords = [];
    const len = Math.max(from.matched.length, to.matched.length);
    for (let i = 0; i < len; i++) {
      const recordFrom = from.matched[i];
      if (recordFrom) {
        if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
          updatingRecords.push(recordFrom);
        else
          leavingRecords.push(recordFrom);
      }
      const recordTo = to.matched[i];
      if (recordTo) {
        if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
          enteringRecords.push(recordTo);
        }
      }
    }
    return [leavingRecords, updatingRecords, enteringRecords];
  }
  function useRouter2() {
    return vue.inject(routerKey);
  }
  function useRoute2() {
    return vue.inject(routeLocationKey);
  }
  exports.RouterLink = RouterLink;
  exports.RouterView = RouterView;
  exports.START_LOCATION = START_LOCATION_NORMALIZED;
  exports.createMemoryHistory = createMemoryHistory;
  exports.createRouter = createRouter;
  exports.createRouterMatcher = createRouterMatcher;
  exports.createWebHashHistory = createWebHashHistory;
  exports.createWebHistory = createWebHistory;
  exports.isNavigationFailure = isNavigationFailure;
  exports.matchedRouteKey = matchedRouteKey;
  exports.onBeforeRouteLeave = onBeforeRouteLeave;
  exports.onBeforeRouteUpdate = onBeforeRouteUpdate;
  exports.parseQuery = parseQuery;
  exports.routeLocationKey = routeLocationKey;
  exports.routerKey = routerKey;
  exports.routerViewLocationKey = routerViewLocationKey;
  exports.stringifyQuery = stringifyQuery;
  exports.useLink = useLink2;
  exports.useRoute = useRoute2;
  exports.useRouter = useRouter2;
  exports.viewDepthKey = viewDepthKey;
})(vueRouter_cjs_prod);
const useState = (key, init) => {
  const nuxt = useNuxtApp();
  const state = vue_cjs_prod.toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (vue_cjs_prod.isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
};
const useError = () => {
  const nuxtApp = useNuxtApp();
  return useState("error", () => nuxtApp.ssrContext.error);
};
const throwError = (_err) => {
  const nuxtApp = useNuxtApp();
  useError();
  const err = typeof _err === "string" ? new Error(_err) : _err;
  nuxtApp.callHook("app:error", err);
  {
    nuxtApp.ssrContext.error = nuxtApp.ssrContext.error || err;
  }
  return err;
};
const MIMES = {
  html: "text/html",
  json: "application/json"
};
const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data);
      resolve(void 0);
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", type);
  }
}
function sendRedirect(event, location2, code = 302) {
  event.res.statusCode = code;
  event.res.setHeader("Location", location2);
  return send(event, "Redirecting to " + location2, MIMES.html);
}
class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.statusMessage = "H3Error";
  }
}
function createError(input) {
  var _a;
  if (input instanceof H3Error) {
    return input;
  }
  const err = new H3Error((_a = input.message) != null ? _a : input.statusMessage);
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  }
  if (input.data) {
    err.data = input.data;
  }
  return err;
}
const useRouter$1 = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  return useNuxtApp()._route;
};
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};
const navigateTo = (to, options = {}) => {
  if (!to) {
    to = "/";
  }
  if (isProcessingMiddleware()) {
    return to;
  }
  const router = useRouter$1();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = router.resolve(to).fullPath || "/";
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, options.redirectCode || 301));
    }
  }
  return options.replace ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const checkPropConflicts = (props, main2, sub) => {
  };
  return vue_cjs_prod.defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter$1();
      const to = vue_cjs_prod.computed(() => {
        checkPropConflicts();
        return props.to || props.href || "";
      });
      const isExternal = vue_cjs_prod.computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          return vue_cjs_prod.h(vue_cjs_prod.resolveComponent("RouterLink"), {
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue
          }, slots.default);
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        checkPropConflicts();
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        return vue_cjs_prod.h("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0$1 = defineNuxtLink({ componentName: "NuxtLink" });
var shared_cjs_prod = {};
Object.defineProperty(shared_cjs_prod, "__esModule", { value: true });
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const PatchFlagNames = {
  [1]: `TEXT`,
  [2]: `CLASS`,
  [4]: `STYLE`,
  [8]: `PROPS`,
  [16]: `FULL_PROPS`,
  [32]: `HYDRATE_EVENTS`,
  [64]: `STABLE_FRAGMENT`,
  [128]: `KEYED_FRAGMENT`,
  [256]: `UNKEYED_FRAGMENT`,
  [512]: `NEED_PATCH`,
  [1024]: `DYNAMIC_SLOTS`,
  [2048]: `DEV_ROOT_FRAGMENT`,
  [-1]: `HOISTED`,
  [-2]: `BAIL`
};
const slotFlagsText = {
  [1]: "STABLE",
  [2]: "DYNAMIC",
  [3]: "FORWARDED"
};
const GLOBALS_WHITE_LISTED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt";
const isGloballyWhitelisted = /* @__PURE__ */ makeMap(GLOBALS_WHITE_LISTED);
const range = 2;
function generateCodeFrame(source, start = 0, end = source.length) {
  let lines = source.split(/(\r?\n)/);
  const newlineSequences = lines.filter((_, idx) => idx % 2 === 1);
  lines = lines.filter((_, idx) => idx % 2 === 0);
  let count = 0;
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + (newlineSequences[i] && newlineSequences[i].length || 0);
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length)
          continue;
        const line = j + 1;
        res.push(`${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
        const lineLength = lines[j].length;
        const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
        if (j === i) {
          const pad = start - (count - (lineLength + newLineSeqLength));
          const length = Math.max(1, end > count ? lineLength - pad : end - start);
          res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`   |  ` + "^".repeat(length));
          }
          count += lineLength + newLineSeqLength;
        }
      }
      break;
    }
  }
  return res.join("\n");
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
const isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
const attrValidationCache = {};
function isSSRSafeAttrName(name) {
  if (attrValidationCache.hasOwnProperty(name)) {
    return attrValidationCache[name];
  }
  const isUnsafe = unsafeAttrCharRE.test(name);
  if (isUnsafe) {
    console.error(`unsafe attribute name: ${name}`);
  }
  return attrValidationCache[name] = !isUnsafe;
}
const propsToAttrMap = {
  acceptCharset: "accept-charset",
  className: "class",
  htmlFor: "for",
  httpEquiv: "http-equiv"
};
const isNoUnitNumericStyleProp = /* @__PURE__ */ makeMap(`animation-iteration-count,border-image-outset,border-image-slice,border-image-width,box-flex,box-flex-group,box-ordinal-group,column-count,columns,flex,flex-grow,flex-positive,flex-shrink,flex-negative,flex-order,grid-row,grid-row-end,grid-row-span,grid-row-start,grid-column,grid-column-end,grid-column-span,grid-column-start,font-weight,line-clamp,line-height,opacity,order,orphans,tab-size,widows,z-index,zoom,fill-opacity,flood-opacity,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-miterlimit,stroke-opacity,stroke-width`);
const isKnownHtmlAttr = /* @__PURE__ */ makeMap(`accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`);
const isKnownSvgAttr = /* @__PURE__ */ makeMap(`xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`);
function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString(value)) {
    return value;
  } else if (isObject$2(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function stringifyStyle(styles) {
  let ret = "";
  if (!styles || isString(styles)) {
    return ret;
  }
  for (const key in styles) {
    const value = styles[key];
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
    if (isString(value) || typeof value === "number" && isNoUnitNumericStyleProp(normalizedKey)) {
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$2(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
const isHTMLTag = /* @__PURE__ */ makeMap(HTML_TAGS);
const isSVGTag = /* @__PURE__ */ makeMap(SVG_TAGS);
const isVoidTag = /* @__PURE__ */ makeMap(VOID_TAGS);
const escapeRE = /["'&<>]/;
function escapeHtml(string) {
  const str = "" + string;
  const match = escapeRE.exec(str);
  if (!match) {
    return str;
  }
  let html = "";
  let escaped;
  let index2;
  let lastIndex = 0;
  for (index2 = match.index; index2 < str.length; index2++) {
    switch (str.charCodeAt(index2)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&#39;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index2) {
      html += str.slice(lastIndex, index2);
    }
    lastIndex = index2 + 1;
    html += escaped;
  }
  return lastIndex !== index2 ? html + str.slice(lastIndex, index2) : html;
}
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
function escapeHtmlComment(src) {
  return src.replace(commentStripRE, "");
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length)
    return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b)
    return true;
  let aValidType = isDate(a);
  let bValidType = isDate(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray(a);
  bValidType = isArray(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject$2(a);
  bValidType = isObject$2(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const toDisplayString = (val) => {
  return isString(val) ? val : val == null ? "" : isArray(val) || isObject$2(val) && (val.toString === objectToString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject$2(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => toTypeString(val) === "[object Date]";
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$2 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$2(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
const isBuiltInDirective = /* @__PURE__ */ makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
};
const toNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : {});
};
const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
function genPropsAccessExp(name) {
  return identRE.test(name) ? `__props.${name}` : `__props[${JSON.stringify(name)}]`;
}
shared_cjs_prod.EMPTY_ARR = EMPTY_ARR;
shared_cjs_prod.EMPTY_OBJ = EMPTY_OBJ;
shared_cjs_prod.NO = NO;
shared_cjs_prod.NOOP = NOOP;
shared_cjs_prod.PatchFlagNames = PatchFlagNames;
shared_cjs_prod.camelize = camelize;
shared_cjs_prod.capitalize = capitalize;
shared_cjs_prod.def = def;
shared_cjs_prod.escapeHtml = escapeHtml;
shared_cjs_prod.escapeHtmlComment = escapeHtmlComment;
shared_cjs_prod.extend = extend;
shared_cjs_prod.genPropsAccessExp = genPropsAccessExp;
shared_cjs_prod.generateCodeFrame = generateCodeFrame;
shared_cjs_prod.getGlobalThis = getGlobalThis;
shared_cjs_prod.hasChanged = hasChanged;
shared_cjs_prod.hasOwn = hasOwn;
shared_cjs_prod.hyphenate = hyphenate;
shared_cjs_prod.includeBooleanAttr = includeBooleanAttr;
shared_cjs_prod.invokeArrayFns = invokeArrayFns;
shared_cjs_prod.isArray = isArray;
shared_cjs_prod.isBooleanAttr = isBooleanAttr;
shared_cjs_prod.isBuiltInDirective = isBuiltInDirective;
shared_cjs_prod.isDate = isDate;
var isFunction_1 = shared_cjs_prod.isFunction = isFunction;
shared_cjs_prod.isGloballyWhitelisted = isGloballyWhitelisted;
shared_cjs_prod.isHTMLTag = isHTMLTag;
shared_cjs_prod.isIntegerKey = isIntegerKey;
shared_cjs_prod.isKnownHtmlAttr = isKnownHtmlAttr;
shared_cjs_prod.isKnownSvgAttr = isKnownSvgAttr;
shared_cjs_prod.isMap = isMap;
shared_cjs_prod.isModelListener = isModelListener;
shared_cjs_prod.isNoUnitNumericStyleProp = isNoUnitNumericStyleProp;
shared_cjs_prod.isObject = isObject$2;
shared_cjs_prod.isOn = isOn;
shared_cjs_prod.isPlainObject = isPlainObject;
shared_cjs_prod.isPromise = isPromise;
shared_cjs_prod.isReservedProp = isReservedProp;
shared_cjs_prod.isSSRSafeAttrName = isSSRSafeAttrName;
shared_cjs_prod.isSVGTag = isSVGTag;
shared_cjs_prod.isSet = isSet;
shared_cjs_prod.isSpecialBooleanAttr = isSpecialBooleanAttr;
shared_cjs_prod.isString = isString;
shared_cjs_prod.isSymbol = isSymbol;
shared_cjs_prod.isVoidTag = isVoidTag;
shared_cjs_prod.looseEqual = looseEqual;
shared_cjs_prod.looseIndexOf = looseIndexOf;
shared_cjs_prod.makeMap = makeMap;
shared_cjs_prod.normalizeClass = normalizeClass;
shared_cjs_prod.normalizeProps = normalizeProps;
shared_cjs_prod.normalizeStyle = normalizeStyle;
shared_cjs_prod.objectToString = objectToString;
shared_cjs_prod.parseStringStyle = parseStringStyle;
shared_cjs_prod.propsToAttrMap = propsToAttrMap;
shared_cjs_prod.remove = remove;
shared_cjs_prod.slotFlagsText = slotFlagsText;
shared_cjs_prod.stringifyStyle = stringifyStyle;
shared_cjs_prod.toDisplayString = toDisplayString;
shared_cjs_prod.toHandlerKey = toHandlerKey;
shared_cjs_prod.toNumber = toNumber;
shared_cjs_prod.toRawType = toRawType;
shared_cjs_prod.toTypeString = toTypeString;
function useHead(meta2) {
  const resolvedMeta = isFunction_1(meta2) ? vue_cjs_prod.computed(meta2) : meta2;
  useNuxtApp()._useHead(resolvedMeta);
}
const preload = defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.mixin({
    beforeCreate() {
      const { _registeredComponents } = this.$nuxt.ssrContext;
      const { __moduleIdentifier } = this.$options;
      _registeredComponents.add(__moduleIdentifier);
    }
  });
});
const components$1 = {};
function componentsPlugin_1f80df3c(nuxtApp) {
  for (const name in components$1) {
    nuxtApp.vueApp.component(name, components$1[name]);
    nuxtApp.vueApp.component("Lazy" + name, components$1[name]);
  }
}
var __defProp2 = Object.defineProperty;
var __defProps2 = Object.defineProperties;
var __getOwnPropDescs2 = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols2 = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum2 = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues2 = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp2.call(b, prop))
      __defNormalProp2(a, prop, b[prop]);
  if (__getOwnPropSymbols2)
    for (var prop of __getOwnPropSymbols2(b)) {
      if (__propIsEnum2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps2 = (a, b) => __defProps2(a, __getOwnPropDescs2(b));
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var createElement = (tag, attrs, document2) => {
  const el = document2.createElement(tag);
  for (const key of Object.keys(attrs)) {
    let value = attrs[key];
    if (key === "key" || value === false) {
      continue;
    }
    if (key === "children") {
      el.textContent = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
};
var htmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = htmlEscape(key);
    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var getTagKey = (props) => {
  const names = ["key", "id", "name", "property"];
  for (const n of names) {
    const value = typeof props.getAttribute === "function" ? props.hasAttribute(n) ? props.getAttribute(n) : void 0 : props[n];
    if (value !== void 0) {
      return { name: n, value };
    }
  }
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "htmlAttrs",
  "bodyAttrs"
];
var headObjToTags = (obj) => {
  const tags = [];
  for (const key of Object.keys(obj)) {
    if (obj[key] == null)
      continue;
    if (key === "title") {
      tags.push({ tag: key, props: { children: obj[key] } });
    } else if (key === "base") {
      tags.push({ tag: key, props: __spreadValues2({ key: "default" }, obj[key]) });
    } else if (acceptFields.includes(key)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          tags.push({ tag: key, props: item });
        });
      } else if (value) {
        tags.push({ tag: key, props: value });
      }
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys2 = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys2.push(key);
  }
  if (keys2.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys2.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document2 = window.document, type, tags) => {
  var _a;
  const head = document2.head;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldElements = [];
  if (headCountEl) {
    for (let i = 0, j = headCountEl.previousElementSibling; i < headCount; i++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_a = j == null ? void 0 : j.tagName) == null ? void 0 : _a.toLowerCase()) === type) {
        oldElements.push(j);
      }
    }
  } else {
    headCountEl = document2.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => createElement(tag.tag, tag.props, document2));
  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldElements.length; i++) {
      const oldEl = oldElements[i];
      if (isEqualNode(oldEl, newEl)) {
        oldElements.splice(i, 1);
        return false;
      }
    }
    return true;
  });
  oldElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  newElements.forEach((t) => {
    head.insertBefore(t, headCountEl);
  });
  headCountEl.setAttribute("content", "" + (headCount - oldElements.length + newElements.length));
};
var createHead = () => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  const head = {
    install(app) {
      app.config.globalProperties.$head = head;
      app.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(objs.value);
        tags.forEach((tag) => {
          if (tag.tag === "meta" || tag.tag === "base" || tag.tag === "script") {
            const key = getTagKey(tag.props);
            if (key) {
              let index2 = -1;
              for (let i = 0; i < deduped.length; i++) {
                const prev = deduped[i];
                const prevValue = prev.props[key.name];
                const nextValue = tag.props[key.name];
                if (prev.tag === tag.tag && prevValue === nextValue) {
                  index2 = i;
                  break;
                }
              }
              if (index2 !== -1) {
                deduped.splice(index2, 1);
              }
            }
          }
          deduped.push(tag);
        });
      });
      return deduped;
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document2 = window.document) {
      let title;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags) {
        if (tag.tag === "title") {
          title = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title !== void 0) {
        document2.title = title;
      }
      setAttrs(document2.documentElement, htmlAttrs);
      setAttrs(document2.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document2, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i) => previousTags.add(i));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}>`;
  }
  return `<${tag.tag}${attrs}>${tag.props.children || ""}</${tag.tag}>`;
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  for (const tag of head.headTags) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, htmlAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      }));
    },
    get bodyAttrs() {
      return stringifyAttrs(__spreadProps2(__spreadValues2({}, bodyAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      }));
    }
  };
};
function isObject$1(val) {
  return val !== null && typeof val === "object";
}
function _defu(baseObj, defaults, namespace = ".", merger) {
  if (!isObject$1(defaults)) {
    return _defu(baseObj, {}, namespace, merger);
  }
  const obj = Object.assign({}, defaults);
  for (const key in baseObj) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const val = baseObj[key];
    if (val === null || val === void 0) {
      continue;
    }
    if (merger && merger(obj, key, val, namespace)) {
      continue;
    }
    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = val.concat(obj[key]);
    } else if (isObject$1(val) && isObject$1(obj[key])) {
      obj[key] = _defu(val, obj[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
function createDefu(merger) {
  return (...args) => args.reduce((p, c) => _defu(p, c, "", merger), {});
}
const defu = createDefu();
const vueuseHead_5a9bcd9c = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    vue_cjs_prod.watchEffect(() => {
      head.updateDOM();
    });
  });
  const titleTemplate = vue_cjs_prod.ref();
  nuxtApp._useHead = (_meta) => {
    const meta2 = vue_cjs_prod.ref(_meta);
    if ("titleTemplate" in meta2.value) {
      titleTemplate.value = meta2.value.titleTemplate;
    }
    const headObj = vue_cjs_prod.computed(() => {
      const overrides = { meta: [] };
      if (titleTemplate.value && "title" in meta2.value) {
        overrides.title = typeof titleTemplate.value === "function" ? titleTemplate.value(meta2.value.title) : titleTemplate.value.replace(/%s/g, meta2.value.title);
      }
      if (meta2.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta2.value.charset });
      }
      if (meta2.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta2.value.viewport });
      }
      return defu(overrides, meta2.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => renderHeadToString(head);
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory(__spreadValues(__spreadValues({}, removeUndefinedProps(props)), ctx.attrs), ctx));
  return () => {
    var _a, _b;
    return renderChild ? (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = vue_cjs_prod.defineComponent({
  name: "Script",
  props: __spreadProps(__spreadValues({}, globalProps), {
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  }),
  setup: setupForUseMeta((script) => ({
    script: [script]
  }))
});
const Link = vue_cjs_prod.defineComponent({
  name: "Link",
  props: __spreadProps(__spreadValues({}, globalProps), {
    as: String,
    crossorigin: String,
    disabled: Boolean,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  }),
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = vue_cjs_prod.defineComponent({
  name: "Base",
  props: __spreadProps(__spreadValues({}, globalProps), {
    href: String,
    target: String
  }),
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = vue_cjs_prod.defineComponent({
  name: "Title",
  setup: setupForUseMeta((_, { slots }) => {
    var _a, _b, _c;
    const title = ((_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children) || null;
    return {
      title
    };
  })
});
const Meta = vue_cjs_prod.defineComponent({
  name: "Meta",
  props: __spreadProps(__spreadValues({}, globalProps), {
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  }),
  setup: setupForUseMeta((meta2) => ({
    meta: [meta2]
  }))
});
const Style = vue_cjs_prod.defineComponent({
  name: "Style",
  props: __spreadProps(__spreadValues({}, globalProps), {
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  }),
  setup: setupForUseMeta((props, { slots }) => {
    var _a, _b, _c;
    const style = __spreadValues({}, props);
    const textContent = (_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = vue_cjs_prod.defineComponent({
  name: "Head",
  setup: (_props, ctx) => () => {
    var _a, _b;
    return (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a);
  }
});
const Html = vue_cjs_prod.defineComponent({
  name: "Html",
  props: __spreadProps(__spreadValues({}, globalProps), {
    manifest: String,
    version: String,
    xmlns: String
  }),
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = vue_cjs_prod.defineComponent({
  name: "Body",
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Script,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
}, Symbol.toStringTag, { value: "Module" }));
const metaConfig = { "globalMeta": { "charset": "utf-8", "viewport": "width=device-width, initial-scale=1", "meta": [], "link": [], "style": [], "script": [] } };
const metaMixin = {
  created() {
    const instance = vue_cjs_prod.getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? vue_cjs_prod.computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const _630f84e0 = defineNuxtPlugin((nuxtApp) => {
  useHead(vue_cjs_prod.markRaw(metaConfig.globalMeta));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name in Components) {
    nuxtApp.vueApp.component(name, Components[name]);
  }
});
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey = (override, routeProps) => {
  var _a;
  const matchedRoute = routeProps.route.matched.find((m) => m.components.default === routeProps.Component.type);
  const source = (_a = override != null ? override : matchedRoute == null ? void 0 : matchedRoute.meta.key) != null ? _a : interpolatePath(routeProps.route, matchedRoute);
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
const Fragment = {
  setup(_props, { slots }) {
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots);
    };
  }
};
const _wrapIf = (component, props, slots) => {
  return { default: () => props ? vue_cjs_prod.h(component, props === true ? {} : props, slots) : vue_cjs_prod.h(Fragment, {}, slots) };
};
const isNestedKey = Symbol("isNested");
const NuxtPage = vue_cjs_prod.defineComponent({
  name: "NuxtPage",
  props: {
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props) {
    const nuxtApp = useNuxtApp();
    const isNested = vue_cjs_prod.inject(isNestedKey, false);
    vue_cjs_prod.provide(isNestedKey, true);
    return () => {
      return vue_cjs_prod.h(vueRouter_cjs_prod.RouterView, {}, {
        default: (routeProps) => {
          var _a;
          return routeProps.Component && _wrapIf(vue_cjs_prod.Transition, (_a = routeProps.route.meta.pageTransition) != null ? _a : defaultPageTransition, wrapInKeepAlive(routeProps.route.meta.keepalive, isNested && nuxtApp.isHydrating ? vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) : vue_cjs_prod.h(vue_cjs_prod.Suspense, {
            onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
            onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
          }, { default: () => vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) }))).default();
        }
      });
    };
  }
});
const defaultPageTransition = { name: "page", mode: "out-in" };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const meta = void 0;
const routes = [
  {
    name: "index",
    path: "/",
    file: "/workspace/alvasori2/pages/index.vue",
    children: [],
    meta,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return index$1;
    })
  }
];
const configRouterOptions = {};
const routerOptions = __spreadValues({}, configRouterOptions);
const globalMiddleware = [];
const namedMiddleware = {};
const _720e9498 = defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.vueApp.component("NuxtPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtNestedPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtChild", NuxtPage);
  const baseURL2 = useRuntimeConfig().app.baseURL;
  const routerHistory = vueRouter_cjs_prod.createMemoryHistory(baseURL2);
  const initialURL = nuxtApp.ssrContext.url;
  const router = vueRouter_cjs_prod.createRouter(__spreadProps(__spreadValues({}, routerOptions), {
    history: routerHistory,
    routes
  }));
  nuxtApp.vueApp.use(router);
  const previousRoute = vue_cjs_prod.shallowRef(router.currentRoute.value);
  router.afterEach((_to, from) => {
    previousRoute.value = from;
  });
  Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
    get: () => previousRoute.value
  });
  const route = {};
  for (const key in router.currentRoute.value) {
    route[key] = vue_cjs_prod.computed(() => router.currentRoute.value[key]);
  }
  const _activeRoute = vue_cjs_prod.shallowRef(router.resolve(initialURL));
  const syncCurrentRoute = () => {
    _activeRoute.value = router.currentRoute.value;
  };
  nuxtApp.hook("page:finish", syncCurrentRoute);
  router.afterEach((to, from) => {
    var _a, _b, _c, _d;
    if (((_b = (_a = to.matched[0]) == null ? void 0 : _a.components) == null ? void 0 : _b.default) === ((_d = (_c = from.matched[0]) == null ? void 0 : _c.components) == null ? void 0 : _d.default)) {
      syncCurrentRoute();
    }
  });
  const activeRoute = {};
  for (const key in _activeRoute.value) {
    activeRoute[key] = vue_cjs_prod.computed(() => _activeRoute.value[key]);
  }
  nuxtApp._route = vue_cjs_prod.reactive(route);
  nuxtApp._activeRoute = vue_cjs_prod.reactive(activeRoute);
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  useError();
  router.afterEach(async (to) => {
    if (to.matched.length === 0) {
      callWithNuxt(nuxtApp, throwError, [createError({
        statusCode: 404,
        statusMessage: `Page not found: ${to.fullPath}`
      })]);
    } else if (to.matched[0].name === "404" && nuxtApp.ssrContext) {
      nuxtApp.ssrContext.res.statusCode = 404;
    }
  });
  try {
    if (true) {
      await router.push(initialURL);
    }
    await router.isReady();
  } catch (error2) {
    callWithNuxt(nuxtApp, throwError, [error2]);
  }
  router.beforeEach(async (to, from) => {
    var _a;
    to.meta = vue_cjs_prod.reactive(to.meta);
    nuxtApp._processingMiddleware = true;
    const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
    for (const component of to.matched) {
      const componentMiddleware = component.meta.middleware;
      if (!componentMiddleware) {
        continue;
      }
      if (Array.isArray(componentMiddleware)) {
        for (const entry2 of componentMiddleware) {
          middlewareEntries.add(entry2);
        }
      } else {
        middlewareEntries.add(componentMiddleware);
      }
    }
    for (const entry2 of middlewareEntries) {
      const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_a = namedMiddleware[entry2]) == null ? void 0 : _a.call(namedMiddleware).then((r) => r.default || r)) : entry2;
      const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
      {
        if (result === false || result instanceof Error) {
          const error2 = result || createError({
            statusMessage: `Route navigation aborted: ${initialURL}`
          });
          return callWithNuxt(nuxtApp, throwError, [error2]);
        }
      }
      if (result || result === false) {
        return result;
      }
    }
  });
  router.afterEach(async (to) => {
    delete nuxtApp._processingMiddleware;
    {
      const currentURL = to.fullPath || "/";
      if (!isEqual(currentURL, initialURL)) {
        await callWithNuxt(nuxtApp, navigateTo, [currentURL]);
      }
    }
  });
  nuxtApp.hooks.hookOnce("app:created", async () => {
    try {
      await router.replace(__spreadProps(__spreadValues({}, router.resolve(initialURL)), {
        force: true
      }));
    } catch (error2) {
      callWithNuxt(nuxtApp, throwError, [error2]);
    }
  });
  return { provide: { router } };
});
function _classPrivateFieldInitSpec(obj, privateMap, value) {
  _checkPrivateRedeclaration(obj, privateMap);
  privateMap.set(obj, value);
}
function _checkPrivateRedeclaration(obj, privateCollection) {
  if (privateCollection.has(obj)) {
    throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
}
function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
  _classApplyDescriptorSet(receiver, descriptor, value);
  return value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }
    descriptor.value = value;
  }
}
function _classPrivateFieldGet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
  return _classApplyDescriptorGet(receiver, descriptor);
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to " + action + " private field on non-instance");
  }
  return privateMap.get(receiver);
}
function _classApplyDescriptorGet(receiver, descriptor) {
  if (descriptor.get) {
    return descriptor.get.call(receiver);
  }
  return descriptor.value;
}
function getNestedValue(obj, path, fallback) {
  const last = path.length - 1;
  if (last < 0)
    return obj === void 0 ? fallback : obj;
  for (let i = 0; i < last; i++) {
    if (obj == null) {
      return fallback;
    }
    obj = obj[path[i]];
  }
  if (obj == null)
    return fallback;
  return obj[path[last]] === void 0 ? fallback : obj[path[last]];
}
function deepEqual(a, b) {
  if (a === b)
    return true;
  if (a instanceof Date && b instanceof Date && a.getTime() !== b.getTime()) {
    return false;
  }
  if (a !== Object(a) || b !== Object(b)) {
    return false;
  }
  const props = Object.keys(a);
  if (props.length !== Object.keys(b).length) {
    return false;
  }
  return props.every((p) => deepEqual(a[p], b[p]));
}
function getObjectValueByPath(obj, path, fallback) {
  if (obj == null || !path || typeof path !== "string")
    return fallback;
  if (obj[path] !== void 0)
    return obj[path];
  path = path.replace(/\[(\w+)\]/g, ".$1");
  path = path.replace(/^\./, "");
  return getNestedValue(obj, path.split("."), fallback);
}
function getPropertyFromItem(item, property, fallback) {
  if (property == null)
    return item === void 0 ? fallback : item;
  if (item !== Object(item))
    return fallback;
  if (typeof property === "string")
    return getObjectValueByPath(item, property, fallback);
  if (Array.isArray(property))
    return getNestedValue(item, property, fallback);
  if (typeof property !== "function")
    return fallback;
  const value = property(item, fallback);
  return typeof value === "undefined" ? fallback : value;
}
function createRange(length) {
  let start = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  return Array.from({
    length
  }, (v, k) => start + k);
}
function convertToUnit(str) {
  let unit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "px";
  if (str == null || str === "") {
    return void 0;
  } else if (isNaN(+str)) {
    return String(str);
  } else if (!isFinite(+str)) {
    return void 0;
  } else {
    return `${Number(str)}${unit}`;
  }
}
function isObject(obj) {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}
function isComponentInstance(obj) {
  return obj == null ? void 0 : obj.$el;
}
const keyCodes = Object.freeze({
  enter: 13,
  tab: 9,
  delete: 46,
  esc: 27,
  space: 32,
  up: 38,
  down: 40,
  left: 37,
  right: 39,
  end: 35,
  home: 36,
  del: 46,
  backspace: 8,
  insert: 45,
  pageup: 33,
  pagedown: 34,
  shift: 16
});
const keyValues = Object.freeze({
  enter: "Enter",
  tab: "Tab",
  delete: "Delete",
  esc: "Escape",
  space: "Space",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  end: "End",
  home: "Home",
  del: "Delete",
  backspace: "Backspace",
  insert: "Insert",
  pageup: "PageUp",
  pagedown: "PageDown",
  shift: "Shift"
});
function keys(o) {
  return Object.keys(o);
}
function pick(obj, paths) {
  const found = /* @__PURE__ */ Object.create(null);
  const rest = /* @__PURE__ */ Object.create(null);
  for (const key in obj) {
    if (paths.some((path) => path instanceof RegExp ? path.test(key) : path === key)) {
      found[key] = obj[key];
    } else {
      rest[key] = obj[key];
    }
  }
  return [found, rest];
}
function filterInputAttrs(attrs) {
  return pick(attrs, ["class", "style", "id", /^data-/]);
}
function wrapInArray(v) {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
function clamp(value) {
  let min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
  let max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
  return Math.max(min, Math.min(max, value));
}
function padEnd(str, length) {
  let char = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "0";
  return str + char.repeat(Math.max(0, length - str.length));
}
function chunk(str) {
  let size = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
  const chunked = [];
  let index2 = 0;
  while (index2 < str.length) {
    chunked.push(str.substr(index2, size));
    index2 += size;
  }
  return chunked;
}
function humanReadableFileSize(bytes) {
  let base = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e3;
  if (bytes < base) {
    return `${bytes} B`;
  }
  const prefix = base === 1024 ? ["Ki", "Mi", "Gi"] : ["k", "M", "G"];
  let unit = -1;
  while (Math.abs(bytes) >= base && unit < prefix.length - 1) {
    bytes /= base;
    ++unit;
  }
  return `${bytes.toFixed(1)} ${prefix[unit]}B`;
}
function mergeDeep() {
  let source = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  let target = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  let arrayFn = arguments.length > 2 ? arguments[2] : void 0;
  const out = {};
  for (const key in source) {
    out[key] = source[key];
  }
  for (const key in target) {
    const sourceProperty = source[key];
    const targetProperty = target[key];
    if (isObject(sourceProperty) && isObject(targetProperty)) {
      out[key] = mergeDeep(sourceProperty, targetProperty, arrayFn);
      continue;
    }
    if (Array.isArray(sourceProperty) && Array.isArray(targetProperty) && arrayFn) {
      out[key] = arrayFn(sourceProperty, targetProperty);
      continue;
    }
    out[key] = targetProperty;
  }
  return out;
}
function getUid() {
  return getUid._uid++;
}
getUid._uid = 0;
function flattenFragments(nodes) {
  return nodes.map((node) => {
    if (node.type === vue_cjs_prod.Fragment) {
      return flattenFragments(node.children);
    } else {
      return node;
    }
  }).flat();
}
function toKebabCase() {
  let str = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
  return str.replace(/[^a-z]/gi, "-").replace(/\B([A-Z])/g, "-$1").toLowerCase();
}
function findChildrenWithProvide(key, vnode) {
  if (!vnode || typeof vnode !== "object")
    return [];
  if (Array.isArray(vnode)) {
    return vnode.map((child) => findChildrenWithProvide(key, child)).flat(1);
  } else if (Array.isArray(vnode.children)) {
    return vnode.children.map((child) => findChildrenWithProvide(key, child)).flat(1);
  } else if (vnode.component) {
    if (Object.getOwnPropertySymbols(vnode.component.provides).includes(key)) {
      return [vnode.component];
    } else if (vnode.component.subTree) {
      return findChildrenWithProvide(key, vnode.component.subTree).flat(1);
    }
  }
  return [];
}
var _arr = /* @__PURE__ */ new WeakMap();
var _pointer = /* @__PURE__ */ new WeakMap();
class CircularBuffer {
  constructor(size) {
    _classPrivateFieldInitSpec(this, _arr, {
      writable: true,
      value: []
    });
    _classPrivateFieldInitSpec(this, _pointer, {
      writable: true,
      value: 0
    });
    this.size = size;
  }
  push(val) {
    _classPrivateFieldGet(this, _arr)[_classPrivateFieldGet(this, _pointer)] = val;
    _classPrivateFieldSet(this, _pointer, (_classPrivateFieldGet(this, _pointer) + 1) % this.size);
  }
  values() {
    return _classPrivateFieldGet(this, _arr).slice(_classPrivateFieldGet(this, _pointer)).concat(_classPrivateFieldGet(this, _arr).slice(0, _classPrivateFieldGet(this, _pointer)));
  }
}
function getEventCoordinates(e) {
  if ("touches" in e) {
    return {
      clientX: e.touches[0].clientX,
      clientY: e.touches[0].clientY
    };
  }
  return {
    clientX: e.clientX,
    clientY: e.clientY
  };
}
const DefaultsSymbol = Symbol.for("vuetify:defaults");
function createDefaults(options) {
  return vue_cjs_prod.ref(options != null ? options : {});
}
function useDefaults() {
  const defaults = vue_cjs_prod.inject(DefaultsSymbol);
  if (!defaults)
    throw new Error("[Vuetify] Could not find defaults instance");
  return defaults;
}
function provideDefaults(defaults, options) {
  const injectedDefaults = useDefaults();
  const providedDefaults = vue_cjs_prod.ref(defaults);
  const newDefaults = vue_cjs_prod.computed(() => {
    const scoped = vue_cjs_prod.unref(options == null ? void 0 : options.scoped);
    const reset = vue_cjs_prod.unref(options == null ? void 0 : options.reset);
    const root = vue_cjs_prod.unref(options == null ? void 0 : options.root);
    let properties = mergeDeep(providedDefaults.value, {
      prev: injectedDefaults.value
    });
    if (scoped)
      return properties;
    if (reset || root) {
      const len = Number(reset || Infinity);
      for (let i = 0; i <= len; i++) {
        if (!properties.prev)
          break;
        properties = properties.prev;
      }
      return properties;
    }
    return mergeDeep(properties.prev, properties);
  });
  vue_cjs_prod.provide(DefaultsSymbol, newDefaults);
  return newDefaults;
}
function parseAnchor(anchor) {
  let [side, align] = anchor.split(" ");
  if (!align) {
    align = side === "top" || side === "bottom" ? "start" : side === "start" || side === "end" ? "top" : "center";
  }
  return {
    side,
    align
  };
}
function oppositeAnchor(anchor) {
  return {
    side: {
      center: "center",
      top: "bottom",
      bottom: "top",
      start: "end",
      end: "start"
    }[anchor.side],
    align: anchor.align
  };
}
function physicalAnchor(anchor, el) {
  var _map$side, _map$align;
  const {
    side,
    align
  } = anchor;
  const {
    direction
  } = window.getComputedStyle(el);
  const map = direction === "ltr" ? {
    start: "left",
    end: "right"
  } : {
    start: "right",
    end: "left"
  };
  return ((_map$side = map[side]) != null ? _map$side : side) + " " + ((_map$align = map[align]) != null ? _map$align : align);
}
class Box {
  constructor(_ref) {
    let {
      x,
      y,
      width,
      height
    } = _ref;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  get top() {
    return this.y;
  }
  get bottom() {
    return this.y + this.height;
  }
  get left() {
    return this.x;
  }
  get right() {
    return this.x + this.width;
  }
}
function nullifyTransforms(el) {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const tx = style.transform;
  if (tx) {
    let ta, sx, sy, dx, dy;
    if (tx.startsWith("matrix3d(")) {
      ta = tx.slice(9, -1).split(/, /);
      sx = +ta[0];
      sy = +ta[5];
      dx = +ta[12];
      dy = +ta[13];
    } else if (tx.startsWith("matrix(")) {
      ta = tx.slice(7, -1).split(/, /);
      sx = +ta[0];
      sy = +ta[3];
      dx = +ta[4];
      dy = +ta[5];
    } else {
      return new Box(rect);
    }
    const to = style.transformOrigin;
    const x = rect.x - dx - (1 - sx) * parseFloat(to);
    const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(" ") + 1));
    const w = sx ? rect.width / sx : el.offsetWidth;
    const h2 = sy ? rect.height / sy : el.offsetHeight;
    return new Box({
      x,
      y,
      width: w,
      height: h2
    });
  } else {
    return new Box(rect);
  }
}
function createMessage(message, vm, parent) {
  if (parent) {
    vm = {
      _isVue: true,
      $parent: parent,
      $options: vm
    };
  }
  if (vm) {
    vm.$_alreadyWarned = vm.$_alreadyWarned || [];
    if (vm.$_alreadyWarned.includes(message))
      return;
    vm.$_alreadyWarned.push(message);
  }
  return `[Vuetify] ${message}` + (vm ? generateComponentTrace(vm) : "");
}
function consoleWarn(message, vm, parent) {
  const newMessage = createMessage(message, vm, parent);
  newMessage != null && console.warn(newMessage);
}
function consoleError(message, vm, parent) {
  const newMessage = createMessage(message, vm, parent);
  newMessage != null && console.error(newMessage);
}
const classifyRE = /(?:^|[-_])(\w)/g;
const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
function formatComponentName(vm, includeFile) {
  if (vm.$root === vm) {
    return "<Root>";
  }
  const options = typeof vm === "function" && vm.cid != null ? vm.options : vm._isVue ? vm.$options || vm.constructor.options : vm || {};
  let name = options.name || options._componentTag;
  const file = options.__file;
  if (!name && file) {
    const match = file.match(/([^/\\]+)\.vue$/);
    name = match == null ? void 0 : match[1];
  }
  return (name ? `<${classify(name)}>` : `<Anonymous>`) + (file && includeFile !== false ? ` at ${file}` : "");
}
function generateComponentTrace(vm) {
  if (vm._isVue && vm.$parent) {
    const tree = [];
    let currentRecursiveSequence = 0;
    while (vm) {
      if (tree.length > 0) {
        const last = tree[tree.length - 1];
        if (last.constructor === vm.constructor) {
          currentRecursiveSequence++;
          vm = vm.$parent;
          continue;
        } else if (currentRecursiveSequence > 0) {
          tree[tree.length - 1] = [last, currentRecursiveSequence];
          currentRecursiveSequence = 0;
        }
      }
      tree.push(vm);
      vm = vm.$parent;
    }
    return "\n\nfound in\n\n" + tree.map((vm2, i) => `${i === 0 ? "---> " : " ".repeat(5 + i * 2)}${Array.isArray(vm2) ? `${formatComponentName(vm2[0])}... (${vm2[1]} recursive calls)` : formatComponentName(vm2)}`).join("\n");
  } else {
    return `

(found in ${formatComponentName(vm)})`;
  }
}
const srgbForwardMatrix = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.204, 1.057]];
const srgbForwardTransform = (C) => C <= 31308e-7 ? C * 12.92 : 1.055 * C ** (1 / 2.4) - 0.055;
const srgbReverseMatrix = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];
const srgbReverseTransform = (C) => C <= 0.04045 ? C / 12.92 : ((C + 0.055) / 1.055) ** 2.4;
function fromXYZ$1(xyz) {
  const rgb2 = Array(3);
  const transform2 = srgbForwardTransform;
  const matrix = srgbForwardMatrix;
  for (let i = 0; i < 3; ++i) {
    rgb2[i] = Math.round(clamp(transform2(matrix[i][0] * xyz[0] + matrix[i][1] * xyz[1] + matrix[i][2] * xyz[2])) * 255);
  }
  return (rgb2[0] << 16) + (rgb2[1] << 8) + (rgb2[2] << 0);
}
function toXYZ$1(rgb2) {
  const xyz = [0, 0, 0];
  const transform2 = srgbReverseTransform;
  const matrix = srgbReverseMatrix;
  const r = transform2((rgb2 >> 16 & 255) / 255);
  const g = transform2((rgb2 >> 8 & 255) / 255);
  const b = transform2((rgb2 >> 0 & 255) / 255);
  for (let i = 0; i < 3; ++i) {
    xyz[i] = matrix[i][0] * r + matrix[i][1] * g + matrix[i][2] * b;
  }
  return xyz;
}
const delta = 0.20689655172413793;
const cielabForwardTransform = (t) => t > delta ** 3 ? Math.cbrt(t) : t / (3 * delta ** 2) + 4 / 29;
const cielabReverseTransform = (t) => t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29);
function fromXYZ(xyz) {
  const transform2 = cielabForwardTransform;
  const transformedY = transform2(xyz[1]);
  return [116 * transformedY - 16, 500 * (transform2(xyz[0] / 0.95047) - transformedY), 200 * (transformedY - transform2(xyz[2] / 1.08883))];
}
function toXYZ(lab) {
  const transform2 = cielabReverseTransform;
  const Ln = (lab[0] + 16) / 116;
  return [transform2(Ln + lab[1] / 500) * 0.95047, transform2(Ln), transform2(Ln - lab[2] / 200) * 1.08883];
}
function isCssColor(color) {
  return !!color && /^(#|var\(--|(rgb|hsl)a?\()/.test(color);
}
function colorToInt(color) {
  let rgb2;
  if (typeof color === "number") {
    rgb2 = color;
  } else if (typeof color === "string") {
    let c = color.startsWith("#") ? color.substring(1) : color;
    if (c.length === 3) {
      c = c.split("").map((char) => char + char).join("");
    }
    if (c.length !== 6) {
      consoleWarn(`'${color}' is not a valid rgb color`);
    }
    rgb2 = parseInt(c, 16);
  } else {
    throw new TypeError(`Colors can only be numbers or strings, recieved ${color == null ? color : color.constructor.name} instead`);
  }
  if (rgb2 < 0) {
    consoleWarn(`Colors cannot be negative: '${color}'`);
    rgb2 = 0;
  } else if (rgb2 > 16777215 || isNaN(rgb2)) {
    consoleWarn(`'${color}' is not a valid rgb color`);
    rgb2 = 16777215;
  }
  return rgb2;
}
function intToHex(color) {
  let hexColor = color.toString(16);
  if (hexColor.length < 6)
    hexColor = "0".repeat(6 - hexColor.length) + hexColor;
  return "#" + hexColor;
}
function HSVAtoRGBA(hsva) {
  const {
    h: h2,
    s,
    v,
    a
  } = hsva;
  const f = (n) => {
    const k = (n + h2 / 60) % 6;
    return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  };
  const rgb2 = [f(5), f(3), f(1)].map((v2) => Math.round(v2 * 255));
  return {
    r: rgb2[0],
    g: rgb2[1],
    b: rgb2[2],
    a
  };
}
function RGBAtoHSVA(rgba2) {
  if (!rgba2)
    return {
      h: 0,
      s: 1,
      v: 1,
      a: 1
    };
  const r = rgba2.r / 255;
  const g = rgba2.g / 255;
  const b = rgba2.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h2 = 0;
  if (max !== min) {
    if (max === r) {
      h2 = 60 * (0 + (g - b) / (max - min));
    } else if (max === g) {
      h2 = 60 * (2 + (b - r) / (max - min));
    } else if (max === b) {
      h2 = 60 * (4 + (r - g) / (max - min));
    }
  }
  if (h2 < 0)
    h2 = h2 + 360;
  const s = max === 0 ? 0 : (max - min) / max;
  const hsv = [h2, s, max];
  return {
    h: hsv[0],
    s: hsv[1],
    v: hsv[2],
    a: rgba2.a
  };
}
function HSVAtoHSLA(hsva) {
  const {
    h: h2,
    s,
    v,
    a
  } = hsva;
  const l = v - v * s / 2;
  const sprime = l === 1 || l === 0 ? 0 : (v - l) / Math.min(l, 1 - l);
  return {
    h: h2,
    s: sprime,
    l,
    a
  };
}
function HSLAtoHSVA(hsl2) {
  const {
    h: h2,
    s,
    l,
    a
  } = hsl2;
  const v = l + s * Math.min(l, 1 - l);
  const sprime = v === 0 ? 0 : 2 - 2 * l / v;
  return {
    h: h2,
    s: sprime,
    v,
    a
  };
}
function RGBAtoCSS(rgba2) {
  return `rgba(${rgba2.r}, ${rgba2.g}, ${rgba2.b}, ${rgba2.a})`;
}
function HSVAtoCSS(hsva) {
  return RGBAtoCSS(HSVAtoRGBA(hsva));
}
function RGBAtoHex(rgba2) {
  const toHex = (v) => {
    const h2 = Math.round(v).toString(16);
    return ("00".substr(0, 2 - h2.length) + h2).toUpperCase();
  };
  return `#${[toHex(rgba2.r), toHex(rgba2.g), toHex(rgba2.b), toHex(Math.round(rgba2.a * 255))].join("")}`;
}
function HexToRGBA(hex2) {
  const rgba2 = chunk(hex2.slice(1), 2).map((c) => parseInt(c, 16));
  return {
    r: rgba2[0],
    g: rgba2[1],
    b: rgba2[2],
    a: Math.round(rgba2[3] / 255 * 100) / 100
  };
}
function HexToHSVA(hex2) {
  const rgb2 = HexToRGBA(hex2);
  return RGBAtoHSVA(rgb2);
}
function HSVAtoHex(hsva) {
  return RGBAtoHex(HSVAtoRGBA(hsva));
}
function parseHex(hex2) {
  if (hex2.startsWith("#")) {
    hex2 = hex2.slice(1);
  }
  hex2 = hex2.replace(/([^0-9a-f])/gi, "F");
  if (hex2.length === 3 || hex2.length === 4) {
    hex2 = hex2.split("").map((x) => x + x).join("");
  }
  if (hex2.length === 6) {
    hex2 = padEnd(hex2, 8, "F");
  } else {
    hex2 = padEnd(padEnd(hex2, 6), 8, "F");
  }
  return `#${hex2}`.toUpperCase().substr(0, 9);
}
function colorToRGB(color) {
  const int = colorToInt(color);
  return {
    r: (int & 16711680) >> 16,
    g: (int & 65280) >> 8,
    b: int & 255
  };
}
function lighten(value, amount) {
  const lab = fromXYZ(toXYZ$1(value));
  lab[0] = lab[0] + amount * 10;
  return fromXYZ$1(toXYZ(lab));
}
function darken(value, amount) {
  const lab = fromXYZ(toXYZ$1(value));
  lab[0] = lab[0] - amount * 10;
  return fromXYZ$1(toXYZ(lab));
}
function getLuma(color) {
  const rgb2 = colorToInt(color);
  return toXYZ$1(rgb2)[1];
}
function getContrast(first, second) {
  const l1 = getLuma(first);
  const l2 = getLuma(second);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}
function propIsDefined(vnode, prop) {
  var _vnode$props, _vnode$props2;
  return ((_vnode$props = vnode.props) == null ? void 0 : _vnode$props.hasOwnProperty(prop)) || ((_vnode$props2 = vnode.props) == null ? void 0 : _vnode$props2.hasOwnProperty(toKebabCase(prop)));
}
const defineComponent = function defineComponent2(options) {
  var _options$_setup;
  options._setup = (_options$_setup = options._setup) != null ? _options$_setup : options.setup;
  if (!options.name) {
    consoleWarn("The component is missing an explicit name, unable to generate default prop value");
    return options;
  }
  if (options._setup) {
    var _options$props;
    options.props = (_options$props = options.props) != null ? _options$props : {};
    options.props._as = String;
    options.setup = function setup(props, ctx) {
      const vm = vue_cjs_prod.getCurrentInstance();
      const defaults = useDefaults();
      const _subcomponentDefaults = vue_cjs_prod.shallowRef();
      const _props = vue_cjs_prod.shallowReactive(__spreadValues({}, vue_cjs_prod.toRaw(props)));
      vue_cjs_prod.watchEffect(() => {
        var _props$_as;
        const globalDefaults = defaults.value.global;
        const componentDefaults = defaults.value[(_props$_as = props._as) != null ? _props$_as : options.name];
        if (componentDefaults) {
          const subComponents = Object.entries(componentDefaults).filter((_ref) => {
            let [key] = _ref;
            return key.startsWith("V");
          });
          if (subComponents.length)
            _subcomponentDefaults.value = Object.fromEntries(subComponents);
        }
        for (const prop of Object.keys(props)) {
          let newVal;
          if (propIsDefined(vm.vnode, prop)) {
            newVal = props[prop];
          } else {
            var _ref2, _componentDefaults$pr;
            newVal = (_ref2 = (_componentDefaults$pr = componentDefaults == null ? void 0 : componentDefaults[prop]) != null ? _componentDefaults$pr : globalDefaults == null ? void 0 : globalDefaults[prop]) != null ? _ref2 : props[prop];
          }
          if (_props[prop] !== newVal) {
            _props[prop] = newVal;
          }
        }
      });
      const setupBindings = options._setup(_props, ctx);
      let scope;
      vue_cjs_prod.watch(_subcomponentDefaults, (val, oldVal) => {
        if (!val && scope)
          scope.stop();
        else if (val && !oldVal) {
          scope = vue_cjs_prod.effectScope();
          scope.run(() => {
            provideDefaults(val);
          });
        }
      }, {
        immediate: true
      });
      return setupBindings;
    };
  }
  return options;
};
function genericComponent() {
  let exposeDefaults = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : true;
  return (options) => (exposeDefaults ? defineComponent : vue_cjs_prod.defineComponent)(options);
}
function createSimpleFunctional(klass) {
  let tag = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "div";
  let name = arguments.length > 2 ? arguments[2] : void 0;
  return defineComponent({
    name: name != null ? name : vue_cjs_prod.capitalize(vue_cjs_prod.camelize(klass.replace(/__/g, "-"))),
    props: {
      tag: {
        type: String,
        default: tag
      }
    },
    setup(props, _ref) {
      let {
        slots
      } = _ref;
      return () => {
        var _slots$default;
        return vue_cjs_prod.h(props.tag, {
          class: klass
        }, (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots));
      };
    }
  });
}
function attachedRoot(node) {
  if (typeof node.getRootNode !== "function") {
    while (node.parentNode)
      node = node.parentNode;
    if (node !== document)
      return null;
    return document;
  }
  const root = node.getRootNode();
  if (root !== document && root.getRootNode({
    composed: true
  }) !== document)
    return null;
  return root;
}
const standardEasing = "cubic-bezier(0.4, 0, 0.2, 1)";
const deceleratedEasing = "cubic-bezier(0.0, 0, 0.2, 1)";
const acceleratedEasing = "cubic-bezier(0.4, 0, 1, 1)";
function getCurrentInstance(name, message) {
  const vm = vue_cjs_prod.getCurrentInstance();
  if (!vm) {
    throw new Error(`[Vuetify] ${name} ${message || "must be called from inside a setup function"}`);
  }
  return vm;
}
function getCurrentInstanceName() {
  var _getCurrentInstance$t;
  let name = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "composables";
  return toKebabCase((_getCurrentInstance$t = getCurrentInstance(name).type) == null ? void 0 : _getCurrentInstance$t.name);
}
function getScrollParent(el) {
  while (el) {
    if (hasScrollbar(el))
      return el;
    el = el.parentElement;
  }
  return document.scrollingElement;
}
function getScrollParents(el) {
  const elements = [];
  while (el) {
    if (hasScrollbar(el))
      elements.push(el);
    el = el.parentElement;
  }
  return elements;
}
function hasScrollbar(el) {
  if (!el || el.nodeType !== Node.ELEMENT_NODE)
    return false;
  const style = window.getComputedStyle(el);
  return style.overflowY === "scroll" || style.overflowY === "auto" && el.scrollHeight > el.clientHeight;
}
const IN_BROWSER = false;
const SUPPORTS_TOUCH = IN_BROWSER ;
function isFixedPosition(el) {
  while (el) {
    if (window.getComputedStyle(el).position === "fixed") {
      return true;
    }
    el = el.offsetParent;
  }
  return false;
}
function propsFactory(props, source) {
  return (defaults) => {
    return Object.keys(props).reduce((obj, prop) => {
      const isObjectDefinition = typeof props[prop] === "object" && props[prop] != null && !Array.isArray(props[prop]);
      const definition = isObjectDefinition ? props[prop] : {
        type: props[prop]
      };
      if (defaults && prop in defaults) {
        obj[prop] = __spreadProps(__spreadValues({}, definition), {
          default: defaults[prop]
        });
      } else {
        obj[prop] = definition;
      }
      if (source) {
        obj[prop].source = source;
      }
      return obj;
    }, {});
  };
}
function useRender(render) {
  const vm = getCurrentInstance("useRender");
  vm.render = render;
}
const DisplaySymbol = Symbol.for("vuetify:display");
const defaultDisplayOptions = {
  mobileBreakpoint: "lg",
  thresholds: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
    xxl: 2560
  }
};
const parseDisplayOptions = function() {
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : defaultDisplayOptions;
  return mergeDeep(defaultDisplayOptions, options);
};
function getClientWidth() {
  return 0;
}
function getClientHeight() {
  return 0;
}
function getPlatform() {
  const userAgent = "ssr";
  function match(regexp) {
    return Boolean(userAgent.match(regexp));
  }
  const android = match(/android/i);
  const ios = match(/iphone|ipad|ipod/i);
  const cordova = match(/cordova/i);
  const electron = match(/electron/i);
  const chrome = match(/chrome/i);
  const edge = match(/edge/i);
  const firefox = match(/firefox/i);
  const opera = match(/opera/i);
  const win = match(/win/i);
  const mac = match(/mac/i);
  const linux = match(/linux/i);
  const ssr = match(/ssr/i);
  return {
    android,
    ios,
    cordova,
    electron,
    chrome,
    edge,
    firefox,
    opera,
    win,
    mac,
    linux,
    touch: SUPPORTS_TOUCH,
    ssr
  };
}
function createDisplay(options) {
  const {
    thresholds,
    mobileBreakpoint
  } = parseDisplayOptions(options);
  const height = vue_cjs_prod.ref(getClientHeight());
  const platform = getPlatform();
  const state = vue_cjs_prod.reactive({});
  const width = vue_cjs_prod.ref(getClientWidth());
  vue_cjs_prod.watchEffect(() => {
    const xs = width.value < thresholds.sm;
    const sm = width.value < thresholds.md && !xs;
    const md = width.value < thresholds.lg && !(sm || xs);
    const lg = width.value < thresholds.xl && !(md || sm || xs);
    const xl = width.value < thresholds.xxl && !(lg || md || sm || xs);
    const xxl = width.value >= thresholds.xxl;
    const name = xs ? "xs" : sm ? "sm" : md ? "md" : lg ? "lg" : xl ? "xl" : "xxl";
    const breakpointValue = typeof mobileBreakpoint === "number" ? mobileBreakpoint : thresholds[mobileBreakpoint];
    const mobile = !platform.ssr ? width.value < breakpointValue : platform.android || platform.ios || platform.opera;
    state.xs = xs;
    state.sm = sm;
    state.md = md;
    state.lg = lg;
    state.xl = xl;
    state.xxl = xxl;
    state.smAndUp = !xs;
    state.mdAndUp = !(xs || sm);
    state.lgAndUp = !(xs || sm || md);
    state.xlAndUp = !(xs || sm || md || lg);
    state.smAndDown = !(md || lg || xl || xxl);
    state.mdAndDown = !(lg || xl || xxl);
    state.lgAndDown = !(xl || xxl);
    state.xlAndDown = !xxl;
    state.name = name;
    state.height = height.value;
    state.width = width.value;
    state.mobile = mobile;
    state.mobileBreakpoint = mobileBreakpoint;
    state.platform = platform;
    state.thresholds = thresholds;
  });
  return vue_cjs_prod.toRefs(state);
}
function useDisplay() {
  const display = vue_cjs_prod.inject(DisplaySymbol);
  if (!display)
    throw new Error("Could not find Vuetify display injection");
  return display;
}
const aliases = {
  collapse: "mdi-chevron-up",
  complete: "mdi-check",
  cancel: "mdi-close-circle",
  close: "mdi-close",
  delete: "mdi-close-circle",
  clear: "mdi-close-circle",
  success: "mdi-check-circle",
  info: "mdi-information",
  warning: "mdi-alert-circle",
  error: "mdi-close-circle",
  prev: "mdi-chevron-left",
  next: "mdi-chevron-right",
  checkboxOn: "mdi-checkbox-marked",
  checkboxOff: "mdi-checkbox-blank-outline",
  checkboxIndeterminate: "mdi-minus-box",
  delimiter: "mdi-circle",
  sort: "mdi-arrow-up",
  expand: "mdi-chevron-down",
  menu: "mdi-menu",
  subgroup: "mdi-menu-down",
  dropdown: "mdi-menu-down",
  radioOn: "mdi-radiobox-marked",
  radioOff: "mdi-radiobox-blank",
  edit: "mdi-pencil",
  ratingEmpty: "mdi-star-outline",
  ratingFull: "mdi-star",
  ratingHalf: "mdi-star-half-full",
  loading: "mdi-cached",
  first: "mdi-page-first",
  last: "mdi-page-last",
  unfold: "mdi-unfold-more-horizontal",
  file: "mdi-paperclip",
  plus: "mdi-plus",
  minus: "mdi-minus"
};
const mdi = {
  component: (props) => vue_cjs_prod.h(VClassIcon, __spreadProps(__spreadValues({}, props), {
    class: "mdi"
  }))
};
const IconValue = [String, Function, Object];
const IconSymbol = Symbol.for("vuetify:icons");
const makeIconProps = propsFactory({
  icon: {
    type: IconValue,
    required: true
  },
  tag: {
    type: String,
    required: true
  }
}, "icon");
const VComponentIcon = defineComponent({
  name: "VComponentIcon",
  props: makeIconProps(),
  setup(props) {
    return () => {
      return vue_cjs_prod.createVNode(props.tag, null, {
        default: () => [vue_cjs_prod.createVNode(props.icon, null, null)]
      });
    };
  }
});
const VSvgIcon = defineComponent({
  name: "VSvgIcon",
  inheritAttrs: false,
  props: makeIconProps(),
  setup(props, _ref) {
    let {
      attrs
    } = _ref;
    return () => {
      return vue_cjs_prod.createVNode(props.tag, vue_cjs_prod.mergeProps(attrs, {
        "style": null
      }), {
        default: () => [vue_cjs_prod.createVNode("svg", {
          "class": "v-icon__svg",
          "xmlns": "http://www.w3.org/2000/svg",
          "viewBox": "0 0 24 24",
          "role": "img",
          "aria-hidden": "true"
        }, [vue_cjs_prod.createVNode("path", {
          "d": props.icon
        }, null)])]
      });
    };
  }
});
const VLigatureIcon = defineComponent({
  name: "VLigatureIcon",
  props: makeIconProps(),
  setup(props) {
    return () => {
      return vue_cjs_prod.createVNode(props.tag, null, {
        default: () => [props.icon]
      });
    };
  }
});
const VClassIcon = defineComponent({
  name: "VClassIcon",
  props: makeIconProps(),
  setup(props) {
    return () => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": props.icon
      }, null);
    };
  }
});
const defaultSets = {
  svg: {
    component: VSvgIcon
  },
  class: {
    component: VClassIcon
  }
};
function createIcons(options) {
  return mergeDeep({
    defaultSet: "mdi",
    sets: __spreadProps(__spreadValues({}, defaultSets), {
      mdi
    }),
    aliases
  }, options);
}
const useIcon = (props) => {
  const icons = vue_cjs_prod.inject(IconSymbol);
  if (!icons)
    throw new Error("Missing Vuetify Icons provide!");
  const iconData = vue_cjs_prod.computed(() => {
    const iconAlias = vue_cjs_prod.isRef(props) ? props.value : props.icon;
    if (!iconAlias)
      throw new Error("Icon value is undefined or null");
    let icon = iconAlias;
    if (typeof iconAlias === "string" && iconAlias.includes("$")) {
      var _icons$aliases;
      icon = (_icons$aliases = icons.aliases) == null ? void 0 : _icons$aliases[iconAlias.slice(iconAlias.indexOf("$") + 1)];
    }
    if (!icon)
      throw new Error(`Could not find aliased icon "${iconAlias}"`);
    if (typeof icon !== "string") {
      return {
        component: VComponentIcon,
        icon
      };
    }
    const iconSetName = Object.keys(icons.sets).find((setName) => typeof icon === "string" && icon.startsWith(`${setName}:`));
    const iconName = iconSetName ? icon.slice(iconSetName.length + 1) : icon;
    const iconSet = icons.sets[iconSetName != null ? iconSetName : icons.defaultSet];
    return {
      component: iconSet.component,
      icon: iconName
    };
  });
  return {
    iconData
  };
};
const en = {
  badge: "Badge",
  close: "Close",
  dataIterator: {
    noResultsText: "No matching records found",
    loadingText: "Loading items..."
  },
  dataTable: {
    itemsPerPageText: "Rows per page:",
    ariaLabel: {
      sortDescending: "Sorted descending.",
      sortAscending: "Sorted ascending.",
      sortNone: "Not sorted.",
      activateNone: "Activate to remove sorting.",
      activateDescending: "Activate to sort descending.",
      activateAscending: "Activate to sort ascending."
    },
    sortBy: "Sort by"
  },
  dataFooter: {
    itemsPerPageText: "Items per page:",
    itemsPerPageAll: "All",
    nextPage: "Next page",
    prevPage: "Previous page",
    firstPage: "First page",
    lastPage: "Last page",
    pageText: "{0}-{1} of {2}"
  },
  datePicker: {
    itemsSelected: "{0} selected",
    nextMonthAriaLabel: "Next month",
    nextYearAriaLabel: "Next year",
    prevMonthAriaLabel: "Previous month",
    prevYearAriaLabel: "Previous year"
  },
  noDataText: "No data available",
  carousel: {
    prev: "Previous visual",
    next: "Next visual",
    ariaLabel: {
      delimiter: "Carousel slide {0} of {1}"
    }
  },
  calendar: {
    moreEvents: "{0} more"
  },
  fileInput: {
    counter: "{0} files",
    counterSize: "{0} files ({1} in total)"
  },
  timePicker: {
    am: "AM",
    pm: "PM"
  },
  pagination: {
    ariaLabel: {
      root: "Pagination Navigation",
      next: "Next page",
      previous: "Previous page",
      page: "Goto Page {0}",
      currentPage: "Page {0}, Current Page",
      first: "First page",
      last: "Last page"
    }
  },
  rating: {
    ariaLabel: {
      item: "Rating {0} of {1}"
    }
  }
};
const rtl = {
  af: false,
  ar: true,
  bg: false,
  ca: false,
  ckb: false,
  cs: false,
  de: false,
  el: false,
  en: false,
  es: false,
  et: false,
  fa: false,
  fi: false,
  fr: false,
  hr: false,
  hu: false,
  he: true,
  id: false,
  it: false,
  ja: false,
  ko: false,
  lv: false,
  lt: false,
  nl: false,
  no: false,
  pl: false,
  pt: false,
  ro: false,
  ru: false,
  sk: false,
  sl: false,
  srCyrl: false,
  srLatn: false,
  sv: false,
  th: false,
  tr: false,
  az: false,
  uk: false,
  vi: false,
  zhHans: false,
  zhHant: false
};
const RtlSymbol = Symbol.for("vuetify:rtl");
function createRtl(localeScope, options) {
  var _options$rtl, _options$defaultRtl;
  return createRtlScope({
    rtl: __spreadValues(__spreadValues({}, rtl), (_options$rtl = options == null ? void 0 : options.rtl) != null ? _options$rtl : {}),
    isRtl: vue_cjs_prod.ref((_options$defaultRtl = options == null ? void 0 : options.defaultRtl) != null ? _options$defaultRtl : false),
    rtlClasses: vue_cjs_prod.ref("")
  }, localeScope);
}
function createRtlScope(currentScope, localeScope, options) {
  const isRtl = vue_cjs_prod.computed(() => {
    if (typeof (options == null ? void 0 : options.rtl) === "boolean")
      return options.rtl;
    if (localeScope.current.value && currentScope.rtl.hasOwnProperty(localeScope.current.value)) {
      return currentScope.rtl[localeScope.current.value];
    }
    return currentScope.isRtl.value;
  });
  return {
    isRtl,
    rtl: currentScope.rtl,
    rtlClasses: vue_cjs_prod.computed(() => `v-locale--is-${isRtl.value ? "rtl" : "ltr"}`)
  };
}
function provideRtl(props, localeScope) {
  const currentScope = vue_cjs_prod.inject(RtlSymbol);
  if (!currentScope)
    throw new Error("[Vuetify] Could not find injected rtl instance");
  const newScope = createRtlScope(currentScope, localeScope, props);
  vue_cjs_prod.provide(RtlSymbol, newScope);
  return newScope;
}
function useRtl() {
  const currentScope = vue_cjs_prod.inject(RtlSymbol);
  if (!currentScope)
    throw new Error("[Vuetify] Could not find injected rtl instance");
  return currentScope;
}
const LocaleAdapterSymbol = Symbol.for("vuetify:locale-adapter");
const VuetifyLocaleSymbol = Symbol.for("vuetify:locale");
function provideLocale(props) {
  const adapter = vue_cjs_prod.inject(LocaleAdapterSymbol);
  if (!adapter)
    throw new Error("[Vuetify] Could not find injected locale adapter");
  return adapter.createScope(props);
}
function useLocale() {
  const adapter = vue_cjs_prod.inject(LocaleAdapterSymbol);
  if (!adapter)
    throw new Error("[Vuetify] Could not find injected locale adapter");
  return adapter.getScope();
}
function isLocaleAdapter(x) {
  return !!x && x.hasOwnProperty("getScope") && x.hasOwnProperty("createScope") && x.hasOwnProperty("createRoot");
}
function createLocale(app, options) {
  const adapter = isLocaleAdapter(options) ? options : createDefaultLocaleAdapter(options);
  const instance = adapter.createRoot(app);
  app == null ? void 0 : app.provide(RtlSymbol, createRtl(instance, options));
  return adapter;
}
const LANG_PREFIX = "$vuetify.";
const replace = (str, params) => {
  return str.replace(/\{(\d+)\}/g, (match, index2) => {
    return String(params[+index2]);
  });
};
const createTranslateFunction = (current, fallback, messages) => {
  return function(key) {
    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }
    if (!key.startsWith(LANG_PREFIX)) {
      return replace(key, params);
    }
    const shortKey = key.replace(LANG_PREFIX, "");
    const currentLocale = current.value && messages.value[current.value];
    const fallbackLocale = fallback.value && messages.value[fallback.value];
    let str = getObjectValueByPath(currentLocale, shortKey, null);
    if (!str) {
      consoleWarn(`Translation key "${key}" not found in "${current.value}", trying fallback locale`);
      str = getObjectValueByPath(fallbackLocale, shortKey, null);
    }
    if (!str) {
      consoleError(`Translation key "${key}" not found in fallback`);
      str = key;
    }
    if (typeof str !== "string") {
      consoleError(`Translation key "${key}" has a non-string value`);
      str = key;
    }
    return replace(str, params);
  };
};
function createNumberFunction(current, fallback) {
  return (value, options) => {
    const numberFormat = new Intl.NumberFormat([current.value, fallback.value], options);
    return numberFormat.format(value);
  };
}
function createDefaultLocaleAdapter(options) {
  const createScope = (options2) => {
    const current = vue_cjs_prod.ref(options2.current);
    const fallback = vue_cjs_prod.ref(options2.fallback);
    const messages = vue_cjs_prod.ref(options2.messages);
    return {
      current,
      fallback,
      messages,
      t: createTranslateFunction(current, fallback, messages),
      n: createNumberFunction(current, fallback)
    };
  };
  return {
    createRoot: (app) => {
      var _options$defaultLocal, _options$fallbackLoca, _options$messages;
      const rootScope = createScope({
        current: (_options$defaultLocal = options == null ? void 0 : options.defaultLocale) != null ? _options$defaultLocal : "en",
        fallback: (_options$fallbackLoca = options == null ? void 0 : options.fallbackLocale) != null ? _options$fallbackLoca : "en",
        messages: (_options$messages = options == null ? void 0 : options.messages) != null ? _options$messages : {
          en
        }
      });
      if (!app)
        throw new Error("[Vuetify] Could not find default app instance");
      app.provide(VuetifyLocaleSymbol, rootScope);
      return rootScope;
    },
    getScope: () => {
      const currentScope = vue_cjs_prod.inject(VuetifyLocaleSymbol);
      if (!currentScope)
        throw new Error("[Vuetify] Could not find injected locale instance");
      return currentScope;
    },
    createScope: (options2) => {
      const currentScope = vue_cjs_prod.inject(VuetifyLocaleSymbol);
      if (!currentScope)
        throw new Error("[Vuetify] Could not find injected locale instance");
      const newScope = createScope({
        current: vue_cjs_prod.computed(() => {
          var _options$locale;
          return (_options$locale = options2 == null ? void 0 : options2.locale) != null ? _options$locale : currentScope.current.value;
        }),
        fallback: vue_cjs_prod.computed(() => {
          var _options$locale2;
          return (_options$locale2 = options2 == null ? void 0 : options2.locale) != null ? _options$locale2 : currentScope.fallback.value;
        }),
        messages: vue_cjs_prod.computed(() => {
          var _options$messages2;
          return (_options$messages2 = options2 == null ? void 0 : options2.messages) != null ? _options$messages2 : currentScope.messages.value;
        })
      });
      vue_cjs_prod.provide(VuetifyLocaleSymbol, newScope);
      return newScope;
    }
  };
}
const mainTRC = 2.4;
const Rco = 0.2126729;
const Gco = 0.7151522;
const Bco = 0.072175;
const normBG = 0.55;
const normTXT = 0.58;
const revTXT = 0.57;
const revBG = 0.62;
const blkThrs = 0.03;
const blkClmp = 1.45;
const deltaYmin = 5e-4;
const scaleBoW = 1.25;
const scaleWoB = 1.25;
const loConThresh = 0.078;
const loConFactor = 12.82051282051282;
const loConOffset = 0.06;
const loClip = 1e-3;
function APCAcontrast(text, background) {
  const Rtxt = ((text >> 16 & 255) / 255) ** mainTRC;
  const Gtxt = ((text >> 8 & 255) / 255) ** mainTRC;
  const Btxt = ((text >> 0 & 255) / 255) ** mainTRC;
  const Rbg = ((background >> 16 & 255) / 255) ** mainTRC;
  const Gbg = ((background >> 8 & 255) / 255) ** mainTRC;
  const Bbg = ((background >> 0 & 255) / 255) ** mainTRC;
  let Ytxt = Rtxt * Rco + Gtxt * Gco + Btxt * Bco;
  let Ybg = Rbg * Rco + Gbg * Gco + Bbg * Bco;
  if (Ytxt <= blkThrs)
    Ytxt += (blkThrs - Ytxt) ** blkClmp;
  if (Ybg <= blkThrs)
    Ybg += (blkThrs - Ybg) ** blkClmp;
  if (Math.abs(Ybg - Ytxt) < deltaYmin)
    return 0;
  let outputContrast;
  if (Ybg > Ytxt) {
    const SAPC = (Ybg ** normBG - Ytxt ** normTXT) * scaleBoW;
    outputContrast = SAPC < loClip ? 0 : SAPC < loConThresh ? SAPC - SAPC * loConFactor * loConOffset : SAPC - loConOffset;
  } else {
    const SAPC = (Ybg ** revBG - Ytxt ** revTXT) * scaleWoB;
    outputContrast = SAPC > -loClip ? 0 : SAPC > -loConThresh ? SAPC - SAPC * loConFactor * loConOffset : SAPC + loConOffset;
  }
  return outputContrast * 100;
}
const ThemeSymbol = Symbol.for("vuetify:theme");
const makeThemeProps = propsFactory({
  theme: String
}, "theme");
const defaultThemeOptions = {
  defaultTheme: "light",
  variations: {
    colors: [],
    lighten: 0,
    darken: 0
  },
  themes: {
    light: {
      dark: false,
      colors: {
        background: "#FFFFFF",
        surface: "#FFFFFF",
        "surface-variant": "#424242",
        "on-surface-variant": "#EEEEEE",
        primary: "#6200EE",
        "primary-darken-1": "#3700B3",
        secondary: "#03DAC6",
        "secondary-darken-1": "#018786",
        error: "#B00020",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FB8C00"
      },
      variables: {
        "border-color": "#000000",
        "border-opacity": 0.12,
        "high-emphasis-opacity": 0.87,
        "medium-emphasis-opacity": 0.6,
        "disabled-opacity": 0.38,
        "idle-opacity": 0.04,
        "hover-opacity": 0.04,
        "focus-opacity": 0.12,
        "selected-opacity": 0.08,
        "activated-opacity": 0.12,
        "pressed-opacity": 0.12,
        "dragged-opacity": 0.08,
        "kbd-background-color": "#212529",
        "kbd-color": "#FFFFFF",
        "code-background-color": "#C2C2C2"
      }
    },
    dark: {
      dark: true,
      colors: {
        background: "#121212",
        surface: "#212121",
        "surface-variant": "#BDBDBD",
        "on-surface-variant": "#424242",
        primary: "#BB86FC",
        "primary-darken-1": "#3700B3",
        secondary: "#03DAC5",
        "secondary-darken-1": "#03DAC5",
        error: "#CF6679",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FB8C00"
      },
      variables: {
        "border-color": "#FFFFFF",
        "border-opacity": 0.12,
        "high-emphasis-opacity": 0.87,
        "medium-emphasis-opacity": 0.6,
        "disabled-opacity": 0.38,
        "idle-opacity": 0.1,
        "hover-opacity": 0.04,
        "focus-opacity": 0.12,
        "selected-opacity": 0.08,
        "activated-opacity": 0.12,
        "pressed-opacity": 0.16,
        "dragged-opacity": 0.08,
        "kbd-background-color": "#212529",
        "kbd-color": "#FFFFFF",
        "code-background-color": "#B7B7B7"
      }
    }
  }
};
function parseThemeOptions() {
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : defaultThemeOptions;
  if (!options)
    return __spreadProps(__spreadValues({}, defaultThemeOptions), {
      isDisabled: true
    });
  const themes = {};
  for (const [key, theme] of Object.entries((_options$themes = options.themes) != null ? _options$themes : {})) {
    var _options$themes, _defaultThemeOptions$, _defaultThemeOptions$2;
    const defaultTheme = theme.dark ? (_defaultThemeOptions$ = defaultThemeOptions.themes) == null ? void 0 : _defaultThemeOptions$.dark : (_defaultThemeOptions$2 = defaultThemeOptions.themes) == null ? void 0 : _defaultThemeOptions$2.light;
    themes[key] = mergeDeep(defaultTheme, theme);
  }
  return mergeDeep(defaultThemeOptions, __spreadProps(__spreadValues({}, options), {
    themes
  }));
}
function createTheme(app, options) {
  const head = app._context.provides.usehead;
  const parsedOptions = vue_cjs_prod.reactive(parseThemeOptions(options));
  const name = vue_cjs_prod.ref(parsedOptions.defaultTheme);
  const themes = vue_cjs_prod.ref(parsedOptions.themes);
  const computedThemes = vue_cjs_prod.computed(() => {
    const acc = {};
    for (const [name2, original] of Object.entries(themes.value)) {
      const theme = acc[name2] = __spreadProps(__spreadValues({}, original), {
        colors: __spreadValues({}, original.colors)
      });
      if (parsedOptions.variations) {
        for (const name3 of parsedOptions.variations.colors) {
          const color = theme.colors[name3];
          for (const variation of ["lighten", "darken"]) {
            const fn = variation === "lighten" ? lighten : darken;
            for (const amount of createRange(parsedOptions.variations[variation], 1)) {
              theme.colors[`${name3}-${variation}-${amount}`] = intToHex(fn(colorToInt(color), amount));
            }
          }
        }
      }
      for (const color of Object.keys(theme.colors)) {
        if (/on-[a-z]/.test(color) || theme.colors[`on-${color}`])
          continue;
        const onColor = `on-${color}`;
        const colorVal = colorToInt(theme.colors[color]);
        const blackContrast = Math.abs(APCAcontrast(0, colorVal));
        const whiteContrast = Math.abs(APCAcontrast(16777215, colorVal));
        theme.colors[onColor] = whiteContrast > Math.min(blackContrast, 50) ? "#fff" : "#000";
      }
    }
    return acc;
  });
  const current = vue_cjs_prod.computed(() => computedThemes.value[name.value]);
  const styles = vue_cjs_prod.computed(() => {
    const lines = [];
    if (current.value.dark) {
      createCssClass(lines, ":root", ["color-scheme: dark"]);
    }
    for (const [themeName, theme] of Object.entries(computedThemes.value)) {
      const {
        variables,
        dark
      } = theme;
      createCssClass(lines, `.v-theme--${themeName}`, [`color-scheme: ${dark ? "dark" : "normal"}`, ...genCssVariables(theme), ...Object.keys(variables).map((key) => {
        const value = variables[key];
        const color = typeof value === "string" && value.startsWith("#") ? colorToRGB(value) : void 0;
        const rgb2 = color ? `${color.r}, ${color.g}, ${color.b}` : void 0;
        return `--v-${key}: ${rgb2 != null ? rgb2 : value}`;
      })]);
    }
    const colors2 = new Set(Object.values(computedThemes.value).flatMap((theme) => Object.keys(theme.colors)));
    for (const key of colors2) {
      if (/on-[a-z]/.test(key)) {
        createCssClass(lines, `.${key}`, [`color: rgb(var(--v-theme-${key})) !important`]);
      } else {
        createCssClass(lines, `.bg-${key}`, [`--v-theme-overlay-multiplier: var(--v-theme-${key}-overlay-multiplier)`, `background: rgb(var(--v-theme-${key})) !important`, `color: rgb(var(--v-theme-on-${key})) !important`]);
        createCssClass(lines, `.text-${key}`, [`color: rgb(var(--v-theme-${key})) !important`]);
        createCssClass(lines, `.border-${key}`, [`--v-border-color: var(--v-theme-${key})`]);
      }
    }
    return lines.map((str, i) => i === 0 ? str : `    ${str}`).join("");
  });
  if (head) {
    head.addHeadObjs(vue_cjs_prod.computed(() => ({
      style: [{
        children: styles.value,
        type: "text/css",
        id: "vuetify-theme-stylesheet"
      }]
    })));
  } else {
    let updateStyles = function() {
      if (parsedOptions.isDisabled)
        return;
    };
    vue_cjs_prod.watch(styles, updateStyles, {
      immediate: true
    });
  }
  const themeClasses = vue_cjs_prod.computed(() => parsedOptions.isDisabled ? void 0 : `v-theme--${name.value}`);
  return {
    isDisabled: parsedOptions.isDisabled,
    name,
    themes,
    current,
    computedThemes,
    themeClasses,
    styles
  };
}
function provideTheme(props) {
  getCurrentInstance("provideTheme");
  const theme = vue_cjs_prod.inject(ThemeSymbol, null);
  if (!theme)
    throw new Error("Could not find Vuetify theme injection");
  const name = vue_cjs_prod.computed(() => {
    var _props$theme;
    return (_props$theme = props.theme) != null ? _props$theme : theme == null ? void 0 : theme.name.value;
  });
  const themeClasses = vue_cjs_prod.computed(() => theme.isDisabled ? void 0 : `v-theme--${name.value}`);
  const newTheme = __spreadProps(__spreadValues({}, theme), {
    name,
    themeClasses
  });
  vue_cjs_prod.provide(ThemeSymbol, newTheme);
  return newTheme;
}
function useTheme() {
  getCurrentInstance("useTheme");
  const theme = vue_cjs_prod.inject(ThemeSymbol, null);
  if (!theme)
    throw new Error("Could not find Vuetify theme injection");
  return theme;
}
function createCssClass(lines, selector, content) {
  lines.push(`${selector} {
`, ...content.map((line) => `  ${line};
`), "}\n");
}
function genCssVariables(theme) {
  const lightOverlay = theme.dark ? 2 : 1;
  const darkOverlay = theme.dark ? 1 : 2;
  const variables = [];
  for (const [key, value] of Object.entries(theme.colors)) {
    const rgb2 = colorToRGB(value);
    variables.push(`--v-theme-${key}: ${rgb2.r},${rgb2.g},${rgb2.b}`);
    if (!key.startsWith("on-")) {
      variables.push(`--v-theme-${key}-overlay-multiplier: ${getLuma(value) > 0.18 ? lightOverlay : darkOverlay}`);
    }
  }
  return variables;
}
function useResizeObserver(callback) {
  const resizeRef = vue_cjs_prod.ref();
  const contentRect = vue_cjs_prod.ref();
  return {
    resizeRef,
    contentRect: vue_cjs_prod.readonly(contentRect)
  };
}
const VuetifyLayoutKey = Symbol.for("vuetify:layout");
const VuetifyLayoutItemKey = Symbol.for("vuetify:layout-item");
const ROOT_ZINDEX = 1e3;
const makeLayoutProps = propsFactory({
  overlaps: {
    type: Array,
    default: () => []
  },
  fullHeight: Boolean
}, "layout");
const makeLayoutItemProps = propsFactory({
  name: {
    type: String
  },
  order: {
    type: [Number, String],
    default: 0
  },
  absolute: Boolean
}, "layout-item");
function useLayout() {
  const layout = vue_cjs_prod.inject(VuetifyLayoutKey);
  if (!layout)
    throw new Error("Could not find injected Vuetify layout");
  return layout;
}
function useLayoutItem(options) {
  var _options$id;
  const layout = vue_cjs_prod.inject(VuetifyLayoutKey);
  if (!layout)
    throw new Error("Could not find injected Vuetify layout");
  const id = (_options$id = options.id) != null ? _options$id : `layout-item-${getUid()}`;
  const vm = getCurrentInstance("useLayoutItem");
  vue_cjs_prod.provide(VuetifyLayoutItemKey, {
    id
  });
  const isKeptAlive = vue_cjs_prod.ref(false);
  vue_cjs_prod.onDeactivated(() => isKeptAlive.value = true);
  vue_cjs_prod.onActivated(() => isKeptAlive.value = false);
  const {
    layoutItemStyles,
    layoutItemScrimStyles
  } = layout.register(vm, __spreadProps(__spreadValues({}, options), {
    active: vue_cjs_prod.computed(() => isKeptAlive.value ? false : options.active.value),
    id
  }));
  vue_cjs_prod.onBeforeUnmount(() => layout.unregister(id));
  return {
    layoutItemStyles,
    layoutRect: layout.layoutRect,
    layoutItemScrimStyles
  };
}
const generateLayers = (layout, positions, layoutSizes, activeItems) => {
  let previousLayer = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };
  const layers = [{
    id: "",
    layer: __spreadValues({}, previousLayer)
  }];
  for (const id of layout) {
    const position = positions.get(id);
    const amount = layoutSizes.get(id);
    const active = activeItems.get(id);
    if (!position || !amount || !active)
      continue;
    const layer = __spreadProps(__spreadValues({}, previousLayer), {
      [position.value]: parseInt(previousLayer[position.value], 10) + (active.value ? parseInt(amount.value, 10) : 0)
    });
    layers.push({
      id,
      layer
    });
    previousLayer = layer;
  }
  return layers;
};
function createLayout(props) {
  const parentLayout = vue_cjs_prod.inject(VuetifyLayoutKey, null);
  const rootZIndex = vue_cjs_prod.computed(() => parentLayout ? parentLayout.rootZIndex.value - 100 : ROOT_ZINDEX);
  const registered = vue_cjs_prod.ref([]);
  const positions = vue_cjs_prod.reactive(/* @__PURE__ */ new Map());
  const layoutSizes = vue_cjs_prod.reactive(/* @__PURE__ */ new Map());
  const priorities = vue_cjs_prod.reactive(/* @__PURE__ */ new Map());
  const activeItems = vue_cjs_prod.reactive(/* @__PURE__ */ new Map());
  const disabledTransitions = vue_cjs_prod.reactive(/* @__PURE__ */ new Map());
  const {
    resizeRef,
    contentRect: layoutRect
  } = useResizeObserver();
  const computedOverlaps = vue_cjs_prod.computed(() => {
    var _props$overlaps;
    const map = /* @__PURE__ */ new Map();
    const overlaps = (_props$overlaps = props.overlaps) != null ? _props$overlaps : [];
    for (const overlap of overlaps.filter((item) => item.includes(":"))) {
      const [top, bottom] = overlap.split(":");
      if (!registered.value.includes(top) || !registered.value.includes(bottom))
        continue;
      const topPosition = positions.get(top);
      const bottomPosition = positions.get(bottom);
      const topAmount = layoutSizes.get(top);
      const bottomAmount = layoutSizes.get(bottom);
      if (!topPosition || !bottomPosition || !topAmount || !bottomAmount)
        continue;
      map.set(bottom, {
        position: topPosition.value,
        amount: parseInt(topAmount.value, 10)
      });
      map.set(top, {
        position: bottomPosition.value,
        amount: -parseInt(bottomAmount.value, 10)
      });
    }
    return map;
  });
  const layers = vue_cjs_prod.computed(() => {
    const uniquePriorities = [...new Set([...priorities.values()].map((p) => p.value))].sort((a, b) => a - b);
    const layout = [];
    for (const p of uniquePriorities) {
      const items2 = registered.value.filter((id) => {
        var _priorities$get;
        return ((_priorities$get = priorities.get(id)) == null ? void 0 : _priorities$get.value) === p;
      });
      layout.push(...items2);
    }
    return generateLayers(layout, positions, layoutSizes, activeItems);
  });
  const transitionsEnabled = vue_cjs_prod.computed(() => {
    return !Array.from(disabledTransitions.values()).some((ref2) => ref2.value);
  });
  const mainStyles = vue_cjs_prod.computed(() => {
    const layer = layers.value[layers.value.length - 1].layer;
    return __spreadValues({
      position: "relative",
      paddingLeft: convertToUnit(layer.left),
      paddingRight: convertToUnit(layer.right),
      paddingTop: convertToUnit(layer.top),
      paddingBottom: convertToUnit(layer.bottom)
    }, transitionsEnabled.value ? void 0 : {
      transition: "none"
    });
  });
  const items = vue_cjs_prod.computed(() => {
    return layers.value.slice(1).map((_ref, index2) => {
      let {
        id
      } = _ref;
      const {
        layer
      } = layers.value[index2];
      const size = layoutSizes.get(id);
      return __spreadProps(__spreadValues({
        id
      }, layer), {
        size: Number(size.value)
      });
    });
  });
  const getLayoutItem = (id) => {
    return items.value.find((item) => item.id === id);
  };
  const rootVm = getCurrentInstance("createLayout");
  const isMounted = vue_cjs_prod.ref(false);
  vue_cjs_prod.onMounted(() => {
    isMounted.value = true;
  });
  vue_cjs_prod.provide(VuetifyLayoutKey, {
    register: (vm, _ref2) => {
      let {
        id,
        order,
        position,
        layoutSize,
        elementSize,
        active,
        disableTransitions,
        absolute
      } = _ref2;
      priorities.set(id, order);
      positions.set(id, position);
      layoutSizes.set(id, layoutSize);
      activeItems.set(id, active);
      disableTransitions && disabledTransitions.set(id, disableTransitions);
      const instances = findChildrenWithProvide(VuetifyLayoutItemKey, rootVm == null ? void 0 : rootVm.vnode);
      const instanceIndex = instances.indexOf(vm);
      if (instanceIndex > -1)
        registered.value.splice(instanceIndex, 0, id);
      else
        registered.value.push(id);
      const index2 = vue_cjs_prod.computed(() => items.value.findIndex((i) => i.id === id));
      const zIndex = vue_cjs_prod.computed(() => rootZIndex.value + layers.value.length * 2 - index2.value * 2);
      const layoutItemStyles = vue_cjs_prod.computed(() => {
        const isHorizontal = position.value === "left" || position.value === "right";
        const isOppositeHorizontal = position.value === "right";
        const isOppositeVertical = position.value === "bottom";
        const styles = __spreadValues({
          [position.value]: 0,
          zIndex: zIndex.value,
          transform: `translate${isHorizontal ? "X" : "Y"}(${(active.value ? 0 : -110) * (isOppositeHorizontal || isOppositeVertical ? -1 : 1)}%)`,
          position: absolute.value || rootZIndex.value !== ROOT_ZINDEX ? "absolute" : "fixed"
        }, transitionsEnabled.value ? void 0 : {
          transition: "none"
        });
        if (!isMounted.value)
          return styles;
        if (index2.value < 0)
          throw new Error(`Layout item "${id}" is missing`);
        const item = items.value[index2.value];
        if (!item)
          throw new Error(`Could not find layout item "${id}`);
        const overlap = computedOverlaps.value.get(id);
        if (overlap) {
          item[overlap.position] += overlap.amount;
        }
        return __spreadProps(__spreadValues({}, styles), {
          height: isHorizontal ? `calc(100% - ${item.top}px - ${item.bottom}px)` : elementSize.value ? `${elementSize.value}px` : void 0,
          marginLeft: isOppositeHorizontal ? void 0 : `${item.left}px`,
          marginRight: isOppositeHorizontal ? `${item.right}px` : void 0,
          marginTop: position.value !== "bottom" ? `${item.top}px` : void 0,
          marginBottom: position.value !== "top" ? `${item.bottom}px` : void 0,
          width: !isHorizontal ? `calc(100% - ${item.left}px - ${item.right}px)` : elementSize.value ? `${elementSize.value}px` : void 0
        });
      });
      const layoutItemScrimStyles = vue_cjs_prod.computed(() => ({
        zIndex: zIndex.value - 1,
        position: rootZIndex.value === ROOT_ZINDEX ? "fixed" : "absolute"
      }));
      return {
        layoutItemStyles,
        layoutItemScrimStyles,
        zIndex
      };
    },
    unregister: (id) => {
      priorities.delete(id);
      positions.delete(id);
      layoutSizes.delete(id);
      activeItems.delete(id);
      disabledTransitions.delete(id);
      registered.value = registered.value.filter((v) => v !== id);
    },
    mainStyles,
    getLayoutItem,
    items,
    layoutRect,
    rootZIndex
  });
  const layoutClasses = vue_cjs_prod.computed(() => ["v-layout", {
    "v-layout--full-height": props.fullHeight
  }]);
  const layoutStyles = vue_cjs_prod.computed(() => ({
    zIndex: rootZIndex.value
  }));
  return {
    layoutClasses,
    layoutStyles,
    getLayoutItem,
    items,
    layoutRect,
    layoutRef: resizeRef
  };
}
const createVuetify = function() {
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const install = (app) => {
    const {
      aliases: aliases2 = {},
      components: components2 = {},
      directives: directives2 = {}
    } = options;
    for (const key in directives2) {
      app.directive(key, directives2[key]);
    }
    for (const key in components2) {
      app.component(key, components2[key]);
    }
    for (const key in aliases2) {
      app.component(key, defineComponent(__spreadProps(__spreadValues({}, aliases2[key]), {
        name: key
      })));
    }
    app.provide(DefaultsSymbol, createDefaults(options.defaults));
    app.provide(DisplaySymbol, createDisplay(options.display));
    app.provide(ThemeSymbol, createTheme(app, options.theme));
    app.provide(IconSymbol, createIcons(options.icons));
    app.provide(LocaleAdapterSymbol, createLocale(app, options.locale));
    function inject2(key) {
      var _vm$parent$provides, _vm$parent, _vm$vnode$appContext;
      const vm = this.$;
      const provides = (_vm$parent$provides = (_vm$parent = vm.parent) == null ? void 0 : _vm$parent.provides) != null ? _vm$parent$provides : (_vm$vnode$appContext = vm.vnode.appContext) == null ? void 0 : _vm$vnode$appContext.provides;
      if (provides && key in provides) {
        return provides[key];
      }
    }
    app.mixin({
      computed: {
        $vuetify() {
          return vue_cjs_prod.reactive({
            defaults: inject2.call(this, DefaultsSymbol),
            display: inject2.call(this, DisplaySymbol),
            theme: inject2.call(this, ThemeSymbol),
            icons: inject2.call(this, IconSymbol),
            locale: inject2.call(this, LocaleAdapterSymbol),
            rtl: inject2.call(this, RtlSymbol)
          });
        }
      }
    });
  };
  return {
    install
  };
};
const VApp = defineComponent({
  name: "VApp",
  props: __spreadValues(__spreadValues({}, makeLayoutProps({
    fullHeight: true
  })), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const theme = provideTheme(props);
    const {
      layoutClasses,
      layoutStyles,
      getLayoutItem,
      items,
      layoutRef
    } = createLayout(props);
    const {
      rtlClasses
    } = useRtl();
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "ref": layoutRef,
        "class": ["v-application", theme.themeClasses.value, layoutClasses.value, rtlClasses.value],
        "style": layoutStyles.value,
        "data-app": "true"
      }, [vue_cjs_prod.createVNode("div", {
        "class": "v-application__wrap"
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)])]);
    });
    return {
      getLayoutItem,
      items,
      theme
    };
  }
});
const VDefaultsProvider = vue_cjs_prod.defineComponent({
  name: "VDefaultsProvider",
  props: {
    defaults: Object,
    reset: [Number, String],
    root: Boolean,
    scoped: Boolean
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      defaults,
      reset,
      root,
      scoped
    } = vue_cjs_prod.toRefs(props);
    provideDefaults(defaults, {
      reset,
      root,
      scoped
    });
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
    };
  }
});
function createCssTransition(name) {
  let origin = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "top center 0";
  let mode = arguments.length > 2 ? arguments[2] : void 0;
  return defineComponent({
    name,
    props: {
      group: Boolean,
      hideOnLeave: Boolean,
      leaveAbsolute: Boolean,
      mode: {
        type: String,
        default: mode
      },
      origin: {
        type: String,
        default: origin
      }
    },
    setup(props, _ref) {
      let {
        slots
      } = _ref;
      return () => {
        const tag = props.group ? vue_cjs_prod.TransitionGroup : vue_cjs_prod.Transition;
        return vue_cjs_prod.h(tag, {
          name,
          mode: props.mode,
          onBeforeEnter(el) {
            el.style.transformOrigin = props.origin;
          },
          onLeave(el) {
            if (props.leaveAbsolute) {
              const {
                offsetTop,
                offsetLeft,
                offsetWidth,
                offsetHeight
              } = el;
              el._transitionInitialStyles = {
                position: el.style.position,
                top: el.style.top,
                left: el.style.left,
                width: el.style.width,
                height: el.style.height
              };
              el.style.position = "absolute";
              el.style.top = `${offsetTop}px`;
              el.style.left = `${offsetLeft}px`;
              el.style.width = `${offsetWidth}px`;
              el.style.height = `${offsetHeight}px`;
            }
            if (props.hideOnLeave) {
              el.style.setProperty("display", "none", "important");
            }
          },
          onAfterLeave(el) {
            if (props.leaveAbsolute && el != null && el._transitionInitialStyles) {
              const {
                position,
                top,
                left,
                width,
                height
              } = el._transitionInitialStyles;
              delete el._transitionInitialStyles;
              el.style.position = position || "";
              el.style.top = top || "";
              el.style.left = left || "";
              el.style.width = width || "";
              el.style.height = height || "";
            }
          }
        }, slots.default);
      };
    }
  });
}
function createJavascriptTransition(name, functions) {
  let mode = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : "in-out";
  return defineComponent({
    name,
    props: {
      mode: {
        type: String,
        default: mode
      }
    },
    setup(props, _ref2) {
      let {
        slots
      } = _ref2;
      return () => {
        return vue_cjs_prod.h(vue_cjs_prod.Transition, __spreadValues({
          name
        }, functions), slots.default);
      };
    }
  });
}
function ExpandTransitionGenerator() {
  let expandedParentClass = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
  let x = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
  const sizeProperty = x ? "width" : "height";
  const offsetProperty = vue_cjs_prod.camelize(`offset-${sizeProperty}`);
  return {
    onBeforeEnter(el) {
      el._parent = el.parentNode;
      el._initialStyle = {
        transition: el.style.transition,
        overflow: el.style.overflow,
        [sizeProperty]: el.style[sizeProperty]
      };
    },
    onEnter(el) {
      const initialStyle = el._initialStyle;
      el.style.setProperty("transition", "none", "important");
      el.style.overflow = "hidden";
      const offset = `${el[offsetProperty]}px`;
      el.style[sizeProperty] = "0";
      void el.offsetHeight;
      el.style.transition = initialStyle.transition;
      if (expandedParentClass && el._parent) {
        el._parent.classList.add(expandedParentClass);
      }
      requestAnimationFrame(() => {
        el.style[sizeProperty] = offset;
      });
    },
    onAfterEnter: resetStyles,
    onEnterCancelled: resetStyles,
    onLeave(el) {
      el._initialStyle = {
        transition: "",
        overflow: el.style.overflow,
        [sizeProperty]: el.style[sizeProperty]
      };
      el.style.overflow = "hidden";
      el.style[sizeProperty] = `${el[offsetProperty]}px`;
      void el.offsetHeight;
      requestAnimationFrame(() => el.style[sizeProperty] = "0");
    },
    onAfterLeave,
    onLeaveCancelled: onAfterLeave
  };
  function onAfterLeave(el) {
    if (expandedParentClass && el._parent) {
      el._parent.classList.remove(expandedParentClass);
    }
    resetStyles(el);
  }
  function resetStyles(el) {
    const size = el._initialStyle[sizeProperty];
    el.style.overflow = el._initialStyle.overflow;
    if (size != null)
      el.style[sizeProperty] = size;
    delete el._initialStyle;
  }
}
const VDialogTransition = defineComponent({
  name: "VDialogTransition",
  props: {
    target: Object
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const functions = {
      onBeforeEnter(el) {
        el.style.pointerEvents = "none";
      },
      async onEnter(el, done) {
        var _getChildren;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const {
          x,
          y,
          sx,
          sy,
          speed
        } = getDimensions(props.target, el);
        const animation = el.animate([{
          transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`,
          opacity: 0
        }, {
          transform: ""
        }], {
          duration: 225 * speed,
          easing: deceleratedEasing
        });
        (_getChildren = getChildren(el)) == null ? void 0 : _getChildren.forEach((el2) => {
          el2.animate([{
            opacity: 0
          }, {
            opacity: 0,
            offset: 0.33
          }, {
            opacity: 1
          }], {
            duration: 225 * 2 * speed,
            easing: standardEasing
          });
        });
        animation.finished.then(() => done());
      },
      onAfterEnter(el) {
        el.style.removeProperty("pointer-events");
      },
      onBeforeLeave(el) {
        el.style.pointerEvents = "none";
      },
      async onLeave(el, done) {
        var _getChildren2;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const {
          x,
          y,
          sx,
          sy,
          speed
        } = getDimensions(props.target, el);
        const animation = el.animate([{
          transform: ""
        }, {
          transform: `translate(${x}px, ${y}px) scale(${sx}, ${sy})`,
          opacity: 0
        }], {
          duration: 125 * speed,
          easing: acceleratedEasing
        });
        animation.finished.then(() => done());
        (_getChildren2 = getChildren(el)) == null ? void 0 : _getChildren2.forEach((el2) => {
          el2.animate([{}, {
            opacity: 0,
            offset: 0.2
          }, {
            opacity: 0
          }], {
            duration: 125 * 2 * speed,
            easing: standardEasing
          });
        });
      },
      onAfterLeave(el) {
        el.style.removeProperty("pointer-events");
      }
    };
    return () => {
      return props.target ? vue_cjs_prod.createVNode(vue_cjs_prod.Transition, vue_cjs_prod.mergeProps({
        "name": "dialog-transition"
      }, functions, {
        "css": false
      }), slots) : vue_cjs_prod.createVNode(vue_cjs_prod.Transition, {
        "name": "dialog-transition"
      }, slots);
    };
  }
});
function getChildren(el) {
  var _el$querySelector;
  const els = (_el$querySelector = el.querySelector(":scope > .v-card, :scope > .v-sheet, :scope > .v-list")) == null ? void 0 : _el$querySelector.children;
  return els && [...els];
}
function getDimensions(target, el) {
  const targetBox = target.getBoundingClientRect();
  const elBox = nullifyTransforms(el);
  const [originX, originY] = getComputedStyle(el).transformOrigin.split(" ").map((v) => parseFloat(v));
  const [anchorSide, anchorOffset] = getComputedStyle(el).getPropertyValue("--v-overlay-anchor-origin").split(" ");
  let offsetX = targetBox.left + targetBox.width / 2;
  if (anchorSide === "left" || anchorOffset === "left") {
    offsetX -= targetBox.width / 2;
  } else if (anchorSide === "right" || anchorOffset === "right") {
    offsetX += targetBox.width / 2;
  }
  let offsetY = targetBox.top + targetBox.height / 2;
  if (anchorSide === "top" || anchorOffset === "top") {
    offsetY -= targetBox.height / 2;
  } else if (anchorSide === "bottom" || anchorOffset === "bottom") {
    offsetY += targetBox.height / 2;
  }
  const tsx = targetBox.width / elBox.width;
  const tsy = targetBox.height / elBox.height;
  const maxs = Math.max(1, tsx, tsy);
  const sx = tsx / maxs;
  const sy = tsy / maxs;
  const asa = elBox.width * elBox.height / (window.innerWidth * window.innerHeight);
  const speed = asa > 0.12 ? Math.min(1.5, (asa - 0.12) * 10 + 1) : 1;
  return {
    x: offsetX - (originX + elBox.left),
    y: offsetY - (originY + elBox.top),
    sx,
    sy,
    speed
  };
}
const VCarouselTransition = createCssTransition("carousel-transition");
const VCarouselReverseTransition = createCssTransition("carousel-reverse-transition");
const VTabTransition = createCssTransition("tab-transition");
const VTabReverseTransition = createCssTransition("tab-reverse-transition");
const VMenuTransition = createCssTransition("menu-transition");
const VFabTransition = createCssTransition("fab-transition", "center center", "out-in");
const VDialogBottomTransition = createCssTransition("dialog-bottom-transition");
const VDialogTopTransition = createCssTransition("dialog-top-transition");
const VFadeTransition = createCssTransition("fade-transition");
const VScaleTransition = createCssTransition("scale-transition");
const VScrollXTransition = createCssTransition("scroll-x-transition");
const VScrollXReverseTransition = createCssTransition("scroll-x-reverse-transition");
const VScrollYTransition = createCssTransition("scroll-y-transition");
const VScrollYReverseTransition = createCssTransition("scroll-y-reverse-transition");
const VSlideXTransition = createCssTransition("slide-x-transition");
const VSlideXReverseTransition = createCssTransition("slide-x-reverse-transition");
const VSlideYTransition = createCssTransition("slide-y-transition");
const VSlideYReverseTransition = createCssTransition("slide-y-reverse-transition");
const VExpandTransition = createJavascriptTransition("expand-transition", ExpandTransitionGenerator());
const VExpandXTransition = createJavascriptTransition("expand-x-transition", ExpandTransitionGenerator("", true));
const makeDimensionProps = propsFactory({
  height: [Number, String],
  maxHeight: [Number, String],
  maxWidth: [Number, String],
  minHeight: [Number, String],
  minWidth: [Number, String],
  width: [Number, String]
}, "dimension");
function useDimension(props) {
  const dimensionStyles = vue_cjs_prod.computed(() => ({
    height: convertToUnit(props.height),
    maxHeight: convertToUnit(props.maxHeight),
    maxWidth: convertToUnit(props.maxWidth),
    minHeight: convertToUnit(props.minHeight),
    minWidth: convertToUnit(props.minWidth),
    width: convertToUnit(props.width)
  }));
  return {
    dimensionStyles
  };
}
function useAspectStyles(props) {
  return {
    aspectStyles: vue_cjs_prod.computed(() => {
      const ratio = Number(props.aspectRatio);
      return ratio ? {
        paddingBottom: String(1 / ratio * 100) + "%"
      } : void 0;
    })
  };
}
const VResponsive = defineComponent({
  name: "VResponsive",
  props: __spreadValues({
    aspectRatio: [String, Number],
    contentClass: String
  }, makeDimensionProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      aspectStyles
    } = useAspectStyles(props);
    return () => {
      var _slots$additional;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-responsive",
        "style": dimensionStyles.value
      }, [vue_cjs_prod.createVNode("div", {
        "class": "v-responsive__sizer",
        "style": aspectStyles.value
      }, null), (_slots$additional = slots.additional) == null ? void 0 : _slots$additional.call(slots), slots.default && vue_cjs_prod.createVNode("div", {
        "class": ["v-responsive__content", props.contentClass]
      }, [slots.default()])]);
    };
  }
});
function mounted$5(el, binding) {
  return;
}
function unmounted$5(el, binding) {
  var _el$_observe2;
  const observe = (_el$_observe2 = el._observe) == null ? void 0 : _el$_observe2[binding.instance.$.uid];
  if (!observe)
    return;
  observe.observer.unobserve(el);
  delete el._observe[binding.instance.$.uid];
}
const Intersect = {
  mounted: mounted$5,
  unmounted: unmounted$5
};
const makeTransitionProps = propsFactory({
  transition: {
    type: [Boolean, String, Object],
    default: "fade-transition",
    validator: (val) => val !== true
  }
}, "transition");
const MaybeTransition = (props, _ref) => {
  var _slots$default;
  let {
    slots
  } = _ref;
  const _a = props, {
    transition
  } = _a, rest = __objRest(_a, [
    "transition"
  ]);
  if (!transition || typeof transition === "boolean")
    return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
  const _b = typeof transition === "object" ? transition : {}, {
    component = vue_cjs_prod.Transition
  } = _b, customProps = __objRest(_b, [
    "component"
  ]);
  return vue_cjs_prod.h(component, vue_cjs_prod.mergeProps(typeof transition === "string" ? {
    name: transition
  } : customProps, rest), slots);
};
const VImg = defineComponent({
  name: "VImg",
  directives: {
    intersect: Intersect
  },
  props: __spreadValues({
    aspectRatio: [String, Number],
    alt: String,
    cover: Boolean,
    eager: Boolean,
    gradient: String,
    lazySrc: String,
    options: {
      type: Object,
      default: () => ({
        root: void 0,
        rootMargin: void 0,
        threshold: void 0
      })
    },
    sizes: String,
    src: {
      type: [String, Object],
      default: ""
    },
    srcset: String,
    width: [String, Number]
  }, makeTransitionProps()),
  emits: ["loadstart", "load", "error"],
  setup(props, _ref) {
    let {
      emit,
      slots
    } = _ref;
    const currentSrc = vue_cjs_prod.ref("");
    const image = vue_cjs_prod.ref();
    const state = vue_cjs_prod.ref(props.eager ? "loading" : "idle");
    const naturalWidth = vue_cjs_prod.ref();
    const naturalHeight = vue_cjs_prod.ref();
    const normalisedSrc = vue_cjs_prod.computed(() => {
      return props.src && typeof props.src === "object" ? {
        src: props.src.src,
        srcset: props.srcset || props.src.srcset,
        lazySrc: props.lazySrc || props.src.lazySrc,
        aspect: Number(props.aspectRatio || props.src.aspect)
      } : {
        src: props.src,
        srcset: props.srcset,
        lazySrc: props.lazySrc,
        aspect: Number(props.aspectRatio || 0)
      };
    });
    const aspectRatio = vue_cjs_prod.computed(() => {
      return normalisedSrc.value.aspect || naturalWidth.value / naturalHeight.value || 0;
    });
    vue_cjs_prod.watch(() => props.src, () => {
      init(state.value !== "idle");
    });
    vue_cjs_prod.onBeforeMount(() => init());
    function init(isIntersecting) {
      if (props.eager && isIntersecting)
        return;
      state.value = "loading";
      if (normalisedSrc.value.lazySrc) {
        const lazyImg = new Image();
        lazyImg.src = normalisedSrc.value.lazySrc;
        pollForSize(lazyImg, null);
      }
      if (!normalisedSrc.value.src)
        return;
      vue_cjs_prod.nextTick(() => {
        var _image$value, _image$value2;
        emit("loadstart", ((_image$value = image.value) == null ? void 0 : _image$value.currentSrc) || normalisedSrc.value.src);
        if ((_image$value2 = image.value) != null && _image$value2.complete) {
          if (!image.value.naturalWidth) {
            onError();
          }
          if (state.value === "error")
            return;
          if (!aspectRatio.value)
            pollForSize(image.value, null);
          onLoad();
        } else {
          if (!aspectRatio.value)
            pollForSize(image.value);
          getSrc();
        }
      });
    }
    function onLoad() {
      var _image$value3;
      getSrc();
      state.value = "loaded";
      emit("load", ((_image$value3 = image.value) == null ? void 0 : _image$value3.currentSrc) || normalisedSrc.value.src);
    }
    function onError() {
      var _image$value4;
      state.value = "error";
      emit("error", ((_image$value4 = image.value) == null ? void 0 : _image$value4.currentSrc) || normalisedSrc.value.src);
    }
    function getSrc() {
      const img = image.value;
      if (img)
        currentSrc.value = img.currentSrc || img.src;
    }
    function pollForSize(img) {
      let timeout = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 100;
      const poll = () => {
        const {
          naturalHeight: imgHeight,
          naturalWidth: imgWidth
        } = img;
        if (imgHeight || imgWidth) {
          naturalWidth.value = imgWidth;
          naturalHeight.value = imgHeight;
        } else if (!img.complete && state.value === "loading" && timeout != null) {
          setTimeout(poll, timeout);
        } else if (img.currentSrc.endsWith(".svg") || img.currentSrc.startsWith("data:image/svg+xml")) {
          naturalWidth.value = 1;
          naturalHeight.value = 1;
        }
      };
      poll();
    }
    const containClasses = vue_cjs_prod.computed(() => ({
      "v-img__img--cover": props.cover,
      "v-img__img--contain": !props.cover
    }));
    const __image = vue_cjs_prod.computed(() => {
      var _slots$sources;
      if (!normalisedSrc.value.src || state.value === "idle")
        return;
      const img = vue_cjs_prod.h("img", {
        class: ["v-img__img", containClasses.value],
        src: normalisedSrc.value.src,
        srcset: normalisedSrc.value.srcset,
        sizes: props.sizes,
        ref: image,
        onLoad,
        onError
      });
      const sources = (_slots$sources = slots.sources) == null ? void 0 : _slots$sources.call(slots);
      return vue_cjs_prod.createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [vue_cjs_prod.withDirectives(sources ? vue_cjs_prod.createVNode("picture", {
          "class": "v-img__picture"
        }, [sources, img]) : img, [[vue_cjs_prod.vShow, state.value === "loaded"]])]
      });
    });
    const __preloadImage = vue_cjs_prod.computed(() => vue_cjs_prod.createVNode(MaybeTransition, {
      "transition": props.transition
    }, {
      default: () => [normalisedSrc.value.lazySrc && state.value !== "loaded" && vue_cjs_prod.createVNode("img", {
        "class": ["v-img__img", "v-img__img--preload", containClasses.value],
        "src": normalisedSrc.value.lazySrc,
        "alt": ""
      }, null)]
    }));
    const __placeholder = vue_cjs_prod.computed(() => {
      if (!slots.placeholder)
        return;
      return vue_cjs_prod.createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [(state.value === "loading" || state.value === "error" && !slots.error) && vue_cjs_prod.createVNode("div", {
          "class": "v-img__placeholder"
        }, [slots.placeholder()])]
      });
    });
    const __error = vue_cjs_prod.computed(() => {
      if (!slots.error)
        return;
      return vue_cjs_prod.createVNode(MaybeTransition, {
        "transition": props.transition,
        "appear": true
      }, {
        default: () => [state.value === "error" && vue_cjs_prod.createVNode("div", {
          "class": "v-img__error"
        }, [slots.error()])]
      });
    });
    const __gradient = vue_cjs_prod.computed(() => {
      if (!props.gradient)
        return;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-img__gradient",
        "style": {
          backgroundImage: `linear-gradient(${props.gradient})`
        }
      }, null);
    });
    const isBooted = vue_cjs_prod.ref(false);
    {
      const stop = vue_cjs_prod.watch(aspectRatio, (val) => {
        if (val) {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              isBooted.value = true;
            });
          });
          stop();
        }
      });
    }
    useRender(() => vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(VResponsive, {
      "class": ["v-img", {
        "v-img--booting": !isBooted.value
      }],
      "style": {
        width: convertToUnit(props.width === "auto" ? naturalWidth.value : props.width)
      },
      "aspectRatio": aspectRatio.value,
      "aria-label": props.alt,
      "role": props.alt ? "img" : void 0
    }, {
      additional: () => [__image.value, __preloadImage.value, __gradient.value, __placeholder.value, __error.value],
      default: slots.default
    }), [[vue_cjs_prod.resolveDirective("intersect"), {
      handler: init,
      options: props.options
    }, null, {
      once: true
    }]]));
    return {
      currentSrc,
      image,
      state,
      naturalWidth,
      naturalHeight
    };
  }
});
const makeTagProps = propsFactory({
  tag: {
    type: String,
    default: "div"
  }
}, "tag");
const VToolbarTitle = genericComponent()({
  name: "VToolbarTitle",
  props: __spreadValues({
    text: String
  }, makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    useRender(() => {
      var _slots$default;
      const hasText = !!(slots.default || slots.text || props.text);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": "v-toolbar-title"
      }, {
        default: () => [hasText && vue_cjs_prod.createVNode("div", {
          "class": "v-toolbar-title__placeholder"
        }, [slots.text ? slots.text() : props.text, (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)])]
      });
    });
    return {};
  }
});
const makeBorderProps = propsFactory({
  border: [Boolean, Number, String]
}, "border");
function useBorder(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const borderClasses = vue_cjs_prod.computed(() => {
    const classes = [];
    if (props.border != null && props.border !== false) {
      classes.push(`${name}--border`);
    }
    if (typeof props.border === "string" && props.border !== "" || props.border === 0) {
      for (const value of String(props.border).split(" ")) {
        classes.push(`border-${value}`);
      }
    }
    return classes;
  });
  return {
    borderClasses
  };
}
const makeElevationProps = propsFactory({
  elevation: {
    type: [Number, String],
    validator(v) {
      const value = parseInt(v);
      return !isNaN(value) && value >= 0 && value <= 24;
    }
  }
}, "elevation");
function useElevation(props) {
  const elevationClasses = vue_cjs_prod.computed(() => {
    const elevation = vue_cjs_prod.isRef(props) ? props.value : props.elevation;
    const classes = [];
    if (elevation == null)
      return classes;
    classes.push(`elevation-${elevation}`);
    return classes;
  });
  return {
    elevationClasses
  };
}
const makeRoundedProps = propsFactory({
  rounded: {
    type: [Boolean, Number, String],
    default: void 0
  }
}, "rounded");
function useRounded(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const roundedClasses = vue_cjs_prod.computed(() => {
    const rounded = vue_cjs_prod.isRef(props) ? props.value : props.rounded;
    const classes = [];
    if (rounded === true || rounded === "") {
      classes.push(`${name}--rounded`);
    } else if (typeof rounded === "string" || rounded === 0) {
      for (const value of String(rounded).split(" ")) {
        classes.push(`rounded-${value}`);
      }
    }
    return classes;
  });
  return {
    roundedClasses
  };
}
function useColor(colors2) {
  const backgroundIsCssColor = vue_cjs_prod.computed(() => isCssColor(colors2.value.background));
  const textIsCssColor = vue_cjs_prod.computed(() => isCssColor(colors2.value.text));
  const colorClasses = vue_cjs_prod.computed(() => {
    const classes = [];
    if (colors2.value.background && !backgroundIsCssColor.value) {
      classes.push(`bg-${colors2.value.background}`);
    }
    if (colors2.value.text && !textIsCssColor.value) {
      classes.push(`text-${colors2.value.text}`);
    }
    return classes;
  });
  const colorStyles = vue_cjs_prod.computed(() => {
    const styles = {};
    if (colors2.value.background && backgroundIsCssColor.value) {
      styles.backgroundColor = colors2.value.background;
    }
    if (colors2.value.text && textIsCssColor.value) {
      styles.color = colors2.value.text;
      styles.caretColor = colors2.value.text;
    }
    return styles;
  });
  return {
    colorClasses,
    colorStyles
  };
}
function useTextColor(props, name) {
  const colors2 = vue_cjs_prod.computed(() => ({
    text: vue_cjs_prod.isRef(props) ? props.value : name ? props[name] : null
  }));
  const {
    colorClasses: textColorClasses,
    colorStyles: textColorStyles
  } = useColor(colors2);
  return {
    textColorClasses,
    textColorStyles
  };
}
function useBackgroundColor(props, name) {
  const colors2 = vue_cjs_prod.computed(() => ({
    background: vue_cjs_prod.isRef(props) ? props.value : name ? props[name] : null
  }));
  const {
    colorClasses: backgroundColorClasses,
    colorStyles: backgroundColorStyles
  } = useColor(colors2);
  return {
    backgroundColorClasses,
    backgroundColorStyles
  };
}
function useForwardRef(target) {
  for (var _len = arguments.length, refs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    refs[_key - 1] = arguments[_key];
  }
  return new Proxy(target, {
    get(target2, key) {
      if (Reflect.has(target2, key)) {
        return Reflect.get(target2, key);
      }
      for (const ref2 of refs) {
        if (ref2.value && Reflect.has(ref2.value, key)) {
          const val = Reflect.get(ref2.value, key);
          return typeof val === "function" ? val.bind(ref2.value) : val;
        }
      }
    },
    getOwnPropertyDescriptor(target2, key) {
      const descriptor = Reflect.getOwnPropertyDescriptor(target2, key);
      if (descriptor)
        return descriptor;
      for (const ref2 of refs) {
        if (!ref2.value)
          continue;
        const descriptor2 = Reflect.getOwnPropertyDescriptor(ref2.value, key);
        if (descriptor2)
          return descriptor2;
      }
      for (const ref2 of refs) {
        let obj = ref2.value && Object.getPrototypeOf(ref2.value);
        while (obj) {
          const descriptor2 = Reflect.getOwnPropertyDescriptor(obj, key);
          if (descriptor2)
            return descriptor2;
          obj = Object.getPrototypeOf(obj);
        }
      }
      return void 0;
    }
  });
}
const allowedDensities$1 = [null, "prominent", "default", "comfortable", "compact"];
const makeVToolbarProps = propsFactory(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
  absolute: Boolean,
  collapse: Boolean,
  color: String,
  density: {
    type: String,
    default: "default",
    validator: (v) => allowedDensities$1.includes(v)
  },
  extended: Boolean,
  extensionHeight: {
    type: [Number, String],
    default: 48
  },
  flat: Boolean,
  floating: Boolean,
  height: {
    type: [Number, String],
    default: 56
  },
  image: String,
  title: String
}, makeBorderProps()), makeElevationProps()), makeRoundedProps()), makeTagProps({
  tag: "header"
})), makeThemeProps()), "v-toolbar");
const VToolbar = genericComponent()({
  name: "VToolbar",
  props: makeVToolbarProps(),
  setup(props, _ref) {
    var _slots$extension;
    let {
      slots
    } = _ref;
    const {
      borderClasses
    } = useBorder(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const isExtended = vue_cjs_prod.ref(!!(props.extended || (_slots$extension = slots.extension) != null && _slots$extension.call(slots)));
    const contentHeight = vue_cjs_prod.computed(() => parseInt(Number(props.height) + (props.density === "prominent" ? Number(props.height) : 0) - (props.density === "comfortable" ? 8 : 0) - (props.density === "compact" ? 16 : 0), 10));
    const extensionHeight = vue_cjs_prod.computed(() => isExtended.value ? parseInt(Number(props.extensionHeight) + (props.density === "prominent" ? Number(props.extensionHeight) : 0) - (props.density === "comfortable" ? 4 : 0) - (props.density === "compact" ? 8 : 0), 10) : 0);
    provideDefaults({
      VBtn: {
        flat: true,
        variant: "text"
      }
    });
    useRender(() => {
      var _slots$extension2, _slots$image, _slots$prepend, _slots$default, _slots$append;
      const hasTitle = !!(props.title || slots.title);
      const hasImage = !!(slots.image || props.image);
      const extension = (_slots$extension2 = slots.extension) == null ? void 0 : _slots$extension2.call(slots);
      isExtended.value = !!(props.extended || extension);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-toolbar", {
          "v-toolbar--absolute": props.absolute,
          "v-toolbar--collapse": props.collapse,
          "v-toolbar--flat": props.flat,
          "v-toolbar--floating": props.floating,
          [`v-toolbar--density-${props.density}`]: true
        }, backgroundColorClasses.value, borderClasses.value, elevationClasses.value, roundedClasses.value, themeClasses.value],
        "style": [backgroundColorStyles.value]
      }, {
        default: () => [hasImage && vue_cjs_prod.createVNode("div", {
          "class": "v-toolbar__image"
        }, [vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VImg: {
              cover: true,
              src: props.image
            }
          },
          "scoped": true
        }, {
          default: () => [slots.image ? (_slots$image = slots.image) == null ? void 0 : _slots$image.call(slots) : vue_cjs_prod.createVNode(VImg, null, null)]
        })]), vue_cjs_prod.createVNode("div", {
          "class": "v-toolbar__content",
          "style": {
            height: convertToUnit(contentHeight.value)
          }
        }, [slots.prepend && vue_cjs_prod.createVNode("div", {
          "class": "v-toolbar__prepend"
        }, [(_slots$prepend = slots.prepend) == null ? void 0 : _slots$prepend.call(slots)]), hasTitle && vue_cjs_prod.createVNode(VToolbarTitle, {
          "text": props.title
        }, {
          text: slots.title
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots), slots.append && vue_cjs_prod.createVNode("div", {
          "class": "v-toolbar__append"
        }, [(_slots$append = slots.append) == null ? void 0 : _slots$append.call(slots)])]), vue_cjs_prod.createVNode(VExpandTransition, null, {
          default: () => [isExtended.value && vue_cjs_prod.createVNode("div", {
            "class": "v-toolbar__extension",
            "style": {
              height: convertToUnit(extensionHeight.value)
            }
          }, [extension])]
        })]
      });
    });
    return useForwardRef({
      contentHeight,
      extensionHeight
    });
  }
});
function filterToolbarProps(props) {
  var _VToolbar$props;
  return pick(props, Object.keys((_VToolbar$props = VToolbar == null ? void 0 : VToolbar.props) != null ? _VToolbar$props : {}));
}
function useProxiedModel(props, prop, defaultValue) {
  let transformIn = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : (v) => v;
  let transformOut = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : (v) => v;
  const vm = getCurrentInstance("useProxiedModel");
  const propIsDefined2 = vue_cjs_prod.computed(() => {
    var _vm$vnode$props, _vm$vnode$props2;
    return !!(typeof props[prop] !== "undefined" && (vm != null && (_vm$vnode$props = vm.vnode.props) != null && _vm$vnode$props.hasOwnProperty(prop) || vm != null && (_vm$vnode$props2 = vm.vnode.props) != null && _vm$vnode$props2.hasOwnProperty(toKebabCase(prop))));
  });
  const internal = vue_cjs_prod.ref(transformIn(props[prop]));
  return vue_cjs_prod.computed({
    get() {
      if (propIsDefined2.value)
        return transformIn(props[prop]);
      else
        return internal.value;
    },
    set(newValue) {
      if ((propIsDefined2.value ? transformIn(props[prop]) : internal.value) === newValue) {
        return;
      }
      internal.value = newValue;
      vm == null ? void 0 : vm.emit(`update:${prop}`, transformOut(newValue));
    }
  });
}
const VAppBar = defineComponent({
  name: "VAppBar",
  props: __spreadProps(__spreadValues(__spreadValues({
    modelValue: {
      type: Boolean,
      default: true
    },
    location: {
      type: String,
      default: "top",
      validator: (value) => ["top", "bottom"].includes(value)
    }
  }, makeVToolbarProps()), makeLayoutItemProps()), {
    height: {
      type: [Number, String],
      default: 64
    }
  }),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const vToolbarRef = vue_cjs_prod.ref();
    const isActive = useProxiedModel(props, "modelValue");
    const height = vue_cjs_prod.computed(() => {
      var _vToolbarRef$value$co, _vToolbarRef$value, _vToolbarRef$value$ex, _vToolbarRef$value2;
      const height2 = (_vToolbarRef$value$co = (_vToolbarRef$value = vToolbarRef.value) == null ? void 0 : _vToolbarRef$value.contentHeight) != null ? _vToolbarRef$value$co : 0;
      const extensionHeight = (_vToolbarRef$value$ex = (_vToolbarRef$value2 = vToolbarRef.value) == null ? void 0 : _vToolbarRef$value2.extensionHeight) != null ? _vToolbarRef$value$ex : 0;
      return height2 + extensionHeight;
    });
    const {
      layoutItemStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.toRef(props, "location"),
      layoutSize: height,
      elementSize: height,
      active: isActive,
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    return () => {
      const [toolbarProps] = filterToolbarProps(props);
      return vue_cjs_prod.createVNode(VToolbar, vue_cjs_prod.mergeProps({
        "ref": vToolbarRef,
        "class": ["v-app-bar", {
          "v-app-bar--bottom": props.location === "bottom"
        }],
        "style": __spreadProps(__spreadValues({}, layoutItemStyles.value), {
          height: void 0
        })
      }, toolbarProps), slots);
    };
  }
});
const allowedDensities = [null, "default", "comfortable", "compact"];
const makeDensityProps = propsFactory({
  density: {
    type: String,
    default: "default",
    validator: (v) => allowedDensities.includes(v)
  }
}, "density");
function useDensity(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const densityClasses = vue_cjs_prod.computed(() => {
    return `${name}--density-${props.density}`;
  });
  return {
    densityClasses
  };
}
const allowedVariants$2 = ["outlined", "plain", "text", "contained", "contained-flat", "contained-text"];
function genOverlays(isClickable, name) {
  return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [isClickable && vue_cjs_prod.createVNode("div", {
    "class": `${name}__overlay`
  }, null), vue_cjs_prod.createVNode("div", {
    "class": `${name}__underlay`
  }, null)]);
}
const makeVariantProps = propsFactory({
  color: String,
  variant: {
    type: String,
    default: "contained",
    validator: (v) => allowedVariants$2.includes(v)
  }
}, "variant");
function useVariant(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const variantClasses = vue_cjs_prod.computed(() => {
    const {
      variant
    } = vue_cjs_prod.unref(props);
    return `${name}--variant-${variant}`;
  });
  const {
    colorClasses,
    colorStyles
  } = useColor(vue_cjs_prod.computed(() => {
    const {
      variant,
      color
    } = vue_cjs_prod.unref(props);
    return {
      [["contained", "contained-flat"].includes(variant) ? "background" : "text"]: color
    };
  }));
  return {
    colorClasses,
    colorStyles,
    variantClasses
  };
}
const VBtnGroup = defineComponent({
  name: "VBtnGroup",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    divided: Boolean
  }, makeBorderProps()), makeDensityProps()), makeElevationProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()), makeVariantProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    provideDefaults({
      VBtn: {
        height: "auto",
        color: vue_cjs_prod.toRef(props, "color"),
        density: vue_cjs_prod.toRef(props, "density"),
        flat: true,
        variant: vue_cjs_prod.toRef(props, "variant")
      }
    });
    useRender(() => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-btn-group", {
          "v-btn-group--divided": props.divided
        }, themeClasses.value, borderClasses.value, densityClasses.value, elevationClasses.value, roundedClasses.value]
      }, slots);
    });
  }
});
const makeGroupProps = propsFactory({
  modelValue: {
    type: null,
    default: void 0
  },
  multiple: Boolean,
  mandatory: [Boolean, String],
  max: Number,
  selectedClass: String,
  disabled: Boolean
}, "group");
const makeGroupItemProps = propsFactory({
  value: null,
  disabled: Boolean,
  selectedClass: String
}, "group-item");
function useGroupItem(props, injectKey) {
  let required = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : true;
  const vm = getCurrentInstance("useGroupItem");
  if (!vm) {
    throw new Error("[Vuetify] useGroupItem composable must be used inside a component setup function");
  }
  const id = getUid();
  vue_cjs_prod.provide(Symbol.for(`${injectKey.description}:id`), id);
  const group = vue_cjs_prod.inject(injectKey, null);
  if (!group) {
    if (!required)
      return group;
    throw new Error(`[Vuetify] Could not find useGroup injection with symbol ${injectKey.description}`);
  }
  const value = vue_cjs_prod.toRef(props, "value");
  const disabled = vue_cjs_prod.computed(() => group.disabled.value || props.disabled);
  group.register({
    id,
    value,
    disabled
  }, vm);
  vue_cjs_prod.onBeforeUnmount(() => {
    group.unregister(id);
  });
  const isSelected = vue_cjs_prod.computed(() => {
    return group.isSelected(id);
  });
  const selectedClass = vue_cjs_prod.computed(() => isSelected.value && [group.selectedClass.value, props.selectedClass]);
  vue_cjs_prod.watch(isSelected, (value2) => {
    vm.emit("group:selected", {
      value: value2
    });
  });
  return {
    id,
    isSelected,
    toggle: () => group.select(id, !isSelected.value),
    select: (value2) => group.select(id, value2),
    selectedClass,
    value,
    disabled,
    group
  };
}
function useGroup(props, injectKey) {
  let isUnmounted = false;
  const items = vue_cjs_prod.reactive([]);
  const selected = useProxiedModel(props, "modelValue", [], (v) => {
    if (v == null)
      return [];
    return getIds(items, wrapInArray(v));
  }, (v) => {
    const arr = getValues(items, v);
    return props.multiple ? arr : arr[0];
  });
  const groupVm = getCurrentInstance("useGroup");
  function register(item, vm) {
    const unwrapped = item;
    const key = Symbol.for(`${injectKey.description}:id`);
    const children = findChildrenWithProvide(key, groupVm == null ? void 0 : groupVm.vnode);
    const index2 = children.indexOf(vm);
    if (index2 > -1) {
      items.splice(index2, 0, unwrapped);
    } else {
      items.push(unwrapped);
    }
  }
  function unregister(id) {
    if (isUnmounted)
      return;
    forceMandatoryValue();
    const index2 = items.findIndex((item) => item.id === id);
    items.splice(index2, 1);
  }
  function forceMandatoryValue() {
    const item = items.find((item2) => !item2.disabled);
    if (item && props.mandatory === "force" && !selected.value.length) {
      selected.value = [item.id];
    }
  }
  vue_cjs_prod.onMounted(() => {
    forceMandatoryValue();
  });
  vue_cjs_prod.onBeforeUnmount(() => {
    isUnmounted = true;
  });
  function select(id, value) {
    const item = items.find((item2) => item2.id === id);
    if (value && item != null && item.disabled)
      return;
    if (props.multiple) {
      var _value;
      const internalValue = selected.value.slice();
      const index2 = internalValue.findIndex((v) => v === id);
      const isSelected = ~index2;
      value = (_value = value) != null ? _value : !isSelected;
      if (isSelected && props.mandatory && internalValue.length <= 1)
        return;
      if (!isSelected && props.max != null && internalValue.length + 1 > props.max)
        return;
      if (index2 < 0 && value)
        internalValue.push(id);
      else if (index2 >= 0 && !value)
        internalValue.splice(index2, 1);
      selected.value = internalValue;
    } else {
      var _value2;
      const isSelected = selected.value.includes(id);
      if (props.mandatory && isSelected)
        return;
      selected.value = ((_value2 = value) != null ? _value2 : !isSelected) ? [id] : [];
    }
  }
  function step(offset) {
    if (props.multiple)
      consoleWarn('This method is not supported when using "multiple" prop');
    if (!selected.value.length) {
      const item = items.find((item2) => !item2.disabled);
      item && (selected.value = [item.id]);
    } else {
      const currentId = selected.value[0];
      const currentIndex = items.findIndex((i) => i.id === currentId);
      let newIndex = (currentIndex + offset) % items.length;
      let newItem = items[newIndex];
      while (newItem.disabled && newIndex !== currentIndex) {
        newIndex = (newIndex + offset) % items.length;
        newItem = items[newIndex];
      }
      if (newItem.disabled)
        return;
      selected.value = [items[newIndex].id];
    }
  }
  const state = {
    register,
    unregister,
    selected,
    select,
    disabled: vue_cjs_prod.toRef(props, "disabled"),
    prev: () => step(items.length - 1),
    next: () => step(1),
    isSelected: (id) => selected.value.includes(id),
    selectedClass: vue_cjs_prod.computed(() => props.selectedClass),
    items: vue_cjs_prod.computed(() => items),
    getItemIndex: (value) => getItemIndex(items, value)
  };
  vue_cjs_prod.provide(injectKey, state);
  return state;
}
function getItemIndex(items, value) {
  const ids = getIds(items, [value]);
  if (!ids.length)
    return -1;
  return items.findIndex((item) => item.id === ids[0]);
}
function getIds(items, modelValue) {
  const ids = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.value != null) {
      if (modelValue.find((value) => deepEqual(value, item.value)) != null) {
        ids.push(item.id);
      }
    } else if (modelValue.includes(i)) {
      ids.push(item.id);
    }
  }
  return ids;
}
function getValues(items, ids) {
  const values = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (ids.includes(item.id)) {
      values.push(item.value != null ? item.value : i);
    }
  }
  return values;
}
const VBtnToggleSymbol = Symbol.for("vuetify:v-btn-toggle");
const VBtnToggle = genericComponent()({
  name: "VBtnToggle",
  props: makeGroupProps({
    selectedClass: "v-btn--selected"
  }),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      isSelected,
      next,
      prev,
      select,
      selected
    } = useGroup(props, VBtnToggleSymbol);
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode(VBtnGroup, {
        "class": "v-btn-toggle"
      }, {
        default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
          isSelected,
          next,
          prev,
          select,
          selected
        })]
      });
    });
    return {
      next,
      prev,
      select
    };
  }
});
const predefinedSizes = ["x-small", "small", "default", "large", "x-large"];
const makeSizeProps = propsFactory({
  size: {
    type: [String, Number],
    default: "default"
  }
}, "size");
function useSize(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const sizeClasses = vue_cjs_prod.computed(() => {
    return predefinedSizes.includes(props.size) ? `${name}--size-${props.size}` : null;
  });
  const sizeStyles = vue_cjs_prod.computed(() => {
    return !predefinedSizes.includes(props.size) && props.size ? {
      width: convertToUnit(props.size),
      height: convertToUnit(props.size)
    } : null;
  });
  return {
    sizeClasses,
    sizeStyles
  };
}
const makeVIconProps = propsFactory(__spreadValues(__spreadValues(__spreadValues({
  color: String,
  start: Boolean,
  end: Boolean,
  icon: IconValue
}, makeSizeProps()), makeTagProps({
  tag: "i"
})), makeThemeProps()), "v-icon");
const VIcon = defineComponent({
  name: "VIcon",
  props: makeVIconProps(),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    let slotIcon;
    if (slots.default) {
      slotIcon = vue_cjs_prod.computed(() => {
        var _slots$default, _flattenFragments$fil;
        const slot = (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
        if (!slot)
          return;
        return (_flattenFragments$fil = flattenFragments(slot).filter((node) => node.children && typeof node.children === "string")[0]) == null ? void 0 : _flattenFragments$fil.children;
      });
    }
    const {
      themeClasses
    } = provideTheme(props);
    const {
      iconData
    } = useIcon(slotIcon || props);
    const {
      sizeClasses
    } = useSize(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "color"));
    return () => {
      return vue_cjs_prod.createVNode(iconData.value.component, {
        "tag": props.tag,
        "icon": iconData.value.icon,
        "class": ["v-icon", "notranslate", sizeClasses.value, textColorClasses.value, themeClasses.value, {
          "v-icon--clickable": !!attrs.onClick,
          "v-icon--start": props.start,
          "v-icon--end": props.end
        }],
        "style": [!sizeClasses.value ? {
          fontSize: convertToUnit(props.size),
          width: convertToUnit(props.size),
          height: convertToUnit(props.size)
        } : void 0, textColorStyles.value],
        "aria-hidden": "true"
      }, null);
    };
  }
});
const oppositeMap = {
  center: "center",
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left"
};
const makeLocationProps = propsFactory({
  location: String
}, "location");
function useLocation(props) {
  let opposite = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
  let offset = arguments.length > 2 ? arguments[2] : void 0;
  const {
    isRtl
  } = useRtl();
  function toPhysical(side) {
    return side === "start" ? isRtl.value ? "right" : "left" : side === "end" ? isRtl.value ? "left" : "right" : side;
  }
  const locationStyles = vue_cjs_prod.computed(() => {
    if (!props.location)
      return {};
    const anchor = parseAnchor(props.location.split(" ").length > 1 ? props.location : `${props.location} center`);
    const side = toPhysical(anchor.side);
    const align = toPhysical(anchor.align);
    function getOffset2(side2) {
      return offset ? offset(side2) : 0;
    }
    const styles = {};
    if (side !== "center") {
      if (opposite)
        styles[oppositeMap[side]] = `calc(100% - ${getOffset2(side)}px)`;
      else
        styles[side] = 0;
    }
    if (align !== "center") {
      if (opposite)
        styles[oppositeMap[align]] = `calc(100% - ${getOffset2(align)}px)`;
      else
        styles[align] = 0;
    } else {
      if (side === "center")
        styles.top = styles.left = "50%";
      else {
        styles[{
          top: "left",
          bottom: "left",
          left: "top",
          right: "top"
        }[side]] = "50%";
      }
      styles.transform = {
        top: "translateX(-50%)",
        bottom: "translateX(-50%)",
        left: "translateY(-50%)",
        right: "translateY(-50%)",
        center: "translate(-50%, -50%)"
      }[side];
    }
    return styles;
  });
  return {
    locationStyles
  };
}
const positionValues = ["static", "relative", "fixed", "absolute", "sticky"];
const makePositionProps = propsFactory({
  position: {
    type: String,
    validator: (v) => positionValues.includes(v)
  }
}, "position");
function usePosition(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const positionClasses = vue_cjs_prod.computed(() => {
    return props.position ? `${name}--${props.position}` : void 0;
  });
  return {
    positionClasses
  };
}
function useRouter() {
  var _getCurrentInstance, _getCurrentInstance$p;
  return (_getCurrentInstance = getCurrentInstance("useRouter")) == null ? void 0 : (_getCurrentInstance$p = _getCurrentInstance.proxy) == null ? void 0 : _getCurrentInstance$p.$router;
}
function useLink(props, attrs) {
  const RouterLink = vue_cjs_prod.resolveDynamicComponent("RouterLink");
  const isLink = vue_cjs_prod.computed(() => !!(props.href || props.to));
  const isClickable = vue_cjs_prod.computed(() => {
    return (isLink == null ? void 0 : isLink.value) || !!(attrs.onClick || attrs.onClickOnce);
  });
  if (typeof RouterLink === "string") {
    return {
      isLink,
      isClickable,
      href: vue_cjs_prod.toRef(props, "href")
    };
  }
  const link = props.to ? RouterLink.useLink(props) : void 0;
  return __spreadProps(__spreadValues({}, link), {
    isLink,
    isClickable,
    href: vue_cjs_prod.computed(() => props.to ? link == null ? void 0 : link.route.value.href : props.href)
  });
}
const makeRouterProps = propsFactory({
  href: String,
  replace: Boolean,
  to: [String, Object]
}, "router");
function useSelectLink(link, select) {
  vue_cjs_prod.watch(() => {
    var _link$isExactActive;
    return (_link$isExactActive = link.isExactActive) == null ? void 0 : _link$isExactActive.value;
  }, (isExactActive) => {
    if (link.isLink.value && isExactActive && select) {
      vue_cjs_prod.nextTick(() => {
        select(true);
      });
    }
  }, {
    immediate: true
  });
}
const stopSymbol = Symbol("rippleStop");
const DELAY_RIPPLE = 80;
function transform(el, value) {
  el.style.transform = value;
  el.style.webkitTransform = value;
}
function opacity(el, value) {
  el.style.opacity = `calc(${value} * var(--v-theme-overlay-multiplier))`;
}
function isTouchEvent(e) {
  return e.constructor.name === "TouchEvent";
}
function isKeyboardEvent(e) {
  return e.constructor.name === "KeyboardEvent";
}
const calculate = function(e, el) {
  var _el$_ripple;
  let value = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  let localX = 0;
  let localY = 0;
  if (!isKeyboardEvent(e)) {
    const offset = el.getBoundingClientRect();
    const target = isTouchEvent(e) ? e.touches[e.touches.length - 1] : e;
    localX = target.clientX - offset.left;
    localY = target.clientY - offset.top;
  }
  let radius = 0;
  let scale = 0.3;
  if ((_el$_ripple = el._ripple) != null && _el$_ripple.circle) {
    scale = 0.15;
    radius = el.clientWidth / 2;
    radius = value.center ? radius : radius + Math.sqrt((localX - radius) ** 2 + (localY - radius) ** 2) / 4;
  } else {
    radius = Math.sqrt(el.clientWidth ** 2 + el.clientHeight ** 2) / 2;
  }
  const centerX = `${(el.clientWidth - radius * 2) / 2}px`;
  const centerY = `${(el.clientHeight - radius * 2) / 2}px`;
  const x = value.center ? centerX : `${localX - radius}px`;
  const y = value.center ? centerY : `${localY - radius}px`;
  return {
    radius,
    scale,
    x,
    y,
    centerX,
    centerY
  };
};
const ripples = {
  show(e, el) {
    var _el$_ripple2;
    let value = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    if (!(el != null && (_el$_ripple2 = el._ripple) != null && _el$_ripple2.enabled)) {
      return;
    }
    const container = document.createElement("span");
    const animation = document.createElement("span");
    container.appendChild(animation);
    container.className = "v-ripple__container";
    if (value.class) {
      container.className += ` ${value.class}`;
    }
    const {
      radius,
      scale,
      x,
      y,
      centerX,
      centerY
    } = calculate(e, el, value);
    const size = `${radius * 2}px`;
    animation.className = "v-ripple__animation";
    animation.style.width = size;
    animation.style.height = size;
    el.appendChild(container);
    const computed2 = window.getComputedStyle(el);
    if (computed2 && computed2.position === "static") {
      el.style.position = "relative";
      el.dataset.previousPosition = "static";
    }
    animation.classList.add("v-ripple__animation--enter");
    animation.classList.add("v-ripple__animation--visible");
    transform(animation, `translate(${x}, ${y}) scale3d(${scale},${scale},${scale})`);
    opacity(animation, 0);
    animation.dataset.activated = String(performance.now());
    setTimeout(() => {
      animation.classList.remove("v-ripple__animation--enter");
      animation.classList.add("v-ripple__animation--in");
      transform(animation, `translate(${centerX}, ${centerY}) scale3d(1,1,1)`);
      opacity(animation, 0.08);
    }, 0);
  },
  hide(el) {
    var _el$_ripple3;
    if (!(el != null && (_el$_ripple3 = el._ripple) != null && _el$_ripple3.enabled))
      return;
    const ripples2 = el.getElementsByClassName("v-ripple__animation");
    if (ripples2.length === 0)
      return;
    const animation = ripples2[ripples2.length - 1];
    if (animation.dataset.isHiding)
      return;
    else
      animation.dataset.isHiding = "true";
    const diff = performance.now() - Number(animation.dataset.activated);
    const delay = Math.max(250 - diff, 0);
    setTimeout(() => {
      animation.classList.remove("v-ripple__animation--in");
      animation.classList.add("v-ripple__animation--out");
      opacity(animation, 0);
      setTimeout(() => {
        const ripples3 = el.getElementsByClassName("v-ripple__animation");
        if (ripples3.length === 1 && el.dataset.previousPosition) {
          el.style.position = el.dataset.previousPosition;
          delete el.dataset.previousPosition;
        }
        animation.parentNode && el.removeChild(animation.parentNode);
      }, 300);
    }, delay);
  }
};
function isRippleEnabled(value) {
  return typeof value === "undefined" || !!value;
}
function rippleShow(e) {
  const value = {};
  const element = e.currentTarget;
  if (!(element != null && element._ripple) || element._ripple.touched || e[stopSymbol])
    return;
  e[stopSymbol] = true;
  if (isTouchEvent(e)) {
    element._ripple.touched = true;
    element._ripple.isTouch = true;
  } else {
    if (element._ripple.isTouch)
      return;
  }
  value.center = element._ripple.centered || isKeyboardEvent(e);
  if (element._ripple.class) {
    value.class = element._ripple.class;
  }
  if (isTouchEvent(e)) {
    if (element._ripple.showTimerCommit)
      return;
    element._ripple.showTimerCommit = () => {
      ripples.show(e, element, value);
    };
    element._ripple.showTimer = window.setTimeout(() => {
      var _element$_ripple;
      if (element != null && (_element$_ripple = element._ripple) != null && _element$_ripple.showTimerCommit) {
        element._ripple.showTimerCommit();
        element._ripple.showTimerCommit = null;
      }
    }, DELAY_RIPPLE);
  } else {
    ripples.show(e, element, value);
  }
}
function rippleStop(e) {
  e[stopSymbol] = true;
}
function rippleHide(e) {
  const element = e.currentTarget;
  if (!element || !element._ripple)
    return;
  window.clearTimeout(element._ripple.showTimer);
  if (e.type === "touchend" && element._ripple.showTimerCommit) {
    element._ripple.showTimerCommit();
    element._ripple.showTimerCommit = null;
    element._ripple.showTimer = window.setTimeout(() => {
      rippleHide(e);
    });
    return;
  }
  window.setTimeout(() => {
    if (element._ripple) {
      element._ripple.touched = false;
    }
  });
  ripples.hide(element);
}
function rippleCancelShow(e) {
  const element = e.currentTarget;
  if (!element || !element._ripple)
    return;
  if (element._ripple.showTimerCommit) {
    element._ripple.showTimerCommit = null;
  }
  window.clearTimeout(element._ripple.showTimer);
}
let keyboardRipple = false;
function keyboardRippleShow(e) {
  if (!keyboardRipple && (e.keyCode === keyCodes.enter || e.keyCode === keyCodes.space)) {
    keyboardRipple = true;
    rippleShow(e);
  }
}
function keyboardRippleHide(e) {
  keyboardRipple = false;
  rippleHide(e);
}
function focusRippleHide(e) {
  if (keyboardRipple) {
    keyboardRipple = false;
    rippleHide(e);
  }
}
function updateRipple(el, binding, wasEnabled) {
  var _el$_ripple4;
  const {
    value,
    modifiers
  } = binding;
  const enabled = isRippleEnabled(value);
  if (!enabled) {
    ripples.hide(el);
  }
  el._ripple = (_el$_ripple4 = el._ripple) != null ? _el$_ripple4 : {};
  el._ripple.enabled = enabled;
  el._ripple.centered = modifiers.center;
  el._ripple.circle = modifiers.circle;
  if (isObject(value) && value.class) {
    el._ripple.class = value.class;
  }
  if (enabled && !wasEnabled) {
    if (modifiers.stop) {
      el.addEventListener("touchstart", rippleStop, {
        passive: true
      });
      el.addEventListener("mousedown", rippleStop);
      return;
    }
    el.addEventListener("touchstart", rippleShow, {
      passive: true
    });
    el.addEventListener("touchend", rippleHide, {
      passive: true
    });
    el.addEventListener("touchmove", rippleCancelShow, {
      passive: true
    });
    el.addEventListener("touchcancel", rippleHide);
    el.addEventListener("mousedown", rippleShow);
    el.addEventListener("mouseup", rippleHide);
    el.addEventListener("mouseleave", rippleHide);
    el.addEventListener("keydown", keyboardRippleShow);
    el.addEventListener("keyup", keyboardRippleHide);
    el.addEventListener("blur", focusRippleHide);
    el.addEventListener("dragstart", rippleHide, {
      passive: true
    });
  } else if (!enabled && wasEnabled) {
    removeListeners(el);
  }
}
function removeListeners(el) {
  el.removeEventListener("mousedown", rippleShow);
  el.removeEventListener("touchstart", rippleShow);
  el.removeEventListener("touchend", rippleHide);
  el.removeEventListener("touchmove", rippleCancelShow);
  el.removeEventListener("touchcancel", rippleHide);
  el.removeEventListener("mouseup", rippleHide);
  el.removeEventListener("mouseleave", rippleHide);
  el.removeEventListener("keydown", keyboardRippleShow);
  el.removeEventListener("keyup", keyboardRippleHide);
  el.removeEventListener("dragstart", rippleHide);
  el.removeEventListener("blur", focusRippleHide);
}
function mounted$4(el, binding) {
  updateRipple(el, binding, false);
}
function unmounted$4(el) {
  delete el._ripple;
  removeListeners(el);
}
function updated$1(el, binding) {
  if (binding.value === binding.oldValue) {
    return;
  }
  const wasEnabled = isRippleEnabled(binding.oldValue);
  updateRipple(el, binding, wasEnabled);
}
const Ripple = {
  mounted: mounted$4,
  unmounted: unmounted$4,
  updated: updated$1
};
const VBtn = defineComponent({
  name: "VBtn",
  directives: {
    Ripple
  },
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    active: Boolean,
    symbol: {
      type: null,
      default: VBtnToggleSymbol
    },
    flat: Boolean,
    icon: [Boolean, String, Function, Object],
    prependIcon: IconValue,
    appendIcon: IconValue,
    block: Boolean,
    stacked: Boolean,
    ripple: {
      type: Boolean,
      default: true
    }
  }, makeBorderProps()), makeRoundedProps()), makeDensityProps()), makeDimensionProps()), makeElevationProps()), makeGroupItemProps()), makeLocationProps()), makePositionProps()), makeRouterProps()), makeSizeProps()), makeTagProps({
    tag: "button"
  })), makeThemeProps()), makeVariantProps({
    variant: "contained"
  })),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      sizeClasses
    } = useSize(props);
    const group = useGroupItem(props, props.symbol, false);
    const link = useLink(props, attrs);
    const isDisabled = vue_cjs_prod.computed(() => (group == null ? void 0 : group.disabled.value) || props.disabled);
    const isElevated = vue_cjs_prod.computed(() => {
      return props.variant === "contained" && !(props.disabled || props.flat || props.border);
    });
    useSelectLink(link, group == null ? void 0 : group.select);
    return () => {
      var _slots$default;
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasColor = !group || group.isSelected.value;
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(Tag, {
        "type": Tag === "a" ? void 0 : "button",
        "class": ["v-btn", group == null ? void 0 : group.selectedClass.value, {
          "v-btn--active": props.active,
          "v-btn--block": props.block,
          "v-btn--disabled": isDisabled.value,
          "v-btn--elevated": isElevated.value,
          "v-btn--flat": props.flat,
          "v-btn--icon": !!props.icon,
          "v-btn--stacked": props.stacked
        }, themeClasses.value, borderClasses.value, hasColor ? colorClasses.value : void 0, densityClasses.value, elevationClasses.value, positionClasses.value, roundedClasses.value, sizeClasses.value, variantClasses.value],
        "style": [hasColor ? colorStyles.value : void 0, dimensionStyles.value, locationStyles.value],
        "disabled": isDisabled.value || void 0,
        "href": link.href.value,
        "onClick": (e) => {
          var _link$navigate;
          if (isDisabled.value)
            return;
          (_link$navigate = link.navigate) == null ? void 0 : _link$navigate.call(link, e);
          group == null ? void 0 : group.toggle();
        }
      }, {
        default: () => [genOverlays(true, "v-btn"), !props.icon && props.prependIcon && vue_cjs_prod.createVNode(VIcon, {
          "class": "v-btn__icon",
          "icon": props.prependIcon,
          "start": true
        }, null), vue_cjs_prod.createVNode("div", {
          "class": "v-btn__content",
          "data-no-activator": ""
        }, [typeof props.icon === "boolean" ? (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots) : vue_cjs_prod.createVNode(VIcon, {
          "class": "v-btn__icon",
          "icon": props.icon,
          "size": props.size
        }, null)]), !props.icon && props.appendIcon && vue_cjs_prod.createVNode(VIcon, {
          "class": "v-btn__icon",
          "icon": props.appendIcon,
          "end": true
        }, null)]
      }), [[vue_cjs_prod.resolveDirective("ripple"), !isDisabled.value && props.ripple, null]]);
    };
  }
});
const VAppBarNavIcon = defineComponent({
  name: "VAppBarNavIcon",
  props: {
    icon: {
      type: IconValue,
      default: "$menu"
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode(VBtn, {
        "class": "v-app-bar-nav-icon",
        "icon": props.icon
      }, {
        default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
      });
    };
  }
});
const VToolbarItems = defineComponent({
  name: "VToolbarItems",
  props: __spreadValues({}, makeVariantProps({
    variant: "contained-text"
  })),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    provideDefaults({
      VBtn: {
        color: vue_cjs_prod.toRef(props, "color"),
        variant: vue_cjs_prod.toRef(props, "variant")
      }
    });
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
    };
  }
});
const VAppBarTitle = defineComponent({
  name: "VAppBarTitle",
  props: __spreadValues({}, VToolbarTitle.props),
  setup(_, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(VToolbarTitle, {
      "class": "v-app-bar-title"
    }, slots);
  }
});
const VAlertTitle = createSimpleFunctional("v-alert-title");
const allowedTypes = ["success", "info", "warning", "error"];
const VAlert = defineComponent({
  name: "VAlert",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    border: {
      type: [Boolean, String],
      validator: (val) => {
        return typeof val === "boolean" || ["top", "end", "bottom", "start"].includes(val);
      }
    },
    borderColor: String,
    closable: Boolean,
    closeIcon: {
      type: IconValue,
      default: "$close"
    },
    closeLabel: {
      type: String,
      default: "$vuetify.close"
    },
    icon: {
      type: [Boolean, String, Function, Object],
      default: null
    },
    modelValue: {
      type: Boolean,
      default: true
    },
    prominent: Boolean,
    title: String,
    text: String,
    type: {
      type: String,
      validator: (val) => allowedTypes.includes(val)
    }
  }, makeDensityProps()), makeDimensionProps()), makeElevationProps()), makeLocationProps()), makePositionProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()), makeVariantProps({
    variant: "contained-flat"
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const icon = vue_cjs_prod.computed(() => {
      var _props$icon;
      if (props.icon === false)
        return void 0;
      if (!props.type)
        return props.icon;
      return (_props$icon = props.icon) != null ? _props$icon : `$${props.type}`;
    });
    const variantProps = vue_cjs_prod.computed(() => {
      var _props$color;
      return {
        color: (_props$color = props.color) != null ? _props$color : props.type,
        variant: props.variant
      };
    });
    const {
      themeClasses
    } = provideTheme(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(variantProps);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "borderColor"));
    function onCloseClick(e) {
      isActive.value = false;
    }
    return () => {
      var _slots$default;
      const hasPrepend = !!(slots.prepend || icon.value);
      const hasTitle = !!(slots.title || props.title);
      const hasText = !!(props.text || slots.text);
      const hasClose = !!(slots.close || props.closable);
      return isActive.value && vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-alert", props.border && {
          "v-alert--border": !!props.border,
          [`v-alert--border-${props.border === true ? "start" : props.border}`]: true
        }, {
          "v-alert--prominent": props.prominent
        }, themeClasses.value, colorClasses.value, densityClasses.value, elevationClasses.value, positionClasses.value, roundedClasses.value, variantClasses.value],
        "style": [colorStyles.value, dimensionStyles.value, locationStyles.value],
        "role": "alert"
      }, {
        default: () => [genOverlays(false, "v-alert"), props.border && vue_cjs_prod.createVNode("div", {
          "class": ["v-alert__border", textColorClasses.value],
          "style": textColorStyles.value
        }, null), hasPrepend && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VIcon: {
              density: props.density,
              icon: icon.value,
              size: props.prominent ? 44 : "default"
            }
          }
        }, {
          default: () => [vue_cjs_prod.createVNode("div", {
            "class": "v-alert__prepend"
          }, [slots.prepend ? slots.prepend() : icon.value && vue_cjs_prod.createVNode(VIcon, null, null)])]
        }), vue_cjs_prod.createVNode("div", {
          "class": "v-alert__content"
        }, [hasTitle && vue_cjs_prod.createVNode(VAlertTitle, null, {
          default: () => [slots.title ? slots.title() : props.title]
        }), hasText && (slots.text ? slots.text() : props.text), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]), slots.append && vue_cjs_prod.createVNode("div", {
          "class": "v-alert__append"
        }, [slots.append()]), hasClose && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VIcon: {
              icon: props.closeIcon,
              size: "small"
            }
          }
        }, {
          default: () => [vue_cjs_prod.createVNode("div", {
            "class": "v-alert__close",
            "onClick": onCloseClick
          }, [slots.close ? slots.close() : vue_cjs_prod.createVNode(VIcon, null, null)])]
        })]
      });
    };
  }
});
const makeVAvatarProps = propsFactory(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
  color: String,
  start: Boolean,
  end: Boolean,
  icon: IconValue,
  image: String
}, makeDensityProps()), makeRoundedProps()), makeSizeProps()), makeTagProps()));
const VAvatar = defineComponent({
  name: "VAvatar",
  props: makeVAvatarProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      densityClasses
    } = useDensity(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props);
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-avatar", {
          "v-avatar--start": props.start,
          "v-avatar--end": props.end
        }, backgroundColorClasses.value, densityClasses.value, roundedClasses.value, sizeClasses.value],
        "style": [backgroundColorStyles.value, sizeStyles.value]
      }, {
        default: () => [props.image ? vue_cjs_prod.createVNode(VImg, {
          "src": props.image,
          "alt": ""
        }, null) : props.icon ? vue_cjs_prod.createVNode(VIcon, {
          "icon": props.icon
        }, null) : (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
      });
    });
    return {};
  }
});
const VChipGroupSymbol = Symbol.for("vuetify:v-chip-group");
const VChipGroup = defineComponent({
  name: "VChipGroup",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues({
    column: Boolean,
    filter: Boolean,
    valueComparator: {
      type: Function,
      default: deepEqual
    }
  }, makeGroupProps({
    selectedClass: "v-chip--selected"
  })), makeTagProps()), makeThemeProps()), makeVariantProps({
    variant: "contained-text"
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      isSelected,
      select,
      next,
      prev,
      selected
    } = useGroup(props, VChipGroupSymbol);
    provideDefaults({
      VChip: {
        color: vue_cjs_prod.toRef(props, "color"),
        filter: vue_cjs_prod.toRef(props, "filter"),
        variant: vue_cjs_prod.toRef(props, "variant")
      }
    });
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-chip-group", {
          "v-chip-group--column": props.column
        }, themeClasses.value]
      }, {
        default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
          isSelected,
          select,
          next,
          prev,
          selected: selected.value
        })]
      });
    };
  }
});
const VChip = defineComponent({
  name: "VChip",
  directives: {
    Ripple
  },
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    activeClass: String,
    appendAvatar: String,
    appendIcon: IconValue,
    closable: Boolean,
    closeIcon: {
      type: IconValue,
      default: "$delete"
    },
    closeLabel: {
      type: String,
      default: "$vuetify.close"
    },
    draggable: Boolean,
    filter: Boolean,
    filterIcon: {
      type: String,
      default: "$complete"
    },
    label: Boolean,
    link: Boolean,
    pill: Boolean,
    prependAvatar: String,
    prependIcon: IconValue,
    ripple: {
      type: Boolean,
      default: true
    },
    text: String,
    modelValue: {
      type: Boolean,
      default: true
    }
  }, makeBorderProps()), makeDensityProps()), makeElevationProps()), makeGroupItemProps()), makeRoundedProps()), makeRouterProps()), makeSizeProps()), makeTagProps({
    tag: "span"
  })), makeThemeProps()), makeVariantProps({
    variant: "contained-text"
  })),
  emits: {
    "click:close": (e) => true,
    "update:active": (value) => true,
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      elevationClasses
    } = useElevation(props);
    const group = useGroupItem(props, VChipGroupSymbol, false);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      sizeClasses
    } = useSize(props);
    const {
      densityClasses
    } = useDensity(props);
    const link = useLink(props, attrs);
    function onCloseClick(e) {
      isActive.value = false;
      emit("click:close", e);
    }
    return () => {
      var _slots$default, _slots$default2;
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasAppend = !!(slots.append || props.appendIcon || props.appendAvatar);
      const hasClose = !!(slots.close || props.closable);
      const hasFilter = !!(slots.filter || props.filter) && group;
      const hasPrepend = !!(slots.prepend || props.prependIcon || props.prependAvatar);
      const hasColor = !group || group.isSelected.value;
      const isClickable = !props.disabled && (!!group || link.isClickable.value || props.link);
      const onClickFunc = props.link ? props.link : group == null ? void 0 : group.toggle;
      return isActive.value && vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(Tag, {
        "class": ["v-chip", {
          "v-chip--disabled": props.disabled,
          "v-chip--label": props.label,
          "v-chip--link": isClickable,
          "v-chip--pill": props.pill
        }, themeClasses.value, borderClasses.value, hasColor ? colorClasses.value : void 0, densityClasses.value, elevationClasses.value, roundedClasses.value, sizeClasses.value, variantClasses.value, group == null ? void 0 : group.selectedClass.value],
        "style": [hasColor ? colorStyles.value : void 0],
        "disabled": props.disabled || void 0,
        "draggable": props.draggable,
        "href": link.href.value,
        "onClick": isClickable && onClickFunc
      }, {
        default: () => [genOverlays(isClickable, "v-chip"), hasFilter && vue_cjs_prod.createVNode(VExpandXTransition, null, {
          default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
            "class": "v-chip__filter"
          }, [slots.filter ? slots.filter() : vue_cjs_prod.createVNode(VIcon, {
            "icon": props.filterIcon
          }, null)]), [[vue_cjs_prod.vShow, group.isSelected.value]])]
        }), hasPrepend && vue_cjs_prod.createVNode("div", {
          "class": "v-chip__prepend"
        }, [slots.prepend ? slots.prepend() : vue_cjs_prod.createVNode(VAvatar, {
          "icon": props.prependIcon,
          "image": props.prependAvatar,
          "size": props.size
        }, null)]), (_slots$default = (_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots, {
          isSelected: group == null ? void 0 : group.isSelected.value,
          selectedClass: group == null ? void 0 : group.selectedClass.value,
          select: group == null ? void 0 : group.select,
          toggle: group == null ? void 0 : group.toggle,
          value: group == null ? void 0 : group.value.value,
          disabled: props.disabled
        })) != null ? _slots$default : props.text, hasAppend && vue_cjs_prod.createVNode("div", {
          "class": "v-chip__append"
        }, [slots.append ? slots.append() : vue_cjs_prod.createVNode(VAvatar, {
          "icon": props.appendIcon,
          "image": props.appendAvatar,
          "size": props.size
        }, null)]), hasClose && vue_cjs_prod.createVNode("div", {
          "class": "v-chip__close",
          "onClick": onCloseClick
        }, [slots.close ? slots.close({
          props: {
            onClick: onCloseClick
          }
        }) : vue_cjs_prod.createVNode(VIcon, {
          "icon": props.closeIcon,
          "size": "x-small"
        }, null)])]
      }), [[vue_cjs_prod.resolveDirective("ripple"), isClickable && props.ripple, null]]);
    };
  }
});
const VDivider = defineComponent({
  name: "VDivider",
  props: __spreadValues({
    color: String,
    inset: Boolean,
    length: [Number, String],
    thickness: [Number, String],
    vertical: Boolean
  }, makeThemeProps()),
  setup(props, _ref) {
    let {
      attrs
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const dividerStyles = vue_cjs_prod.computed(() => {
      const styles = {};
      if (props.length) {
        styles[props.vertical ? "maxHeight" : "maxWidth"] = convertToUnit(props.length);
      }
      if (props.thickness) {
        styles[props.vertical ? "borderRightWidth" : "borderTopWidth"] = convertToUnit(props.thickness);
      }
      return styles;
    });
    return () => {
      return vue_cjs_prod.createVNode("hr", {
        "class": [{
          "v-divider": true,
          "v-divider--inset": props.inset,
          "v-divider--vertical": props.vertical
        }, themeClasses.value, backgroundColorClasses.value],
        "style": [dividerStyles.value, backgroundColorStyles.value],
        "aria-orientation": !attrs.role || attrs.role === "separator" ? props.vertical ? "vertical" : "horizontal" : void 0,
        "role": `${attrs.role || "separator"}`
      }, null);
    };
  }
});
const ListKey = Symbol.for("vuetify:list");
function createList() {
  const parent = vue_cjs_prod.inject(ListKey, {
    hasPrepend: vue_cjs_prod.ref(false),
    updateHasPrepend: () => null
  });
  const data = {
    hasPrepend: vue_cjs_prod.ref(false),
    updateHasPrepend: (value) => {
      if (value)
        data.hasPrepend.value = value;
    }
  };
  vue_cjs_prod.provide(ListKey, data);
  return parent;
}
function useList() {
  return vue_cjs_prod.inject(ListKey, null);
}
const singleOpenStrategy = {
  open: (_ref) => {
    let {
      id,
      value,
      opened,
      parents
    } = _ref;
    if (value) {
      const newOpened = /* @__PURE__ */ new Set();
      newOpened.add(id);
      let parent = parents.get(id);
      while (parent != null) {
        newOpened.add(parent);
        parent = parents.get(parent);
      }
      return newOpened;
    } else {
      opened.delete(id);
      return opened;
    }
  },
  select: () => null
};
const multipleOpenStrategy = {
  open: (_ref2) => {
    let {
      id,
      value,
      opened,
      parents
    } = _ref2;
    if (value) {
      let parent = parents.get(id);
      opened.add(id);
      while (parent != null && parent !== id) {
        opened.add(parent);
        parent = parents.get(parent);
      }
      return opened;
    } else {
      opened.delete(id);
    }
    return opened;
  },
  select: () => null
};
const listOpenStrategy = {
  open: multipleOpenStrategy.open,
  select: (_ref3) => {
    let {
      id,
      value,
      opened,
      parents
    } = _ref3;
    if (!value)
      return opened;
    const path = [];
    let parent = parents.get(id);
    while (parent != null) {
      path.push(parent);
      parent = parents.get(parent);
    }
    return new Set(path);
  }
};
const independentSelectStrategy = (mandatory) => {
  const strategy = {
    select: (_ref) => {
      let {
        id,
        value,
        selected
      } = _ref;
      if (mandatory && !value) {
        const on = Array.from(selected.entries()).reduce((arr, _ref2) => {
          let [key, value2] = _ref2;
          return value2 === "on" ? [...arr, key] : arr;
        }, []);
        if (on.length === 1 && on[0] === id)
          return selected;
      }
      selected.set(id, value ? "on" : "off");
      return selected;
    },
    in: (v, children, parents) => {
      let map = /* @__PURE__ */ new Map();
      for (const id of v || []) {
        map = strategy.select({
          id,
          value: true,
          selected: new Map(map),
          children,
          parents
        });
      }
      return map;
    },
    out: (v) => {
      const arr = [];
      for (const [key, value] of v.entries()) {
        if (value === "on")
          arr.push(key);
      }
      return arr;
    }
  };
  return strategy;
};
const independentSingleSelectStrategy = (mandatory) => {
  const parentStrategy = independentSelectStrategy(mandatory);
  const strategy = {
    select: (_ref3) => {
      let _a = _ref3, {
        selected,
        id
      } = _a, rest = __objRest(_a, [
        "selected",
        "id"
      ]);
      const singleSelected = selected.has(id) ? /* @__PURE__ */ new Map([[id, selected.get(id)]]) : /* @__PURE__ */ new Map();
      return parentStrategy.select(__spreadProps(__spreadValues({}, rest), {
        id,
        selected: singleSelected
      }));
    },
    in: (v, children, parents) => {
      let map = /* @__PURE__ */ new Map();
      if (v != null && v.length) {
        map = parentStrategy.in(v.slice(0, 1), children, parents);
      }
      return map;
    },
    out: (v, children, parents) => {
      return parentStrategy.out(v, children, parents);
    }
  };
  return strategy;
};
const leafSelectStrategy = (mandatory) => {
  const parentStrategy = independentSelectStrategy(mandatory);
  const strategy = {
    select: (_ref4) => {
      let _a = _ref4, {
        id,
        selected,
        children
      } = _a, rest = __objRest(_a, [
        "id",
        "selected",
        "children"
      ]);
      if (children.has(id))
        return selected;
      return parentStrategy.select(__spreadValues({
        id,
        selected,
        children
      }, rest));
    },
    in: parentStrategy.in,
    out: parentStrategy.out
  };
  return strategy;
};
const leafSingleSelectStrategy = (mandatory) => {
  const parentStrategy = independentSingleSelectStrategy(mandatory);
  const strategy = {
    select: (_ref5) => {
      let _a = _ref5, {
        id,
        selected,
        children
      } = _a, rest = __objRest(_a, [
        "id",
        "selected",
        "children"
      ]);
      if (children.has(id))
        return selected;
      return parentStrategy.select(__spreadValues({
        id,
        selected,
        children
      }, rest));
    },
    in: parentStrategy.in,
    out: parentStrategy.out
  };
  return strategy;
};
const classicSelectStrategy = (mandatory) => {
  const strategy = {
    select: (_ref6) => {
      let {
        id,
        value,
        selected,
        children,
        parents
      } = _ref6;
      const original = new Map(selected);
      const items = [id];
      while (items.length) {
        const item = items.shift();
        selected.set(item, value ? "on" : "off");
        if (children.has(item)) {
          items.push(...children.get(item));
        }
      }
      let parent = parents.get(id);
      while (parent) {
        const childrenIds = children.get(parent);
        const everySelected = childrenIds.every((cid) => selected.get(cid) === "on");
        const noneSelected = childrenIds.every((cid) => !selected.has(cid) || selected.get(cid) === "off");
        selected.set(parent, everySelected ? "on" : noneSelected ? "off" : "indeterminate");
        parent = parents.get(parent);
      }
      if (mandatory && !value) {
        const on = Array.from(selected.entries()).reduce((arr, _ref7) => {
          let [key, value2] = _ref7;
          return value2 === "on" ? [...arr, key] : arr;
        }, []);
        if (on.length === 0)
          return original;
      }
      return selected;
    },
    in: (v, children, parents) => {
      let map = /* @__PURE__ */ new Map();
      for (const id of v || []) {
        map = strategy.select({
          id,
          value: true,
          selected: new Map(map),
          children,
          parents
        });
      }
      return map;
    },
    out: (v, children) => {
      const arr = [];
      for (const [key, value] of v.entries()) {
        if (value === "on" && !children.has(key))
          arr.push(key);
      }
      return arr;
    }
  };
  return strategy;
};
const VNestedSymbol = Symbol.for("vuetify:nested");
const emptyNested = {
  id: vue_cjs_prod.ref(),
  root: {
    register: () => null,
    unregister: () => null,
    parents: vue_cjs_prod.ref(/* @__PURE__ */ new Map()),
    children: vue_cjs_prod.ref(/* @__PURE__ */ new Map()),
    open: () => null,
    select: () => null,
    opened: vue_cjs_prod.ref(/* @__PURE__ */ new Set()),
    selected: vue_cjs_prod.ref(/* @__PURE__ */ new Map()),
    selectedValues: vue_cjs_prod.ref([])
  }
};
const makeNestedProps = propsFactory({
  selectStrategy: [String, Function],
  openStrategy: [String, Function],
  opened: Array,
  selected: Array,
  mandatory: Boolean
}, "nested");
const useNested = (props) => {
  let isUnmounted = false;
  const children = vue_cjs_prod.ref(/* @__PURE__ */ new Map());
  const parents = vue_cjs_prod.ref(/* @__PURE__ */ new Map());
  const opened = useProxiedModel(props, "opened", props.opened, (v) => new Set(v), (v) => [...v.values()]);
  const selectStrategy = vue_cjs_prod.computed(() => {
    if (typeof props.selectStrategy === "object")
      return props.selectStrategy;
    switch (props.selectStrategy) {
      case "single-leaf":
        return leafSingleSelectStrategy(props.mandatory);
      case "leaf":
        return leafSelectStrategy(props.mandatory);
      case "independent":
        return independentSelectStrategy(props.mandatory);
      case "single-independent":
        return independentSingleSelectStrategy(props.mandatory);
      case "classic":
      default:
        return classicSelectStrategy(props.mandatory);
    }
  });
  const openStrategy = vue_cjs_prod.computed(() => {
    if (typeof props.openStrategy === "function")
      return props.openStrategy;
    switch (props.openStrategy) {
      case "list":
        return listOpenStrategy;
      case "single":
        return singleOpenStrategy;
      case "multiple":
      default:
        return multipleOpenStrategy;
    }
  });
  const selected = useProxiedModel(props, "selected", props.selected, (v) => selectStrategy.value.in(v, children.value, parents.value), (v) => selectStrategy.value.out(v, children.value, parents.value));
  vue_cjs_prod.onBeforeUnmount(() => {
    isUnmounted = true;
  });
  function getPath(id) {
    const path = [];
    let parent = id;
    while (parent != null) {
      path.unshift(parent);
      parent = parents.value.get(parent);
    }
    return path;
  }
  const vm = getCurrentInstance("nested");
  const nested = {
    id: vue_cjs_prod.ref(),
    root: {
      opened,
      selected,
      selectedValues: vue_cjs_prod.computed(() => {
        const arr = [];
        for (const [key, value] of selected.value.entries()) {
          if (value === "on")
            arr.push(key);
        }
        return arr;
      }),
      register: (id, parentId, isGroup) => {
        parentId && id !== parentId && parents.value.set(id, parentId);
        isGroup && children.value.set(id, []);
        if (parentId != null) {
          children.value.set(parentId, [...children.value.get(parentId) || [], id]);
        }
      },
      unregister: (id) => {
        if (isUnmounted)
          return;
        children.value.delete(id);
        const parent = parents.value.get(id);
        if (parent) {
          var _children$value$get;
          const list = (_children$value$get = children.value.get(parent)) != null ? _children$value$get : [];
          children.value.set(parent, list.filter((child) => child !== id));
        }
        parents.value.delete(id);
        opened.value.delete(id);
      },
      open: (id, value, event) => {
        vm.emit("click:open", {
          id,
          value,
          path: getPath(id),
          event
        });
        const newOpened = openStrategy.value.open({
          id,
          value,
          opened: new Set(opened.value),
          children: children.value,
          parents: parents.value,
          event
        });
        newOpened && (opened.value = newOpened);
      },
      select: (id, value, event) => {
        vm.emit("click:select", {
          id,
          value,
          path: getPath(id),
          event
        });
        const newSelected = selectStrategy.value.select({
          id,
          value,
          selected: new Map(selected.value),
          children: children.value,
          parents: parents.value,
          event
        });
        newSelected && (selected.value = newSelected);
        const newOpened = openStrategy.value.select({
          id,
          value,
          selected: new Map(selected.value),
          opened: new Set(opened.value),
          children: children.value,
          parents: parents.value,
          event
        });
        newOpened && (opened.value = newOpened);
      },
      children,
      parents
    }
  };
  vue_cjs_prod.provide(VNestedSymbol, nested);
  return nested.root;
};
const useNestedItem = (id, isGroup) => {
  const parent = vue_cjs_prod.inject(VNestedSymbol, emptyNested);
  const computedId = vue_cjs_prod.computed(() => {
    var _id$value;
    return (_id$value = id.value) != null ? _id$value : getUid().toString();
  });
  const item = __spreadProps(__spreadValues({}, parent), {
    id: computedId,
    open: (open, e) => parent.root.open(computedId.value, open, e),
    isOpen: vue_cjs_prod.computed(() => parent.root.opened.value.has(computedId.value)),
    parent: vue_cjs_prod.computed(() => parent.root.parents.value.get(computedId.value)),
    select: (selected, e) => parent.root.select(computedId.value, selected, e),
    isSelected: vue_cjs_prod.computed(() => parent.root.selected.value.get(computedId.value) === "on"),
    isIndeterminate: vue_cjs_prod.computed(() => parent.root.selected.value.get(computedId.value) === "indeterminate"),
    isLeaf: vue_cjs_prod.computed(() => !parent.root.children.value.get(computedId.value)),
    isGroupActivator: parent.isGroupActivator
  });
  !parent.isGroupActivator && parent.root.register(computedId.value, parent.id.value, isGroup);
  vue_cjs_prod.onBeforeUnmount(() => {
    !parent.isGroupActivator && parent.root.unregister(computedId.value);
  });
  isGroup && vue_cjs_prod.provide(VNestedSymbol, item);
  return item;
};
const useNestedGroupActivator = () => {
  const parent = vue_cjs_prod.inject(VNestedSymbol, emptyNested);
  vue_cjs_prod.provide(VNestedSymbol, __spreadProps(__spreadValues({}, parent), {
    isGroupActivator: true
  }));
};
const VListGroupActivator = defineComponent({
  name: "VListGroupActivator",
  setup(_, _ref) {
    let {
      slots
    } = _ref;
    useNestedGroupActivator();
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
    };
  }
});
const VListGroup = genericComponent()({
  name: "VListGroup",
  props: __spreadValues({
    activeColor: String,
    color: String,
    collapseIcon: {
      type: IconValue,
      default: "$collapse"
    },
    expandIcon: {
      type: IconValue,
      default: "$expand"
    },
    value: null
  }, makeTagProps()),
  setup(props, _ref2) {
    let {
      slots
    } = _ref2;
    const {
      isOpen,
      open
    } = useNestedItem(vue_cjs_prod.toRef(props, "value"), true);
    const list = useList();
    const onClick = (e) => {
      open(!isOpen.value, e);
    };
    const activatorProps = vue_cjs_prod.computed(() => {
      var _props$activeColor;
      return {
        onClick,
        active: isOpen.value,
        appendIcon: isOpen.value ? props.collapseIcon : props.expandIcon,
        class: "v-list-group__header",
        color: isOpen.value ? (_props$activeColor = props.activeColor) != null ? _props$activeColor : props.color : void 0
      };
    });
    return () => {
      var _slots$default2;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-list-group", {
          "v-list-group--prepend": list == null ? void 0 : list.hasPrepend.value
        }]
      }, {
        default: () => [slots.activator && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VListItemIcon: {
              color: activatorProps.value.color
            }
          }
        }, {
          default: () => [vue_cjs_prod.createVNode(VListGroupActivator, null, {
            default: () => [slots.activator({
              props: activatorProps.value,
              isOpen
            })]
          })]
        }), vue_cjs_prod.createVNode(VExpandTransition, null, {
          default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
            "class": "v-list-group__items"
          }, [(_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots)]), [[vue_cjs_prod.vShow, isOpen.value]])]
        })]
      });
    };
  }
});
const VListItemAvatar = defineComponent({
  name: "VListItemAvatar",
  props: makeVAvatarProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(VAvatar, vue_cjs_prod.mergeProps({
      "class": ["v-list-item-avatar", {
        "v-list-item-avatar--start": props.start,
        "v-list-item-avatar--end": props.end
      }]
    }, props), slots);
  }
});
const VListItemHeader = createSimpleFunctional("v-list-item-header");
const VListItemIcon = defineComponent({
  name: "VListItemIcon",
  props: makeVIconProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(VIcon, vue_cjs_prod.mergeProps({
      "class": ["v-list-item-icon", {
        "v-list-item-icon--start": props.start,
        "v-list-item-icon--end": props.end
      }]
    }, props), slots);
  }
});
const VListItemSubtitle = createSimpleFunctional("v-list-item-subtitle");
const VListItemTitle = createSimpleFunctional("v-list-item-title");
const VListItem = genericComponent()({
  name: "VListItem",
  directives: {
    Ripple
  },
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    active: Boolean,
    activeColor: String,
    activeClass: String,
    appendAvatar: String,
    appendIcon: IconValue,
    disabled: Boolean,
    lines: String,
    nav: Boolean,
    prependAvatar: String,
    prependIcon: IconValue,
    subtitle: [String, Number, Boolean],
    title: [String, Number, Boolean],
    value: null,
    link: Boolean
  }, makeBorderProps()), makeDensityProps()), makeDimensionProps()), makeElevationProps()), makeRoundedProps()), makeRouterProps()), makeTagProps()), makeThemeProps()), makeVariantProps({
    variant: "text"
  })),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const link = useLink(props, attrs);
    const id = vue_cjs_prod.computed(() => {
      var _props$value;
      return (_props$value = props.value) != null ? _props$value : link.href.value;
    });
    const {
      select,
      isSelected,
      isIndeterminate,
      isGroupActivator,
      root,
      parent
    } = useNestedItem(id, false);
    const list = useList();
    const isActive = vue_cjs_prod.computed(() => {
      var _link$isExactActive;
      return props.active || ((_link$isExactActive = link.isExactActive) == null ? void 0 : _link$isExactActive.value) || isSelected.value;
    });
    const roundedProps = vue_cjs_prod.computed(() => props.rounded || props.nav);
    const variantProps = vue_cjs_prod.computed(() => {
      var _props$activeColor;
      return {
        color: isActive.value ? (_props$activeColor = props.activeColor) != null ? _props$activeColor : props.color : props.color,
        variant: props.variant
      };
    });
    vue_cjs_prod.onMounted(() => {
      var _link$isExactActive2;
      if ((_link$isExactActive2 = link.isExactActive) != null && _link$isExactActive2.value && parent.value != null) {
        root.open(parent.value, true);
      }
    });
    vue_cjs_prod.watch(() => {
      var _link$isExactActive3;
      return (_link$isExactActive3 = link.isExactActive) == null ? void 0 : _link$isExactActive3.value;
    }, (val) => {
      if (val && parent.value != null) {
        root.open(parent.value, true);
      }
    });
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(variantProps);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(roundedProps);
    const lineClasses = vue_cjs_prod.computed(() => props.lines ? `v-list-item--${props.lines}-line` : void 0);
    const slotProps = vue_cjs_prod.computed(() => ({
      isActive: isActive.value,
      select,
      isSelected: isSelected.value,
      isIndeterminate: isIndeterminate.value
    }));
    useRender(() => {
      var _slots$prepend, _slots$default, _slots$append;
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasColor = !list || isSelected.value || isActive.value;
      const hasTitle = slots.title || props.title;
      const hasSubtitle = slots.subtitle || props.subtitle;
      const hasHeader = !!(hasTitle || hasSubtitle);
      const hasAppend = !!(slots.append || props.appendAvatar || props.appendIcon);
      const hasPrepend = !!(slots.prepend || props.prependAvatar || props.prependIcon);
      const isClickable = !props.disabled && (props.link || link.isClickable.value || props.value != null && !!list);
      list == null ? void 0 : list.updateHasPrepend(hasPrepend);
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(Tag, {
        "class": ["v-list-item", {
          "v-list-item--active": isActive.value,
          "v-list-item--disabled": props.disabled,
          "v-list-item--link": isClickable,
          "v-list-item--nav": props.nav,
          "v-list-item--prepend": !hasPrepend && (list == null ? void 0 : list.hasPrepend.value),
          [`${props.activeClass}`]: isActive.value
        }, themeClasses.value, borderClasses.value, hasColor ? colorClasses.value : void 0, densityClasses.value, elevationClasses.value, lineClasses.value, roundedClasses.value, variantClasses.value],
        "style": [hasColor ? colorStyles.value : void 0, dimensionStyles.value],
        "href": link.href.value,
        "tabindex": isClickable ? 0 : void 0,
        "onClick": isClickable && ((e) => {
          var _link$navigate;
          if (isGroupActivator)
            return;
          (_link$navigate = link.navigate) == null ? void 0 : _link$navigate.call(link, e);
          props.value != null && select(!isSelected.value, e);
        })
      }, {
        default: () => [genOverlays(isClickable || isActive.value, "v-list-item"), hasPrepend && vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [props.prependAvatar && vue_cjs_prod.createVNode(VListItemAvatar, {
          "image": props.prependAvatar,
          "start": true
        }, null), props.prependIcon && vue_cjs_prod.createVNode(VListItemIcon, {
          "icon": props.prependIcon,
          "start": true
        }, null), (_slots$prepend = slots.prepend) == null ? void 0 : _slots$prepend.call(slots, slotProps.value)]), hasHeader && vue_cjs_prod.createVNode(VListItemHeader, null, {
          default: () => [hasTitle && vue_cjs_prod.createVNode(VListItemTitle, null, {
            default: () => [slots.title ? slots.title({
              title: props.title
            }) : props.title]
          }), hasSubtitle && vue_cjs_prod.createVNode(VListItemSubtitle, null, {
            default: () => [slots.subtitle ? slots.subtitle({
              subtitle: props.subtitle
            }) : props.subtitle]
          })]
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, slotProps.value), hasAppend && vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [(_slots$append = slots.append) == null ? void 0 : _slots$append.call(slots, slotProps.value), props.appendAvatar && vue_cjs_prod.createVNode(VListItemAvatar, {
          "image": props.appendAvatar,
          "end": true
        }, null), props.appendIcon && vue_cjs_prod.createVNode(VListItemIcon, {
          "icon": props.appendIcon,
          "end": true
        }, null)])]
      }), [[vue_cjs_prod.resolveDirective("ripple"), isClickable]]);
    });
  }
});
const VListSubheader = defineComponent({
  name: "VListSubheader",
  props: __spreadValues({
    color: String,
    inset: Boolean,
    sticky: Boolean,
    title: String
  }, makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "color"));
    return () => {
      var _slots$default, _slots$default2;
      const hasText = !!(slots.default || props.title);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-list-subheader", {
          "v-list-subheader--inset": props.inset,
          "v-list-subheader--sticky": props.sticky
        }, textColorClasses.value],
        "style": {
          textColorStyles
        }
      }, {
        default: () => [hasText && vue_cjs_prod.createVNode("div", {
          "class": "v-list-subheader__text"
        }, [(_slots$default = (_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots)) != null ? _slots$default : props.title])]
      });
    };
  }
});
const VListChildren = genericComponent()({
  name: "VListChildren",
  props: {
    items: Array
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    createList();
    return () => {
      var _slots$default, _slots$default2, _props$items;
      return (_slots$default = (_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots)) != null ? _slots$default : (_props$items = props.items) == null ? void 0 : _props$items.map((_ref2) => {
        let {
          children,
          props: itemProps,
          type,
          originalItem: item
        } = _ref2;
        if (type === "divider")
          return vue_cjs_prod.createVNode(VDivider, itemProps, null);
        if (type === "subheader")
          return vue_cjs_prod.createVNode(VListSubheader, itemProps, slots);
        const slotsWithItem = {
          subtitle: slots.subtitle ? (slotProps) => {
            var _slots$subtitle;
            return (_slots$subtitle = slots.subtitle) == null ? void 0 : _slots$subtitle.call(slots, __spreadProps(__spreadValues({}, slotProps), {
              item
            }));
          } : void 0,
          prepend: slots.prepend ? (slotProps) => {
            var _slots$prepend;
            return (_slots$prepend = slots.prepend) == null ? void 0 : _slots$prepend.call(slots, __spreadProps(__spreadValues({}, slotProps), {
              item
            }));
          } : void 0,
          append: slots.append ? (slotProps) => {
            var _slots$append;
            return (_slots$append = slots.append) == null ? void 0 : _slots$append.call(slots, __spreadProps(__spreadValues({}, slotProps), {
              item
            }));
          } : void 0,
          default: slots.default ? (slotProps) => {
            var _slots$default3;
            return (_slots$default3 = slots.default) == null ? void 0 : _slots$default3.call(slots, __spreadProps(__spreadValues({}, slotProps), {
              item
            }));
          } : void 0,
          title: slots.title ? (slotProps) => {
            var _slots$title;
            return (_slots$title = slots.title) == null ? void 0 : _slots$title.call(slots, __spreadProps(__spreadValues({}, slotProps), {
              item
            }));
          } : void 0
        };
        return children ? vue_cjs_prod.createVNode(VListGroup, {
          "value": itemProps == null ? void 0 : itemProps.value
        }, {
          activator: (_ref3) => {
            let {
              props: activatorProps
            } = _ref3;
            return slots.header ? slots.header(__spreadValues(__spreadValues({}, itemProps), activatorProps)) : vue_cjs_prod.createVNode(VListItem, vue_cjs_prod.mergeProps(itemProps, activatorProps), slotsWithItem);
          },
          default: () => vue_cjs_prod.createVNode(VListChildren, {
            "items": children
          }, slots)
        }) : slots.item ? slots.item(itemProps) : vue_cjs_prod.createVNode(VListItem, itemProps, slotsWithItem);
      });
    };
  }
});
const makeItemsProps = propsFactory({
  items: {
    type: Array,
    default: () => []
  },
  itemTitle: {
    type: [String, Array, Function],
    default: "title"
  },
  itemValue: {
    type: [String, Array, Function],
    default: "value"
  },
  itemChildren: {
    type: [Boolean, String, Array, Function],
    default: "children"
  },
  itemProps: {
    type: [Boolean, String, Array, Function],
    default: "props"
  },
  returnObject: Boolean
}, "item");
function transformItem$1(props, item) {
  const title = getPropertyFromItem(item, props.itemTitle, item);
  const value = getPropertyFromItem(item, props.itemValue, title);
  const children = getPropertyFromItem(item, props.itemChildren);
  const itemProps = props.itemProps === true ? pick(item, ["children"])[1] : getPropertyFromItem(item, props.itemProps);
  const _props = __spreadValues({
    title,
    value
  }, itemProps);
  return {
    title: _props.title,
    value: _props.value,
    props: _props,
    children: Array.isArray(children) ? transformItems$1(props, children) : void 0,
    originalItem: item
  };
}
function transformItems$1(props, items) {
  const array = [];
  for (const item of items) {
    array.push(transformItem$1(props, item));
  }
  return array;
}
function useItems(props) {
  const items = vue_cjs_prod.computed(() => transformItems$1(props, props.items));
  function transformIn(value) {
    return value.map((item) => transformItem$1(props, item));
  }
  function transformOut(value) {
    if (props.returnObject)
      return value.map((_ref) => {
        let {
          originalItem: item
        } = _ref;
        return item;
      });
    return value.map((_ref2) => {
      let {
        props: props2
      } = _ref2;
      return props2.value;
    });
  }
  return {
    items,
    transformIn,
    transformOut
  };
}
function transformItem(props, item) {
  const type = getPropertyFromItem(item, props.itemType, "item");
  const title = typeof item === "string" ? item : getPropertyFromItem(item, props.itemTitle);
  const value = getPropertyFromItem(item, props.itemValue, void 0);
  const children = getPropertyFromItem(item, props.itemChildren);
  const itemProps = props.itemProps === true ? pick(item, ["children"])[1] : getPropertyFromItem(item, props.itemProps);
  const _props = __spreadValues({
    title,
    value
  }, itemProps);
  return {
    type,
    title: _props.title,
    value: _props.value,
    props: _props,
    children: type === "item" && children ? transformItems(props, children) : void 0,
    originalItem: item
  };
}
function transformItems(props, items) {
  const array = [];
  for (const item of items) {
    array.push(transformItem(props, item));
  }
  return array;
}
function useListItems(props) {
  const items = vue_cjs_prod.computed(() => transformItems(props, props.items));
  return {
    items
  };
}
const VList = genericComponent()({
  name: "VList",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadProps(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    activeColor: String,
    activeClass: String,
    bgColor: String,
    disabled: Boolean,
    lines: {
      type: [Boolean, String],
      default: "one"
    },
    nav: Boolean
  }, makeNestedProps({
    selectStrategy: "single-leaf",
    openStrategy: "list"
  })), makeBorderProps()), makeDensityProps()), makeDimensionProps()), makeElevationProps()), {
    itemType: {
      type: String,
      default: "type"
    }
  }), makeItemsProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()), makeVariantProps({
    variant: "text"
  })),
  emits: {
    "update:selected": (val) => true,
    "update:opened": (val) => true,
    "click:open": (value) => true,
    "click:select": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      items
    } = useListItems(props);
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "bgColor"));
    const {
      borderClasses
    } = useBorder(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      open,
      select
    } = useNested(props);
    const lineClasses = vue_cjs_prod.computed(() => props.lines ? `v-list--${props.lines}-line` : void 0);
    const activeColor = vue_cjs_prod.toRef(props, "activeColor");
    const color = vue_cjs_prod.toRef(props, "color");
    createList();
    provideDefaults({
      VListGroup: {
        activeColor,
        color
      },
      VListItem: {
        activeClass: vue_cjs_prod.toRef(props, "activeClass"),
        activeColor,
        color,
        density: vue_cjs_prod.toRef(props, "density"),
        disabled: vue_cjs_prod.toRef(props, "disabled"),
        lines: vue_cjs_prod.toRef(props, "lines"),
        nav: vue_cjs_prod.toRef(props, "nav"),
        variant: vue_cjs_prod.toRef(props, "variant")
      }
    });
    useRender(() => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-list", {
          "v-list--disabled": props.disabled,
          "v-list--nav": props.nav
        }, themeClasses.value, backgroundColorClasses.value, borderClasses.value, densityClasses.value, elevationClasses.value, lineClasses.value, roundedClasses.value],
        "style": [backgroundColorStyles.value, dimensionStyles.value]
      }, {
        default: () => [vue_cjs_prod.createVNode(VListChildren, {
          "items": items.value
        }, slots)]
      });
    });
    return {
      open,
      select
    };
  }
});
const VListImg = createSimpleFunctional("v-list-img");
const VListItemAction = defineComponent({
  name: "VListItemAction",
  props: __spreadValues({
    start: Boolean,
    end: Boolean
  }, makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-list-item-action", {
          "v-list-item-action--start": props.start,
          "v-list-item-action--end": props.end
        }]
      }, slots);
    };
  }
});
const VListItemMedia = defineComponent({
  name: "VListItemMedia",
  props: __spreadValues({
    start: Boolean,
    end: Boolean
  }, makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-list-item-media", {
          "v-list-item-media--start": props.start,
          "v-list-item-media--end": props.end
        }]
      }, slots);
    };
  }
});
const makeDelayProps = propsFactory({
  closeDelay: [Number, String],
  openDelay: [Number, String]
}, "delay");
function useDelay(props, cb) {
  const runDelayFactory = (prop) => () => {
    return Promise.resolve(true);
  };
  return {
    runCloseDelay: runDelayFactory(),
    runOpenDelay: runDelayFactory()
  };
}
const VMenuSymbol = Symbol.for("vuetify:v-menu");
const makeActivatorProps = propsFactory(__spreadValues({
  activator: [String, Object],
  activatorProps: {
    type: Object,
    default: () => ({})
  },
  openOnClick: {
    type: Boolean,
    default: void 0
  },
  openOnHover: Boolean,
  openOnFocus: {
    type: Boolean,
    default: void 0
  },
  closeOnContentClick: Boolean
}, makeDelayProps()));
function useActivator(props, _ref) {
  let {
    isActive,
    isTop
  } = _ref;
  const activatorEl = vue_cjs_prod.ref();
  let isHovered = false;
  const openOnFocus = vue_cjs_prod.computed(() => props.openOnFocus || props.openOnFocus == null && props.openOnHover);
  const openOnClick = vue_cjs_prod.computed(() => props.openOnClick || props.openOnClick == null && !props.openOnHover && !openOnFocus.value);
  const {
    runOpenDelay,
    runCloseDelay
  } = useDelay();
  const availableEvents = {
    click: (e) => {
      e.stopPropagation();
      activatorEl.value = e.currentTarget || e.target;
      isActive.value = !isActive.value;
    },
    mouseenter: (e) => {
      isHovered = true;
      activatorEl.value = e.currentTarget || e.target;
      runOpenDelay();
    },
    mouseleave: (e) => {
      isHovered = false;
      runCloseDelay();
    },
    focus: (e) => {
      e.stopPropagation();
      activatorEl.value = e.currentTarget || e.target;
      runOpenDelay();
    },
    blur: (e) => {
      e.stopPropagation();
      runCloseDelay();
    }
  };
  const activatorEvents = vue_cjs_prod.computed(() => {
    const events = {};
    if (openOnClick.value) {
      events.click = availableEvents.click;
    }
    if (props.openOnHover) {
      events.mouseenter = availableEvents.mouseenter;
      events.mouseleave = availableEvents.mouseleave;
    }
    if (openOnFocus.value) {
      events.focus = availableEvents.focus;
      events.blur = availableEvents.blur;
    }
    return events;
  });
  const contentEvents = vue_cjs_prod.computed(() => {
    const events = {};
    if (props.openOnHover) {
      events.mouseenter = () => {
        isHovered = true;
        runOpenDelay();
      };
      events.mouseleave = () => {
        isHovered = false;
        runCloseDelay();
      };
    }
    if (props.closeOnContentClick) {
      const menu = vue_cjs_prod.inject(VMenuSymbol, null);
      events.click = () => {
        isActive.value = false;
        menu == null ? void 0 : menu.closeParents();
      };
    }
    return events;
  });
  vue_cjs_prod.watch(isTop, (val) => {
    if (val && props.openOnHover && !isHovered) {
      isActive.value = false;
    }
  });
  const activatorRef = vue_cjs_prod.ref();
  vue_cjs_prod.watchEffect(() => {
    if (!activatorRef.value)
      return;
    vue_cjs_prod.nextTick(() => {
      const activator = activatorRef.value;
      activatorEl.value = isComponentInstance(activator) ? activator.$el : activator;
    });
  });
  const vm = getCurrentInstance("useActivator");
  let scope;
  vue_cjs_prod.watch(() => !!props.activator, (val) => {
    if (val && IN_BROWSER) {
      scope = vue_cjs_prod.effectScope();
      scope.run(() => {
        _useActivator(props, vm, {
          activatorEl,
          activatorEvents
        });
      });
    } else if (scope) {
      scope.stop();
    }
  }, {
    flush: "post",
    immediate: true
  });
  return {
    activatorEl,
    activatorRef,
    activatorEvents,
    contentEvents
  };
}
function _useActivator(props, vm, _ref2) {
  let {
    activatorEl,
    activatorEvents
  } = _ref2;
  vue_cjs_prod.watch(() => props.activator, (val, oldVal) => {
    if (oldVal && val !== oldVal) {
      const activator = getActivator(oldVal);
      activator && unbindActivatorProps(activator);
    }
    if (val) {
      vue_cjs_prod.nextTick(() => bindActivatorProps());
    }
  }, {
    immediate: true
  });
  vue_cjs_prod.watch(() => props.activatorProps, () => {
    bindActivatorProps();
  });
  vue_cjs_prod.onScopeDispose(() => {
    unbindActivatorProps();
  });
  function bindActivatorProps() {
    let el = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getActivator();
    let _props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : props.activatorProps;
    if (!el)
      return;
    Object.entries(activatorEvents.value).forEach((_ref3) => {
      let [name, cb] = _ref3;
      el.addEventListener(name, cb);
    });
    Object.keys(_props).forEach((k) => {
      if (_props[k] == null) {
        el.removeAttribute(k);
      } else {
        el.setAttribute(k, _props[k]);
      }
    });
  }
  function unbindActivatorProps() {
    let el = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : getActivator();
    let _props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : props.activatorProps;
    if (!el)
      return;
    Object.entries(activatorEvents.value).forEach((_ref4) => {
      let [name, cb] = _ref4;
      el.removeEventListener(name, cb);
    });
    Object.keys(_props).forEach((k) => {
      el.removeAttribute(k);
    });
  }
  function getActivator() {
    var _activator;
    let selector = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : props.activator;
    let activator;
    if (selector) {
      if (selector === "parent") {
        var _vm$proxy, _vm$proxy$$el;
        let el = vm == null ? void 0 : (_vm$proxy = vm.proxy) == null ? void 0 : (_vm$proxy$$el = _vm$proxy.$el) == null ? void 0 : _vm$proxy$$el.parentNode;
        while (el.hasAttribute("data-no-activator")) {
          el = el.parentNode;
        }
        activator = el;
      } else if (typeof selector === "string") {
        activator = document.querySelector(selector);
      } else if ("$el" in selector) {
        activator = selector.$el;
      } else {
        activator = selector;
      }
    }
    activatorEl.value = ((_activator = activator) == null ? void 0 : _activator.nodeType) === Node.ELEMENT_NODE ? activator : null;
    return activatorEl.value;
  }
}
function elementToViewport(point, offset) {
  return {
    x: point.x + offset.x,
    y: point.y + offset.y
  };
}
function getOffset$1(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
}
function anchorToPoint(anchor, box) {
  if (anchor.side === "top" || anchor.side === "bottom") {
    const {
      side,
      align
    } = anchor;
    const x = align === "start" ? 0 : align === "center" ? box.width / 2 : align === "end" ? box.width : align;
    const y = side === "top" ? 0 : side === "bottom" ? box.height : side;
    return elementToViewport({
      x,
      y
    }, box);
  } else if (anchor.side === "start" || anchor.side === "end") {
    const {
      side,
      align
    } = anchor;
    const x = side === "start" ? 0 : side === "end" ? box.width : side;
    const y = align === "top" ? 0 : align === "center" ? box.height / 2 : align === "bottom" ? box.height : align;
    return elementToViewport({
      x,
      y
    }, box);
  }
  return elementToViewport({
    x: box.width / 2,
    y: box.height / 2
  }, box);
}
const locationStrategies = {
  static: staticLocationStrategy,
  connected: connectedLocationStrategy
};
const makeLocationStrategyProps = propsFactory({
  locationStrategy: {
    type: [String, Function],
    default: "static",
    validator: (val) => typeof val === "function" || val in locationStrategies
  },
  location: {
    type: String,
    default: "bottom"
  },
  origin: {
    type: String,
    default: "auto"
  },
  offset: [Number, String]
});
function useLocationStrategies(props, data) {
  const contentStyles = vue_cjs_prod.ref({});
  const updateLocation = vue_cjs_prod.ref();
  let scope;
  vue_cjs_prod.watchEffect(async () => {
    var _scope;
    (_scope = scope) == null ? void 0 : _scope.stop();
    updateLocation.value = void 0;
    return;
  });
  vue_cjs_prod.onScopeDispose(() => {
    var _scope2;
    updateLocation.value = void 0;
    (_scope2 = scope) == null ? void 0 : _scope2.stop();
  });
  return {
    contentStyles,
    updateLocation
  };
}
function staticLocationStrategy() {
}
function connectedLocationStrategy(data, props, contentStyles) {
  const activatorFixed = isFixedPosition(data.activatorEl.value);
  if (activatorFixed) {
    Object.assign(contentStyles.value, {
      position: "fixed"
    });
  }
  const preferredAnchor = vue_cjs_prod.computed(() => parseAnchor(props.location));
  const preferredOrigin = vue_cjs_prod.computed(() => props.origin === "overlap" ? preferredAnchor.value : props.origin === "auto" ? oppositeAnchor(preferredAnchor.value) : parseAnchor(props.origin));
  const doesOverlap = vue_cjs_prod.computed(() => {
    return preferredAnchor.value.side === preferredOrigin.value.side;
  });
  const configuredMaxHeight = vue_cjs_prod.computed(() => {
    const val = parseFloat(props.maxHeight);
    return isNaN(val) ? Infinity : val;
  });
  const configuredMinWidth = vue_cjs_prod.computed(() => {
    const val = parseFloat(props.minWidth);
    return isNaN(val) ? Infinity : val;
  });
  function updateLocation() {
    var _props$maxWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => true);
    });
    const targetBox = data.activatorEl.value.getBoundingClientRect();
    if (props.offset) {
      targetBox.x -= +props.offset;
      targetBox.y -= +props.offset;
      targetBox.width += +props.offset * 2;
      targetBox.height += +props.offset * 2;
    }
    const scrollParent = getScrollParent(data.contentEl.value);
    const viewportWidth = scrollParent.clientWidth;
    const viewportHeight = Math.min(scrollParent.clientHeight, window.innerHeight);
    let contentBox;
    {
      const scrollables = /* @__PURE__ */ new Map();
      data.contentEl.value.querySelectorAll("*").forEach((el) => {
        const x2 = el.scrollLeft;
        const y2 = el.scrollTop;
        if (x2 || y2) {
          scrollables.set(el, [x2, y2]);
        }
      });
      const initialMaxWidth = data.contentEl.value.style.maxWidth;
      const initialMaxHeight = data.contentEl.value.style.maxHeight;
      data.contentEl.value.style.removeProperty("max-width");
      data.contentEl.value.style.removeProperty("max-height");
      contentBox = nullifyTransforms(data.contentEl.value);
      contentBox.x -= parseFloat(data.contentEl.value.style.left) || 0;
      contentBox.y -= parseFloat(data.contentEl.value.style.top) || 0;
      data.contentEl.value.style.maxWidth = initialMaxWidth;
      data.contentEl.value.style.maxHeight = initialMaxHeight;
      scrollables.forEach((position, el) => {
        el.scrollTo(...position);
      });
    }
    const contentHeight = Math.min(configuredMaxHeight.value, contentBox.height);
    const maxFreeSpaceWidth = props.maxWidth === void 0 ? Number.MAX_VALUE : parseInt((_props$maxWidth = props.maxWidth) != null ? _props$maxWidth : 0, 10);
    const viewportMargin = 12;
    const freeSpace = {
      top: targetBox.top - viewportMargin,
      bottom: viewportHeight - targetBox.bottom - viewportMargin,
      left: Math.min(targetBox.left - viewportMargin, maxFreeSpaceWidth),
      right: Math.min(viewportWidth - targetBox.right - viewportMargin, maxFreeSpaceWidth)
    };
    const fitsY = preferredAnchor.value.side === "bottom" && contentHeight <= freeSpace.bottom || preferredAnchor.value.side === "top" && contentHeight <= freeSpace.top;
    const anchor = fitsY ? preferredAnchor.value : preferredAnchor.value.side === "bottom" && freeSpace.top > freeSpace.bottom || preferredAnchor.value.side === "top" && freeSpace.bottom > freeSpace.top ? oppositeAnchor(preferredAnchor.value) : preferredAnchor.value;
    const origin = fitsY ? preferredOrigin.value : oppositeAnchor(anchor);
    const canFill = doesOverlap.value || ["center", "top", "bottom"].includes(anchor.side);
    const maxWidth = canFill ? Math.min(viewportWidth, Math.max(targetBox.width, viewportWidth - viewportMargin * 2)) : anchor.side === "end" ? freeSpace.right : anchor.side === "start" ? freeSpace.left : null;
    const minWidth = Math.min(configuredMinWidth.value, maxWidth, targetBox.width);
    const maxHeight = fitsY ? configuredMaxHeight.value : Math.min(configuredMaxHeight.value, Math.floor(anchor.side === "top" ? freeSpace.top : freeSpace.bottom));
    const targetPoint = anchorToPoint(anchor, targetBox);
    const contentPoint = anchorToPoint(origin, new Box(__spreadProps(__spreadValues({}, contentBox), {
      height: Math.min(contentHeight, maxHeight)
    })));
    const {
      x,
      y
    } = getOffset$1(targetPoint, contentPoint);
    Object.assign(contentStyles.value, {
      "--v-overlay-anchor-origin": physicalAnchor(anchor, data.activatorEl.value),
      top: convertToUnit(Math.round(y)),
      left: convertToUnit(Math.round(x)),
      transformOrigin: physicalAnchor(origin, data.activatorEl.value),
      minWidth: convertToUnit(minWidth),
      maxWidth: convertToUnit(maxWidth),
      maxHeight: convertToUnit(maxHeight)
    });
  }
  vue_cjs_prod.watch(() => [preferredAnchor.value, preferredOrigin.value, props.offset], () => updateLocation(), {
    immediate: !activatorFixed
  });
  if (activatorFixed)
    vue_cjs_prod.nextTick(() => updateLocation());
  requestAnimationFrame(() => {
    if (contentStyles.value.maxHeight)
      updateLocation();
  });
  return {
    updateLocation
  };
}
let clean = true;
const frames = [];
function requestNewFrame(cb) {
  if (!clean || frames.length) {
    frames.push(cb);
    run();
  } else {
    clean = false;
    cb();
    run();
  }
}
let raf = -1;
function run() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const frame = frames.shift();
    if (frame)
      frame();
    if (frames.length)
      run();
    else
      clean = true;
  });
}
const scrollStrategies = {
  none: null,
  close: closeScrollStrategy,
  block: blockScrollStrategy,
  reposition: repositionScrollStrategy
};
const makeScrollStrategyProps = propsFactory({
  scrollStrategy: {
    type: [String, Function],
    default: "block",
    validator: (val) => typeof val === "function" || val in scrollStrategies
  }
});
function closeScrollStrategy(data) {
  var _data$activatorEl$val;
  function onScroll(e) {
    data.isActive.value = false;
  }
  bindScroll((_data$activatorEl$val = data.activatorEl.value) != null ? _data$activatorEl$val : data.contentEl.value, onScroll);
}
function blockScrollStrategy(data) {
  var _data$root$value;
  const scrollElements = [.../* @__PURE__ */ new Set([...getScrollParents(data.activatorEl.value), ...getScrollParents(data.contentEl.value)])].filter((el) => !el.classList.contains("v-overlay-scroll-blocked"));
  const scrollbarWidth = window.innerWidth - document.documentElement.offsetWidth;
  const scrollableParent = ((el) => hasScrollbar(el) && el)(((_data$root$value = data.root.value) == null ? void 0 : _data$root$value.offsetParent) || document.documentElement);
  if (scrollableParent) {
    data.root.value.classList.add("v-overlay--scroll-blocked");
  }
  scrollElements.forEach((el, i) => {
    el.style.setProperty("--v-body-scroll-x", convertToUnit(-el.scrollLeft));
    el.style.setProperty("--v-body-scroll-y", convertToUnit(-el.scrollTop));
    el.style.setProperty("--v-scrollbar-offset", convertToUnit(scrollbarWidth));
    el.classList.add("v-overlay-scroll-blocked");
  });
  vue_cjs_prod.onScopeDispose(() => {
    scrollElements.forEach((el, i) => {
      const x = parseFloat(el.style.getPropertyValue("--v-body-scroll-x"));
      const y = parseFloat(el.style.getPropertyValue("--v-body-scroll-y"));
      el.style.removeProperty("--v-body-scroll-x");
      el.style.removeProperty("--v-body-scroll-y");
      el.style.removeProperty("--v-scrollbar-offset");
      el.classList.remove("v-overlay-scroll-blocked");
      el.scrollLeft = -x;
      el.scrollTop = -y;
    });
    if (scrollableParent) {
      data.root.value.classList.remove("v-overlay--scroll-blocked");
    }
  });
}
function repositionScrollStrategy(data) {
  var _data$activatorEl$val2;
  let slow = false;
  let raf2 = -1;
  function update(e) {
    requestNewFrame(() => {
      var _data$updateLocation$, _data$updateLocation;
      const start = performance.now();
      (_data$updateLocation$ = (_data$updateLocation = data.updateLocation).value) == null ? void 0 : _data$updateLocation$.call(_data$updateLocation, e);
      const time = performance.now() - start;
      slow = time / (1e3 / 60) > 2;
    });
  }
  bindScroll((_data$activatorEl$val2 = data.activatorEl.value) != null ? _data$activatorEl$val2 : data.contentEl.value, (e) => {
    if (slow) {
      cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          update(e);
        });
      });
    } else {
      update(e);
    }
  });
}
function bindScroll(el, onScroll) {
  const scrollElements = [document, ...getScrollParents(el)];
  scrollElements.forEach((el2) => {
    el2.addEventListener("scroll", onScroll, {
      passive: true
    });
  });
  vue_cjs_prod.onScopeDispose(() => {
    scrollElements.forEach((el2) => {
      el2.removeEventListener("scroll", onScroll);
    });
  });
}
function useToggleScope(source, cb) {
  let scope;
  vue_cjs_prod.watch(source, (active) => {
    if (active && !scope) {
      scope = vue_cjs_prod.effectScope();
      scope.run(cb);
    } else {
      var _scope;
      (_scope = scope) == null ? void 0 : _scope.stop();
      scope = void 0;
    }
  }, {
    immediate: true
  });
}
function useTeleport(target) {
  const teleportTarget = vue_cjs_prod.computed(() => {
    const _target = target.value;
    if (_target === true || !IN_BROWSER)
      return void 0;
    const targetElement = _target === false ? document.body : typeof _target === "string" ? document.querySelector(_target) : _target;
    if (targetElement == null) {
      vue_cjs_prod.warn(`Unable to locate target ${_target}`);
      return void 0;
    }
    if (!useTeleport.cache.has(targetElement)) {
      const el = document.createElement("div");
      el.className = "v-overlay-container";
      targetElement.appendChild(el);
      useTeleport.cache.set(targetElement, el);
    }
    return useTeleport.cache.get(targetElement);
  });
  return {
    teleportTarget
  };
}
useTeleport.cache = /* @__PURE__ */ new WeakMap();
const makeLazyProps = propsFactory({
  eager: Boolean
}, "lazy");
function useLazy(props, active) {
  const isBooted = vue_cjs_prod.ref(false);
  const hasContent = vue_cjs_prod.computed(() => isBooted.value || props.eager || active.value);
  vue_cjs_prod.watch(active, () => isBooted.value = true);
  function onAfterLeave() {
    if (!props.eager)
      isBooted.value = false;
  }
  return {
    isBooted,
    hasContent,
    onAfterLeave
  };
}
const stack = vue_cjs_prod.reactive([]);
function useStack(isActive, zIndex) {
  const vm = getCurrentInstance("useStack");
  const _zIndex = vue_cjs_prod.ref(+zIndex.value);
  useToggleScope(isActive, () => {
    var _stack;
    const lastZIndex = (_stack = stack[stack.length - 1]) == null ? void 0 : _stack[1];
    _zIndex.value = lastZIndex ? lastZIndex + 10 : +zIndex.value;
    stack.push([vm, _zIndex.value]);
    vue_cjs_prod.onScopeDispose(() => {
      const idx = stack.findIndex((v) => v[0] === vm);
      stack.splice(idx, 1);
    });
  });
  const isTop = vue_cjs_prod.ref(true);
  vue_cjs_prod.watchEffect(() => {
    var _stack2;
    const _isTop = vue_cjs_prod.toRaw((_stack2 = stack[stack.length - 1]) == null ? void 0 : _stack2[0]) === vm;
    setTimeout(() => isTop.value = _isTop);
  });
  return {
    isTop: vue_cjs_prod.readonly(isTop),
    stackStyles: vue_cjs_prod.computed(() => ({
      zIndex: _zIndex.value
    }))
  };
}
function defaultConditional() {
  return true;
}
function checkEvent(e, el, binding) {
  if (!e || checkIsActive(e, binding) === false)
    return false;
  const root = attachedRoot(el);
  if (typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot && root.host === e.target)
    return false;
  const elements = (typeof binding.value === "object" && binding.value.include || (() => []))();
  elements.push(el);
  return !elements.some((el2) => el2 == null ? void 0 : el2.contains(e.target));
}
function checkIsActive(e, binding) {
  const isActive = typeof binding.value === "object" && binding.value.closeConditional || defaultConditional;
  return isActive(e);
}
function directive(e, el, binding) {
  const handler = typeof binding.value === "function" ? binding.value : binding.value.handler;
  el._clickOutside.lastMousedownWasOutside && checkEvent(e, el, binding) && setTimeout(() => {
    checkIsActive(e, binding) && handler && handler(e);
  }, 0);
}
function handleShadow(el, callback) {
  const root = attachedRoot(el);
  callback(document);
  if (typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot) {
    callback(root);
  }
}
const ClickOutside = {
  mounted(el, binding) {
    const onClick = (e) => directive(e, el, binding);
    const onMousedown = (e) => {
      el._clickOutside.lastMousedownWasOutside = checkEvent(e, el, binding);
    };
    handleShadow(el, (app) => {
      app.addEventListener("click", onClick, true);
      app.addEventListener("mousedown", onMousedown, true);
    });
    if (!el._clickOutside) {
      el._clickOutside = {
        lastMousedownWasOutside: true
      };
    }
    el._clickOutside[binding.instance.$.uid] = {
      onClick,
      onMousedown
    };
  },
  unmounted(el, binding) {
    if (!el._clickOutside)
      return;
    handleShadow(el, (app) => {
      var _el$_clickOutside;
      if (!app || !((_el$_clickOutside = el._clickOutside) != null && _el$_clickOutside[binding.instance.$.uid]))
        return;
      const {
        onClick,
        onMousedown
      } = el._clickOutside[binding.instance.$.uid];
      app.removeEventListener("click", onClick, true);
      app.removeEventListener("mousedown", onMousedown, true);
    });
    delete el._clickOutside[binding.instance.$.uid];
  }
};
const VOverlay = genericComponent()({
  name: "VOverlay",
  directives: {
    ClickOutside
  },
  inheritAttrs: false,
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    absolute: Boolean,
    attach: [Boolean, String, Object],
    closeOnBack: {
      type: Boolean,
      default: true
    },
    contained: Boolean,
    contentClass: null,
    contentProps: null,
    disabled: Boolean,
    noClickAnimation: Boolean,
    modelValue: Boolean,
    persistent: Boolean,
    scrim: {
      type: [String, Boolean],
      default: true
    },
    zIndex: {
      type: [Number, String],
      default: 2e3
    }
  }, makeActivatorProps()), makeDimensionProps()), makeLocationStrategyProps()), makeScrollStrategyProps()), makeThemeProps()), makeTransitionProps()), makeLazyProps()),
  emits: {
    "click:outside": (e) => true,
    "update:modelValue": (value) => true,
    afterLeave: () => true
  },
  setup(props, _ref) {
    let {
      slots,
      attrs,
      emit
    } = _ref;
    const model = useProxiedModel(props, "modelValue");
    const isActive = vue_cjs_prod.computed({
      get: () => model.value,
      set: (v) => {
        if (!(v && props.disabled))
          model.value = v;
      }
    });
    const {
      teleportTarget
    } = useTeleport(vue_cjs_prod.computed(() => props.attach || props.contained));
    provideTheme(props);
    useRtl();
    useLazy(props, isActive);
    useBackgroundColor(vue_cjs_prod.computed(() => {
      return typeof props.scrim === "string" ? props.scrim : null;
    }));
    const {
      isTop,
      stackStyles
    } = useStack(isActive, vue_cjs_prod.toRef(props, "zIndex"));
    const {
      activatorEl,
      activatorRef,
      activatorEvents,
      contentEvents
    } = useActivator(props, {
      isActive,
      isTop
    });
    useDimension(props);
    vue_cjs_prod.watch(() => props.disabled, (v) => {
      if (v)
        isActive.value = false;
    });
    const root = vue_cjs_prod.ref();
    const contentEl = vue_cjs_prod.ref();
    const {
      contentStyles,
      updateLocation
    } = useLocationStrategies();
    useRouter();
    useToggleScope(() => props.closeOnBack, () => {
    });
    const top = vue_cjs_prod.ref();
    vue_cjs_prod.watch(() => isActive.value && (props.absolute || props.contained) && teleportTarget.value == null, (val) => {
      if (val) {
        const scrollParent = getScrollParent(root.value);
        if (scrollParent && scrollParent !== document.scrollingElement) {
          top.value = scrollParent.scrollTop;
        }
      }
    });
    function animateClick() {
      var _contentEl$value;
      if (props.noClickAnimation)
        return;
      (_contentEl$value = contentEl.value) == null ? void 0 : _contentEl$value.animate([{
        transformOrigin: "center"
      }, {
        transform: "scale(1.03)"
      }, {
        transformOrigin: "center"
      }], {
        duration: 150,
        easing: standardEasing
      });
    }
    useRender(() => {
      var _slots$activator;
      return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [(_slots$activator = slots.activator) == null ? void 0 : _slots$activator.call(slots, {
        isActive: isActive.value,
        props: vue_cjs_prod.mergeProps({
          ref: activatorRef
        }, vue_cjs_prod.toHandlers(activatorEvents.value), props.activatorProps)
      }), IN_BROWSER]);
    });
    return {
      animateClick,
      contentEl,
      activatorEl,
      isTop,
      updateLocation
    };
  }
});
function useScopeId() {
  const vm = getCurrentInstance("useScopeId");
  const scopeId = vm.vnode.scopeId;
  return {
    scopeId: scopeId ? {
      [scopeId]: ""
    } : void 0
  };
}
const VMenu = genericComponent()({
  name: "VMenu",
  inheritAttrs: false,
  props: __spreadValues({
    modelValue: Boolean,
    id: String
  }, makeTransitionProps({
    transition: {
      component: VDialogTransition
    }
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      scopeId
    } = useScopeId();
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `v-menu-${uid}`);
    const overlay = vue_cjs_prod.ref();
    const parent = vue_cjs_prod.inject(VMenuSymbol, null);
    let openChildren = 0;
    vue_cjs_prod.provide(VMenuSymbol, {
      register() {
        ++openChildren;
      },
      unregister() {
        --openChildren;
      },
      closeParents() {
        setTimeout(() => {
          if (!openChildren) {
            isActive.value = false;
            parent == null ? void 0 : parent.closeParents();
          }
        }, 40);
      }
    });
    vue_cjs_prod.watch(isActive, (val) => {
      val ? parent == null ? void 0 : parent.register() : parent == null ? void 0 : parent.unregister();
    });
    function onClickOutside() {
      parent == null ? void 0 : parent.closeParents();
    }
    useRender(() => vue_cjs_prod.createVNode(VOverlay, vue_cjs_prod.mergeProps({
      "ref": overlay,
      "modelValue": isActive.value,
      "onUpdate:modelValue": ($event) => isActive.value = $event,
      "class": ["v-menu"],
      "transition": props.transition,
      "absolute": true,
      "closeOnContentClick": true,
      "locationStrategy": "connected",
      "scrollStrategy": "reposition",
      "scrim": false,
      "openDelay": "300",
      "closeDelay": "250",
      "activatorProps": {
        "aria-haspopup": "menu",
        "aria-expanded": String(isActive.value),
        "aria-owns": id.value
      },
      "onClick:outside": onClickOutside
    }, scopeId, attrs), {
      default: slots.default,
      activator: slots.activator
    }));
    return useForwardRef({
      id
    }, overlay);
  }
});
const VMessages = defineComponent({
  name: "VMessages",
  props: __spreadValues({
    active: Boolean,
    color: String,
    messages: {
      type: [Array, String],
      default: () => []
    }
  }, makeTransitionProps({
    transition: {
      component: VSlideYTransition,
      leaveAbsolute: true,
      group: true
    }
  })),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const messages = vue_cjs_prod.computed(() => wrapInArray(props.messages));
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.computed(() => props.color));
    return () => vue_cjs_prod.createVNode(MaybeTransition, {
      "transition": props.transition,
      "tag": "div",
      "class": ["v-messages", textColorClasses.value],
      "style": textColorStyles.value
    }, {
      default: () => [props.active && messages.value.map((message, i) => vue_cjs_prod.createVNode("div", {
        "class": "v-messages__message",
        "key": `${i}-${messages.value}`
      }, [slots.message ? slots.message({
        message
      }) : message]))]
    });
  }
});
const FormKey = Symbol.for("vuetify:form");
const makeFormProps = propsFactory({
  disabled: Boolean,
  fastFail: Boolean,
  lazyValidation: Boolean,
  readonly: Boolean,
  modelValue: {
    type: Boolean,
    default: null
  }
});
function createForm(props) {
  const model = useProxiedModel(props, "modelValue");
  const isDisabled = vue_cjs_prod.computed(() => props.disabled);
  const isReadonly = vue_cjs_prod.computed(() => props.readonly);
  const isValidating = vue_cjs_prod.ref(false);
  const items = vue_cjs_prod.ref([]);
  const errorMessages = vue_cjs_prod.ref([]);
  async function validate() {
    const results = [];
    let valid = true;
    errorMessages.value = [];
    isValidating.value = true;
    for (const item of items.value) {
      const itemErrorMessages = await item.validate();
      if (itemErrorMessages.length > 0) {
        valid = false;
        results.push({
          id: item.id,
          errorMessages: itemErrorMessages
        });
      }
      if (!valid && props.fastFail)
        break;
    }
    errorMessages.value = results;
    isValidating.value = false;
    return {
      valid,
      errorMessages: errorMessages.value
    };
  }
  function reset() {
    items.value.forEach((item) => item.reset());
    model.value = null;
  }
  function resetValidation() {
    items.value.forEach((item) => item.resetValidation());
    errorMessages.value = [];
    model.value = null;
  }
  vue_cjs_prod.watch(items, () => {
    let valid = null;
    if (items.value.some((item) => item.isValid === false)) {
      valid = false;
    } else if (items.value.every((item) => item.isValid === true)) {
      valid = true;
    }
    model.value = valid;
  }, {
    deep: true
  });
  vue_cjs_prod.provide(FormKey, {
    register: (id, validate2, reset2, resetValidation2, isValid) => {
      if (items.value.some((item) => item.id === id)) {
        consoleWarn(`Duplicate input name "${id}"`);
      }
      items.value.push({
        id,
        validate: validate2,
        reset: reset2,
        resetValidation: resetValidation2,
        isValid
      });
    },
    unregister: (id) => {
      items.value = items.value.filter((item) => {
        return item.id !== id;
      });
    },
    isDisabled,
    isReadonly,
    isValidating,
    items
  });
  return {
    errorMessages,
    isDisabled,
    isReadonly,
    isValidating,
    items,
    validate,
    reset,
    resetValidation
  };
}
function useForm() {
  return vue_cjs_prod.inject(FormKey, null);
}
const makeValidationProps = propsFactory({
  disabled: Boolean,
  error: Boolean,
  errorMessages: {
    type: [Array, String],
    default: () => []
  },
  maxErrors: {
    type: [Number, String],
    default: 1
  },
  name: String,
  readonly: Boolean,
  rules: {
    type: Array,
    default: () => []
  },
  modelValue: null
});
function useValidation(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const model = useProxiedModel(props, "modelValue");
  const form = useForm();
  const internalErrorMessages = vue_cjs_prod.ref([]);
  const isPristine = vue_cjs_prod.ref(true);
  const isDirty = vue_cjs_prod.computed(() => wrapInArray(model.value === "" ? null : model.value).length > 0);
  const isDisabled = vue_cjs_prod.computed(() => !!(props.disabled || form != null && form.isDisabled.value));
  const isReadonly = vue_cjs_prod.computed(() => !!(props.readonly || form != null && form.isReadonly.value));
  const errorMessages = vue_cjs_prod.computed(() => {
    return props.errorMessages.length ? wrapInArray(props.errorMessages) : internalErrorMessages.value;
  });
  const isValid = vue_cjs_prod.computed(() => {
    if (!props.rules.length)
      return true;
    if (props.error || errorMessages.value.length)
      return false;
    return isPristine.value ? null : true;
  });
  const isValidating = vue_cjs_prod.ref(false);
  const validationClasses = vue_cjs_prod.computed(() => {
    return {
      [`${name}--error`]: isValid.value === false,
      [`${name}--dirty`]: isDirty.value,
      [`${name}--disabled`]: isDisabled.value,
      [`${name}--readonly`]: isReadonly.value
    };
  });
  const uid = vue_cjs_prod.computed(() => {
    var _props$name;
    return (_props$name = props.name) != null ? _props$name : getUid();
  });
  vue_cjs_prod.onBeforeMount(() => {
    form == null ? void 0 : form.register(uid.value, validate, reset, resetValidation, isValid);
  });
  vue_cjs_prod.onBeforeUnmount(() => {
    form == null ? void 0 : form.unregister(uid.value);
  });
  vue_cjs_prod.watch(model, () => {
    if (model.value != null)
      validate();
  });
  function reset() {
    resetValidation();
    model.value = null;
  }
  function resetValidation() {
    isPristine.value = true;
    internalErrorMessages.value = [];
  }
  async function validate() {
    const results = [];
    isValidating.value = true;
    for (const rule of props.rules) {
      if (results.length >= (props.maxErrors || 1)) {
        break;
      }
      const handler = typeof rule === "function" ? rule : () => rule;
      const result = await handler(model.value);
      if (result === true)
        continue;
      if (typeof result !== "string") {
        console.warn(`${result} is not a valid value. Rule functions must return boolean true or a string.`);
        continue;
      }
      results.push(result);
    }
    internalErrorMessages.value = results;
    isValidating.value = false;
    isPristine.value = false;
    return internalErrorMessages.value;
  }
  return {
    errorMessages,
    isDirty,
    isDisabled,
    isReadonly,
    isPristine,
    isValid,
    isValidating,
    reset,
    resetValidation,
    validate,
    validationClasses
  };
}
const makeVInputProps = propsFactory(__spreadValues(__spreadValues({
  id: String,
  appendIcon: IconValue,
  prependIcon: IconValue,
  hideDetails: [Boolean, String],
  messages: {
    type: [Array, String],
    default: () => []
  },
  direction: {
    type: String,
    default: "horizontal",
    validator: (v) => ["horizontal", "vertical"].includes(v)
  }
}, makeDensityProps()), makeValidationProps()));
const VInput = genericComponent()({
  name: "VInput",
  props: __spreadValues({}, makeVInputProps()),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots,
      emit
    } = _ref;
    const {
      densityClasses
    } = useDensity(props);
    const {
      errorMessages,
      isDirty,
      isDisabled,
      isReadonly,
      isPristine,
      isValid,
      isValidating,
      reset,
      resetValidation,
      validate,
      validationClasses
    } = useValidation(props);
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `input-${uid}`);
    const slotProps = vue_cjs_prod.computed(() => ({
      id,
      isDirty,
      isDisabled,
      isReadonly,
      isPristine,
      isValid,
      isValidating,
      reset,
      resetValidation,
      validate
    }));
    useRender(() => {
      var _props$messages, _slots$prepend, _slots$default, _slots$append, _slots$details;
      const hasPrepend = !!(slots.prepend || props.prependIcon);
      const hasAppend = !!(slots.append || props.appendIcon);
      const hasMessages = !!((_props$messages = props.messages) != null && _props$messages.length || errorMessages.value.length);
      const hasDetails = !props.hideDetails || props.hideDetails === "auto" && hasMessages;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-input", `v-input--${props.direction}`, densityClasses.value, validationClasses.value]
      }, [hasPrepend && vue_cjs_prod.createVNode("div", {
        "class": "v-input__prepend"
      }, [slots == null ? void 0 : (_slots$prepend = slots.prepend) == null ? void 0 : _slots$prepend.call(slots, slotProps.value), props.prependIcon && vue_cjs_prod.createVNode(VIcon, {
        "onClick": attrs["onClick:prepend"],
        "icon": props.prependIcon
      }, null)]), slots.default && vue_cjs_prod.createVNode("div", {
        "class": "v-input__control"
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, slotProps.value)]), hasAppend && vue_cjs_prod.createVNode("div", {
        "class": "v-input__append"
      }, [slots == null ? void 0 : (_slots$append = slots.append) == null ? void 0 : _slots$append.call(slots, slotProps.value), props.appendIcon && vue_cjs_prod.createVNode(VIcon, {
        "onClick": attrs["onClick:append"],
        "icon": props.appendIcon
      }, null)]), hasDetails && vue_cjs_prod.createVNode("div", {
        "class": "v-input__details"
      }, [vue_cjs_prod.createVNode(VMessages, {
        "active": hasMessages,
        "messages": errorMessages.value.length > 0 ? errorMessages.value : props.messages
      }, {
        message: slots.message
      }), (_slots$details = slots.details) == null ? void 0 : _slots$details.call(slots, slotProps.value)])]);
    });
    return {
      reset,
      resetValidation,
      validate
    };
  }
});
function filterInputProps(props) {
  return pick(props, Object.keys(VInput.props));
}
const VLabel = defineComponent({
  name: "VLabel",
  props: __spreadValues({
    text: String
  }, makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode("label", {
        "class": "v-label"
      }, [props.text, (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    };
  }
});
const VFieldLabel = defineComponent({
  name: "VFieldLabel",
  props: {
    floating: Boolean
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => {
      return vue_cjs_prod.createVNode(VLabel, {
        "class": ["v-field-label", {
          "v-field-label--floating": props.floating
        }],
        "aria-hidden": props.floating || void 0
      }, slots);
    };
  }
});
function useIntersectionObserver(callback) {
  const intersectionRef = vue_cjs_prod.ref();
  const isIntersecting = vue_cjs_prod.ref(false);
  return {
    intersectionRef,
    isIntersecting
  };
}
const VProgressLinear = defineComponent({
  name: "VProgressLinear",
  props: __spreadValues(__spreadValues(__spreadValues({
    active: {
      type: Boolean,
      default: true
    },
    bgColor: String,
    bgOpacity: [Number, String],
    bufferValue: {
      type: [Number, String],
      default: 0
    },
    clickable: Boolean,
    color: String,
    height: {
      type: [Number, String],
      default: 4
    },
    indeterminate: Boolean,
    max: {
      type: [Number, String],
      default: 100
    },
    modelValue: {
      type: [Number, String],
      default: 0
    },
    reverse: Boolean,
    stream: Boolean,
    striped: Boolean,
    roundedBar: Boolean
  }, makeRoundedProps()), makeTagProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const progress = useProxiedModel(props, "modelValue");
    const {
      isRtl
    } = useRtl();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(props, "color");
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.computed(() => props.bgColor || props.color));
    const {
      backgroundColorClasses: barColorClasses,
      backgroundColorStyles: barColorStyles
    } = useBackgroundColor(props, "color");
    const {
      roundedClasses
    } = useRounded(props);
    const {
      intersectionRef,
      isIntersecting
    } = useIntersectionObserver();
    const max = vue_cjs_prod.computed(() => parseInt(props.max, 10));
    const height = vue_cjs_prod.computed(() => parseInt(props.height, 10));
    const normalizedBuffer = vue_cjs_prod.computed(() => parseFloat(props.bufferValue) / max.value * 100);
    const normalizedValue = vue_cjs_prod.computed(() => parseFloat(progress.value) / max.value * 100);
    const isReversed = vue_cjs_prod.computed(() => isRtl.value !== props.reverse);
    const transition = vue_cjs_prod.computed(() => props.indeterminate ? "fade-transition" : "slide-x-transition");
    const opacity2 = vue_cjs_prod.computed(() => {
      return props.bgOpacity == null ? props.bgOpacity : parseFloat(props.bgOpacity);
    });
    function handleClick(e) {
      if (!intersectionRef.value)
        return;
      const {
        left,
        right,
        width
      } = intersectionRef.value.getBoundingClientRect();
      const value = isReversed.value ? width - e.clientX + (right - width) : e.clientX - left;
      progress.value = Math.round(value / width * max.value);
    }
    return () => vue_cjs_prod.createVNode(props.tag, {
      "ref": intersectionRef,
      "class": ["v-progress-linear", {
        "v-progress-linear--active": props.active && isIntersecting.value,
        "v-progress-linear--reverse": isReversed.value,
        "v-progress-linear--rounded": props.rounded,
        "v-progress-linear--rounded-bar": props.roundedBar,
        "v-progress-linear--striped": props.striped
      }, roundedClasses.value, themeClasses.value],
      "style": {
        height: props.active ? convertToUnit(height.value) : 0,
        "--v-progress-linear-height": convertToUnit(height.value)
      },
      "role": "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": props.max,
      "aria-valuenow": props.indeterminate ? void 0 : normalizedValue.value,
      "onClick": props.clickable && handleClick
    }, {
      default: () => [props.stream && vue_cjs_prod.createVNode("div", {
        "class": ["v-progress-linear__stream", textColorClasses.value],
        "style": __spreadProps(__spreadValues({}, textColorStyles.value), {
          [isReversed.value ? "left" : "right"]: convertToUnit(-height.value),
          borderTop: `${convertToUnit(height.value / 2)} dotted`,
          opacity: opacity2.value,
          top: `calc(50% - ${convertToUnit(height.value / 4)})`,
          width: convertToUnit(100 - normalizedBuffer.value, "%"),
          "--v-progress-linear-stream-to": convertToUnit(height.value * (isReversed.value ? 1 : -1))
        })
      }, null), vue_cjs_prod.createVNode("div", {
        "class": ["v-progress-linear__background", backgroundColorClasses.value],
        "style": [backgroundColorStyles.value, {
          opacity: opacity2.value,
          width: convertToUnit(!props.stream ? 100 : normalizedBuffer.value, "%")
        }]
      }, null), vue_cjs_prod.createVNode(vue_cjs_prod.Transition, {
        "name": transition.value
      }, {
        default: () => [!props.indeterminate ? vue_cjs_prod.createVNode("div", {
          "class": ["v-progress-linear__determinate", barColorClasses.value],
          "style": [barColorStyles.value, {
            width: convertToUnit(normalizedValue.value, "%")
          }]
        }, null) : vue_cjs_prod.createVNode("div", {
          "class": "v-progress-linear__indeterminate"
        }, [["long", "short"].map((bar) => vue_cjs_prod.createVNode("div", {
          "key": bar,
          "class": ["v-progress-linear__indeterminate", bar, barColorClasses.value],
          "style": barColorStyles.value
        }, null))])]
      }), slots.default && vue_cjs_prod.createVNode("div", {
        "class": "v-progress-linear__content"
      }, [slots.default({
        value: normalizedValue.value,
        buffer: normalizedBuffer.value
      })])]
    });
  }
});
const makeLoaderProps = propsFactory({
  loading: Boolean
}, "loader");
function useLoader(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const loaderClasses = vue_cjs_prod.computed(() => ({
    [`${name}--loading`]: props.loading
  }));
  return {
    loaderClasses
  };
}
function LoaderSlot(props, _ref) {
  var _slots$default;
  let {
    slots
  } = _ref;
  return vue_cjs_prod.createVNode("div", {
    "class": `${props.name}__loader`
  }, [((_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
    color: props.color,
    isActive: props.active
  })) || vue_cjs_prod.createVNode(VProgressLinear, {
    "active": props.active,
    "color": props.color,
    "height": "2",
    "indeterminate": true
  }, null)]);
}
const makeFocusProps = propsFactory({
  focused: Boolean
}, "focus");
function useFocus(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const isFocused = useProxiedModel(props, "focused");
  const focusClasses = vue_cjs_prod.computed(() => {
    return {
      [`${name}--focused`]: isFocused.value
    };
  });
  function focus() {
    isFocused.value = true;
  }
  function blur() {
    isFocused.value = false;
  }
  return {
    focusClasses,
    isFocused,
    focus,
    blur
  };
}
const allowedVariants$1 = ["underlined", "outlined", "filled", "contained", "plain"];
const makeVFieldProps = propsFactory(__spreadValues(__spreadValues({
  appendInnerIcon: IconValue,
  bgColor: String,
  clearable: Boolean,
  clearIcon: {
    type: IconValue,
    default: "$clear"
  },
  active: Boolean,
  color: String,
  dirty: Boolean,
  disabled: Boolean,
  error: Boolean,
  label: String,
  persistentClear: Boolean,
  prependInnerIcon: IconValue,
  reverse: Boolean,
  singleLine: Boolean,
  variant: {
    type: String,
    default: "filled",
    validator: (v) => allowedVariants$1.includes(v)
  }
}, makeThemeProps()), makeLoaderProps()), "v-field");
const VField = genericComponent()({
  name: "VField",
  inheritAttrs: false,
  props: __spreadValues(__spreadValues({
    id: String
  }, makeFocusProps()), makeVFieldProps()),
  emits: {
    "click:clear": (e) => true,
    "click:control": (e) => true,
    "update:focused": (focused) => true,
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      loaderClasses
    } = useLoader(props);
    const {
      focusClasses,
      isFocused,
      focus,
      blur
    } = useFocus(props);
    const isActive = vue_cjs_prod.computed(() => props.dirty || props.active);
    const hasLabel = vue_cjs_prod.computed(() => !props.singleLine && !!(props.label || slots.label));
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `input-${uid}`);
    const labelRef = vue_cjs_prod.ref();
    const floatingLabelRef = vue_cjs_prod.ref();
    const controlRef = vue_cjs_prod.ref();
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "bgColor"));
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.computed(() => {
      return isActive.value && isFocused.value && !props.error && !props.disabled ? props.color : void 0;
    }));
    vue_cjs_prod.watch(isActive, (val) => {
      if (hasLabel.value) {
        const el = labelRef.value.$el;
        const targetEl = floatingLabelRef.value.$el;
        const rect = nullifyTransforms(el);
        const targetRect = targetEl.getBoundingClientRect();
        const x = targetRect.x - rect.x;
        const y = targetRect.y - rect.y - (rect.height / 2 - targetRect.height / 2);
        const targetWidth = targetRect.width / 0.75;
        const width = Math.abs(targetWidth - rect.width) > 1 ? {
          maxWidth: convertToUnit(targetWidth)
        } : void 0;
        const duration = parseFloat(getComputedStyle(el).transitionDuration) * 1e3;
        const scale = parseFloat(getComputedStyle(targetEl).getPropertyValue("--v-field-label-scale"));
        el.style.visibility = "visible";
        targetEl.style.visibility = "hidden";
        el.animate([{
          transform: "translate(0)"
        }, __spreadValues({
          transform: `translate(${x}px, ${y}px) scale(${scale})`
        }, width)], {
          duration,
          easing: standardEasing,
          direction: val ? "normal" : "reverse"
        }).finished.then(() => {
          el.style.removeProperty("visibility");
          targetEl.style.removeProperty("visibility");
        });
      }
    }, {
      flush: "post"
    });
    const slotProps = vue_cjs_prod.computed(() => ({
      isActive,
      isFocused,
      controlRef,
      blur,
      focus
    }));
    function onClick(e) {
      if (e.target !== document.activeElement) {
        e.preventDefault();
      }
      emit("click:control", e);
    }
    useRender(() => {
      var _slots$prependInner, _slots$default, _slots$appendInner;
      const isOutlined = props.variant === "outlined";
      const hasPrepend = slots.prependInner || props.prependInnerIcon;
      const hasClear = !!(props.clearable || slots.clear);
      const hasAppend = !!(slots.appendInner || props.appendInnerIcon || hasClear);
      const label = slots.label ? slots.label({
        label: props.label,
        props: {
          for: id.value
        }
      }) : props.label;
      return vue_cjs_prod.createVNode("div", vue_cjs_prod.mergeProps({
        "class": ["v-field", {
          "v-field--active": isActive.value,
          "v-field--appended": hasAppend,
          "v-field--disabled": props.disabled,
          "v-field--dirty": props.dirty,
          "v-field--error": props.error,
          "v-field--has-background": !!props.bgColor,
          "v-field--persistent-clear": props.persistentClear,
          "v-field--prepended": hasPrepend,
          "v-field--reverse": props.reverse,
          "v-field--single-line": props.singleLine,
          "v-field--has-label": !!label,
          [`v-field--variant-${props.variant}`]: true
        }, themeClasses.value, backgroundColorClasses.value, focusClasses.value, loaderClasses.value],
        "style": [backgroundColorStyles.value, textColorStyles.value],
        "onClick": onClick
      }, attrs), [vue_cjs_prod.createVNode("div", {
        "class": "v-field__overlay"
      }, null), vue_cjs_prod.createVNode(LoaderSlot, {
        "name": "v-field",
        "active": props.loading,
        "color": props.error ? "error" : props.color
      }, {
        default: slots.loader
      }), hasPrepend && vue_cjs_prod.createVNode("div", {
        "class": "v-field__prepend-inner"
      }, [props.prependInnerIcon && vue_cjs_prod.createVNode(VIcon, {
        "onClick": attrs["onClick:prependInner"],
        "icon": props.prependInnerIcon
      }, null), slots == null ? void 0 : (_slots$prependInner = slots.prependInner) == null ? void 0 : _slots$prependInner.call(slots, slotProps.value)]), vue_cjs_prod.createVNode("div", {
        "class": "v-field__field",
        "data-no-activator": ""
      }, [["contained", "filled"].includes(props.variant) && hasLabel.value && vue_cjs_prod.createVNode(VFieldLabel, {
        "ref": floatingLabelRef,
        "class": [textColorClasses.value],
        "floating": true
      }, {
        default: () => [label]
      }), vue_cjs_prod.createVNode(VFieldLabel, {
        "ref": labelRef,
        "for": id.value
      }, {
        default: () => [label]
      }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, __spreadProps(__spreadValues({}, slotProps.value), {
        props: {
          id: id.value,
          class: "v-field__input"
        },
        focus,
        blur
      }))]), hasClear && vue_cjs_prod.createVNode(VExpandXTransition, null, {
        default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
          "class": "v-field__clearable"
        }, [slots.clear ? slots.clear() : vue_cjs_prod.createVNode(VIcon, {
          "onClick": (e) => emit("click:clear", e),
          "icon": props.clearIcon
        }, null)]), [[vue_cjs_prod.vShow, props.dirty]])]
      }), hasAppend && vue_cjs_prod.createVNode("div", {
        "class": "v-field__append-inner"
      }, [slots == null ? void 0 : (_slots$appendInner = slots.appendInner) == null ? void 0 : _slots$appendInner.call(slots, slotProps.value), props.appendInnerIcon && vue_cjs_prod.createVNode(VIcon, {
        "onClick": attrs["onClick:appendInner"],
        "icon": props.appendInnerIcon
      }, null)]), vue_cjs_prod.createVNode("div", {
        "class": ["v-field__outline", textColorClasses.value]
      }, [isOutlined && vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("div", {
        "class": "v-field__outline__start"
      }, null), hasLabel.value && vue_cjs_prod.createVNode("div", {
        "class": "v-field__outline__notch"
      }, [vue_cjs_prod.createVNode(VFieldLabel, {
        "ref": floatingLabelRef,
        "floating": true
      }, {
        default: () => [label]
      })]), vue_cjs_prod.createVNode("div", {
        "class": "v-field__outline__end"
      }, null)]), ["plain", "underlined"].includes(props.variant) && hasLabel.value && vue_cjs_prod.createVNode(VFieldLabel, {
        "ref": floatingLabelRef,
        "floating": true
      }, {
        default: () => [label]
      })])]);
    });
    return {
      controlRef
    };
  }
});
function filterFieldProps(attrs) {
  return pick(attrs, Object.keys(VField.props));
}
const VCounter = defineComponent({
  name: "VCounter",
  functional: true,
  props: __spreadValues({
    active: Boolean,
    max: [Number, String],
    value: {
      type: [Number, String],
      default: 0
    }
  }, makeTransitionProps({
    transition: {
      component: VSlideYTransition
    }
  })),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const counter = vue_cjs_prod.computed(() => {
      return props.max ? `${props.value} / ${props.max}` : String(props.value);
    });
    return () => {
      return vue_cjs_prod.createVNode(MaybeTransition, {
        "transition": props.transition
      }, {
        default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
          "class": "v-counter"
        }, [slots.default ? slots.default({
          counter: counter.value,
          max: props.max,
          value: props.value
        }) : counter.value]), [[vue_cjs_prod.vShow, props.active]])]
      });
    };
  }
});
const activeTypes = ["color", "file", "time", "date", "datetime-local", "week", "month"];
const VTextField = genericComponent()({
  name: "VTextField",
  directives: {
    Intersect
  },
  inheritAttrs: false,
  props: __spreadValues(__spreadValues({
    autofocus: Boolean,
    counter: [Boolean, Number, String],
    counterValue: Function,
    hint: String,
    persistentHint: Boolean,
    prefix: String,
    placeholder: String,
    persistentPlaceholder: Boolean,
    persistentCounter: Boolean,
    suffix: String,
    type: {
      type: String,
      default: "text"
    }
  }, makeVInputProps()), makeVFieldProps()),
  emits: {
    "click:clear": (e) => true,
    "click:control": (e) => true,
    "click:input": (e) => true,
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const model = useProxiedModel(props, "modelValue");
    const counterValue = vue_cjs_prod.computed(() => {
      var _model$value;
      return typeof props.counterValue === "function" ? props.counterValue(model.value) : ((_model$value = model.value) != null ? _model$value : "").toString().length;
    });
    const max = vue_cjs_prod.computed(() => {
      if (attrs.maxlength)
        return attrs.maxlength;
      if (!props.counter || typeof props.counter !== "number" && typeof props.counter !== "string")
        return void 0;
      return props.counter;
    });
    function onIntersect(isIntersecting, entries) {
      var _entries$0$target, _entries$0$target$foc;
      if (!props.autofocus || !isIntersecting)
        return;
      (_entries$0$target = entries[0].target) == null ? void 0 : (_entries$0$target$foc = _entries$0$target.focus) == null ? void 0 : _entries$0$target$foc.call(_entries$0$target);
    }
    const vInputRef = vue_cjs_prod.ref();
    const vFieldRef = vue_cjs_prod.ref();
    const isFocused = vue_cjs_prod.ref(false);
    const inputRef = vue_cjs_prod.ref();
    const isActive = vue_cjs_prod.computed(() => activeTypes.includes(props.type) || props.persistentPlaceholder || isFocused.value);
    const messages = vue_cjs_prod.computed(() => {
      return props.messages.length ? props.messages : isFocused.value || props.persistentHint ? props.hint : "";
    });
    function onFocus() {
      if (inputRef.value !== document.activeElement) {
        var _inputRef$value;
        (_inputRef$value = inputRef.value) == null ? void 0 : _inputRef$value.focus();
      }
      if (!isFocused.value)
        isFocused.value = true;
    }
    function onControlClick(e) {
      onFocus();
      emit("click:control", e);
    }
    function onClear(e) {
      e.stopPropagation();
      onFocus();
      vue_cjs_prod.nextTick(() => {
        model.value = "";
        emit("click:clear", e);
      });
    }
    useRender(() => {
      const hasCounter = !!(slots.counter || props.counter || props.counterValue);
      const [rootAttrs, inputAttrs] = filterInputAttrs(attrs);
      const [_a] = filterInputProps(props), _b = _a, inputProps = __objRest(_b, [
        "modelValue"
      ]);
      const [fieldProps] = filterFieldProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "ref": vInputRef,
        "modelValue": model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        "class": ["v-text-field", {
          "v-text-field--prefixed": props.prefix,
          "v-text-field--suffixed": props.suffix,
          "v-text-field--flush-details": ["plain", "underlined"].includes(props.variant)
        }],
        "onClick:prepend": attrs["onClick:prepend"],
        "onClick:append": attrs["onClick:append"]
      }, rootAttrs, inputProps, {
        "messages": messages.value
      }), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            isDisabled,
            isDirty,
            isReadonly,
            isValid
          } = _ref2;
          return vue_cjs_prod.createVNode(VField, vue_cjs_prod.mergeProps({
            "ref": vFieldRef,
            "onMousedown": (e) => {
              if (e.target === inputRef.value)
                return;
              e.preventDefault();
            },
            "onClick:control": onControlClick,
            "onClick:clear": onClear,
            "onClick:prependInner": attrs["onClick:prependInner"],
            "onClick:appendInner": attrs["onClick:appendInner"],
            "role": "textbox"
          }, fieldProps, {
            "active": isActive.value || isDirty.value,
            "dirty": isDirty.value || props.dirty,
            "focused": isFocused.value,
            "error": isValid.value === false
          }), __spreadProps(__spreadValues({}, slots), {
            default: (_ref3) => {
              var _slots$default;
              let {
                props: _a2
              } = _ref3, _b2 = _a2, {
                class: fieldClass
              } = _b2, slotProps = __objRest(_b2, [
                "class"
              ]);
              return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [props.prefix && vue_cjs_prod.createVNode("span", {
                "class": "v-text-field__prefix"
              }, [props.prefix]), vue_cjs_prod.createVNode("div", {
                "class": fieldClass,
                "onClick": (e) => emit("click:input", e),
                "data-no-activator": ""
              }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots), vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("input", vue_cjs_prod.mergeProps({
                "ref": inputRef,
                "onUpdate:modelValue": ($event) => model.value = $event,
                "autofocus": props.autofocus,
                "readonly": isReadonly.value,
                "disabled": isDisabled.value,
                "name": props.name,
                "placeholder": props.placeholder,
                "size": 1,
                "type": props.type,
                "onFocus": onFocus,
                "onBlur": () => isFocused.value = false
              }, slotProps, inputAttrs), null), [[vue_cjs_prod.vModelDynamic, model.value], [vue_cjs_prod.resolveDirective("intersect"), {
                handler: onIntersect
              }, null, {
                once: true
              }]])]), props.suffix && vue_cjs_prod.createVNode("span", {
                "class": "v-text-field__suffix"
              }, [props.suffix])]);
            }
          }));
        },
        details: hasCounter ? () => vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("span", null, null), vue_cjs_prod.createVNode(VCounter, {
          "active": props.persistentCounter || isFocused.value,
          "value": counterValue.value,
          "max": max.value
        }, slots.counter)]) : void 0
      }));
    });
    return useForwardRef({}, vInputRef, vFieldRef, inputRef);
  }
});
const makeSelectProps = propsFactory(__spreadValues({
  chips: Boolean,
  closableChips: Boolean,
  eager: Boolean,
  hideNoData: Boolean,
  hideSelected: Boolean,
  menuIcon: {
    type: IconValue,
    default: "$dropdown"
  },
  modelValue: {
    type: null,
    default: () => []
  },
  multiple: Boolean,
  noDataText: {
    type: String,
    default: "$vuetify.noDataText"
  },
  openOnClear: Boolean
}, makeItemsProps({
  itemChildren: false
})), "select");
const VSelect = genericComponent()({
  name: "VSelect",
  props: __spreadValues(__spreadValues({}, makeSelectProps()), makeTransitionProps({
    transition: {
      component: VDialogTransition
    }
  })),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      t
    } = useLocale();
    const vTextFieldRef = vue_cjs_prod.ref();
    const menu = vue_cjs_prod.ref(false);
    const {
      items,
      transformIn,
      transformOut
    } = useItems(props);
    const model = useProxiedModel(props, "modelValue", [], (v) => transformIn(wrapInArray(v)), (v) => {
      const transformed = transformOut(v);
      return props.multiple ? transformed : transformed[0];
    });
    const selections = vue_cjs_prod.computed(() => {
      return model.value.map((v) => {
        return items.value.find((item) => item.value === v.value) || v;
      });
    });
    const selected = vue_cjs_prod.computed(() => selections.value.map((selection) => selection.props.value));
    function onClear(e) {
      model.value = [];
      if (props.openOnClear) {
        menu.value = true;
      }
    }
    function onClickControl() {
      if (props.hideNoData && !items.value.length)
        return;
      menu.value = true;
    }
    function onKeydown(e) {
      if (["Enter", "ArrowDown", " "].includes(e.key)) {
        menu.value = true;
      }
      if (["Escape", "Tab"].includes(e.key)) {
        menu.value = false;
      }
    }
    function select(item) {
      if (props.multiple) {
        const index2 = selected.value.findIndex((selection) => selection === item.value);
        if (index2 === -1) {
          model.value = [...model.value, item];
        } else {
          const value = [...model.value];
          value.splice(index2, 1);
          model.value = value;
        }
      } else {
        model.value = [item];
        menu.value = false;
      }
    }
    useRender(() => {
      const hasChips = !!(props.chips || slots.chip);
      return vue_cjs_prod.createVNode(VTextField, {
        "ref": vTextFieldRef,
        "class": ["v-select", {
          "v-select--active-menu": menu.value,
          "v-select--chips": !!props.chips,
          [`v-select--${props.multiple ? "multiple" : "single"}`]: true
        }],
        "appendInnerIcon": props.menuIcon,
        "readonly": true,
        "onClick:clear": onClear,
        "onClick:input": onClickControl,
        "onClick:control": onClickControl,
        "onBlur": () => menu.value = false,
        "modelValue": model.value.map((v) => v.props.value).join(", "),
        "onKeydown": onKeydown
      }, __spreadProps(__spreadValues({}, slots), {
        default: () => {
          var _slots$noData, _slots$noData2;
          return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(VMenu, {
            "modelValue": menu.value,
            "onUpdate:modelValue": ($event) => menu.value = $event,
            "activator": "parent",
            "contentClass": "v-select__content",
            "eager": props.eager,
            "openOnClick": false,
            "transition": props.transition
          }, {
            default: () => [vue_cjs_prod.createVNode(VList, {
              "selected": selected.value,
              "selectStrategy": props.multiple ? "independent" : "single-independent"
            }, {
              default: () => [!items.value.length && !props.hideNoData && ((_slots$noData = (_slots$noData2 = slots["no-data"]) == null ? void 0 : _slots$noData2.call(slots)) != null ? _slots$noData : vue_cjs_prod.createVNode(VListItem, {
                "title": t(props.noDataText)
              }, null)), items.value.map((item) => vue_cjs_prod.createVNode(VListItem, vue_cjs_prod.mergeProps(item.props, {
                "onMousedown": (e) => e.preventDefault(),
                "onClick": () => select(item)
              }), null))]
            })]
          }), selections.value.map((selection, index2) => {
            function onChipClose(e) {
              e.stopPropagation();
              e.preventDefault();
              select(selection);
            }
            const slotProps = {
              "onClick:close": onChipClose,
              modelValue: true
            };
            return vue_cjs_prod.createVNode("div", {
              "class": "v-select__selection"
            }, [hasChips ? vue_cjs_prod.createVNode(VDefaultsProvider, {
              "defaults": {
                VChip: {
                  closable: props.closableChips,
                  size: "small",
                  text: selection.props.title
                }
              }
            }, {
              default: () => [slots.chip ? slots.chip({
                props: slotProps,
                selection,
                index: index2
              }) : vue_cjs_prod.createVNode(VChip, slotProps, null)]
            }) : slots.selection ? slots.selection({
              item: selection.originalItem,
              index: index2
            }) : vue_cjs_prod.createVNode("span", {
              "class": "v-select__selection-text"
            }, [selection.props.title, props.multiple && index2 < selections.value.length - 1 && vue_cjs_prod.createVNode("span", {
              "class": "v-select__selection-comma"
            }, [vue_cjs_prod.createTextVNode(",")])])]);
          })]);
        }
      }));
    });
    return useForwardRef({}, vTextFieldRef);
  }
});
const defaultFilter = (value, query, item) => {
  if (value == null || query == null)
    return -1;
  return value.toString().toLocaleLowerCase().indexOf(query.toString().toLocaleLowerCase());
};
const makeFilterProps = propsFactory({
  customFilter: Function,
  customKeyFilter: Object,
  filterKeys: [Array, String],
  filterMode: {
    type: String,
    default: "intersection"
  },
  noFilter: Boolean
}, "filter");
function filterItems(items, query, options) {
  var _options$default, _options$customKeyFil;
  const array = [];
  const filter = (_options$default = options == null ? void 0 : options.default) != null ? _options$default : defaultFilter;
  const keys2 = options != null && options.filterKeys ? wrapInArray(options.filterKeys) : false;
  const customFiltersLength = Object.keys((_options$customKeyFil = options == null ? void 0 : options.customKeyFilter) != null ? _options$customKeyFil : {}).length;
  if (!(items != null && items.length))
    return array;
  loop:
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const customMatches = {};
      const defaultMatches = {};
      let match = -1;
      if (query && !(options != null && options.noFilter)) {
        if (typeof item === "object") {
          const filterKeys = keys2 || Object.keys(item);
          for (const key of filterKeys) {
            var _options$customKeyFil2;
            const value = getPropertyFromItem(item, key, item);
            const keyFilter = options == null ? void 0 : (_options$customKeyFil2 = options.customKeyFilter) == null ? void 0 : _options$customKeyFil2[key];
            match = keyFilter ? keyFilter(value, query, item) : filter(value, query, item);
            if (match !== -1 && match !== false) {
              if (keyFilter)
                customMatches[key] = match;
              else
                defaultMatches[key] = match;
            } else if ((options == null ? void 0 : options.filterMode) === "every") {
              continue loop;
            }
          }
        } else {
          match = filter(item, query, item);
          if (match !== -1 && match !== false) {
            defaultMatches.title = match;
          }
        }
        const defaultMatchesLength = Object.keys(defaultMatches).length;
        const customMatchesLength = Object.keys(customMatches).length;
        if (!defaultMatchesLength && !customMatchesLength)
          continue;
        if ((options == null ? void 0 : options.filterMode) === "union" && customMatchesLength !== customFiltersLength && !defaultMatchesLength)
          continue;
        if ((options == null ? void 0 : options.filterMode) === "intersection" && (customMatchesLength !== customFiltersLength || !defaultMatchesLength))
          continue;
      }
      array.push({
        index: i,
        matches: __spreadValues(__spreadValues({}, defaultMatches), customMatches)
      });
    }
  return array;
}
function useFilter(props, items, query) {
  const strQuery = vue_cjs_prod.computed(() => typeof (query == null ? void 0 : query.value) !== "string" && typeof (query == null ? void 0 : query.value) !== "number" ? "" : String(query.value));
  const filteredItems = vue_cjs_prod.computed(() => {
    const transformedItems = vue_cjs_prod.unref(items);
    const matches = filterItems(transformedItems, strQuery.value, {
      customKeyFilter: props.customKeyFilter,
      default: props.customFilter,
      filterKeys: props.filterKeys,
      filterMode: props.filterMode,
      noFilter: props.noFilter
    });
    return matches.map((_ref) => {
      let {
        index: index2,
        matches: matches2
      } = _ref;
      return {
        item: transformedItems[index2],
        matches: matches2
      };
    });
  });
  return {
    filteredItems
  };
}
function highlightResult$1(text, matches, length) {
  if (Array.isArray(matches))
    throw new Error("Multiple matches is not implemented");
  return typeof matches === "number" && ~matches ? vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("span", {
    "class": "v-autocomplete__unmask"
  }, [text.substr(0, matches)]), vue_cjs_prod.createVNode("span", {
    "class": "v-autocomplete__mask"
  }, [text.substr(matches, length)]), vue_cjs_prod.createVNode("span", {
    "class": "v-autocomplete__unmask"
  }, [text.substr(matches + length)])]) : text;
}
const VAutocomplete = genericComponent()({
  name: "VAutocomplete",
  props: __spreadValues(__spreadValues(__spreadValues({
    search: String
  }, makeFilterProps({
    filterKeys: ["title"]
  })), makeSelectProps()), makeTransitionProps({
    transition: false
  })),
  emits: {
    "click:clear": (e) => true,
    "update:search": (val) => true,
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      t
    } = useLocale();
    const vTextFieldRef = vue_cjs_prod.ref();
    const isFocused = vue_cjs_prod.ref(false);
    const isPristine = vue_cjs_prod.ref(true);
    const menu = vue_cjs_prod.ref(false);
    const {
      items,
      transformIn,
      transformOut
    } = useItems(props);
    const search = useProxiedModel(props, "search", "");
    const model = useProxiedModel(props, "modelValue", [], (v) => transformIn(wrapInArray(v)), (v) => {
      const transformed = transformOut(v);
      return props.multiple ? transformed : transformed[0];
    });
    const {
      filteredItems
    } = useFilter(props, items, vue_cjs_prod.computed(() => isPristine.value ? void 0 : search.value));
    const selections = vue_cjs_prod.computed(() => {
      return model.value.map((v) => {
        return items.value.find((item) => item.value === v.value) || v;
      });
    });
    const selected = vue_cjs_prod.computed(() => selections.value.map((selection) => selection.props.value));
    function onClear(e) {
      model.value = [];
      if (props.openOnClear) {
        menu.value = true;
      }
      search.value = "";
    }
    function onClickControl() {
      if (props.hideNoData && !filteredItems.value.length)
        return;
      menu.value = true;
    }
    function onKeydown(e) {
      if (["Enter", "ArrowDown"].includes(e.key)) {
        menu.value = true;
      }
      if (["Escape"].includes(e.key)) {
        menu.value = false;
      }
      if (["Enter", "Escape", "Tab"].includes(e.key)) {
        isPristine.value = true;
      }
    }
    function onInput(e) {
      search.value = e.target.value;
    }
    function onAfterLeave() {
      if (isFocused.value)
        isPristine.value = true;
    }
    const isSelecting = vue_cjs_prod.ref(false);
    function select(item) {
      if (props.multiple) {
        const index2 = selected.value.findIndex((selection) => selection === item.value);
        if (index2 === -1) {
          model.value = [...model.value, item];
          search.value = "";
        } else {
          const value = [...model.value];
          value.splice(index2, 1);
          model.value = value;
        }
      } else {
        model.value = [item];
        isSelecting.value = true;
        search.value = item.title;
        menu.value = false;
        isPristine.value = true;
        vue_cjs_prod.nextTick(() => isSelecting.value = false);
      }
    }
    vue_cjs_prod.watch(isFocused, (val) => {
      if (val) {
        var _selections$value$at$, _selections$value$at;
        isSelecting.value = true;
        search.value = props.multiple ? "" : String((_selections$value$at$ = (_selections$value$at = selections.value.at(-1)) == null ? void 0 : _selections$value$at.props.title) != null ? _selections$value$at$ : "");
        isPristine.value = true;
        vue_cjs_prod.nextTick(() => isSelecting.value = false);
      } else {
        menu.value = false;
        search.value = "";
      }
    });
    vue_cjs_prod.watch(search, (val) => {
      if (!isFocused.value || isSelecting.value)
        return;
      if (val)
        menu.value = true;
      isPristine.value = !val;
    });
    useRender(() => {
      const hasChips = !!(props.chips || slots.chip);
      return vue_cjs_prod.createVNode(VTextField, {
        "ref": vTextFieldRef,
        "modelValue": search.value,
        "onInput": onInput,
        "class": ["v-autocomplete", {
          "v-autocomplete--active-menu": menu.value,
          "v-autocomplete--chips": !!props.chips,
          [`v-autocomplete--${props.multiple ? "multiple" : "single"}`]: true
        }],
        "appendInnerIcon": props.menuIcon,
        "dirty": selected.value.length > 0,
        "onClick:clear": onClear,
        "onClick:control": onClickControl,
        "onClick:input": onClickControl,
        "onFocus": () => isFocused.value = true,
        "onBlur": () => isFocused.value = false,
        "onKeydown": onKeydown
      }, __spreadProps(__spreadValues({}, slots), {
        default: () => {
          var _slots$noData, _slots$noData2;
          return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(VMenu, {
            "modelValue": menu.value,
            "onUpdate:modelValue": ($event) => menu.value = $event,
            "activator": "parent",
            "contentClass": "v-autocomplete__content",
            "eager": props.eager,
            "openOnClick": false,
            "transition": props.transition,
            "onAfterLeave": onAfterLeave
          }, {
            default: () => [vue_cjs_prod.createVNode(VList, {
              "selected": selected.value,
              "selectStrategy": props.multiple ? "independent" : "single-independent"
            }, {
              default: () => [!filteredItems.value.length && !props.hideNoData && ((_slots$noData = (_slots$noData2 = slots["no-data"]) == null ? void 0 : _slots$noData2.call(slots)) != null ? _slots$noData : vue_cjs_prod.createVNode(VListItem, {
                "title": t(props.noDataText)
              }, null)), filteredItems.value.map((_ref2) => {
                let {
                  item,
                  matches
                } = _ref2;
                return vue_cjs_prod.createVNode(VListItem, vue_cjs_prod.mergeProps(item.props, {
                  "onMousedown": (e) => e.preventDefault(),
                  "onClick": () => select(item)
                }), {
                  title: () => {
                    var _search$value$length, _search$value;
                    return isPristine.value ? item.title : highlightResult$1(item.title, matches.title, (_search$value$length = (_search$value = search.value) == null ? void 0 : _search$value.length) != null ? _search$value$length : 0);
                  }
                });
              })]
            })]
          }), selections.value.map((selection, index2) => {
            function onChipClose(e) {
              e.stopPropagation();
              e.preventDefault();
              select(selection);
            }
            const slotProps = {
              "onClick:close": onChipClose,
              modelValue: true
            };
            return vue_cjs_prod.createVNode("div", {
              "class": "v-autocomplete__selection"
            }, [hasChips ? vue_cjs_prod.createVNode(VDefaultsProvider, {
              "defaults": {
                VChip: {
                  closable: props.closableChips,
                  size: "small",
                  text: selection.props.title
                }
              }
            }, {
              default: () => [slots.chip ? slots.chip({
                props: slotProps,
                item: selection.originalItem,
                index: index2
              }) : vue_cjs_prod.createVNode(VChip, slotProps, null)]
            }) : slots.selection ? slots.selection({
              item: selection.originalItem,
              index: index2
            }) : vue_cjs_prod.createVNode("span", {
              "class": "v-autocomplete__selection-text"
            }, [selection.props.title, props.multiple && index2 < selections.value.length - 1 && vue_cjs_prod.createVNode("span", {
              "class": "v-autocomplete__selection-comma"
            }, [vue_cjs_prod.createTextVNode(",")])])]);
          })]);
        }
      }));
    });
    return useForwardRef({
      filteredItems
    }, vTextFieldRef);
  }
});
const VBadge = defineComponent({
  name: "VBadge",
  inheritAttrs: false,
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    bordered: Boolean,
    color: String,
    content: [Number, String],
    dot: Boolean,
    floating: Boolean,
    icon: IconValue,
    inline: Boolean,
    label: {
      type: String,
      default: "$vuetify.badge"
    },
    max: [Number, String],
    modelValue: {
      type: Boolean,
      default: true
    },
    offsetX: [Number, String],
    offsetY: [Number, String],
    textColor: String
  }, makeLocationProps({
    location: "top end"
  })), makeRoundedProps()), makeTagProps()), makeThemeProps()), makeTransitionProps({
    transition: "scale-rotate-transition"
  })),
  setup(props, ctx) {
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      roundedClasses
    } = useRounded(props);
    const {
      t
    } = useLocale();
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "textColor"));
    const {
      themeClasses
    } = useTheme();
    const {
      locationStyles
    } = useLocation(props, true, (side) => {
      var _props$offsetY, _props$offsetX;
      const base = props.floating ? props.dot ? 2 : 4 : props.dot ? 8 : 12;
      return base + (["top", "bottom"].includes(side) ? +((_props$offsetY = props.offsetY) != null ? _props$offsetY : 0) : ["left", "right"].includes(side) ? +((_props$offsetX = props.offsetX) != null ? _props$offsetX : 0) : 0);
    });
    return () => {
      var _ctx$slots$default, _ctx$slots, _ctx$slots$badge, _ctx$slots2;
      const value = Number(props.content);
      const content = !props.max || isNaN(value) ? props.content : value <= props.max ? value : `${props.max}+`;
      const [badgeAttrs, attrs] = pick(ctx.attrs, ["aria-atomic", "aria-label", "aria-live", "role", "title"]);
      return vue_cjs_prod.createVNode(props.tag, vue_cjs_prod.mergeProps({
        "class": ["v-badge", {
          "v-badge--bordered": props.bordered,
          "v-badge--dot": props.dot,
          "v-badge--floating": props.floating,
          "v-badge--inline": props.inline
        }]
      }, attrs), {
        default: () => [vue_cjs_prod.createVNode("div", {
          "class": "v-badge__wrapper"
        }, [(_ctx$slots$default = (_ctx$slots = ctx.slots).default) == null ? void 0 : _ctx$slots$default.call(_ctx$slots), vue_cjs_prod.createVNode(MaybeTransition, {
          "transition": props.transition
        }, {
          default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("span", vue_cjs_prod.mergeProps({
            "class": ["v-badge__badge", backgroundColorClasses.value, roundedClasses.value, textColorClasses.value, themeClasses.value],
            "style": [backgroundColorStyles.value, textColorStyles.value, props.inline ? {} : locationStyles.value],
            "aria-atomic": "true",
            "aria-label": t(props.label, value),
            "aria-live": "polite",
            "role": "status"
          }, badgeAttrs), [props.dot ? void 0 : ctx.slots.badge ? (_ctx$slots$badge = (_ctx$slots2 = ctx.slots).badge) == null ? void 0 : _ctx$slots$badge.call(_ctx$slots2) : props.icon ? vue_cjs_prod.createVNode(VIcon, {
            "icon": props.icon
          }, null) : content]), [[vue_cjs_prod.vShow, props.modelValue]])]
        })])]
      });
    };
  }
});
const VBannerActions = defineComponent({
  name: "VBannerActions",
  props: {
    color: String,
    density: String
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    provideDefaults({
      VBtn: {
        color: props.color,
        density: props.density,
        variant: "text"
      }
    });
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-banner-actions"
      }, [slots == null ? void 0 : (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    });
    return {};
  }
});
const VBannerAvatar = defineComponent({
  name: "VBannerAvatar",
  props: makeVAvatarProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(VAvatar, vue_cjs_prod.mergeProps({
      "class": "v-banner-avatar"
    }, props), slots);
  }
});
const VBannerIcon = defineComponent({
  name: "VBannerIcon",
  props: makeVAvatarProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(VAvatar, vue_cjs_prod.mergeProps({
      "class": "v-banner-icon"
    }, props), slots);
  }
});
const VBannerText = createSimpleFunctional("v-banner-text");
const VBanner = defineComponent({
  name: "VBanner",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    avatar: String,
    color: String,
    icon: IconValue,
    lines: String,
    stacked: Boolean,
    sticky: Boolean,
    text: String
  }, makeBorderProps()), makeDensityProps()), makeDimensionProps()), makeElevationProps()), makeLocationProps()), makePositionProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      borderClasses
    } = useBorder(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      mobile
    } = useDisplay();
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      themeClasses
    } = provideTheme(props);
    const color = vue_cjs_prod.toRef(props, "color");
    const density = vue_cjs_prod.toRef(props, "density");
    provideDefaults({
      VBannerActions: {
        color,
        density
      },
      VBannerAvatar: {
        density,
        image: vue_cjs_prod.toRef(props, "avatar")
      },
      VBannerIcon: {
        color,
        density,
        icon: vue_cjs_prod.toRef(props, "icon")
      }
    });
    useRender(() => {
      var _slots$default;
      const hasText = !!(props.text || slots.text);
      const hasPrepend = !!(slots.prepend || props.avatar || props.icon);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-banner", {
          "v-banner--stacked": props.stacked || mobile.value,
          "v-banner--sticky": props.sticky,
          [`v-banner--${props.lines}-line`]: !!props.lines
        }, borderClasses.value, densityClasses.value, elevationClasses.value, positionClasses.value, roundedClasses.value, themeClasses.value],
        "style": [dimensionStyles.value, locationStyles.value],
        "role": "banner"
      }, {
        default: () => [hasPrepend && vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [slots.prepend ? vue_cjs_prod.createVNode("div", {
          "class": "v-banner__prepend"
        }, [slots.prepend()]) : props.avatar ? vue_cjs_prod.createVNode(VBannerAvatar, null, null) : props.icon ? vue_cjs_prod.createVNode(VBannerIcon, null, null) : void 0]), hasText && vue_cjs_prod.createVNode(VBannerText, null, {
          default: () => [slots.text ? slots.text() : props.text]
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots), slots.actions && vue_cjs_prod.createVNode(VBannerActions, null, {
          default: () => [slots.actions()]
        })]
      });
    });
  }
});
const VBottomNavigation = defineComponent({
  name: "VBottomNavigation",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    bgColor: String,
    color: String,
    grow: Boolean,
    mode: {
      type: String,
      validator: (v) => !v || ["horizontal", "shift"].includes(v)
    },
    height: {
      type: [Number, String],
      default: 56
    }
  }, makeBorderProps()), makeDensityProps()), makeElevationProps()), makeRoundedProps()), makeLayoutItemProps({
    name: "bottom-navigation"
  })), makeTagProps({
    tag: "header"
  })), makeGroupProps({
    modelValue: true,
    selectedClass: "v-btn--selected"
  })), makeThemeProps()),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = useTheme();
    const {
      borderClasses
    } = useBorder(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "bgColor"));
    const {
      densityClasses
    } = useDensity(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const height = vue_cjs_prod.computed(() => Number(props.height) - (props.density === "comfortable" ? 8 : 0) - (props.density === "compact" ? 16 : 0));
    const isActive = useProxiedModel(props, "modelValue", props.modelValue);
    const {
      layoutItemStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.computed(() => "bottom"),
      layoutSize: vue_cjs_prod.computed(() => isActive.value ? height.value : 0),
      elementSize: height,
      active: isActive,
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    useGroup(props, VBtnToggleSymbol);
    provideDefaults({
      VBtn: {
        color: vue_cjs_prod.toRef(props, "color"),
        density: vue_cjs_prod.toRef(props, "density"),
        stacked: vue_cjs_prod.computed(() => props.mode !== "horizontal"),
        variant: "text"
      }
    }, {
      scoped: true
    });
    return () => {
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-bottom-navigation", {
          "v-bottom-navigation--active": isActive.value,
          "v-bottom-navigation--grow": props.grow,
          "v-bottom-navigation--shift": props.mode === "shift"
        }, themeClasses.value, backgroundColorClasses.value, borderClasses.value, densityClasses.value, elevationClasses.value, roundedClasses.value],
        "style": [backgroundColorStyles.value, layoutItemStyles.value, {
          height: convertToUnit(height.value),
          transform: `translateY(${convertToUnit(!isActive.value ? 100 : 0, "%")})`
        }]
      }, {
        default: () => [slots.default && vue_cjs_prod.createVNode("div", {
          "class": "v-bottom-navigation__content"
        }, [slots.default()])]
      });
    };
  }
});
const VBreadcrumbsItem = defineComponent({
  name: "VBreadcrumbsItem",
  props: __spreadValues(__spreadValues({
    active: Boolean,
    activeClass: String,
    activeColor: String,
    color: String,
    disabled: Boolean,
    text: String
  }, makeRouterProps()), makeTagProps({
    tag: "li"
  })),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const link = useLink(props, attrs);
    const isActive = vue_cjs_prod.computed(() => {
      var _link$isExactActive;
      return props.active || ((_link$isExactActive = link.isExactActive) == null ? void 0 : _link$isExactActive.value);
    });
    const color = vue_cjs_prod.computed(() => isActive.value ? props.activeColor : props.color);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(color);
    useRender(() => {
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasText = !!(slots.default || props.text);
      return vue_cjs_prod.createVNode(Tag, {
        "class": ["v-breadcrumbs-item", {
          "v-breadcrumbs-item--active": isActive.value,
          "v-breadcrumbs-item--disabled": props.disabled,
          "v-breadcrumbs-item--link": link.isLink.value,
          [`${props.activeClass}`]: isActive.value && props.activeClass
        }, textColorClasses.value],
        "style": [textColorStyles.value],
        "href": link.href.value,
        "aria-current": isActive.value ? "page" : void 0,
        "onClick": link.navigate
      }, {
        default: hasText ? () => {
          var _slots$default, _slots$default2;
          return (_slots$default = (_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots)) != null ? _slots$default : props.text;
        } : void 0
      });
    });
    return {};
  }
});
const VBreadcrumbsDivider = createSimpleFunctional("v-breadcrumbs-divider", "li");
const VBreadcrumbs = defineComponent({
  name: "VBreadcrumbs",
  props: __spreadValues(__spreadValues(__spreadValues({
    activeClass: String,
    activeColor: String,
    bgColor: String,
    color: String,
    disabled: Boolean,
    divider: {
      type: String,
      default: "/"
    },
    icon: IconValue,
    items: {
      type: Array,
      default: () => []
    }
  }, makeDensityProps()), makeRoundedProps()), makeTagProps({
    tag: "ul"
  })),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      densityClasses
    } = useDensity(props);
    const {
      roundedClasses
    } = useRounded(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "bgColor"));
    provideDefaults({
      VBreadcrumbsItem: {
        activeClass: vue_cjs_prod.toRef(props, "activeClass"),
        activeColor: vue_cjs_prod.toRef(props, "activeColor"),
        color: vue_cjs_prod.toRef(props, "color"),
        disabled: vue_cjs_prod.toRef(props, "disabled")
      }
    });
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-breadcrumbs", backgroundColorClasses.value, densityClasses.value, roundedClasses.value],
        "style": backgroundColorStyles.value
      }, {
        default: () => [props.icon && vue_cjs_prod.createVNode(VIcon, {
          "icon": props.icon,
          "left": true
        }, null), props.items.map((item, index2, array) => {
          var _slots$divider, _slots$divider2;
          return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(VBreadcrumbsItem, vue_cjs_prod.mergeProps({
            "key": index2,
            "disabled": index2 >= array.length - 1
          }, typeof item === "string" ? {
            text: item
          } : item), {
            default: slots.text ? () => {
              var _slots$text;
              return (_slots$text = slots.text) == null ? void 0 : _slots$text.call(slots, {
                item,
                index: index2
              });
            } : void 0
          }), index2 < array.length - 1 && vue_cjs_prod.createVNode(VBreadcrumbsDivider, null, {
            default: () => [(_slots$divider = (_slots$divider2 = slots.divider) == null ? void 0 : _slots$divider2.call(slots, {
              item,
              index: index2
            })) != null ? _slots$divider : props.divider]
          })]);
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
      });
    });
    return {};
  }
});
const VCardActions = defineComponent({
  name: "VCardActions",
  setup(_, _ref) {
    let {
      slots
    } = _ref;
    provideDefaults({
      VBtn: {
        variant: "text"
      }
    });
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-card-actions"
      }, [slots == null ? void 0 : (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    });
    return {};
  }
});
const VCardAvatar = createSimpleFunctional("v-card-avatar");
const VCardContent = createSimpleFunctional("v-card-content");
const VCardHeader = createSimpleFunctional("v-card-header");
const VCardHeaderText = createSimpleFunctional("v-card-header-text");
const VCardImg = createSimpleFunctional("v-card-img");
const VCardSubtitle = createSimpleFunctional("v-card-subtitle");
const VCardText = createSimpleFunctional("v-card-text");
const VCardTitle = createSimpleFunctional("v-card-title");
const VCard = defineComponent({
  name: "VCard",
  directives: {
    Ripple
  },
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    appendAvatar: String,
    appendIcon: IconValue,
    disabled: Boolean,
    flat: Boolean,
    hover: Boolean,
    image: String,
    link: Boolean,
    prependAvatar: String,
    prependIcon: IconValue,
    ripple: Boolean,
    subtitle: String,
    text: String,
    title: String
  }, makeThemeProps()), makeBorderProps()), makeDensityProps()), makeDimensionProps()), makeElevationProps()), makeLocationProps()), makePositionProps()), makeRoundedProps()), makeRouterProps()), makeTagProps()), makeVariantProps({
    variant: "contained"
  })),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      densityClasses
    } = useDensity(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    const link = useLink(props, attrs);
    return () => {
      var _slots$image, _slots$media, _slots$headerText, _slots$default;
      const Tag = link.isLink.value ? "a" : props.tag;
      const hasTitle = !!(slots.title || props.title);
      const hasSubtitle = !!(slots.subtitle || props.subtitle);
      const hasHeaderText = hasTitle || hasSubtitle;
      const hasAppend = !!(slots.append || props.appendAvatar || props.appendIcon);
      const hasPrepend = !!(slots.prepend || props.prependAvatar || props.prependIcon);
      const hasImage = !!(slots.image || props.image);
      const hasHeader = hasHeaderText || hasPrepend || hasAppend;
      const hasText = !!(slots.text || props.text);
      const isClickable = !props.disabled && (link.isClickable.value || props.link);
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(Tag, {
        "class": ["v-card", {
          "v-card--disabled": props.disabled,
          "v-card--flat": props.flat,
          "v-card--hover": props.hover && !(props.disabled || props.flat),
          "v-card--link": isClickable
        }, themeClasses.value, borderClasses.value, colorClasses.value, densityClasses.value, elevationClasses.value, positionClasses.value, roundedClasses.value, variantClasses.value],
        "style": [colorStyles.value, dimensionStyles.value, locationStyles.value],
        "href": link.href.value,
        "onClick": isClickable && link.navigate
      }, {
        default: () => [genOverlays(isClickable, "v-card"), hasImage && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VImg: {
              cover: true,
              src: props.image
            }
          }
        }, {
          default: () => [vue_cjs_prod.createVNode(VCardImg, null, {
            default: () => [slots.image ? (_slots$image = slots.image) == null ? void 0 : _slots$image.call(slots) : vue_cjs_prod.createVNode(VImg, {
              "alt": ""
            }, null)]
          })]
        }), (_slots$media = slots.media) == null ? void 0 : _slots$media.call(slots), hasHeader && vue_cjs_prod.createVNode(VCardHeader, null, {
          default: () => [hasPrepend && vue_cjs_prod.createVNode(VDefaultsProvider, {
            "defaults": {
              VAvatar: {
                density: props.density,
                icon: props.prependIcon,
                image: props.prependAvatar
              }
            }
          }, {
            default: () => [vue_cjs_prod.createVNode(VCardAvatar, null, {
              default: () => [slots.prepend ? slots.prepend() : vue_cjs_prod.createVNode(VAvatar, null, null)]
            })]
          }), hasHeaderText && vue_cjs_prod.createVNode(VCardHeaderText, null, {
            default: () => [hasTitle && vue_cjs_prod.createVNode(VCardTitle, null, {
              default: () => [slots.title ? slots.title() : props.title]
            }), hasSubtitle && vue_cjs_prod.createVNode(VCardSubtitle, null, {
              default: () => [slots.subtitle ? slots.subtitle() : props.subtitle]
            }), (_slots$headerText = slots.headerText) == null ? void 0 : _slots$headerText.call(slots)]
          }), hasAppend && vue_cjs_prod.createVNode(VDefaultsProvider, {
            "defaults": {
              VAvatar: {
                density: props.density,
                icon: props.appendIcon,
                image: props.appendAvatar
              }
            }
          }, {
            default: () => [vue_cjs_prod.createVNode(VCardAvatar, null, {
              default: () => [slots.append ? slots.append() : vue_cjs_prod.createVNode(VAvatar, null, null)]
            })]
          })]
        }), hasText && vue_cjs_prod.createVNode(VCardText, null, {
          default: () => [slots.text ? slots.text() : props.text]
        }), slots.content && vue_cjs_prod.createVNode(VCardContent, null, {
          default: slots.content
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots), slots.actions && vue_cjs_prod.createVNode(VCardActions, null, {
          default: slots.actions
        })]
      }), [[vue_cjs_prod.resolveDirective("ripple"), isClickable]]);
    };
  }
});
const handleGesture = (wrapper) => {
  const {
    touchstartX,
    touchendX,
    touchstartY,
    touchendY
  } = wrapper;
  const dirRatio = 0.5;
  const minDistance = 16;
  wrapper.offsetX = touchendX - touchstartX;
  wrapper.offsetY = touchendY - touchstartY;
  if (Math.abs(wrapper.offsetY) < dirRatio * Math.abs(wrapper.offsetX)) {
    wrapper.left && touchendX < touchstartX - minDistance && wrapper.left(wrapper);
    wrapper.right && touchendX > touchstartX + minDistance && wrapper.right(wrapper);
  }
  if (Math.abs(wrapper.offsetX) < dirRatio * Math.abs(wrapper.offsetY)) {
    wrapper.up && touchendY < touchstartY - minDistance && wrapper.up(wrapper);
    wrapper.down && touchendY > touchstartY + minDistance && wrapper.down(wrapper);
  }
};
function touchstart(event, wrapper) {
  var _wrapper$start;
  const touch = event.changedTouches[0];
  wrapper.touchstartX = touch.clientX;
  wrapper.touchstartY = touch.clientY;
  (_wrapper$start = wrapper.start) == null ? void 0 : _wrapper$start.call(wrapper, __spreadValues({
    originalEvent: event
  }, wrapper));
}
function touchend(event, wrapper) {
  var _wrapper$end;
  const touch = event.changedTouches[0];
  wrapper.touchendX = touch.clientX;
  wrapper.touchendY = touch.clientY;
  (_wrapper$end = wrapper.end) == null ? void 0 : _wrapper$end.call(wrapper, __spreadValues({
    originalEvent: event
  }, wrapper));
  handleGesture(wrapper);
}
function touchmove(event, wrapper) {
  var _wrapper$move;
  const touch = event.changedTouches[0];
  wrapper.touchmoveX = touch.clientX;
  wrapper.touchmoveY = touch.clientY;
  (_wrapper$move = wrapper.move) == null ? void 0 : _wrapper$move.call(wrapper, __spreadValues({
    originalEvent: event
  }, wrapper));
}
function createHandlers() {
  let value = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  const wrapper = {
    touchstartX: 0,
    touchstartY: 0,
    touchendX: 0,
    touchendY: 0,
    touchmoveX: 0,
    touchmoveY: 0,
    offsetX: 0,
    offsetY: 0,
    left: value.left,
    right: value.right,
    up: value.up,
    down: value.down,
    start: value.start,
    move: value.move,
    end: value.end
  };
  return {
    touchstart: (e) => touchstart(e, wrapper),
    touchend: (e) => touchend(e, wrapper),
    touchmove: (e) => touchmove(e, wrapper)
  };
}
function mounted$3(el, binding) {
  var _value$options, _binding$instance, _target$_touchHandler;
  const value = binding.value;
  const target = value != null && value.parent ? el.parentElement : el;
  const options = (_value$options = value == null ? void 0 : value.options) != null ? _value$options : {
    passive: true
  };
  const uid = (_binding$instance = binding.instance) == null ? void 0 : _binding$instance.$.uid;
  if (!target || !uid)
    return;
  const handlers = createHandlers(binding.value);
  target._touchHandlers = (_target$_touchHandler = target._touchHandlers) != null ? _target$_touchHandler : /* @__PURE__ */ Object.create(null);
  target._touchHandlers[uid] = handlers;
  keys(handlers).forEach((eventName) => {
    target.addEventListener(eventName, handlers[eventName], options);
  });
}
function unmounted$3(el, binding) {
  var _binding$value, _binding$instance2;
  const target = (_binding$value = binding.value) != null && _binding$value.parent ? el.parentElement : el;
  const uid = (_binding$instance2 = binding.instance) == null ? void 0 : _binding$instance2.$.uid;
  if (!(target != null && target._touchHandlers) || !uid)
    return;
  const handlers = target._touchHandlers[uid];
  keys(handlers).forEach((eventName) => {
    target.removeEventListener(eventName, handlers[eventName]);
  });
  delete target._touchHandlers[uid];
}
const Touch = {
  mounted: mounted$3,
  unmounted: unmounted$3
};
const VWindowSymbol = Symbol.for("vuetify:v-window");
const VWindowGroupSymbol = Symbol.for("vuetify:v-window-group");
const VWindow = genericComponent()({
  name: "VWindow",
  directives: {
    Touch
  },
  props: __spreadValues(__spreadValues({
    continuous: Boolean,
    nextIcon: {
      type: [Boolean, String, Function, Object],
      default: "$next"
    },
    prevIcon: {
      type: [Boolean, String, Function, Object],
      default: "$prev"
    },
    reverse: Boolean,
    showArrows: {
      type: [Boolean, String],
      validator: (v) => typeof v === "boolean" || v === "hover"
    },
    touch: {
      type: [Object, Boolean],
      default: void 0
    },
    direction: {
      type: String,
      default: "horizontal"
    },
    modelValue: null,
    disabled: Boolean,
    selectedClass: {
      type: String,
      default: "v-window-item--active"
    },
    mandatory: {
      default: "force"
    }
  }, makeTagProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (v) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      isRtl
    } = useRtl();
    const {
      t
    } = useLocale();
    const group = useGroup(props, VWindowGroupSymbol);
    const rootRef = vue_cjs_prod.ref();
    const isRtlReverse = vue_cjs_prod.computed(() => isRtl.value ? !props.reverse : props.reverse);
    const isReversed = vue_cjs_prod.ref(false);
    const transition = vue_cjs_prod.computed(() => {
      const axis = props.direction === "vertical" ? "y" : "x";
      const reverse = isRtlReverse.value ? !isReversed.value : isReversed.value;
      const direction = reverse ? "-reverse" : "";
      return `v-window-${axis}${direction}-transition`;
    });
    const transitionCount = vue_cjs_prod.ref(0);
    const transitionHeight = vue_cjs_prod.ref(void 0);
    const activeIndex = vue_cjs_prod.computed(() => {
      return group.items.value.findIndex((item) => group.selected.value.includes(item.id));
    });
    vue_cjs_prod.watch(activeIndex, (newVal, oldVal) => {
      const itemsLength = group.items.value.length;
      const lastIndex = itemsLength - 1;
      if (itemsLength <= 2) {
        isReversed.value = newVal < oldVal;
      } else if (newVal === lastIndex && oldVal === 0) {
        isReversed.value = true;
      } else if (newVal === 0 && oldVal === lastIndex) {
        isReversed.value = false;
      } else {
        isReversed.value = newVal < oldVal;
      }
    });
    vue_cjs_prod.provide(VWindowSymbol, {
      transition,
      isReversed,
      transitionCount,
      transitionHeight,
      rootRef
    });
    const canMoveBack = vue_cjs_prod.computed(() => props.continuous || activeIndex.value !== 0);
    const canMoveForward = vue_cjs_prod.computed(() => props.continuous || activeIndex.value !== group.items.value.length - 1);
    function prev() {
      canMoveBack.value && group.prev();
    }
    function next() {
      canMoveForward.value && group.next();
    }
    const arrows = vue_cjs_prod.computed(() => {
      const arrows2 = [];
      const prevProps = {
        icon: isRtl.value ? props.nextIcon : props.prevIcon,
        class: `v-window__${isRtlReverse.value ? "right" : "left"}`,
        onClick: group.prev,
        ariaLabel: t("$vuetify.carousel.prev")
      };
      arrows2.push(canMoveBack.value ? slots.prev ? slots.prev({
        props: prevProps
      }) : vue_cjs_prod.createVNode(VBtn, prevProps, null) : vue_cjs_prod.createVNode("div", null, null));
      const nextProps = {
        icon: isRtl.value ? props.prevIcon : props.nextIcon,
        class: `v-window__${isRtlReverse.value ? "left" : "right"}`,
        onClick: group.next,
        ariaLabel: t("$vuetify.carousel.next")
      };
      arrows2.push(canMoveForward.value ? slots.next ? slots.next({
        props: nextProps
      }) : vue_cjs_prod.createVNode(VBtn, nextProps, null) : vue_cjs_prod.createVNode("div", null, null));
      return arrows2;
    });
    const touchOptions = vue_cjs_prod.computed(() => {
      if (props.touch === false)
        return props.touch;
      const options = {
        left: () => {
          isRtlReverse.value ? prev() : next();
        },
        right: () => {
          isRtlReverse.value ? next() : prev();
        },
        end: (_ref2) => {
          let {
            originalEvent
          } = _ref2;
          originalEvent.stopPropagation();
        },
        start: (_ref3) => {
          let {
            originalEvent
          } = _ref3;
          originalEvent.stopPropagation();
        }
      };
      return __spreadValues(__spreadValues({}, options), props.touch === true ? {} : props.touch);
    });
    useRender(() => {
      var _slots$default, _slots$additional;
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(props.tag, {
        "ref": rootRef,
        "class": ["v-window", {
          "v-window--show-arrows-on-hover": props.showArrows === "hover"
        }, themeClasses.value]
      }, {
        default: () => [vue_cjs_prod.createVNode("div", {
          "class": "v-window__container",
          "style": {
            height: transitionHeight.value
          }
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
          group
        }), props.showArrows !== false && vue_cjs_prod.createVNode("div", {
          "class": "v-window__controls"
        }, [arrows.value])]), (_slots$additional = slots.additional) == null ? void 0 : _slots$additional.call(slots, {
          group
        })]
      }), [[vue_cjs_prod.resolveDirective("touch"), touchOptions.value]]);
    });
    return {
      group
    };
  }
});
const VWindowItem = defineComponent({
  name: "VWindowItem",
  directives: {
    Touch
  },
  props: __spreadValues(__spreadValues({
    reverseTransition: {
      type: [Boolean, String],
      default: void 0
    },
    transition: {
      type: [Boolean, String],
      default: void 0
    }
  }, makeLazyProps()), makeGroupItemProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const window2 = vue_cjs_prod.inject(VWindowSymbol);
    const groupItem = useGroupItem(props, VWindowGroupSymbol);
    if (!window2 || !groupItem)
      throw new Error("[Vuetify] VWindowItem must be used inside VWindow");
    const isTransitioning = vue_cjs_prod.ref(false);
    const hasTransition = vue_cjs_prod.computed(() => window2.isReversed.value ? props.reverseTransition !== false : props.transition !== false);
    function onAfterTransition() {
      if (!isTransitioning.value || !window2) {
        return;
      }
      isTransitioning.value = false;
      if (window2.transitionCount.value > 0) {
        window2.transitionCount.value -= 1;
        if (window2.transitionCount.value === 0) {
          window2.transitionHeight.value = void 0;
        }
      }
    }
    function onBeforeTransition() {
      if (isTransitioning.value || !window2) {
        return;
      }
      isTransitioning.value = true;
      if (window2.transitionCount.value === 0) {
        var _window$rootRef$value;
        window2.transitionHeight.value = convertToUnit((_window$rootRef$value = window2.rootRef.value) == null ? void 0 : _window$rootRef$value.clientHeight);
      }
      window2.transitionCount.value += 1;
    }
    function onTransitionCancelled() {
      onAfterTransition();
    }
    function onEnterTransition(el) {
      if (!isTransitioning.value) {
        return;
      }
      vue_cjs_prod.nextTick(() => {
        if (!hasTransition.value || !isTransitioning.value || !window2) {
          return;
        }
        window2.transitionHeight.value = convertToUnit(el.clientHeight);
      });
    }
    const transition = vue_cjs_prod.computed(() => {
      const name = window2.isReversed.value ? props.reverseTransition : props.transition;
      return !hasTransition.value ? false : {
        name: typeof name !== "string" ? window2.transition.value : name,
        onBeforeEnter: onBeforeTransition,
        onAfterEnter: onAfterTransition,
        onEnterCancelled: onTransitionCancelled,
        onBeforeLeave: onBeforeTransition,
        onAfterLeave: onAfterTransition,
        onLeaveCancelled: onTransitionCancelled,
        onEnter: onEnterTransition
      };
    });
    const {
      hasContent
    } = useLazy(props, groupItem.isSelected);
    return () => {
      return vue_cjs_prod.createVNode(MaybeTransition, {
        "transition": transition.value
      }, {
        default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
          "class": ["v-window-item", groupItem.selectedClass.value]
        }, [slots.default && hasContent.value && slots.default()]), [[vue_cjs_prod.vShow, groupItem.isSelected.value]])]
      });
    };
  }
});
const VCarousel = defineComponent({
  name: "VCarousel",
  props: {
    color: String,
    cycle: Boolean,
    delimiterIcon: {
      type: IconValue,
      default: "$delimiter"
    },
    height: {
      type: [Number, String],
      default: 500
    },
    hideDelimiters: Boolean,
    hideDelimiterBackground: Boolean,
    interval: {
      type: [Number, String],
      default: 6e3,
      validator: (value) => value > 0
    },
    modelValue: null,
    progress: [Boolean, String],
    showArrows: {
      type: [Boolean, String],
      default: true,
      validator: (v) => typeof v === "boolean" || v === "hover"
    },
    verticalDelimiters: [Boolean, String]
  },
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const model = useProxiedModel(props, "modelValue");
    const {
      t
    } = useLocale();
    const windowRef = vue_cjs_prod.ref();
    let slideTimeout = -1;
    vue_cjs_prod.watch(model, restartTimeout);
    vue_cjs_prod.watch(() => props.interval, restartTimeout);
    vue_cjs_prod.watch(() => props.cycle, (val) => {
      if (val)
        restartTimeout();
      else
        window.clearTimeout(slideTimeout);
    });
    vue_cjs_prod.onMounted(startTimeout);
    function startTimeout() {
      if (!props.cycle || !windowRef.value)
        return;
      slideTimeout = window.setTimeout(windowRef.value.group.next, +props.interval > 0 ? +props.interval : 6e3);
    }
    function restartTimeout() {
      window.clearTimeout(slideTimeout);
      window.requestAnimationFrame(startTimeout);
    }
    useRender(() => vue_cjs_prod.createVNode(VWindow, {
      "ref": windowRef,
      "modelValue": model.value,
      "onUpdate:modelValue": ($event) => model.value = $event,
      "class": ["v-carousel", {
        "v-carousel--hide-delimiter-background": props.hideDelimiterBackground,
        "v-carousel--vertical-delimiters": props.verticalDelimiters
      }],
      "style": {
        height: convertToUnit(props.height)
      },
      "continuous": true,
      "showArrows": props.showArrows,
      "mandatory": "force"
    }, {
      default: slots.default,
      additional: (_ref2) => {
        let {
          group
        } = _ref2;
        return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [!props.hideDelimiters && vue_cjs_prod.createVNode("div", {
          "class": "v-carousel__controls",
          "style": {
            left: props.verticalDelimiters === "left" && props.verticalDelimiters ? 0 : "auto",
            right: props.verticalDelimiters === "right" ? 0 : "auto"
          }
        }, [group.items.value.length > 0 && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VBtn: {
              color: props.color,
              icon: props.delimiterIcon,
              size: "x-small",
              variant: "text"
            }
          },
          "scoped": true
        }, {
          default: () => [group.items.value.map((item) => {
            const props2 = {
              "aria-label": t("$vuetify.carousel.ariaLabel.delimiter"),
              class: [group.isSelected(item.id) && "v-btn--selected"],
              onClick: () => group.select(item.id, true)
            };
            return slots.item ? slots.item({
              props: props2,
              item
            }) : vue_cjs_prod.createVNode(VBtn, vue_cjs_prod.mergeProps(item, props2), null);
          })]
        })]), props.progress && vue_cjs_prod.createVNode(VProgressLinear, {
          "class": "v-carousel__progress",
          "color": typeof props.progress === "string" ? props.progress : void 0,
          "modelValue": (group.getItemIndex(model.value) + 1) / group.items.value.length * 100
        }, null)]);
      },
      prev: slots.prev,
      next: slots.next
    }));
  }
});
const VCarouselItem = defineComponent({
  name: "VCarouselItem",
  inheritAttrs: false,
  props: {
    value: null
  },
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    useRender(() => vue_cjs_prod.createVNode(VWindowItem, {
      "class": "v-carousel-item",
      "value": props.value
    }, {
      default: () => [vue_cjs_prod.createVNode(VImg, attrs, slots)]
    }));
  }
});
const VSelectionControlGroupSymbol = Symbol.for("vuetify:selection-control-group");
const VSelectionControlGroup = defineComponent({
  name: "VSelectionControlGroup",
  props: {
    disabled: Boolean,
    id: String,
    inline: Boolean,
    name: String,
    falseIcon: IconValue,
    trueIcon: IconValue,
    multiple: {
      type: Boolean,
      default: null
    },
    readonly: Boolean,
    type: String,
    modelValue: null
  },
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const modelValue = useProxiedModel(props, "modelValue");
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `v-selection-control-group-${uid}`);
    const name = vue_cjs_prod.computed(() => props.name || id.value);
    vue_cjs_prod.provide(VSelectionControlGroupSymbol, {
      disabled: vue_cjs_prod.toRef(props, "disabled"),
      inline: vue_cjs_prod.toRef(props, "inline"),
      modelValue,
      multiple: vue_cjs_prod.computed(() => !!props.multiple || props.multiple == null && Array.isArray(modelValue.value)),
      name,
      falseIcon: vue_cjs_prod.toRef(props, "falseIcon"),
      trueIcon: vue_cjs_prod.toRef(props, "trueIcon"),
      readonly: vue_cjs_prod.toRef(props, "readonly"),
      type: vue_cjs_prod.toRef(props, "type")
    });
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-selection-control-group",
        "aria-labelled-by": props.type === "radio" ? id.value : void 0,
        "role": props.type === "radio" ? "radiogroup" : void 0
      }, [slots == null ? void 0 : (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    });
    return {};
  }
});
const makeSelectionControlProps = propsFactory(__spreadValues(__spreadValues({
  color: String,
  disabled: Boolean,
  error: Boolean,
  id: String,
  inline: Boolean,
  label: String,
  falseIcon: IconValue,
  trueIcon: IconValue,
  ripple: {
    type: Boolean,
    default: true
  },
  multiple: {
    type: Boolean,
    default: null
  },
  name: String,
  readonly: Boolean,
  trueValue: null,
  falseValue: null,
  modelValue: null,
  type: String,
  value: null,
  valueComparator: {
    type: Function,
    default: deepEqual
  }
}, makeThemeProps()), makeDensityProps()));
function useSelectionControl(props) {
  const group = vue_cjs_prod.inject(VSelectionControlGroupSymbol, void 0);
  const {
    densityClasses
  } = useDensity(props);
  const modelValue = useProxiedModel(props, "modelValue");
  const trueValue = vue_cjs_prod.computed(() => props.trueValue !== void 0 ? props.trueValue : props.value !== void 0 ? props.value : true);
  const falseValue = vue_cjs_prod.computed(() => props.falseValue !== void 0 ? props.falseValue : false);
  const isMultiple = vue_cjs_prod.computed(() => (group == null ? void 0 : group.multiple.value) || !!props.multiple || props.multiple == null && Array.isArray(modelValue.value));
  const model = vue_cjs_prod.computed({
    get() {
      const val = group ? group.modelValue.value : modelValue.value;
      return isMultiple.value ? val.some((v) => props.valueComparator(v, trueValue.value)) : props.valueComparator(val, trueValue.value);
    },
    set(val) {
      if (props.readonly)
        return;
      const currentValue = val ? trueValue.value : falseValue.value;
      let newVal = currentValue;
      if (isMultiple.value) {
        newVal = val ? [...wrapInArray(modelValue.value), currentValue] : wrapInArray(modelValue.value).filter((item) => !props.valueComparator(item, trueValue.value));
      }
      if (group) {
        group.modelValue.value = newVal;
      } else {
        modelValue.value = newVal;
      }
    }
  });
  const {
    textColorClasses,
    textColorStyles
  } = useTextColor(vue_cjs_prod.computed(() => {
    return model.value && !props.error && !props.disabled ? props.color : void 0;
  }));
  const icon = vue_cjs_prod.computed(() => {
    var _group$trueIcon$value, _group$falseIcon$valu;
    return model.value ? (_group$trueIcon$value = group == null ? void 0 : group.trueIcon.value) != null ? _group$trueIcon$value : props.trueIcon : (_group$falseIcon$valu = group == null ? void 0 : group.falseIcon.value) != null ? _group$falseIcon$valu : props.falseIcon;
  });
  return {
    group,
    densityClasses,
    trueValue,
    falseValue,
    model,
    textColorClasses,
    textColorStyles,
    icon
  };
}
const VSelectionControl = genericComponent()({
  name: "VSelectionControl",
  directives: {
    Ripple
  },
  inheritAttrs: false,
  props: makeSelectionControlProps(),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      densityClasses,
      group,
      icon,
      model,
      textColorClasses,
      textColorStyles,
      trueValue
    } = useSelectionControl(props);
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `input-${uid}`);
    const isFocused = vue_cjs_prod.ref(false);
    const isFocusVisible = vue_cjs_prod.ref(false);
    const input = vue_cjs_prod.ref();
    function onFocus(e) {
      isFocused.value = true;
      {
        isFocusVisible.value = true;
      }
    }
    function onBlur() {
      isFocused.value = false;
      isFocusVisible.value = false;
    }
    useRender(() => {
      var _group$type$value, _slots$default, _group$name$value, _slots$input;
      const label = slots.label ? slots.label({
        label: props.label,
        props: {
          for: id.value
        }
      }) : props.label;
      const type = (_group$type$value = group == null ? void 0 : group.type.value) != null ? _group$type$value : props.type;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-selection-control", {
          "v-selection-control--dirty": model.value,
          "v-selection-control--disabled": props.disabled,
          "v-selection-control--error": props.error,
          "v-selection-control--focused": isFocused.value,
          "v-selection-control--focus-visible": isFocusVisible.value,
          "v-selection-control--inline": (group == null ? void 0 : group.inline.value) || props.inline
        }, densityClasses.value]
      }, [vue_cjs_prod.createVNode("div", {
        "class": ["v-selection-control__wrapper", textColorClasses.value],
        "style": textColorStyles.value
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots), vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
        "class": ["v-selection-control__input"]
      }, [icon.value && vue_cjs_prod.createVNode(VIcon, {
        "icon": icon.value
      }, null), vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("input", vue_cjs_prod.mergeProps({
        "onUpdate:modelValue": ($event) => model.value = $event,
        "ref": input,
        "disabled": props.disabled,
        "id": id.value,
        "onBlur": onBlur,
        "onFocus": onFocus,
        "aria-readonly": props.readonly,
        "type": type,
        "value": trueValue.value,
        "name": (_group$name$value = group == null ? void 0 : group.name.value) != null ? _group$name$value : props.name,
        "aria-checked": type === "checkbox" ? model.value : void 0
      }, attrs), null), [[vue_cjs_prod.vModelDynamic, model.value]]), (_slots$input = slots.input) == null ? void 0 : _slots$input.call(slots, {
        model,
        textColorClasses,
        props: {
          onFocus,
          onBlur,
          id: id.value
        }
      })]), [[vue_cjs_prod.resolveDirective("ripple"), props.ripple && [!props.disabled && !props.readonly, null, ["center", "circle"]]]])]), vue_cjs_prod.createVNode(VLabel, {
        "for": id.value
      }, {
        default: () => [label]
      })]);
    });
    return {
      isFocused,
      input
    };
  }
});
function filterControlProps(props) {
  return pick(props, Object.keys(VSelectionControl.props));
}
const VCheckbox = defineComponent({
  name: "VCheckbox",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues(__spreadValues({
    indeterminate: Boolean,
    indeterminateIcon: {
      type: IconValue,
      default: "$checkboxIndeterminate"
    }
  }, makeVInputProps()), makeSelectionControlProps()), {
    falseIcon: {
      type: IconValue,
      default: "$checkboxOff"
    },
    trueIcon: {
      type: IconValue,
      default: "$checkboxOn"
    }
  }),
  emits: {
    "update:indeterminate": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const indeterminate = useProxiedModel(props, "indeterminate");
    const falseIcon = vue_cjs_prod.computed(() => {
      return indeterminate.value ? props.indeterminateIcon : props.falseIcon;
    });
    const trueIcon = vue_cjs_prod.computed(() => {
      return indeterminate.value ? props.indeterminateIcon : props.trueIcon;
    });
    function onChange() {
      if (indeterminate.value) {
        indeterminate.value = false;
      }
    }
    useRender(() => {
      const [inputAttrs, controlAttrs] = filterInputAttrs(attrs);
      const [inputProps, _1] = filterInputProps(props);
      const [controlProps, _2] = filterControlProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "class": "v-checkbox"
      }, inputAttrs, inputProps), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            isDisabled,
            isReadonly
          } = _ref2;
          return vue_cjs_prod.createVNode(VSelectionControl, vue_cjs_prod.mergeProps(controlProps, {
            "type": "checkbox",
            "onUpdate:modelValue": onChange,
            "falseIcon": falseIcon.value,
            "trueIcon": trueIcon.value,
            "aria-checked": indeterminate.value ? "mixed" : void 0,
            "disabled": isDisabled.value,
            "readonly": isReadonly.value
          }, controlAttrs), slots);
        }
      }));
    });
    return {};
  }
});
const VCode = createSimpleFunctional("v-code");
const VSheet = defineComponent({
  name: "VSheet",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    color: String
  }, makeBorderProps()), makeDimensionProps()), makeElevationProps()), makeLocationProps()), makePositionProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      borderClasses
    } = useBorder(props);
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      roundedClasses
    } = useRounded(props);
    return () => vue_cjs_prod.createVNode(props.tag, {
      "class": ["v-sheet", themeClasses.value, backgroundColorClasses.value, borderClasses.value, elevationClasses.value, positionClasses.value, roundedClasses.value],
      "style": [backgroundColorStyles.value, dimensionStyles.value, locationStyles.value]
    }, slots);
  }
});
const VSliderSymbol = Symbol.for("vuetify:v-slider");
function getOffset(e, el, direction) {
  const vertical = direction === "vertical";
  const rect = el.getBoundingClientRect();
  const touch = "touches" in e ? e.touches[0] : e;
  return vertical ? touch.clientY - (rect.top + rect.height / 2) : touch.clientX - (rect.left + rect.width / 2);
}
function getPosition(e, position) {
  if ("touches" in e && e.touches.length)
    return e.touches[0][position];
  else if ("changedTouches" in e && e.changedTouches.length)
    return e.changedTouches[0][position];
  else
    return e[position];
}
const makeSliderProps = propsFactory(__spreadValues(__spreadValues({
  disabled: Boolean,
  error: Boolean,
  readonly: Boolean,
  max: {
    type: [Number, String],
    default: 100
  },
  min: {
    type: [Number, String],
    default: 0
  },
  step: {
    type: [Number, String],
    default: 0
  },
  thumbColor: String,
  thumbLabel: {
    type: [Boolean, String],
    default: void 0,
    validator: (v) => typeof v === "boolean" || v === "always"
  },
  thumbSize: {
    type: [Number, String],
    default: 20
  },
  showTicks: {
    type: [Boolean, String],
    default: false,
    validator: (v) => typeof v === "boolean" || v === "always"
  },
  ticks: {
    type: [Array, Object]
  },
  tickSize: {
    type: [Number, String],
    default: 2
  },
  color: String,
  trackColor: String,
  trackFillColor: String,
  trackSize: {
    type: [Number, String],
    default: 4
  },
  direction: {
    type: String,
    default: "horizontal",
    validator: (v) => ["vertical", "horizontal"].includes(v)
  },
  reverse: Boolean
}, makeRoundedProps()), makeElevationProps({
  elevation: 2
})), "slider");
const useSlider = (_ref) => {
  let {
    props,
    handleSliderMouseUp,
    handleMouseMove,
    getActiveThumb
  } = _ref;
  const {
    isRtl
  } = useRtl();
  const isReversed = vue_cjs_prod.computed(() => isRtl.value !== props.reverse);
  const horizontalDirection = vue_cjs_prod.computed(() => {
    let hd = isRtl.value ? "rtl" : "ltr";
    if (props.reverse) {
      hd = hd === "rtl" ? "ltr" : "rtl";
    }
    return hd;
  });
  const min = vue_cjs_prod.computed(() => parseFloat(props.min));
  const max = vue_cjs_prod.computed(() => parseFloat(props.max));
  const step = vue_cjs_prod.computed(() => props.step > 0 ? parseFloat(props.step) : 0);
  const decimals = vue_cjs_prod.computed(() => {
    const trimmedStep = step.value.toString().trim();
    return trimmedStep.includes(".") ? trimmedStep.length - trimmedStep.indexOf(".") - 1 : 0;
  });
  const thumbSize = vue_cjs_prod.computed(() => parseInt(props.thumbSize, 10));
  const tickSize = vue_cjs_prod.computed(() => parseInt(props.tickSize, 10));
  const trackSize = vue_cjs_prod.computed(() => parseInt(props.trackSize, 10));
  const numTicks = vue_cjs_prod.computed(() => (max.value - min.value) / step.value);
  const disabled = vue_cjs_prod.toRef(props, "disabled");
  const vertical = vue_cjs_prod.computed(() => props.direction === "vertical");
  const thumbColor = vue_cjs_prod.computed(() => {
    var _props$thumbColor;
    return props.error || props.disabled ? void 0 : (_props$thumbColor = props.thumbColor) != null ? _props$thumbColor : props.color;
  });
  const trackColor = vue_cjs_prod.computed(() => {
    var _props$trackColor;
    return props.error || props.disabled ? void 0 : (_props$trackColor = props.trackColor) != null ? _props$trackColor : props.color;
  });
  const trackFillColor = vue_cjs_prod.computed(() => {
    var _props$trackFillColor;
    return props.error || props.disabled ? void 0 : (_props$trackFillColor = props.trackFillColor) != null ? _props$trackFillColor : props.color;
  });
  const mousePressed = vue_cjs_prod.ref(false);
  const startOffset = vue_cjs_prod.ref(0);
  const trackContainerRef = vue_cjs_prod.ref();
  const activeThumbRef = vue_cjs_prod.ref();
  function roundValue(value) {
    if (step.value <= 0)
      return value;
    const clamped = clamp(value, min.value, max.value);
    const offset = min.value % step.value;
    const newValue = Math.round((clamped - offset) / step.value) * step.value + offset;
    return parseFloat(Math.min(newValue, max.value).toFixed(decimals.value));
  }
  function parseMouseMove(e) {
    var _trackContainerRef$va;
    const vertical2 = props.direction === "vertical";
    const start = vertical2 ? "top" : "left";
    const length = vertical2 ? "height" : "width";
    const position2 = vertical2 ? "clientY" : "clientX";
    const {
      [start]: trackStart,
      [length]: trackLength
    } = (_trackContainerRef$va = trackContainerRef.value) == null ? void 0 : _trackContainerRef$va.$el.getBoundingClientRect();
    const clickOffset = getPosition(e, position2);
    let clickPos = Math.min(Math.max((clickOffset - trackStart - startOffset.value) / trackLength, 0), 1) || 0;
    if (vertical2 || isReversed.value)
      clickPos = 1 - clickPos;
    return roundValue(min.value + clickPos * (max.value - min.value));
  }
  let thumbMoved = false;
  const handleStop = (e) => {
    if (!thumbMoved) {
      startOffset.value = 0;
      handleSliderMouseUp(parseMouseMove(e));
    }
    mousePressed.value = false;
    thumbMoved = false;
    startOffset.value = 0;
  };
  const handleStart = (e) => {
    activeThumbRef.value = getActiveThumb(e);
    if (!activeThumbRef.value)
      return;
    activeThumbRef.value.focus();
    mousePressed.value = true;
    if (activeThumbRef.value.contains(e.target)) {
      thumbMoved = true;
      startOffset.value = getOffset(e, activeThumbRef.value, props.direction);
    } else {
      startOffset.value = 0;
      handleMouseMove(parseMouseMove(e));
    }
  };
  const moveListenerOptions = {
    passive: true,
    capture: true
  };
  function onMouseMove(e) {
    thumbMoved = true;
    handleMouseMove(parseMouseMove(e));
  }
  function onSliderMouseUp(e) {
    e.stopPropagation();
    e.preventDefault();
    handleStop(e);
    window.removeEventListener("mousemove", onMouseMove, moveListenerOptions);
    window.removeEventListener("mouseup", onSliderMouseUp);
  }
  function onSliderTouchend(e) {
    e.stopPropagation();
    e.preventDefault();
    handleStop(e);
    window.removeEventListener("touchmove", onMouseMove, moveListenerOptions);
    window.removeEventListener("touchend", onSliderTouchend);
  }
  function onSliderTouchstart(e) {
    handleStart(e);
    window.addEventListener("touchmove", onMouseMove, moveListenerOptions);
    window.addEventListener("touchend", onSliderTouchend, {
      passive: false
    });
  }
  function onSliderMousedown(e) {
    e.preventDefault();
    handleStart(e);
    window.addEventListener("mousemove", onMouseMove, moveListenerOptions);
    window.addEventListener("mouseup", onSliderMouseUp, {
      passive: false
    });
  }
  const position = (val) => {
    const percentage = (val - min.value) / (max.value - min.value) * 100;
    return clamp(isNaN(percentage) ? 0 : percentage, 0, 100);
  };
  const parsedTicks = vue_cjs_prod.computed(() => {
    if (!props.ticks) {
      return numTicks.value !== Infinity ? createRange(numTicks.value + 1).map((t) => {
        const value = min.value + t * step.value;
        return {
          value,
          position: position(value)
        };
      }) : [];
    }
    if (Array.isArray(props.ticks))
      return props.ticks.map((t) => ({
        value: t,
        position: position(t),
        label: t.toString()
      }));
    return Object.keys(props.ticks).map((key) => ({
      value: parseInt(key, 10),
      position: position(parseInt(key, 10)),
      label: props.ticks[key]
    }));
  });
  const hasLabels = vue_cjs_prod.computed(() => parsedTicks.value.some((_ref2) => {
    let {
      label
    } = _ref2;
    return !!label;
  }));
  const data = {
    activeThumbRef,
    color: vue_cjs_prod.toRef(props, "color"),
    decimals,
    disabled,
    direction: vue_cjs_prod.toRef(props, "direction"),
    elevation: vue_cjs_prod.toRef(props, "elevation"),
    hasLabels,
    horizontalDirection,
    isReversed,
    min,
    max,
    mousePressed,
    numTicks,
    onSliderMousedown,
    onSliderTouchstart,
    parsedTicks,
    parseMouseMove,
    position,
    readonly: vue_cjs_prod.toRef(props, "readonly"),
    rounded: vue_cjs_prod.toRef(props, "rounded"),
    roundValue,
    showTicks: vue_cjs_prod.toRef(props, "showTicks"),
    startOffset,
    step,
    thumbSize,
    thumbColor,
    thumbLabel: vue_cjs_prod.toRef(props, "thumbLabel"),
    ticks: vue_cjs_prod.toRef(props, "ticks"),
    tickSize,
    trackColor,
    trackContainerRef,
    trackFillColor,
    trackSize,
    vertical
  };
  vue_cjs_prod.provide(VSliderSymbol, data);
  return data;
};
const VSliderThumb = defineComponent({
  name: "VSliderThumb",
  directives: {
    Ripple
  },
  props: {
    focused: Boolean,
    max: {
      type: Number,
      required: true
    },
    min: {
      type: Number,
      required: true
    },
    modelValue: {
      type: Number,
      required: true
    },
    position: {
      type: Number,
      required: true
    }
  },
  emits: {
    "update:modelValue": (v) => true
  },
  setup(props, _ref) {
    let {
      slots,
      emit
    } = _ref;
    const slider = vue_cjs_prod.inject(VSliderSymbol);
    if (!slider)
      throw new Error("[Vuetify] v-slider-thumb must be used inside v-slider or v-range-slider");
    const {
      thumbColor,
      step,
      vertical,
      disabled,
      thumbSize,
      thumbLabel,
      direction,
      readonly: readonly2,
      elevation,
      isReversed,
      horizontalDirection,
      mousePressed,
      decimals
    } = slider;
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(thumbColor);
    const {
      pageup,
      pagedown,
      end,
      home,
      left,
      right,
      down,
      up
    } = keyValues;
    const relevantKeys = [pageup, pagedown, end, home, left, right, down, up];
    const multipliers = vue_cjs_prod.computed(() => {
      if (step.value)
        return [1, 2, 3];
      else
        return [1, 5, 10];
    });
    function parseKeydown(e, value) {
      if (!relevantKeys.includes(e.key))
        return;
      e.preventDefault();
      const _step = step.value || 0.1;
      const steps = (props.max - props.min) / _step;
      if ([left, right, down, up].includes(e.key)) {
        const increase = isReversed.value ? [left, up] : [right, up];
        const direction2 = increase.includes(e.key) ? 1 : -1;
        const multiplier = e.shiftKey ? 2 : e.ctrlKey ? 1 : 0;
        value = value + direction2 * _step * multipliers.value[multiplier];
      } else if (e.key === home) {
        value = props.min;
      } else if (e.key === end) {
        value = props.max;
      } else {
        const direction2 = e.key === pagedown ? 1 : -1;
        value = value - direction2 * _step * (steps > 100 ? steps / 10 : 10);
      }
      return Math.max(props.min, Math.min(props.max, value));
    }
    function onKeydown(e) {
      const newValue = parseKeydown(e, props.modelValue);
      newValue != null && emit("update:modelValue", newValue);
    }
    return () => {
      var _slots$thumbLabel, _slots$thumbLabel2;
      const positionPercentage = convertToUnit(vertical.value ? 100 - props.position : props.position, "%");
      const inset = vertical.value ? "block" : "inline";
      const {
        elevationClasses
      } = useElevation(vue_cjs_prod.computed(() => !disabled.value ? elevation.value : void 0));
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-thumb", {
          "v-slider-thumb--focused": props.focused,
          "v-slider-thumb--pressed": props.focused && mousePressed.value
        }],
        "style": {
          [`inset-${inset}-start`]: `calc(${positionPercentage} - var(--v-slider-thumb-size) / 2)`,
          "--v-slider-thumb-size": convertToUnit(thumbSize.value),
          direction: !vertical.value ? horizontalDirection.value : void 0
        },
        "role": "slider",
        "tabindex": disabled.value ? -1 : 0,
        "aria-valuemin": props.min,
        "aria-valuemax": props.max,
        "aria-valuenow": props.modelValue,
        "aria-readonly": readonly2.value,
        "aria-orientation": direction.value,
        "onKeydown": !readonly2.value ? onKeydown : void 0
      }, [vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-thumb__surface", textColorClasses.value, elevationClasses.value],
        "style": __spreadValues({}, textColorStyles.value)
      }, null), vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-thumb__ripple", textColorClasses.value],
        "style": textColorStyles.value
      }, null), [[vue_cjs_prod.resolveDirective("ripple"), true, null, {
        circle: true,
        center: true
      }]]), vue_cjs_prod.createVNode(VScaleTransition, {
        "origin": "bottom center"
      }, {
        default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
          "class": "v-slider-thumb__label-container"
        }, [vue_cjs_prod.createVNode("div", {
          "class": ["v-slider-thumb__label"]
        }, [vue_cjs_prod.createVNode("div", null, [(_slots$thumbLabel = (_slots$thumbLabel2 = slots["thumb-label"]) == null ? void 0 : _slots$thumbLabel2.call(slots, {
          modelValue: props.modelValue
        })) != null ? _slots$thumbLabel : props.modelValue.toFixed(step.value ? decimals.value : 1)])])]), [[vue_cjs_prod.vShow, thumbLabel.value && props.focused || thumbLabel.value === "always"]])]
      })]);
    };
  }
});
const VSliderTrack = defineComponent({
  name: "VSliderTrack",
  props: {
    start: {
      type: Number,
      required: true
    },
    stop: {
      type: Number,
      required: true
    }
  },
  emits: {},
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const slider = vue_cjs_prod.inject(VSliderSymbol);
    if (!slider)
      throw new Error("[Vuetify] v-slider-track must be inside v-slider or v-range-slider");
    const {
      trackColor,
      trackFillColor,
      vertical,
      tickSize,
      showTicks,
      trackSize,
      color,
      rounded,
      parsedTicks,
      horizontalDirection
    } = slider;
    const {
      roundedClasses
    } = useRounded(rounded);
    const {
      backgroundColorClasses: trackFillColorClasses,
      backgroundColorStyles: trackFillColorStyles
    } = useBackgroundColor(trackFillColor);
    const {
      backgroundColorClasses: trackColorClasses,
      backgroundColorStyles: trackColorStyles
    } = useBackgroundColor(trackColor);
    const startDir = vue_cjs_prod.computed(() => `inset-${vertical.value ? "block-end" : "inline-start"}`);
    const endDir = vue_cjs_prod.computed(() => vertical.value ? "height" : "width");
    const backgroundStyles = vue_cjs_prod.computed(() => {
      return {
        [startDir.value]: "0%",
        [endDir.value]: "100%"
      };
    });
    const trackFillWidth = vue_cjs_prod.computed(() => props.stop - props.start);
    const trackFillStyles = vue_cjs_prod.computed(() => {
      return {
        [startDir.value]: convertToUnit(props.start, "%"),
        [endDir.value]: convertToUnit(trackFillWidth.value, "%")
      };
    });
    const computedTicks = vue_cjs_prod.computed(() => {
      const ticks = vertical.value ? parsedTicks.value.slice().reverse() : parsedTicks.value;
      return ticks.map((tick, index2) => {
        var _slots$tickLabel, _slots$tickLabel2;
        const directionProperty = vertical.value ? "bottom" : "margin-inline-start";
        const directionValue = tick.position > 0 && tick.position < 100 ? convertToUnit(tick.position, "%") : void 0;
        return vue_cjs_prod.createVNode("div", {
          "key": tick.value,
          "class": ["v-slider-track__tick", {
            "v-slider-track__tick--filled": tick.position >= props.start && tick.position <= props.stop
          }],
          "style": {
            [directionProperty]: directionValue
          }
        }, [(tick.label || slots["tick-label"]) && vue_cjs_prod.createVNode("div", {
          "class": "v-slider-track__tick-label"
        }, [(_slots$tickLabel = (_slots$tickLabel2 = slots["tick-label"]) == null ? void 0 : _slots$tickLabel2.call(slots, {
          tick,
          index: index2
        })) != null ? _slots$tickLabel : tick.label])]);
      });
    });
    return () => {
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-track", roundedClasses.value],
        "style": {
          "--v-slider-track-size": convertToUnit(trackSize.value),
          "--v-slider-tick-size": convertToUnit(tickSize.value),
          direction: !vertical.value ? horizontalDirection.value : void 0
        }
      }, [vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-track__background", trackColorClasses.value, {
          "v-slider-track__background--opacity": !!color.value || !trackFillColor.value
        }],
        "style": __spreadValues(__spreadValues({}, backgroundStyles.value), trackColorStyles.value)
      }, null), vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-track__fill", trackFillColorClasses.value],
        "style": __spreadValues(__spreadValues({}, trackFillStyles.value), trackFillColorStyles.value)
      }, null), showTicks.value && vue_cjs_prod.createVNode("div", {
        "class": ["v-slider-track__ticks", {
          "v-slider-track__ticks--always-show": showTicks.value === "always"
        }]
      }, [computedTicks.value])]);
    };
  }
});
const VSlider = defineComponent({
  name: "VSlider",
  props: __spreadProps(__spreadValues(__spreadValues(__spreadValues({}, makeFocusProps()), makeSliderProps()), makeVInputProps()), {
    modelValue: {
      type: [Number, String],
      default: 0
    }
  }),
  emits: {
    "update:focused": (value) => true,
    "update:modelValue": (v) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const thumbContainerRef = vue_cjs_prod.ref();
    const {
      min,
      max,
      mousePressed,
      roundValue,
      onSliderMousedown,
      onSliderTouchstart,
      trackContainerRef,
      position,
      hasLabels,
      readonly: readonly2
    } = useSlider({
      props,
      handleSliderMouseUp: (newValue) => model.value = roundValue(newValue),
      handleMouseMove: (newValue) => model.value = roundValue(newValue),
      getActiveThumb: () => {
        var _thumbContainerRef$va;
        return (_thumbContainerRef$va = thumbContainerRef.value) == null ? void 0 : _thumbContainerRef$va.$el;
      }
    });
    const model = useProxiedModel(props, "modelValue", void 0, (v) => {
      const value = typeof v === "string" ? parseFloat(v) : v == null ? min.value : v;
      return roundValue(value);
    });
    const {
      isFocused,
      focus,
      blur
    } = useFocus(props);
    const trackStop = vue_cjs_prod.computed(() => position(model.value));
    return () => {
      const [inputProps, _] = filterInputProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "class": ["v-slider", {
          "v-slider--has-labels": !!slots["tick-label"] || hasLabels.value,
          "v-slider--focused": isFocused.value,
          "v-slider--pressed": mousePressed.value,
          "v-slider--disabled": props.disabled
        }]
      }, inputProps, {
        "focused": isFocused.value
      }), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            id
          } = _ref2;
          return vue_cjs_prod.createVNode("div", {
            "class": "v-slider__container",
            "onMousedown": !readonly2.value ? onSliderMousedown : void 0,
            "onTouchstartPassive": !readonly2.value ? onSliderTouchstart : void 0
          }, [vue_cjs_prod.createVNode("input", {
            "id": id.value,
            "name": props.name || id.value,
            "disabled": props.disabled,
            "readonly": props.readonly,
            "tabindex": "-1",
            "value": model.value
          }, null), vue_cjs_prod.createVNode(VSliderTrack, {
            "ref": trackContainerRef,
            "start": 0,
            "stop": trackStop.value
          }, {
            "tick-label": slots["tick-label"]
          }), vue_cjs_prod.createVNode(VSliderThumb, {
            "ref": thumbContainerRef,
            "focused": isFocused.value,
            "min": min.value,
            "max": max.value,
            "modelValue": model.value,
            "onUpdate:modelValue": (v) => model.value = v,
            "position": trackStop.value,
            "elevation": props.elevation,
            "onFocus": focus,
            "onBlur": blur
          }, {
            "thumb-label": slots["thumb-label"]
          })]);
        }
      }));
    };
  }
});
var _rgba$inputs;
function has(obj, key) {
  return key.every((k) => obj.hasOwnProperty(k));
}
function parseColor(color) {
  var _hsva$a;
  if (!color)
    return null;
  let hsva = null;
  if (typeof color === "string") {
    const hex2 = parseHex(color);
    hsva = HexToHSVA(hex2);
  }
  if (typeof color === "object") {
    if (has(color, ["r", "g", "b"])) {
      hsva = RGBAtoHSVA(color);
    } else if (has(color, ["h", "s", "l"])) {
      hsva = HSLAtoHSVA(color);
    } else if (has(color, ["h", "s", "v"])) {
      hsva = color;
    }
  }
  return hsva != null ? __spreadProps(__spreadValues({}, hsva), {
    a: (_hsva$a = hsva.a) != null ? _hsva$a : 1
  }) : null;
}
function stripAlpha(color, stripAlpha2) {
  if (stripAlpha2) {
    const _a = color, rest = __objRest(_a, [
      "a"
    ]);
    return rest;
  }
  return color;
}
function extractColor(color, input) {
  if (input == null || typeof input === "string") {
    const hex2 = HSVAtoHex(color);
    if (color.a === 1)
      return hex2.slice(0, 7);
    else
      return hex2;
  }
  if (typeof input === "object") {
    let converted;
    if (has(input, ["r", "g", "b"]))
      converted = HSVAtoRGBA(color);
    else if (has(input, ["h", "s", "l"]))
      converted = HSVAtoHSLA(color);
    else if (has(input, ["h", "s", "v"]))
      converted = color;
    return stripAlpha(converted, !has(input, ["a"]));
  }
  return color;
}
const nullColor = {
  h: 0,
  s: 0,
  v: 1,
  a: 1
};
const rgba = {
  inputProps: {
    type: "number",
    min: 0
  },
  inputs: [{
    label: "R",
    max: 255,
    step: 1,
    getValue: (c) => Math.round(c.r),
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      r: Number(v)
    })
  }, {
    label: "G",
    max: 255,
    step: 1,
    getValue: (c) => Math.round(c.g),
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      g: Number(v)
    })
  }, {
    label: "B",
    max: 255,
    step: 1,
    getValue: (c) => Math.round(c.b),
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      b: Number(v)
    })
  }, {
    label: "A",
    max: 1,
    step: 0.01,
    getValue: (c) => Math.round(c.a * 100) / 100,
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      a: Number(v)
    })
  }],
  to: HSVAtoRGBA,
  from: RGBAtoHSVA
};
const rgb = __spreadProps(__spreadValues({}, rgba), {
  inputs: (_rgba$inputs = rgba.inputs) == null ? void 0 : _rgba$inputs.slice(0, 3)
});
const hsla = {
  inputProps: {
    type: "number",
    min: 0
  },
  inputs: [{
    label: "H",
    max: 360,
    step: 1,
    getValue: (c) => Math.round(c.h),
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      h: Number(v)
    })
  }, {
    label: "S",
    max: 1,
    step: 0.01,
    getValue: (c) => Math.round(c.s * 100) / 100,
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      s: Number(v)
    })
  }, {
    label: "L",
    max: 1,
    step: 0.01,
    getValue: (c) => Math.round(c.l * 100) / 100,
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      l: Number(v)
    })
  }, {
    label: "A",
    max: 1,
    step: 0.01,
    getValue: (c) => Math.round(c.a * 100) / 100,
    getColor: (c, v) => __spreadProps(__spreadValues({}, c), {
      a: Number(v)
    })
  }],
  to: HSVAtoHSLA,
  from: HSLAtoHSVA
};
const hsl = __spreadProps(__spreadValues({}, hsla), {
  inputs: hsla.inputs.slice(0, 3)
});
const hexa = {
  inputProps: {
    type: "text"
  },
  inputs: [{
    label: "HEXA",
    getValue: (c) => c,
    getColor: (c, v) => v
  }],
  to: HSVAtoHex,
  from: HexToHSVA
};
const hex = __spreadProps(__spreadValues({}, hexa), {
  inputs: [{
    label: "HEX",
    getValue: (c) => c.slice(0, 7),
    getColor: (c, v) => v
  }]
});
const modes = {
  rgb,
  rgba,
  hsl,
  hsla,
  hex,
  hexa
};
const VColorPickerPreview = defineComponent({
  name: "VColorPickerPreview",
  props: {
    color: {
      type: Object
    },
    disabled: Boolean,
    hideAlpha: Boolean
  },
  emits: {
    "update:color": (color) => true
  },
  setup(props, _ref) {
    let {
      emit
    } = _ref;
    return () => {
      var _props$color, _props$color2, _props$color4;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-color-picker-preview", {
          "v-color-picker-preview--hide-alpha": props.hideAlpha
        }]
      }, [vue_cjs_prod.createVNode("div", {
        "class": "v-color-picker-preview__dot"
      }, [vue_cjs_prod.createVNode("div", {
        "style": {
          background: HSVAtoCSS((_props$color = props.color) != null ? _props$color : nullColor)
        }
      }, null)]), vue_cjs_prod.createVNode("div", {
        "class": "v-color-picker-preview__sliders"
      }, [vue_cjs_prod.createVNode(VSlider, {
        "class": "v-color-picker-preview__track v-color-picker-preview__hue",
        "modelValue": (_props$color2 = props.color) == null ? void 0 : _props$color2.h,
        "onUpdate:modelValue": (h2) => {
          var _props$color3;
          return emit("update:color", __spreadProps(__spreadValues({}, (_props$color3 = props.color) != null ? _props$color3 : nullColor), {
            h: h2
          }));
        },
        "step": 0,
        "min": 0,
        "max": 360,
        "disabled": props.disabled,
        "thumbSize": 14,
        "trackSize": 8,
        "trackFillColor": "white",
        "hideDetails": true
      }, null), !props.hideAlpha && vue_cjs_prod.createVNode(VSlider, {
        "class": "v-color-picker-preview__track v-color-picker-preview__alpha",
        "modelValue": (_props$color4 = props.color) == null ? void 0 : _props$color4.a,
        "onUpdate:modelValue": (a) => {
          var _props$color5;
          return emit("update:color", __spreadProps(__spreadValues({}, (_props$color5 = props.color) != null ? _props$color5 : nullColor), {
            a
          }));
        },
        "step": 0,
        "min": 0,
        "max": 1,
        "disabled": props.disabled,
        "thumbSize": 14,
        "trackSize": 8,
        "trackFillColor": "white",
        "hideDetails": true
      }, null)])]);
    };
  }
});
const VColorPickerCanvas = defineComponent({
  name: "VColorPickerCanvas",
  props: {
    color: {
      type: Object
    },
    disabled: Boolean,
    dotSize: {
      type: [Number, String],
      default: 10
    },
    height: {
      type: [Number, String],
      default: 150
    },
    width: {
      type: [Number, String],
      default: 300
    }
  },
  emits: {
    "update:color": (color) => true,
    "update:position": (hue) => true
  },
  setup(props, _ref) {
    let {
      emit
    } = _ref;
    const isInteracting = vue_cjs_prod.ref(false);
    const isOutsideUpdate = vue_cjs_prod.ref(false);
    const dotPosition = vue_cjs_prod.ref({
      x: 0,
      y: 0
    });
    const dotStyles = vue_cjs_prod.computed(() => {
      const {
        x,
        y
      } = dotPosition.value;
      const radius = parseInt(props.dotSize, 10) / 2;
      return {
        width: convertToUnit(props.dotSize),
        height: convertToUnit(props.dotSize),
        transform: `translate(${convertToUnit(x - radius)}, ${convertToUnit(y - radius)})`
      };
    });
    const canvasRef = vue_cjs_prod.ref();
    function updateDotPosition(x, y, rect) {
      const {
        left,
        top,
        width,
        height
      } = rect;
      dotPosition.value = {
        x: clamp(x - left, 0, width),
        y: clamp(y - top, 0, height)
      };
    }
    function handleClick(e) {
      if (props.disabled || !canvasRef.value)
        return;
      updateDotPosition(e.clientX, e.clientY, canvasRef.value.getBoundingClientRect());
    }
    function handleMouseDown(e) {
      e.preventDefault();
      if (props.disabled)
        return;
      isInteracting.value = true;
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    function handleMouseMove(e) {
      if (props.disabled || !canvasRef.value)
        return;
      isInteracting.value = true;
      const coords = getEventCoordinates(e);
      updateDotPosition(coords.clientX, coords.clientY, canvasRef.value.getBoundingClientRect());
    }
    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    }
    vue_cjs_prod.watch(dotPosition, () => {
      var _props$color$h, _props$color, _props$color$a, _props$color2;
      if (isOutsideUpdate.value) {
        isOutsideUpdate.value = false;
        return;
      }
      if (!canvasRef.value)
        return;
      const {
        width,
        height
      } = canvasRef.value.getBoundingClientRect();
      const {
        x,
        y
      } = dotPosition.value;
      emit("update:color", {
        h: (_props$color$h = (_props$color = props.color) == null ? void 0 : _props$color.h) != null ? _props$color$h : 0,
        s: clamp(x, 0, width) / width,
        v: 1 - clamp(y, 0, height) / height,
        a: (_props$color$a = (_props$color2 = props.color) == null ? void 0 : _props$color2.a) != null ? _props$color$a : 1
      });
    });
    function updateCanvas() {
      var _props$color$h2, _props$color3;
      if (!canvasRef.value)
        return;
      const canvas = canvasRef.value;
      const ctx = canvas.getContext("2d");
      if (!ctx)
        return;
      const saturationGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      saturationGradient.addColorStop(0, "hsla(0, 0%, 100%, 1)");
      saturationGradient.addColorStop(1, `hsla(${(_props$color$h2 = (_props$color3 = props.color) == null ? void 0 : _props$color3.h) != null ? _props$color$h2 : 0}, 100%, 50%, 1)`);
      ctx.fillStyle = saturationGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const valueGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      valueGradient.addColorStop(0, "hsla(0, 0%, 100%, 0)");
      valueGradient.addColorStop(1, "hsla(0, 0%, 0%, 1)");
      ctx.fillStyle = valueGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    vue_cjs_prod.watch(() => {
      var _props$color4;
      return (_props$color4 = props.color) == null ? void 0 : _props$color4.h;
    }, updateCanvas, {
      immediate: true
    });
    vue_cjs_prod.watch(() => props.color, () => {
      if (isInteracting.value) {
        isInteracting.value = false;
        return;
      }
      if (!props.color)
        return;
      isOutsideUpdate.value = true;
      dotPosition.value = {
        x: props.color.s * parseInt(props.width, 10),
        y: (1 - props.color.v) * parseInt(props.height, 10)
      };
    }, {
      deep: true,
      immediate: true
    });
    vue_cjs_prod.onMounted(() => updateCanvas());
    return () => vue_cjs_prod.createVNode("div", {
      "class": "v-color-picker-canvas",
      "style": {
        width: convertToUnit(props.width),
        height: convertToUnit(props.height)
      },
      "onClick": handleClick,
      "onMousedown": handleMouseDown,
      "onTouchstart": handleMouseDown
    }, [vue_cjs_prod.createVNode("canvas", {
      "ref": canvasRef,
      "width": props.width,
      "height": props.height
    }, null), vue_cjs_prod.createVNode("div", {
      "class": ["v-color-picker-canvas__dot", {
        "v-color-picker-canvas__dot--disabled": props.disabled
      }],
      "style": dotStyles.value
    }, null)]);
  }
});
const VColorPickerInput = (_ref) => {
  let _a = _ref, {
    label
  } = _a, rest = __objRest(_a, [
    "label"
  ]);
  return vue_cjs_prod.createVNode("div", {
    "class": "v-color-picker-edit__input"
  }, [vue_cjs_prod.createVNode("input", rest, null), vue_cjs_prod.createVNode("span", null, [label])]);
};
const VColorPickerEdit = defineComponent({
  name: "VColorPickerEdit",
  props: {
    color: Object,
    disabled: Boolean,
    mode: {
      type: String,
      default: "rgba",
      validator: (v) => Object.keys(modes).includes(v)
    },
    modes: {
      type: Array,
      default: () => Object.keys(modes),
      validator: (v) => Array.isArray(v) && v.every((m) => Object.keys(modes).includes(m))
    }
  },
  emits: {
    "update:color": (color) => true,
    "update:mode": (mode) => true
  },
  setup(props, _ref2) {
    let {
      emit
    } = _ref2;
    const enabledModes = vue_cjs_prod.computed(() => {
      return props.modes.map((key) => __spreadProps(__spreadValues({}, modes[key]), {
        name: key
      }));
    });
    const inputs = vue_cjs_prod.computed(() => {
      var _mode$inputs;
      const mode = enabledModes.value.find((m) => m.name === props.mode);
      if (!mode)
        return [];
      const color = props.color ? mode.to(props.color) : {};
      return (_mode$inputs = mode.inputs) == null ? void 0 : _mode$inputs.map((_ref3) => {
        let _a = _ref3, {
          getValue,
          getColor
        } = _a, inputProps = __objRest(_a, [
          "getValue",
          "getColor"
        ]);
        return __spreadProps(__spreadValues(__spreadValues({}, mode.inputProps), inputProps), {
          disabled: props.disabled,
          value: getValue(color),
          onChange: (e) => {
            const target = e.target;
            if (!target)
              return;
            emit("update:color", mode.from(getColor(color, target.value)));
          }
        });
      });
    });
    return () => {
      var _inputs$value;
      return vue_cjs_prod.createVNode("div", {
        "class": "v-color-picker-edit"
      }, [(_inputs$value = inputs.value) == null ? void 0 : _inputs$value.map((props2) => vue_cjs_prod.createVNode(VColorPickerInput, props2, null)), enabledModes.value.length > 1 && vue_cjs_prod.createVNode(VBtn, {
        "icon": "$unfold",
        "size": "x-small",
        "variant": "plain",
        "onClick": () => {
          const mi = enabledModes.value.findIndex((m) => m.name === props.mode);
          emit("update:mode", enabledModes.value[(mi + 1) % enabledModes.value.length].name);
        }
      }, null)]);
    };
  }
});
const red = Object.freeze({
  base: "#f44336",
  lighten5: "#ffebee",
  lighten4: "#ffcdd2",
  lighten3: "#ef9a9a",
  lighten2: "#e57373",
  lighten1: "#ef5350",
  darken1: "#e53935",
  darken2: "#d32f2f",
  darken3: "#c62828",
  darken4: "#b71c1c",
  accent1: "#ff8a80",
  accent2: "#ff5252",
  accent3: "#ff1744",
  accent4: "#d50000"
});
const pink = Object.freeze({
  base: "#e91e63",
  lighten5: "#fce4ec",
  lighten4: "#f8bbd0",
  lighten3: "#f48fb1",
  lighten2: "#f06292",
  lighten1: "#ec407a",
  darken1: "#d81b60",
  darken2: "#c2185b",
  darken3: "#ad1457",
  darken4: "#880e4f",
  accent1: "#ff80ab",
  accent2: "#ff4081",
  accent3: "#f50057",
  accent4: "#c51162"
});
const purple = Object.freeze({
  base: "#9c27b0",
  lighten5: "#f3e5f5",
  lighten4: "#e1bee7",
  lighten3: "#ce93d8",
  lighten2: "#ba68c8",
  lighten1: "#ab47bc",
  darken1: "#8e24aa",
  darken2: "#7b1fa2",
  darken3: "#6a1b9a",
  darken4: "#4a148c",
  accent1: "#ea80fc",
  accent2: "#e040fb",
  accent3: "#d500f9",
  accent4: "#aa00ff"
});
const deepPurple = Object.freeze({
  base: "#673ab7",
  lighten5: "#ede7f6",
  lighten4: "#d1c4e9",
  lighten3: "#b39ddb",
  lighten2: "#9575cd",
  lighten1: "#7e57c2",
  darken1: "#5e35b1",
  darken2: "#512da8",
  darken3: "#4527a0",
  darken4: "#311b92",
  accent1: "#b388ff",
  accent2: "#7c4dff",
  accent3: "#651fff",
  accent4: "#6200ea"
});
const indigo = Object.freeze({
  base: "#3f51b5",
  lighten5: "#e8eaf6",
  lighten4: "#c5cae9",
  lighten3: "#9fa8da",
  lighten2: "#7986cb",
  lighten1: "#5c6bc0",
  darken1: "#3949ab",
  darken2: "#303f9f",
  darken3: "#283593",
  darken4: "#1a237e",
  accent1: "#8c9eff",
  accent2: "#536dfe",
  accent3: "#3d5afe",
  accent4: "#304ffe"
});
const blue = Object.freeze({
  base: "#2196f3",
  lighten5: "#e3f2fd",
  lighten4: "#bbdefb",
  lighten3: "#90caf9",
  lighten2: "#64b5f6",
  lighten1: "#42a5f5",
  darken1: "#1e88e5",
  darken2: "#1976d2",
  darken3: "#1565c0",
  darken4: "#0d47a1",
  accent1: "#82b1ff",
  accent2: "#448aff",
  accent3: "#2979ff",
  accent4: "#2962ff"
});
const lightBlue = Object.freeze({
  base: "#03a9f4",
  lighten5: "#e1f5fe",
  lighten4: "#b3e5fc",
  lighten3: "#81d4fa",
  lighten2: "#4fc3f7",
  lighten1: "#29b6f6",
  darken1: "#039be5",
  darken2: "#0288d1",
  darken3: "#0277bd",
  darken4: "#01579b",
  accent1: "#80d8ff",
  accent2: "#40c4ff",
  accent3: "#00b0ff",
  accent4: "#0091ea"
});
const cyan = Object.freeze({
  base: "#00bcd4",
  lighten5: "#e0f7fa",
  lighten4: "#b2ebf2",
  lighten3: "#80deea",
  lighten2: "#4dd0e1",
  lighten1: "#26c6da",
  darken1: "#00acc1",
  darken2: "#0097a7",
  darken3: "#00838f",
  darken4: "#006064",
  accent1: "#84ffff",
  accent2: "#18ffff",
  accent3: "#00e5ff",
  accent4: "#00b8d4"
});
const teal = Object.freeze({
  base: "#009688",
  lighten5: "#e0f2f1",
  lighten4: "#b2dfdb",
  lighten3: "#80cbc4",
  lighten2: "#4db6ac",
  lighten1: "#26a69a",
  darken1: "#00897b",
  darken2: "#00796b",
  darken3: "#00695c",
  darken4: "#004d40",
  accent1: "#a7ffeb",
  accent2: "#64ffda",
  accent3: "#1de9b6",
  accent4: "#00bfa5"
});
const green = Object.freeze({
  base: "#4caf50",
  lighten5: "#e8f5e9",
  lighten4: "#c8e6c9",
  lighten3: "#a5d6a7",
  lighten2: "#81c784",
  lighten1: "#66bb6a",
  darken1: "#43a047",
  darken2: "#388e3c",
  darken3: "#2e7d32",
  darken4: "#1b5e20",
  accent1: "#b9f6ca",
  accent2: "#69f0ae",
  accent3: "#00e676",
  accent4: "#00c853"
});
const lightGreen = Object.freeze({
  base: "#8bc34a",
  lighten5: "#f1f8e9",
  lighten4: "#dcedc8",
  lighten3: "#c5e1a5",
  lighten2: "#aed581",
  lighten1: "#9ccc65",
  darken1: "#7cb342",
  darken2: "#689f38",
  darken3: "#558b2f",
  darken4: "#33691e",
  accent1: "#ccff90",
  accent2: "#b2ff59",
  accent3: "#76ff03",
  accent4: "#64dd17"
});
const lime = Object.freeze({
  base: "#cddc39",
  lighten5: "#f9fbe7",
  lighten4: "#f0f4c3",
  lighten3: "#e6ee9c",
  lighten2: "#dce775",
  lighten1: "#d4e157",
  darken1: "#c0ca33",
  darken2: "#afb42b",
  darken3: "#9e9d24",
  darken4: "#827717",
  accent1: "#f4ff81",
  accent2: "#eeff41",
  accent3: "#c6ff00",
  accent4: "#aeea00"
});
const yellow = Object.freeze({
  base: "#ffeb3b",
  lighten5: "#fffde7",
  lighten4: "#fff9c4",
  lighten3: "#fff59d",
  lighten2: "#fff176",
  lighten1: "#ffee58",
  darken1: "#fdd835",
  darken2: "#fbc02d",
  darken3: "#f9a825",
  darken4: "#f57f17",
  accent1: "#ffff8d",
  accent2: "#ffff00",
  accent3: "#ffea00",
  accent4: "#ffd600"
});
const amber = Object.freeze({
  base: "#ffc107",
  lighten5: "#fff8e1",
  lighten4: "#ffecb3",
  lighten3: "#ffe082",
  lighten2: "#ffd54f",
  lighten1: "#ffca28",
  darken1: "#ffb300",
  darken2: "#ffa000",
  darken3: "#ff8f00",
  darken4: "#ff6f00",
  accent1: "#ffe57f",
  accent2: "#ffd740",
  accent3: "#ffc400",
  accent4: "#ffab00"
});
const orange = Object.freeze({
  base: "#ff9800",
  lighten5: "#fff3e0",
  lighten4: "#ffe0b2",
  lighten3: "#ffcc80",
  lighten2: "#ffb74d",
  lighten1: "#ffa726",
  darken1: "#fb8c00",
  darken2: "#f57c00",
  darken3: "#ef6c00",
  darken4: "#e65100",
  accent1: "#ffd180",
  accent2: "#ffab40",
  accent3: "#ff9100",
  accent4: "#ff6d00"
});
const deepOrange = Object.freeze({
  base: "#ff5722",
  lighten5: "#fbe9e7",
  lighten4: "#ffccbc",
  lighten3: "#ffab91",
  lighten2: "#ff8a65",
  lighten1: "#ff7043",
  darken1: "#f4511e",
  darken2: "#e64a19",
  darken3: "#d84315",
  darken4: "#bf360c",
  accent1: "#ff9e80",
  accent2: "#ff6e40",
  accent3: "#ff3d00",
  accent4: "#dd2c00"
});
const brown = Object.freeze({
  base: "#795548",
  lighten5: "#efebe9",
  lighten4: "#d7ccc8",
  lighten3: "#bcaaa4",
  lighten2: "#a1887f",
  lighten1: "#8d6e63",
  darken1: "#6d4c41",
  darken2: "#5d4037",
  darken3: "#4e342e",
  darken4: "#3e2723"
});
const blueGrey = Object.freeze({
  base: "#607d8b",
  lighten5: "#eceff1",
  lighten4: "#cfd8dc",
  lighten3: "#b0bec5",
  lighten2: "#90a4ae",
  lighten1: "#78909c",
  darken1: "#546e7a",
  darken2: "#455a64",
  darken3: "#37474f",
  darken4: "#263238"
});
const grey = Object.freeze({
  base: "#9e9e9e",
  lighten5: "#fafafa",
  lighten4: "#f5f5f5",
  lighten3: "#eeeeee",
  lighten2: "#e0e0e0",
  lighten1: "#bdbdbd",
  darken1: "#757575",
  darken2: "#616161",
  darken3: "#424242",
  darken4: "#212121"
});
const shades = Object.freeze({
  black: "#000000",
  white: "#ffffff",
  transparent: "transparent"
});
const colors = Object.freeze({
  red,
  pink,
  purple,
  deepPurple,
  indigo,
  blue,
  lightBlue,
  cyan,
  teal,
  green,
  lightGreen,
  lime,
  yellow,
  amber,
  orange,
  deepOrange,
  brown,
  blueGrey,
  grey,
  shades
});
function parseDefaultColors(colors2) {
  return Object.keys(colors2).map((key) => {
    const color = colors2[key];
    return color.base ? [color.base, color.darken4, color.darken3, color.darken2, color.darken1, color.lighten1, color.lighten2, color.lighten3, color.lighten4, color.lighten5] : [color.black, color.white, color.transparent];
  });
}
const VColorPickerSwatches = defineComponent({
  name: "VColorPickerSwatches",
  props: {
    swatches: {
      type: Array,
      default: () => parseDefaultColors(colors)
    },
    disabled: Boolean,
    color: Object,
    maxHeight: [Number, String]
  },
  emits: {
    "update:color": (color) => true
  },
  setup(props, _ref) {
    let {
      emit
    } = _ref;
    return () => vue_cjs_prod.createVNode("div", {
      "class": "v-color-picker-swatches",
      "style": {
        maxHeight: convertToUnit(props.maxHeight)
      }
    }, [vue_cjs_prod.createVNode("div", null, [props.swatches.map((swatch) => vue_cjs_prod.createVNode("div", {
      "class": "v-color-picker-swatches__swatch"
    }, [swatch.map((color) => {
      const hsva = parseColor(color);
      return vue_cjs_prod.createVNode("div", {
        "class": "v-color-picker-swatches__color",
        "onClick": () => hsva && emit("update:color", hsva)
      }, [vue_cjs_prod.createVNode("div", {
        "style": {
          background: color
        }
      }, [props.color && deepEqual(props.color, hsva) ? vue_cjs_prod.createVNode(VIcon, {
        "size": "x-small",
        "icon": "$success",
        "color": getContrast(color, "#FFFFFF") > 2 ? "white" : "black"
      }, null) : void 0])]);
    })]))])]);
  }
});
const VColorPicker = defineComponent({
  name: "VColorPicker",
  inheritAttrs: false,
  props: __spreadValues(__spreadValues(__spreadValues({
    canvasHeight: {
      type: [String, Number],
      default: 150
    },
    disabled: Boolean,
    dotSize: {
      type: [Number, String],
      default: 10
    },
    hideCanvas: Boolean,
    hideSliders: Boolean,
    hideInputs: Boolean,
    mode: {
      type: String,
      default: "rgba",
      validator: (v) => Object.keys(modes).includes(v)
    },
    modes: {
      type: Array,
      default: () => Object.keys(modes),
      validator: (v) => Array.isArray(v) && v.every((m) => Object.keys(modes).includes(m))
    },
    showSwatches: Boolean,
    swatches: Array,
    swatchesMaxHeight: {
      type: [Number, String],
      default: 150
    },
    modelValue: {
      type: [Object, String]
    },
    width: {
      type: [Number, String],
      default: 300
    }
  }, makeElevationProps()), makeRoundedProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (color) => true,
    "update:mode": (mode) => true
  },
  setup(props) {
    const mode = useProxiedModel(props, "mode");
    const lastPickedColor = vue_cjs_prod.ref(null);
    const currentColor = useProxiedModel(props, "modelValue", void 0, (v) => {
      let c = parseColor(v);
      if (!c)
        return null;
      if (lastPickedColor.value) {
        c = __spreadProps(__spreadValues({}, c), {
          h: lastPickedColor.value.h
        });
        lastPickedColor.value = null;
      }
      return c;
    }, (v) => {
      if (!v)
        return null;
      return extractColor(v, props.modelValue);
    });
    const updateColor = (hsva) => {
      currentColor.value = hsva;
      lastPickedColor.value = hsva;
    };
    vue_cjs_prod.onMounted(() => {
      if (!props.modes.includes(mode.value))
        mode.value = props.modes[0];
    });
    return () => {
      var _currentColor$value;
      return vue_cjs_prod.createVNode(VSheet, {
        "rounded": props.rounded,
        "elevation": props.elevation,
        "theme": props.theme,
        "class": ["v-color-picker"],
        "style": {
          "--v-color-picker-color-hsv": HSVAtoCSS(__spreadProps(__spreadValues({}, (_currentColor$value = currentColor.value) != null ? _currentColor$value : nullColor), {
            a: 1
          }))
        },
        "maxWidth": props.width
      }, {
        default: () => [!props.hideCanvas && vue_cjs_prod.createVNode(VColorPickerCanvas, {
          "color": currentColor.value,
          "onUpdate:color": updateColor,
          "disabled": props.disabled,
          "dotSize": props.dotSize,
          "width": props.width,
          "height": props.canvasHeight
        }, null), (!props.hideSliders || !props.hideInputs) && vue_cjs_prod.createVNode("div", {
          "class": "v-color-picker__controls"
        }, [!props.hideSliders && vue_cjs_prod.createVNode(VColorPickerPreview, {
          "color": currentColor.value,
          "onUpdate:color": updateColor,
          "hideAlpha": !mode.value.endsWith("a"),
          "disabled": props.disabled
        }, null), !props.hideInputs && vue_cjs_prod.createVNode(VColorPickerEdit, {
          "modes": props.modes,
          "mode": mode.value,
          "onUpdate:mode": (m) => mode.value = m,
          "color": currentColor.value,
          "onUpdate:color": updateColor,
          "disabled": props.disabled
        }, null)]), props.showSwatches && vue_cjs_prod.createVNode(VColorPickerSwatches, {
          "color": currentColor.value,
          "onUpdate:color": updateColor,
          "maxHeight": props.swatchesMaxHeight,
          "swatches": props.swatches,
          "disabled": props.disabled
        }, null)]
      });
    };
  }
});
function highlightResult(text, matches, length) {
  if (Array.isArray(matches))
    throw new Error("Multiple matches is not implemented");
  return typeof matches === "number" && ~matches ? vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("span", {
    "class": "v-combobox__unmask"
  }, [text.substr(0, matches)]), vue_cjs_prod.createVNode("span", {
    "class": "v-combobox__mask"
  }, [text.substr(matches, length)]), vue_cjs_prod.createVNode("span", {
    "class": "v-combobox__unmask"
  }, [text.substr(matches + length)])]) : text;
}
const VCombobox = genericComponent()({
  name: "VCombobox",
  props: __spreadValues(__spreadValues(__spreadValues({
    delimiters: Array
  }, makeFilterProps({
    filterKeys: ["title"]
  })), makeSelectProps({
    hideNoData: true,
    returnObject: true
  })), makeTransitionProps({
    transition: false
  })),
  emits: {
    "update:modelValue": (val) => true,
    "update:searchInput": (val) => true
  },
  setup(props, _ref) {
    let {
      emit,
      slots
    } = _ref;
    const {
      t
    } = useLocale();
    const vTextFieldRef = vue_cjs_prod.ref();
    const isFocused = vue_cjs_prod.ref(false);
    const isPristine = vue_cjs_prod.ref(true);
    const menu = vue_cjs_prod.ref(false);
    const selectionIndex = vue_cjs_prod.ref(-1);
    const color = vue_cjs_prod.computed(() => {
      var _vTextFieldRef$value;
      return (_vTextFieldRef$value = vTextFieldRef.value) == null ? void 0 : _vTextFieldRef$value.color;
    });
    const {
      items,
      transformIn,
      transformOut
    } = useItems(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(color);
    const model = useProxiedModel(props, "modelValue", [], (v) => transformIn(wrapInArray(v || [])), (v) => {
      const transformed = transformOut(v);
      return props.multiple ? transformed : transformed[0];
    });
    const _search = vue_cjs_prod.ref("");
    const search = vue_cjs_prod.computed({
      get: () => {
        if (props.multiple)
          return _search.value;
        const item = items.value.find((_ref2) => {
          let {
            props: props2
          } = _ref2;
          return props2.value === model.value[0];
        });
        return item == null ? void 0 : item.props.value;
      },
      set: (val) => {
        var _props$delimiters;
        if (props.multiple) {
          _search.value = val;
        } else {
          model.value = [transformItem$1(props, val)];
        }
        if (val && props.multiple && (_props$delimiters = props.delimiters) != null && _props$delimiters.length) {
          const values = val.split(new RegExp(`(?:${props.delimiters.join("|")})+`));
          if (values.length > 1) {
            values.forEach((v) => {
              v = v.trim();
              if (v)
                select(transformItem$1(props, v));
            });
            _search.value = "";
          }
        }
        if (!val)
          selectionIndex.value = -1;
        if (isFocused.value)
          menu.value = true;
        isPristine.value = !val;
      }
    });
    vue_cjs_prod.watch(_search, (value) => {
      emit("update:searchInput", value);
    });
    const {
      filteredItems
    } = useFilter(props, items, vue_cjs_prod.computed(() => isPristine.value ? void 0 : search.value));
    const selections = vue_cjs_prod.computed(() => {
      return model.value.map((v) => {
        return items.value.find((item) => item.value === v.value) || v;
      });
    });
    const selected = vue_cjs_prod.computed(() => selections.value.map((selection2) => selection2.props.value));
    const selection = vue_cjs_prod.computed(() => selections.value[selectionIndex.value]);
    function onClear(e) {
      model.value = [];
      if (props.openOnClear) {
        menu.value = true;
      }
    }
    function onClickControl() {
      if (props.hideNoData && !filteredItems.value.length)
        return;
      menu.value = true;
    }
    function onKeydown(e) {
      const selectionStart = vTextFieldRef.value.selectionStart;
      const length = selected.value.length;
      if (selectionIndex.value > -1)
        e.preventDefault();
      if (["Enter", "ArrowDown"].includes(e.key)) {
        menu.value = true;
      }
      if (["Escape"].includes(e.key)) {
        menu.value = false;
      }
      if (["Enter", "Escape", "Tab"].includes(e.key)) {
        isPristine.value = true;
      }
      if (!props.multiple)
        return;
      if (["Backspace", "Delete"].includes(e.key)) {
        if (selectionIndex.value < 0) {
          if (e.key === "Backspace" && !search.value) {
            selectionIndex.value = length - 1;
          }
          return;
        }
        select(selection.value);
        vue_cjs_prod.nextTick(() => !selection.value && (selectionIndex.value = length - 2));
      }
      if (e.key === "ArrowLeft") {
        if (selectionIndex.value < 0 && selectionStart > 0)
          return;
        const prev = selectionIndex.value > -1 ? selectionIndex.value - 1 : length - 1;
        if (selections.value[prev]) {
          selectionIndex.value = prev;
        } else {
          selectionIndex.value = -1;
          vTextFieldRef.value.setSelectionRange(search.value.length, search.value.length);
        }
      }
      if (e.key === "ArrowRight") {
        if (selectionIndex.value < 0)
          return;
        const next = selectionIndex.value + 1;
        if (selections.value[next]) {
          selectionIndex.value = next;
        } else {
          selectionIndex.value = -1;
          vTextFieldRef.value.setSelectionRange(0, 0);
        }
      }
      if (e.key === "Enter") {
        select(transformItem$1(props, search.value));
        search.value = "";
      }
    }
    function onInput(e) {
      search.value = e.target.value;
    }
    function onAfterLeave() {
      if (isFocused.value)
        isPristine.value = true;
    }
    function select(item) {
      if (props.multiple) {
        const index2 = selected.value.findIndex((selection2) => selection2 === item.value);
        if (index2 === -1) {
          model.value = [...model.value, item];
        } else {
          const value = [...model.value];
          value.splice(index2, 1);
          model.value = value;
        }
        search.value = "";
      } else {
        search.value = item.title;
        vue_cjs_prod.nextTick(() => {
          menu.value = false;
          isPristine.value = true;
        });
      }
    }
    vue_cjs_prod.watch(filteredItems, (val) => {
      if (!val.length && props.hideNoData)
        menu.value = false;
    });
    vue_cjs_prod.watch(isFocused, (val) => {
      if (val) {
        selectionIndex.value = -1;
      } else {
        menu.value = false;
        if (!props.multiple || !search.value)
          return;
        model.value = [...model.value, transformItem$1(props, search.value)];
        search.value = "";
      }
    });
    useRender(() => {
      const hasChips = !!(props.chips || slots.chip);
      return vue_cjs_prod.createVNode(VTextField, {
        "ref": vTextFieldRef,
        "modelValue": search.value,
        "onInput": onInput,
        "class": ["v-combobox", {
          "v-combobox--active-menu": menu.value,
          "v-combobox--chips": !!props.chips,
          "v-combobox--selecting-index": selectionIndex.value > -1,
          [`v-combobox--${props.multiple ? "multiple" : "single"}`]: true
        }],
        "appendInnerIcon": props.items.length ? props.menuIcon : void 0,
        "dirty": selected.value.length > 0,
        "onClick:clear": onClear,
        "onClick:control": onClickControl,
        "onClick:input": onClickControl,
        "onFocus": () => isFocused.value = true,
        "onBlur": () => isFocused.value = false,
        "onKeydown": onKeydown
      }, __spreadProps(__spreadValues({}, slots), {
        default: () => {
          var _slots$noData, _slots$noData2;
          return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(VMenu, {
            "modelValue": menu.value,
            "onUpdate:modelValue": ($event) => menu.value = $event,
            "activator": "parent",
            "contentClass": "v-combobox__content",
            "eager": props.eager,
            "openOnClick": false,
            "transition": props.transition,
            "onAfterLeave": onAfterLeave
          }, {
            default: () => [vue_cjs_prod.createVNode(VList, {
              "selected": selected.value,
              "selectStrategy": props.multiple ? "independent" : "single-independent"
            }, {
              default: () => [!filteredItems.value.length && !props.hideNoData && ((_slots$noData = (_slots$noData2 = slots["no-data"]) == null ? void 0 : _slots$noData2.call(slots)) != null ? _slots$noData : vue_cjs_prod.createVNode(VListItem, {
                "title": t(props.noDataText)
              }, null)), filteredItems.value.map((_ref3) => {
                let {
                  item,
                  matches
                } = _ref3;
                return vue_cjs_prod.createVNode(VListItem, vue_cjs_prod.mergeProps(item.props, {
                  "onMousedown": (e) => e.preventDefault(),
                  "onClick": () => select(item)
                }), {
                  title: () => {
                    var _search$value$length, _search$value;
                    return isPristine.value ? item.title : highlightResult(item.title, matches.title, (_search$value$length = (_search$value = search.value) == null ? void 0 : _search$value.length) != null ? _search$value$length : 0);
                  }
                });
              })]
            })]
          }), selections.value.map((selection2, index2) => {
            function onChipClose(e) {
              e.stopPropagation();
              e.preventDefault();
              select(selection2);
            }
            const slotProps = {
              "onClick:close": onChipClose,
              modelValue: true
            };
            return vue_cjs_prod.createVNode("div", {
              "class": ["v-combobox__selection", index2 === selectionIndex.value && ["v-combobox__selection--selected", textColorClasses.value]],
              "style": index2 === selectionIndex.value ? textColorStyles.value : {}
            }, [hasChips ? vue_cjs_prod.createVNode(VDefaultsProvider, {
              "defaults": {
                VChip: {
                  closable: props.closableChips,
                  size: "small",
                  text: selection2.props.title
                }
              }
            }, {
              default: () => [slots.chip ? slots.chip({
                props: slotProps,
                item: selection2.originalItem,
                index: index2
              }) : vue_cjs_prod.createVNode(VChip, slotProps, null)]
            }) : slots.selection ? slots.selection({
              item: selection2.originalItem,
              index: index2
            }) : vue_cjs_prod.createVNode("span", {
              "class": "v-combobox__selection-text"
            }, [selection2.props.title, props.multiple && index2 < selections.value.length - 1 && vue_cjs_prod.createVNode("span", {
              "class": "v-combobox__selection-comma"
            }, [vue_cjs_prod.createTextVNode(",")])])]);
          })]);
        }
      }));
    });
    return useForwardRef({
      isFocused,
      isPristine,
      menu,
      search,
      selectionIndex,
      filteredItems,
      select
    }, vTextFieldRef);
  }
});
const VDialog = genericComponent()({
  name: "VDialog",
  inheritAttrs: false,
  props: __spreadValues(__spreadValues({
    fullscreen: Boolean,
    origin: {
      type: String,
      default: "center center"
    },
    retainFocus: {
      type: Boolean,
      default: true
    },
    scrollable: Boolean,
    modelValue: Boolean
  }, makeDimensionProps({
    width: "auto"
  })), makeTransitionProps({
    transition: {
      component: VDialogTransition
    }
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      dimensionStyles
    } = useDimension(props);
    const {
      scopeId
    } = useScopeId();
    const overlay = vue_cjs_prod.ref();
    vue_cjs_prod.watch(isActive, async (val) => {
      await vue_cjs_prod.nextTick();
      if (val) {
        var _contentEl;
        (_contentEl = overlay.value.contentEl) == null ? void 0 : _contentEl.focus({
          preventScroll: true
        });
      } else {
        var _activatorEl;
        (_activatorEl = overlay.value.activatorEl) == null ? void 0 : _activatorEl.focus({
          preventScroll: true
        });
      }
    });
    return () => {
      return vue_cjs_prod.createVNode(VOverlay, vue_cjs_prod.mergeProps({
        "modelValue": isActive.value,
        "onUpdate:modelValue": ($event) => isActive.value = $event,
        "class": ["v-dialog", {
          "v-dialog--fullscreen": props.fullscreen,
          "v-dialog--scrollable": props.scrollable
        }],
        "style": dimensionStyles.value,
        "transition": props.transition,
        "ref": overlay,
        "aria-role": "dialog",
        "aria-modal": "true",
        "activatorProps": {
          "aria-haspopup": "dialog",
          "aria-expanded": String(isActive.value)
        },
        "z-index": 2400
      }, scopeId, attrs), {
        default: slots.default,
        activator: slots.activator
      });
    };
  }
});
const VExpansionPanelSymbol = Symbol.for("vuetify:v-expansion-panel");
const allowedVariants = ["default", "accordion", "inset", "popout"];
const VExpansionPanels = defineComponent({
  name: "VExpansionPanels",
  props: __spreadValues(__spreadValues(__spreadValues({
    color: String,
    variant: {
      type: String,
      default: "default",
      validator: (v) => allowedVariants.includes(v)
    },
    readonly: Boolean
  }, makeGroupProps()), makeTagProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    useGroup(props, VExpansionPanelSymbol);
    const {
      themeClasses
    } = provideTheme(props);
    const variantClass = vue_cjs_prod.computed(() => props.variant && `v-expansion-panels--variant-${props.variant}`);
    provideDefaults({
      VExpansionPanel: {
        color: vue_cjs_prod.toRef(props, "color")
      },
      VExpansionPanelTitle: {
        readonly: vue_cjs_prod.toRef(props, "readonly")
      }
    });
    useRender(() => vue_cjs_prod.createVNode(props.tag, {
      "class": ["v-expansion-panels", themeClasses.value, variantClass.value]
    }, slots));
    return {};
  }
});
const makeVExpansionPanelTitleProps = propsFactory({
  color: String,
  expandIcon: {
    type: IconValue,
    default: "$expand"
  },
  collapseIcon: {
    type: IconValue,
    default: "$collapse"
  },
  hideActions: Boolean,
  ripple: {
    type: [Boolean, Object],
    default: false
  },
  readonly: Boolean
});
const VExpansionPanelTitle = defineComponent({
  name: "VExpansionPanelTitle",
  directives: {
    Ripple
  },
  props: __spreadValues({}, makeVExpansionPanelTitleProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const expansionPanel = vue_cjs_prod.inject(VExpansionPanelSymbol);
    if (!expansionPanel)
      throw new Error("[Vuetify] v-expansion-panel-title needs to be placed inside v-expansion-panel");
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(props, "color");
    const slotProps = vue_cjs_prod.computed(() => ({
      collapseIcon: props.collapseIcon,
      disabled: expansionPanel.disabled.value,
      expanded: expansionPanel.isSelected.value,
      expandIcon: props.expandIcon,
      readonly: props.readonly
    }));
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("button", {
        "class": ["v-expansion-panel-title", {
          "v-expansion-panel-title--active": expansionPanel.isSelected.value
        }, backgroundColorClasses.value],
        "style": backgroundColorStyles.value,
        "type": "button",
        "tabindex": expansionPanel.disabled.value ? -1 : void 0,
        "disabled": expansionPanel.disabled.value,
        "aria-expanded": expansionPanel.isSelected.value,
        "onClick": !props.readonly ? expansionPanel.toggle : void 0
      }, [vue_cjs_prod.createVNode("div", {
        "class": "v-expansion-panel-title__overlay"
      }, null), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, slotProps.value), !props.hideActions && vue_cjs_prod.createVNode("div", {
        "class": "v-expansion-panel-title__icon"
      }, [slots.actions ? slots.actions(slotProps.value) : vue_cjs_prod.createVNode(VIcon, {
        "icon": expansionPanel.isSelected.value ? props.collapseIcon : props.expandIcon
      }, null)])]), [[vue_cjs_prod.resolveDirective("ripple"), props.ripple]]);
    });
    return {};
  }
});
const VExpansionPanelText = defineComponent({
  name: "VExpansionPanelText",
  props: __spreadValues({}, makeLazyProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const expansionPanel = vue_cjs_prod.inject(VExpansionPanelSymbol);
    if (!expansionPanel)
      throw new Error("[Vuetify] v-expansion-panel-text needs to be placed inside v-expansion-panel");
    const {
      hasContent,
      onAfterLeave
    } = useLazy(props, expansionPanel.isSelected);
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode(VExpandTransition, {
        "onAfterLeave": onAfterLeave
      }, {
        default: () => [vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("div", {
          "class": "v-expansion-panel-text"
        }, [slots.default && hasContent.value && vue_cjs_prod.createVNode("div", {
          "class": "v-expansion-panel-text__wrapper"
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)])]), [[vue_cjs_prod.vShow, expansionPanel.isSelected.value]])]
      });
    });
    return {};
  }
});
const VExpansionPanel = defineComponent({
  name: "VExpansionPanel",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    title: String,
    text: String,
    bgColor: String
  }, makeElevationProps()), makeGroupItemProps()), makeLazyProps()), makeRoundedProps()), makeTagProps()), makeVExpansionPanelTitleProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const groupItem = useGroupItem(props, VExpansionPanelSymbol);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(props, "bgColor");
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const isDisabled = vue_cjs_prod.computed(() => (groupItem == null ? void 0 : groupItem.disabled.value) || props.disabled);
    const selectedIndices = vue_cjs_prod.computed(() => groupItem.group.items.value.reduce((arr, item, index2) => {
      if (groupItem.group.selected.value.includes(item.id))
        arr.push(index2);
      return arr;
    }, []));
    const isBeforeSelected = vue_cjs_prod.computed(() => {
      const index2 = groupItem.group.items.value.findIndex((item) => item.id === groupItem.id);
      return !groupItem.isSelected.value && selectedIndices.value.some((selectedIndex) => selectedIndex - index2 === 1);
    });
    const isAfterSelected = vue_cjs_prod.computed(() => {
      const index2 = groupItem.group.items.value.findIndex((item) => item.id === groupItem.id);
      return !groupItem.isSelected.value && selectedIndices.value.some((selectedIndex) => selectedIndex - index2 === -1);
    });
    vue_cjs_prod.provide(VExpansionPanelSymbol, groupItem);
    useRender(() => {
      var _slots$default;
      const hasText = !!(slots.text || props.text);
      const hasTitle = !!(slots.title || props.title);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-expansion-panel", {
          "v-expansion-panel--active": groupItem.isSelected.value,
          "v-expansion-panel--before-active": isBeforeSelected.value,
          "v-expansion-panel--after-active": isAfterSelected.value,
          "v-expansion-panel--disabled": isDisabled.value
        }, roundedClasses.value, backgroundColorClasses.value],
        "style": backgroundColorStyles.value,
        "aria-expanded": groupItem.isSelected.value
      }, {
        default: () => [vue_cjs_prod.createVNode("div", {
          "class": ["v-expansion-panel__shadow", ...elevationClasses.value]
        }, null), hasTitle && vue_cjs_prod.createVNode(VExpansionPanelTitle, {
          "collapseIcon": props.collapseIcon,
          "color": props.color,
          "expandIcon": props.expandIcon,
          "hideActions": props.hideActions,
          "ripple": props.ripple
        }, {
          default: () => [slots.title ? slots.title() : props.title]
        }), hasText && vue_cjs_prod.createVNode(VExpansionPanelText, {
          "eager": props.eager
        }, {
          default: () => [slots.text ? slots.text() : props.text]
        }), (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
      });
    });
    return {};
  }
});
const VFileInput = defineComponent({
  name: "VFileInput",
  inheritAttrs: false,
  props: __spreadValues(__spreadProps(__spreadValues({
    chips: Boolean,
    counter: Boolean,
    counterSizeString: {
      type: String,
      default: "$vuetify.fileInput.counterSize"
    },
    counterString: {
      type: String,
      default: "$vuetify.fileInput.counter"
    },
    multiple: Boolean,
    hint: String,
    persistentHint: Boolean,
    placeholder: String,
    showSize: {
      type: [Boolean, Number],
      default: false,
      validator: (v) => {
        return typeof v === "boolean" || [1e3, 1024].includes(v);
      }
    }
  }, makeVInputProps()), {
    prependIcon: {
      type: IconValue,
      default: "$file"
    },
    modelValue: {
      type: Array,
      default: () => [],
      validator: (val) => {
        return wrapInArray(val).every((v) => v != null && typeof v === "object");
      }
    }
  }), makeVFieldProps({
    clearable: true
  })),
  emits: {
    "click:clear": (e) => true,
    "click:control": (e) => true,
    "update:modelValue": (files) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const {
      t
    } = useLocale();
    const model = useProxiedModel(props, "modelValue");
    const base = vue_cjs_prod.computed(() => typeof props.showSize !== "boolean" ? props.showSize : void 0);
    const totalBytes = vue_cjs_prod.computed(() => {
      var _model$value;
      return ((_model$value = model.value) != null ? _model$value : []).reduce((bytes, _ref2) => {
        let {
          size = 0
        } = _ref2;
        return bytes + size;
      }, 0);
    });
    const totalBytesReadable = vue_cjs_prod.computed(() => humanReadableFileSize(totalBytes.value, base.value));
    const fileNames = vue_cjs_prod.computed(() => {
      var _model$value2;
      return ((_model$value2 = model.value) != null ? _model$value2 : []).map((file) => {
        const {
          name = "",
          size = 0
        } = file;
        return !props.showSize ? name : `${name} (${humanReadableFileSize(size, base.value)})`;
      });
    });
    const counterValue = vue_cjs_prod.computed(() => {
      var _model$value$length, _model$value3;
      const fileCount = (_model$value$length = (_model$value3 = model.value) == null ? void 0 : _model$value3.length) != null ? _model$value$length : 0;
      if (props.showSize)
        return t(props.counterSizeString, fileCount, totalBytesReadable.value);
      else
        return t(props.counterString, fileCount);
    });
    const vInputRef = vue_cjs_prod.ref();
    const vFieldRef = vue_cjs_prod.ref();
    const isFocused = vue_cjs_prod.ref(false);
    const inputRef = vue_cjs_prod.ref();
    const messages = vue_cjs_prod.computed(() => {
      return props.messages.length ? props.messages : props.persistentHint ? props.hint : "";
    });
    function onFocus() {
      if (inputRef.value !== document.activeElement) {
        var _inputRef$value;
        (_inputRef$value = inputRef.value) == null ? void 0 : _inputRef$value.focus();
      }
      if (!isFocused.value) {
        isFocused.value = true;
      }
    }
    function onControlClick(e) {
      var _inputRef$value2;
      (_inputRef$value2 = inputRef.value) == null ? void 0 : _inputRef$value2.click();
      emit("click:control", e);
    }
    function onClear(e) {
      e.stopPropagation();
      onFocus();
      vue_cjs_prod.nextTick(() => {
        model.value = [];
        if (inputRef != null && inputRef.value) {
          inputRef.value.value = "";
        }
        emit("click:clear", e);
      });
    }
    useRender(() => {
      const hasCounter = !!(slots.counter || props.counter);
      const [rootAttrs, inputAttrs] = filterInputAttrs(attrs);
      const [_a] = filterInputProps(props), _b = _a, inputProps = __objRest(_b, [
        "modelValue"
      ]);
      const [fieldProps] = filterFieldProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "ref": vInputRef,
        "modelValue": model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        "class": "v-file-input"
      }, rootAttrs, inputProps, {
        "onClick:prepend": onControlClick,
        "messages": messages.value
      }), __spreadProps(__spreadValues({}, slots), {
        default: (_ref3) => {
          let {
            isDisabled,
            isDirty,
            isReadonly,
            isValid
          } = _ref3;
          return vue_cjs_prod.createVNode(VField, vue_cjs_prod.mergeProps({
            "ref": vFieldRef,
            "prepend-icon": props.prependIcon,
            "onClick:control": onControlClick,
            "onClick:clear": onClear
          }, fieldProps, {
            "active": isDirty.value || isFocused.value,
            "dirty": isDirty.value,
            "focused": isFocused.value,
            "error": isValid.value === false
          }), __spreadProps(__spreadValues({}, slots), {
            default: (_ref4) => {
              let {
                props: _a2
              } = _ref4, _b2 = _a2, {
                class: fieldClass
              } = _b2, slotProps = __objRest(_b2, [
                "class"
              ]);
              return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("input", vue_cjs_prod.mergeProps({
                "ref": inputRef,
                "type": "file",
                "readonly": isReadonly.value,
                "disabled": isDisabled.value,
                "multiple": props.multiple,
                "name": props.name,
                "onClick": (e) => {
                  e.stopPropagation();
                  onFocus();
                },
                "onChange": (e) => {
                  var _target$files;
                  if (!e.target)
                    return;
                  const target = e.target;
                  model.value = [...(_target$files = target.files) != null ? _target$files : []];
                },
                "onFocus": onFocus,
                "onBlur": () => isFocused.value = false
              }, slotProps, inputAttrs), null), model.value.length > 0 && vue_cjs_prod.createVNode("div", {
                "class": fieldClass
              }, [slots.selection ? slots.selection({
                fileNames: fileNames.value,
                totalBytes: totalBytes.value,
                totalBytesReadable: totalBytesReadable.value
              }) : props.chips ? fileNames.value.map((text) => vue_cjs_prod.createVNode(VChip, {
                "key": text,
                "size": "small",
                "color": props.color
              }, {
                default: () => [text]
              })) : fileNames.value.join(", ")])]);
            }
          }));
        },
        details: hasCounter ? () => vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("span", null, null), vue_cjs_prod.createVNode(VCounter, {
          "active": !!model.value.length,
          "value": counterValue.value
        }, slots.counter)]) : void 0
      }));
    });
    return useForwardRef({}, vInputRef, vFieldRef, inputRef);
  }
});
const VFooter = defineComponent({
  name: "VFooter",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    app: Boolean,
    color: String,
    height: {
      type: [Number, String],
      default: "auto"
    }
  }, makeBorderProps()), makeElevationProps()), makeLayoutItemProps()), makeRoundedProps()), makeTagProps({
    tag: "footer"
  })), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      borderClasses
    } = useBorder(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const autoHeight = vue_cjs_prod.ref(32);
    const {
      resizeRef
    } = useResizeObserver();
    const height = vue_cjs_prod.computed(() => props.height === "auto" ? autoHeight.value : parseInt(props.height, 10));
    const {
      layoutItemStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.computed(() => "bottom"),
      layoutSize: height,
      elementSize: vue_cjs_prod.computed(() => props.height === "auto" ? void 0 : height.value),
      active: vue_cjs_prod.computed(() => props.app),
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    return () => vue_cjs_prod.createVNode(props.tag, {
      "ref": resizeRef,
      "class": ["v-footer", themeClasses.value, backgroundColorClasses.value, borderClasses.value, elevationClasses.value, roundedClasses.value],
      "style": [backgroundColorStyles, props.app ? layoutItemStyles.value : void 0]
    }, slots);
  }
});
const VForm = defineComponent({
  name: "VForm",
  props: __spreadValues({}, makeFormProps()),
  emits: {
    "update:modelValue": (val) => true,
    submit: (e) => true
  },
  setup(props, _ref) {
    let {
      slots,
      emit
    } = _ref;
    const form = createForm(props);
    const formRef = vue_cjs_prod.ref();
    function onReset(e) {
      e.preventDefault();
      form.reset();
    }
    function onSubmit(_e) {
      const e = _e;
      const ready = form.validate();
      e.then = ready.then.bind(ready);
      e.catch = ready.catch.bind(ready);
      e.finally = ready.finally.bind(ready);
      emit("submit", e);
      if (!e.defaultPrevented) {
        ready.then((_ref2) => {
          let {
            valid
          } = _ref2;
          if (valid) {
            var _formRef$value;
            (_formRef$value = formRef.value) == null ? void 0 : _formRef$value.submit();
          }
        });
      }
      e.preventDefault();
    }
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("form", {
        "ref": formRef,
        "class": "v-form",
        "novalidate": true,
        "onReset": onReset,
        "onSubmit": onSubmit
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, form)]);
    });
    return useForwardRef(form, formRef);
  }
});
const VContainer = defineComponent({
  name: "VContainer",
  props: __spreadValues({
    fluid: {
      type: Boolean,
      default: false
    }
  }, makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    return () => vue_cjs_prod.createVNode(props.tag, {
      "class": ["v-container", {
        "v-container--fluid": props.fluid
      }]
    }, slots);
  }
});
const breakpoints$1 = ["sm", "md", "lg", "xl", "xxl"];
const breakpointProps = (() => {
  return breakpoints$1.reduce((props, val) => {
    props[val] = {
      type: [Boolean, String, Number],
      default: false
    };
    return props;
  }, {});
})();
const offsetProps = (() => {
  return breakpoints$1.reduce((props, val) => {
    props["offset" + vue_cjs_prod.capitalize(val)] = {
      type: [String, Number],
      default: null
    };
    return props;
  }, {});
})();
const orderProps = (() => {
  return breakpoints$1.reduce((props, val) => {
    props["order" + vue_cjs_prod.capitalize(val)] = {
      type: [String, Number],
      default: null
    };
    return props;
  }, {});
})();
const propMap$1 = {
  col: Object.keys(breakpointProps),
  offset: Object.keys(offsetProps),
  order: Object.keys(orderProps)
};
function breakpointClass$1(type, prop, val) {
  let className = type;
  if (val == null || val === false) {
    return void 0;
  }
  if (prop) {
    const breakpoint = prop.replace(type, "");
    className += `-${breakpoint}`;
  }
  if (type === "col") {
    className = "v-" + className;
  }
  if (type === "col" && (val === "" || val === true)) {
    return className.toLowerCase();
  }
  className += `-${val}`;
  return className.toLowerCase();
}
const VCol = defineComponent({
  name: "VCol",
  props: __spreadValues(__spreadProps(__spreadValues(__spreadProps(__spreadValues(__spreadProps(__spreadValues({
    cols: {
      type: [Boolean, String, Number],
      default: false
    }
  }, breakpointProps), {
    offset: {
      type: [String, Number],
      default: null
    }
  }), offsetProps), {
    order: {
      type: [String, Number],
      default: null
    }
  }), orderProps), {
    alignSelf: {
      type: String,
      default: null,
      validator: (str) => ["auto", "start", "end", "center", "baseline", "stretch"].includes(str)
    }
  }), makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const classes = vue_cjs_prod.computed(() => {
      const classList = [];
      let type;
      for (type in propMap$1) {
        propMap$1[type].forEach((prop) => {
          const value = props[prop];
          const className = breakpointClass$1(type, prop, value);
          if (className)
            classList.push(className);
        });
      }
      const hasColClasses = classList.some((className) => className.startsWith("v-col-"));
      classList.push({
        "v-col": !hasColClasses || !props.cols,
        [`v-col-${props.cols}`]: props.cols,
        [`offset-${props.offset}`]: props.offset,
        [`order-${props.order}`]: props.order,
        [`align-self-${props.alignSelf}`]: props.alignSelf
      });
      return classList;
    });
    return () => {
      var _slots$default;
      return vue_cjs_prod.h(props.tag, {
        class: classes.value
      }, (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots));
    };
  }
});
const breakpoints = ["sm", "md", "lg", "xl", "xxl"];
const ALIGNMENT = ["start", "end", "center"];
function makeRowProps(prefix, def2) {
  return breakpoints.reduce((props, val) => {
    props[prefix + vue_cjs_prod.capitalize(val)] = def2();
    return props;
  }, {});
}
const alignValidator = (str) => [...ALIGNMENT, "baseline", "stretch"].includes(str);
const alignProps = makeRowProps("align", () => ({
  type: String,
  default: null,
  validator: alignValidator
}));
const justifyValidator = (str) => [...ALIGNMENT, "space-between", "space-around"].includes(str);
const justifyProps = makeRowProps("justify", () => ({
  type: String,
  default: null,
  validator: justifyValidator
}));
const alignContentValidator = (str) => [...ALIGNMENT, "space-between", "space-around", "stretch"].includes(str);
const alignContentProps = makeRowProps("alignContent", () => ({
  type: String,
  default: null,
  validator: alignContentValidator
}));
const propMap = {
  align: Object.keys(alignProps),
  justify: Object.keys(justifyProps),
  alignContent: Object.keys(alignContentProps)
};
const classMap = {
  align: "align",
  justify: "justify",
  alignContent: "align-content"
};
function breakpointClass(type, prop, val) {
  let className = classMap[type];
  if (val == null) {
    return void 0;
  }
  if (prop) {
    const breakpoint = prop.replace(type, "");
    className += `-${breakpoint}`;
  }
  className += `-${val}`;
  return className.toLowerCase();
}
const VRow = defineComponent({
  name: "VRow",
  props: __spreadValues(__spreadValues(__spreadProps(__spreadValues(__spreadProps(__spreadValues({
    dense: Boolean,
    noGutters: Boolean,
    align: {
      type: String,
      default: null,
      validator: alignValidator
    }
  }, alignProps), {
    justify: {
      type: String,
      default: null,
      validator: justifyValidator
    }
  }), justifyProps), {
    alignContent: {
      type: String,
      default: null,
      validator: alignContentValidator
    }
  }), alignContentProps), makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const classes = vue_cjs_prod.computed(() => {
      const classList = [];
      let type;
      for (type in propMap) {
        propMap[type].forEach((prop) => {
          const value = props[prop];
          const className = breakpointClass(type, prop, value);
          if (className)
            classList.push(className);
        });
      }
      classList.push({
        "v-row--no-gutters": props.noGutters,
        "v-row--dense": props.dense,
        [`align-${props.align}`]: props.align,
        [`justify-${props.justify}`]: props.justify,
        [`align-content-${props.alignContent}`]: props.alignContent
      });
      return classList;
    });
    return () => {
      var _slots$default;
      return vue_cjs_prod.h(props.tag, {
        class: ["v-row", classes.value]
      }, (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots));
    };
  }
});
const VSpacer = createSimpleFunctional("flex-grow-1", "div", "VSpacer");
const VHover = defineComponent({
  name: "VHover",
  props: __spreadValues({
    disabled: Boolean,
    modelValue: {
      type: Boolean,
      default: void 0
    }
  }, makeDelayProps()),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const isHovering = useProxiedModel(props, "modelValue");
    const {
      runOpenDelay,
      runCloseDelay
    } = useDelay();
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
        isHovering: isHovering.value,
        props: {
          onMouseenter: runOpenDelay,
          onMouseleave: runCloseDelay
        }
      });
    };
  }
});
const VItemGroupSymbol = Symbol.for("vuetify:v-item-group");
const VItemGroup = defineComponent({
  name: "VItemGroup",
  props: __spreadValues(__spreadValues(__spreadValues({}, makeGroupProps({
    selectedClass: "v-item--selected"
  })), makeTagProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      isSelected,
      select,
      next,
      prev,
      selected
    } = useGroup(props, VItemGroupSymbol);
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-item-group", themeClasses.value]
      }, {
        default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
          isSelected,
          select,
          next,
          prev,
          selected: selected.value
        })]
      });
    };
  }
});
const VItem = genericComponent()({
  name: "VItem",
  props: makeGroupItemProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      isSelected,
      select,
      toggle,
      selectedClass,
      value,
      disabled
    } = useGroupItem(props, VItemGroupSymbol);
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
        isSelected: isSelected.value,
        selectedClass: selectedClass.value,
        select,
        toggle,
        value: value.value,
        disabled: disabled.value
      });
    };
  }
});
const VKbd = createSimpleFunctional("v-kbd");
const VLayout = defineComponent({
  name: "VLayout",
  props: makeLayoutProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      layoutClasses,
      layoutStyles,
      getLayoutItem,
      items,
      layoutRef
    } = createLayout(props);
    useRender(() => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "ref": layoutRef,
        "class": layoutClasses.value,
        "style": layoutStyles.value
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    });
    return {
      getLayoutItem,
      items
    };
  }
});
const VLayoutItem = defineComponent({
  name: "VLayoutItem",
  props: __spreadValues({
    position: {
      type: String,
      required: true
    },
    size: {
      type: [Number, String],
      default: 300
    },
    modelValue: Boolean
  }, makeLayoutItemProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      layoutItemStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.toRef(props, "position"),
      elementSize: vue_cjs_prod.toRef(props, "size"),
      layoutSize: vue_cjs_prod.toRef(props, "size"),
      active: vue_cjs_prod.toRef(props, "modelValue"),
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-layout-item"],
        "style": layoutItemStyles.value
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    };
  }
});
const VLazy = defineComponent({
  name: "VLazy",
  directives: {
    intersect: Intersect
  },
  props: __spreadValues(__spreadValues(__spreadValues({
    modelValue: Boolean,
    options: {
      type: Object,
      default: () => ({
        root: void 0,
        rootMargin: void 0,
        threshold: void 0
      })
    }
  }, makeDimensionProps()), makeTagProps()), makeTransitionProps({
    transition: "fade-transition"
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      dimensionStyles
    } = useDimension(props);
    const isActive = useProxiedModel(props, "modelValue");
    function onIntersect(isIntersecting) {
      if (isActive.value)
        return;
      isActive.value = isIntersecting;
    }
    return () => {
      var _slots$default;
      return vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode(props.tag, {
        "class": "v-lazy",
        "style": dimensionStyles.value
      }, {
        default: () => [isActive.value && vue_cjs_prod.createVNode(MaybeTransition, {
          "transition": props.transition
        }, {
          default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
        })]
      }), [[vue_cjs_prod.resolveDirective("intersect"), onIntersect, props.options]]);
    };
  }
});
const VLocaleProvider = defineComponent({
  name: "VLocaleProvider",
  props: {
    locale: String,
    fallbackLocale: String,
    messages: Object,
    rtl: {
      type: Boolean,
      default: void 0
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const localeInstance = provideLocale(props);
    const {
      rtlClasses
    } = provideRtl(props, localeInstance);
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-locale-provider", rtlClasses.value]
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]);
    };
  }
});
function useSsrBoot() {
  const isBooted = vue_cjs_prod.ref(false);
  vue_cjs_prod.onMounted(() => {
    window.requestAnimationFrame(() => {
      isBooted.value = true;
    });
  });
  const ssrBootStyles = vue_cjs_prod.computed(() => !isBooted.value ? {
    transition: "none !important"
  } : void 0);
  return {
    ssrBootStyles
  };
}
const VMain = defineComponent({
  name: "VMain",
  props: makeTagProps({
    tag: "main"
  }),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      mainStyles
    } = useLayout();
    const {
      ssrBootStyles
    } = useSsrBoot();
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": "v-main",
        "style": [mainStyles.value, ssrBootStyles.value]
      }, {
        default: () => [vue_cjs_prod.createVNode("div", {
          "class": "v-main__wrap"
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)])]
      });
    };
  }
});
const HORIZON = 100;
const HISTORY = 20;
function kineticEnergyToVelocity(work) {
  const sqrt2 = 1.41421356237;
  return (work < 0 ? -1 : 1) * Math.sqrt(Math.abs(work)) * sqrt2;
}
function calculateImpulseVelocity(samples) {
  if (samples.length < 2) {
    return 0;
  }
  if (samples.length === 2) {
    if (samples[1].t === samples[0].t) {
      return 0;
    }
    return (samples[1].d - samples[0].d) / (samples[1].t - samples[0].t);
  }
  let work = 0;
  for (let i = samples.length - 1; i > 0; i--) {
    if (samples[i].t === samples[i - 1].t) {
      continue;
    }
    const vprev = kineticEnergyToVelocity(work);
    const vcurr = (samples[i].d - samples[i - 1].d) / (samples[i].t - samples[i - 1].t);
    work += (vcurr - vprev) * Math.abs(vcurr);
    if (i === samples.length - 1) {
      work *= 0.5;
    }
  }
  return kineticEnergyToVelocity(work) * 1e3;
}
function useVelocity() {
  const touches = {};
  function addMovement(e) {
    Array.from(e.changedTouches).forEach((touch) => {
      var _touches$touch$identi;
      const samples = (_touches$touch$identi = touches[touch.identifier]) != null ? _touches$touch$identi : touches[touch.identifier] = new CircularBuffer(HISTORY);
      samples.push([e.timeStamp, touch]);
    });
  }
  function endTouch(e) {
    Array.from(e.changedTouches).forEach((touch) => {
      delete touches[touch.identifier];
    });
  }
  function getVelocity(id) {
    var _touches$id;
    const samples = (_touches$id = touches[id]) == null ? void 0 : _touches$id.values().reverse();
    if (!samples) {
      throw new Error(`No samples for touch id ${id}`);
    }
    const newest = samples[0];
    const x = [];
    const y = [];
    for (const val of samples) {
      if (newest[0] - val[0] > HORIZON)
        break;
      x.push({
        t: val[0],
        d: val[1].clientX
      });
      y.push({
        t: val[0],
        d: val[1].clientY
      });
    }
    return {
      x: calculateImpulseVelocity(x),
      y: calculateImpulseVelocity(y),
      get direction() {
        const {
          x: x2,
          y: y2
        } = this;
        const [absX, absY] = [Math.abs(x2), Math.abs(y2)];
        return absX > absY && x2 >= 0 ? "right" : absX > absY && x2 <= 0 ? "left" : absY > absX && y2 >= 0 ? "down" : absY > absX && y2 <= 0 ? "up" : oops$1();
      }
    };
  }
  return {
    addMovement,
    endTouch,
    getVelocity
  };
}
function oops$1() {
  throw new Error();
}
function useTouch(_ref) {
  let {
    isActive,
    isTemporary,
    width,
    touchless,
    position
  } = _ref;
  vue_cjs_prod.onMounted(() => {
    window.addEventListener("touchstart", onTouchstart, {
      passive: true
    });
    window.addEventListener("touchmove", onTouchmove, {
      passive: false
    });
    window.addEventListener("touchend", onTouchend, {
      passive: true
    });
  });
  vue_cjs_prod.onBeforeUnmount(() => {
    window.removeEventListener("touchstart", onTouchstart);
    window.removeEventListener("touchmove", onTouchmove);
    window.removeEventListener("touchend", onTouchend);
  });
  const isHorizontal = vue_cjs_prod.computed(() => position.value !== "bottom");
  const {
    addMovement,
    endTouch,
    getVelocity
  } = useVelocity();
  let maybeDragging = false;
  const isDragging = vue_cjs_prod.ref(false);
  const dragProgress = vue_cjs_prod.ref(0);
  const offset = vue_cjs_prod.ref(0);
  let start;
  function getOffset2(pos, active) {
    return (position.value === "left" ? pos : position.value === "right" ? document.documentElement.clientWidth - pos : position.value === "bottom" ? document.documentElement.clientHeight - pos : oops()) - (active ? width.value : 0);
  }
  function getProgress(pos) {
    let limit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : true;
    const progress = position.value === "left" ? (pos - offset.value) / width.value : position.value === "right" ? (document.documentElement.clientWidth - pos - offset.value) / width.value : position.value === "bottom" ? (document.documentElement.clientHeight - pos - offset.value) / width.value : oops();
    return limit ? Math.max(0, Math.min(1, progress)) : progress;
  }
  function onTouchstart(e) {
    if (touchless.value)
      return;
    const touchX = e.changedTouches[0].clientX;
    const touchY = e.changedTouches[0].clientY;
    const touchZone = 25;
    const inTouchZone = position.value === "left" ? touchX < touchZone : position.value === "right" ? touchX > document.documentElement.clientWidth - touchZone : position.value === "bottom" ? touchY > document.documentElement.clientHeight - touchZone : oops();
    const inElement = isActive.value && (position.value === "left" ? touchX < width.value : position.value === "right" ? touchX > document.documentElement.clientWidth - width.value : position.value === "bottom" ? touchY > document.documentElement.clientHeight - width.value : oops());
    if (inTouchZone || inElement || isActive.value && isTemporary.value) {
      maybeDragging = true;
      start = [touchX, touchY];
      offset.value = getOffset2(isHorizontal.value ? touchX : touchY, isActive.value);
      dragProgress.value = getProgress(isHorizontal.value ? touchX : touchY);
      endTouch(e);
      addMovement(e);
    }
  }
  function onTouchmove(e) {
    const touchX = e.changedTouches[0].clientX;
    const touchY = e.changedTouches[0].clientY;
    if (maybeDragging) {
      if (!e.cancelable) {
        maybeDragging = false;
        return;
      }
      const dx = Math.abs(touchX - start[0]);
      const dy = Math.abs(touchY - start[1]);
      const thresholdMet = isHorizontal.value ? dx > dy && dx > 3 : dy > dx && dy > 3;
      if (thresholdMet) {
        isDragging.value = true;
        maybeDragging = false;
      } else if ((isHorizontal.value ? dy : dx) > 3) {
        maybeDragging = false;
      }
    }
    if (!isDragging.value)
      return;
    e.preventDefault();
    addMovement(e);
    const progress = getProgress(isHorizontal.value ? touchX : touchY, false);
    dragProgress.value = Math.max(0, Math.min(1, progress));
    if (progress > 1) {
      offset.value = getOffset2(isHorizontal.value ? touchX : touchY, true);
    } else if (progress < 0) {
      offset.value = getOffset2(isHorizontal.value ? touchX : touchY, false);
    }
  }
  function onTouchend(e) {
    maybeDragging = false;
    if (!isDragging.value)
      return;
    addMovement(e);
    isDragging.value = false;
    const velocity = getVelocity(e.changedTouches[0].identifier);
    const vx = Math.abs(velocity.x);
    const vy = Math.abs(velocity.y);
    const thresholdMet = isHorizontal.value ? vx > vy && vx > 400 : vy > vx && vy > 3;
    if (thresholdMet) {
      isActive.value = velocity.direction === ({
        left: "right",
        right: "left",
        bottom: "up"
      }[position.value] || oops());
    } else {
      isActive.value = dragProgress.value > 0.5;
    }
  }
  const dragStyles = vue_cjs_prod.computed(() => {
    return isDragging.value ? {
      transform: position.value === "left" ? `translateX(calc(-100% + ${dragProgress.value * width.value}px))` : position.value === "right" ? `translateX(calc(100% - ${dragProgress.value * width.value}px))` : position.value === "bottom" ? `translateY(calc(100% - ${dragProgress.value * width.value}px))` : oops(),
      transition: "none"
    } : void 0;
  });
  return {
    isDragging,
    dragProgress,
    dragStyles
  };
}
function oops() {
  throw new Error();
}
const VNavigationDrawer = defineComponent({
  name: "VNavigationDrawer",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    color: String,
    disableResizeWatcher: Boolean,
    disableRouteWatcher: Boolean,
    expandOnHover: Boolean,
    floating: Boolean,
    modelValue: {
      type: Boolean,
      default: null
    },
    permanent: Boolean,
    rail: Boolean,
    railWidth: {
      type: [Number, String],
      default: 72
    },
    image: String,
    temporary: Boolean,
    touchless: Boolean,
    width: {
      type: [Number, String],
      default: 256
    },
    location: {
      type: String,
      default: "left",
      validator: (value) => ["left", "right", "bottom"].includes(value)
    }
  }, makeBorderProps()), makeElevationProps()), makeLayoutItemProps()), makeRoundedProps()), makeTagProps({
    tag: "nav"
  })), makeThemeProps()),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      borderClasses
    } = useBorder(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      elevationClasses
    } = useElevation(props);
    const {
      mobile
    } = useDisplay();
    const {
      roundedClasses
    } = useRounded(props);
    const router = useRouter();
    const isActive = useProxiedModel(props, "modelValue", null, (v) => !!v);
    const isHovering = vue_cjs_prod.ref(false);
    const width = vue_cjs_prod.computed(() => {
      return props.rail && props.expandOnHover && isHovering.value ? Number(props.width) : Number(props.rail ? props.railWidth : props.width);
    });
    const isTemporary = vue_cjs_prod.computed(() => !props.permanent && (mobile.value || props.temporary));
    if (!props.disableResizeWatcher) {
      vue_cjs_prod.watch(isTemporary, (val) => !props.permanent && (isActive.value = !val));
    }
    if (!props.disableRouteWatcher && router) {
      vue_cjs_prod.watch(router.currentRoute, () => isTemporary.value && (isActive.value = false));
    }
    vue_cjs_prod.watch(() => props.permanent, (val) => {
      if (val)
        isActive.value = true;
    });
    vue_cjs_prod.onBeforeMount(() => {
      if (props.modelValue != null || isTemporary.value)
        return;
      isActive.value = props.permanent || !mobile.value;
    });
    const rootEl = vue_cjs_prod.ref();
    const {
      isDragging,
      dragProgress,
      dragStyles
    } = useTouch({
      isActive,
      isTemporary,
      width,
      touchless: vue_cjs_prod.toRef(props, "touchless"),
      position: vue_cjs_prod.toRef(props, "location")
    });
    const layoutSize = vue_cjs_prod.computed(() => {
      const size = isTemporary.value ? 0 : props.rail && props.expandOnHover ? Number(props.railWidth) : width.value;
      return isDragging.value ? size * dragProgress.value : size;
    });
    const {
      layoutItemStyles,
      layoutRect,
      layoutItemScrimStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.toRef(props, "location"),
      layoutSize,
      elementSize: width,
      active: vue_cjs_prod.computed(() => isActive.value || isDragging.value),
      disableTransitions: vue_cjs_prod.computed(() => isDragging.value),
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    const scrimStyles = vue_cjs_prod.computed(() => __spreadValues(__spreadValues(__spreadValues({}, isDragging.value ? {
      opacity: dragProgress.value * 0.2,
      transition: "none"
    } : void 0), layoutRect.value ? {
      left: convertToUnit(layoutRect.value.left),
      right: convertToUnit(layoutRect.value.right),
      top: convertToUnit(layoutRect.value.top),
      bottom: convertToUnit(layoutRect.value.bottom)
    } : void 0), layoutItemScrimStyles.value));
    return () => {
      var _slots$image, _slots$prepend, _slots$default, _slots$append;
      const hasImage = slots.image || props.image;
      return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(props.tag, vue_cjs_prod.mergeProps({
        "ref": rootEl,
        "onMouseenter": () => isHovering.value = true,
        "onMouseleave": () => isHovering.value = false,
        "class": ["v-navigation-drawer", {
          "v-navigation-drawer--bottom": props.location === "bottom",
          "v-navigation-drawer--end": props.location === "right",
          "v-navigation-drawer--expand-on-hover": props.expandOnHover,
          "v-navigation-drawer--floating": props.floating,
          "v-navigation-drawer--is-hovering": isHovering.value,
          "v-navigation-drawer--rail": props.rail,
          "v-navigation-drawer--start": props.location === "left",
          "v-navigation-drawer--temporary": isTemporary.value,
          "v-navigation-drawer--active": isActive.value
        }, themeClasses.value, backgroundColorClasses.value, borderClasses.value, elevationClasses.value, roundedClasses.value],
        "style": [backgroundColorStyles.value, layoutItemStyles.value, dragStyles.value]
      }, attrs), {
        default: () => [hasImage && vue_cjs_prod.createVNode("div", {
          "class": "v-navigation-drawer__img"
        }, [slots.image ? (_slots$image = slots.image) == null ? void 0 : _slots$image.call(slots, {
          image: props.image
        }) : vue_cjs_prod.createVNode("img", {
          "src": props.image,
          "alt": ""
        }, null)]), slots.prepend && vue_cjs_prod.createVNode("div", {
          "class": "v-navigation-drawer__prepend"
        }, [(_slots$prepend = slots.prepend) == null ? void 0 : _slots$prepend.call(slots)]), vue_cjs_prod.createVNode("div", {
          "class": "v-navigation-drawer__content"
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]), slots.append && vue_cjs_prod.createVNode("div", {
          "class": "v-navigation-drawer__append"
        }, [(_slots$append = slots.append) == null ? void 0 : _slots$append.call(slots)])]
      }), vue_cjs_prod.createVNode(vue_cjs_prod.Transition, {
        "name": "fade-transition"
      }, {
        default: () => [isTemporary.value && (isDragging.value || isActive.value) && vue_cjs_prod.createVNode("div", {
          "class": "v-navigation-drawer__scrim",
          "style": scrimStyles.value,
          "onClick": () => isActive.value = false
        }, null)]
      })]);
    };
  }
});
const VNoSsr = defineComponent({
  name: "VNoSsr",
  setup(_, _ref) {
    let {
      slots
    } = _ref;
    const show = vue_cjs_prod.ref(false);
    return () => {
      var _slots$default;
      return show.value && ((_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots));
    };
  }
});
function useRefs() {
  const refs = vue_cjs_prod.ref([]);
  vue_cjs_prod.onBeforeUpdate(() => refs.value = []);
  function updateRef(e, i) {
    refs.value[i] = e;
  }
  return {
    refs,
    updateRef
  };
}
const VPagination = defineComponent({
  name: "VPagination",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    start: {
      type: [Number, String],
      default: 1
    },
    modelValue: {
      type: Number,
      default: (props) => props.start
    },
    disabled: Boolean,
    length: {
      type: [Number, String],
      default: 1,
      validator: (val) => val % 1 === 0
    },
    totalVisible: [Number, String],
    firstIcon: {
      type: IconValue,
      default: "$first"
    },
    prevIcon: {
      type: IconValue,
      default: "$prev"
    },
    nextIcon: {
      type: IconValue,
      default: "$next"
    },
    lastIcon: {
      type: IconValue,
      default: "$last"
    },
    ariaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.root"
    },
    pageAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.page"
    },
    currentPageAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.currentPage"
    },
    firstAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.first"
    },
    previousAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.previous"
    },
    nextAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.next"
    },
    lastAriaLabel: {
      type: String,
      default: "$vuetify.pagination.ariaLabel.last"
    },
    ellipsis: {
      type: String,
      default: "..."
    },
    showFirstLastPage: Boolean
  }, makeRoundedProps()), makeBorderProps()), makeDensityProps()), makeElevationProps()), makeSizeProps()), makeTagProps({
    tag: "nav"
  })), makeThemeProps()), makeVariantProps({
    variant: "text"
  })),
  emits: {
    "update:modelValue": (value) => true,
    first: (value) => true,
    prev: (value) => true,
    next: (value) => true,
    last: (value) => true
  },
  setup(props, _ref) {
    let {
      slots,
      emit
    } = _ref;
    const page = useProxiedModel(props, "modelValue");
    const {
      t,
      n
    } = useLocale();
    const {
      isRtl
    } = useRtl();
    const {
      themeClasses
    } = provideTheme(props);
    const maxButtons = vue_cjs_prod.ref(-1);
    provideDefaults(void 0, {
      scoped: true
    });
    const {
      resizeRef
    } = useResizeObserver();
    const length = vue_cjs_prod.computed(() => parseInt(props.length, 10));
    const start = vue_cjs_prod.computed(() => parseInt(props.start, 10));
    const totalVisible = vue_cjs_prod.computed(() => {
      var _props$totalVisible;
      if (props.totalVisible)
        return Math.min(parseInt((_props$totalVisible = props.totalVisible) != null ? _props$totalVisible : "", 10), length.value);
      else if (maxButtons.value >= 0)
        return maxButtons.value;
      return length.value;
    });
    const range2 = vue_cjs_prod.computed(() => {
      if (length.value <= 0)
        return [];
      if (totalVisible.value <= 2)
        return [page.value];
      if (length.value <= totalVisible.value) {
        return createRange(length.value, start.value);
      }
      const even = totalVisible.value % 2 === 0;
      const middle = even ? totalVisible.value / 2 : Math.floor(totalVisible.value / 2);
      const left = even ? middle : middle + 1;
      const right = length.value - middle;
      if (left - page.value >= 0) {
        return [...createRange(Math.max(1, totalVisible.value - 1), start.value), props.ellipsis, length.value];
      } else if (page.value - right >= 0) {
        const rangeLength = totalVisible.value - 1;
        const rangeStart = length.value - rangeLength + start.value;
        return [start.value, props.ellipsis, ...createRange(rangeLength, rangeStart)];
      } else {
        const rangeLength = Math.max(1, totalVisible.value - 3);
        const rangeStart = rangeLength === 1 ? page.value : page.value - Math.ceil(rangeLength / 2) + start.value;
        return [start.value, props.ellipsis, ...createRange(rangeLength, rangeStart), props.ellipsis, length.value];
      }
    });
    function setValue(e, value, event) {
      e.preventDefault();
      page.value = value;
      event && emit(event, value);
    }
    const {
      refs,
      updateRef
    } = useRefs();
    provideDefaults({
      VBtn: {
        border: vue_cjs_prod.toRef(props, "border"),
        density: vue_cjs_prod.toRef(props, "density"),
        size: vue_cjs_prod.toRef(props, "size"),
        variant: vue_cjs_prod.toRef(props, "variant")
      }
    });
    const items = vue_cjs_prod.computed(() => {
      return range2.value.map((item, index2) => {
        const ref2 = (e) => updateRef(e, index2);
        if (typeof item === "string") {
          return {
            isActive: false,
            page: item,
            props: {
              ref: ref2,
              ellipsis: true,
              icon: true,
              disabled: true
            }
          };
        } else {
          const isActive = item === page.value;
          return {
            isActive,
            page: n(item),
            props: {
              ref: ref2,
              ellipsis: false,
              icon: true,
              disabled: !!props.disabled || props.length < 2,
              elevation: props.elevation,
              rounded: props.rounded,
              color: isActive ? props.color : void 0,
              ariaCurrent: isActive,
              ariaLabel: t(isActive ? props.currentPageAriaLabel : props.pageAriaLabel, index2 + 1),
              onClick: (e) => setValue(e, item)
            }
          };
        }
      });
    });
    const controls = vue_cjs_prod.computed(() => {
      const prevDisabled = !!props.disabled || page.value <= start.value;
      const nextDisabled = !!props.disabled || page.value >= start.value + length.value - 1;
      return {
        first: props.showFirstLastPage ? {
          icon: isRtl.value ? props.lastIcon : props.firstIcon,
          onClick: (e) => setValue(e, start.value, "first"),
          disabled: prevDisabled,
          ariaLabel: t(props.firstAriaLabel),
          ariaDisabled: prevDisabled
        } : void 0,
        prev: {
          icon: isRtl.value ? props.nextIcon : props.prevIcon,
          onClick: (e) => setValue(e, page.value - 1, "prev"),
          disabled: prevDisabled,
          ariaLabel: t(props.previousAriaLabel),
          ariaDisabled: prevDisabled
        },
        next: {
          icon: isRtl.value ? props.prevIcon : props.nextIcon,
          onClick: (e) => setValue(e, page.value + 1, "next"),
          disabled: nextDisabled,
          ariaLabel: t(props.nextAriaLabel),
          ariaDisabled: nextDisabled
        },
        last: props.showFirstLastPage ? {
          icon: isRtl.value ? props.firstIcon : props.lastIcon,
          onClick: (e) => setValue(e, start.value + length.value - 1, "last"),
          disabled: nextDisabled,
          ariaLabel: t(props.lastAriaLabel),
          ariaDisabled: nextDisabled
        } : void 0
      };
    });
    function updateFocus() {
      var _refs$value$currentIn;
      const currentIndex = page.value - start.value;
      (_refs$value$currentIn = refs.value[currentIndex]) == null ? void 0 : _refs$value$currentIn.$el.focus();
    }
    function onKeydown(e) {
      if (e.key === keyValues.left && !props.disabled && page.value > props.start) {
        page.value = page.value - 1;
        vue_cjs_prod.nextTick(updateFocus);
      } else if (e.key === keyValues.right && !props.disabled && page.value < start.value + length.value - 1) {
        page.value = page.value + 1;
        vue_cjs_prod.nextTick(updateFocus);
      }
    }
    return () => vue_cjs_prod.createVNode(props.tag, {
      "ref": resizeRef,
      "class": ["v-pagination", themeClasses.value],
      "role": "navigation",
      "aria-label": t(props.ariaLabel),
      "onKeydown": onKeydown,
      "data-test": "v-pagination-root"
    }, {
      default: () => [vue_cjs_prod.createVNode("ul", {
        "class": "v-pagination__list"
      }, [props.showFirstLastPage && vue_cjs_prod.createVNode("li", {
        "class": "v-pagination__first",
        "data-test": "v-pagination-first"
      }, [slots.first ? slots.first(controls.value.first) : vue_cjs_prod.createVNode(VBtn, controls.value.first, null)]), vue_cjs_prod.createVNode("li", {
        "class": "v-pagination__prev",
        "data-test": "v-pagination-prev"
      }, [slots.prev ? slots.prev(controls.value.prev) : vue_cjs_prod.createVNode(VBtn, controls.value.prev, null)]), items.value.map((item, index2) => vue_cjs_prod.createVNode("li", {
        "key": `${index2}_${item.page}`,
        "class": ["v-pagination__item", {
          "v-pagination__item--is-active": item.isActive
        }],
        "data-test": "v-pagination-item"
      }, [slots.item ? slots.item(item) : vue_cjs_prod.createVNode(VBtn, item.props, {
        default: () => [item.page]
      })])), vue_cjs_prod.createVNode("li", {
        "class": "v-pagination__next",
        "data-test": "v-pagination-next"
      }, [slots.next ? slots.next(controls.value.next) : vue_cjs_prod.createVNode(VBtn, controls.value.next, null)]), props.showFirstLastPage && vue_cjs_prod.createVNode("li", {
        "class": "v-pagination__last",
        "data-test": "v-pagination-last"
      }, [slots.last ? slots.last(controls.value.last) : vue_cjs_prod.createVNode(VBtn, controls.value.last, null)])])]
    });
  }
});
function floor(val) {
  return Math.floor(Math.abs(val)) * Math.sign(val);
}
const VParallax = defineComponent({
  name: "VParallax",
  props: {
    scale: {
      type: [Number, String],
      default: 1.3
    }
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const root = vue_cjs_prod.ref();
    const {
      intersectionRef,
      isIntersecting
    } = useIntersectionObserver();
    vue_cjs_prod.watchEffect(() => {
      var _root$value;
      intersectionRef.value = (_root$value = root.value) == null ? void 0 : _root$value.$el;
    });
    let scrollParent;
    vue_cjs_prod.watch(isIntersecting, (val) => {
      if (val) {
        scrollParent = getScrollParent(intersectionRef.value);
        scrollParent = scrollParent === document.scrollingElement ? document : scrollParent;
        scrollParent.addEventListener("scroll", onScroll, {
          passive: true
        });
        onScroll();
      } else {
        scrollParent.removeEventListener("scroll", onScroll);
      }
    });
    vue_cjs_prod.onBeforeUnmount(() => {
      var _scrollParent;
      (_scrollParent = scrollParent) == null ? void 0 : _scrollParent.removeEventListener("scroll", onScroll);
    });
    let frame = -1;
    function onScroll() {
      if (!isIntersecting.value)
        return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        var _root$value2, _scrollParent$clientH, _scrollParent$scrollT;
        const el = ((_root$value2 = root.value) == null ? void 0 : _root$value2.$el).querySelector(".v-img__img");
        if (!el)
          return;
        const rect = intersectionRef.value.getBoundingClientRect();
        const scrollHeight = (_scrollParent$clientH = scrollParent.clientHeight) != null ? _scrollParent$clientH : window.innerHeight;
        const scrollPos = (_scrollParent$scrollT = scrollParent.scrollTop) != null ? _scrollParent$scrollT : window.scrollY;
        const top = rect.top + scrollPos;
        const progress = (scrollPos + scrollHeight - top) / (rect.height + scrollHeight);
        const translate = floor((rect.height * +props.scale - rect.height) * (-progress + 0.5));
        el.style.setProperty("transform", `translateY(${translate}px) scale(${props.scale})`);
      });
    }
    return () => vue_cjs_prod.createVNode(VImg, {
      "class": ["v-parallax", {
        "v-parallax--active": isIntersecting.value
      }],
      "ref": root,
      "cover": true,
      "onLoadstart": onScroll,
      "onLoad": onScroll
    }, slots);
  }
});
const VProgressCircular = defineComponent({
  name: "VProgressCircular",
  props: __spreadValues(__spreadValues(__spreadValues({
    bgColor: String,
    color: String,
    indeterminate: [Boolean, String],
    modelValue: {
      type: [Number, String],
      default: 0
    },
    rotate: {
      type: [Number, String],
      default: 0
    },
    width: {
      type: [Number, String],
      default: 4
    }
  }, makeSizeProps()), makeTagProps({
    tag: "div"
  })), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const MAGIC_RADIUS_CONSTANT = 20;
    const CIRCUMFERENCE = 2 * Math.PI * MAGIC_RADIUS_CONSTANT;
    const root = vue_cjs_prod.ref();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props);
    const {
      textColorClasses,
      textColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "color"));
    const {
      textColorClasses: underlayColorClasses,
      textColorStyles: underlayColorStyles
    } = useTextColor(vue_cjs_prod.toRef(props, "bgColor"));
    const {
      intersectionRef,
      isIntersecting
    } = useIntersectionObserver();
    const {
      resizeRef,
      contentRect
    } = useResizeObserver();
    const normalizedValue = vue_cjs_prod.computed(() => Math.max(0, Math.min(100, parseFloat(props.modelValue))));
    const width = vue_cjs_prod.computed(() => Number(props.width));
    const size = vue_cjs_prod.computed(() => {
      return sizeStyles.value ? Number(props.size) : contentRect.value ? contentRect.value.width : Math.max(width.value, 32);
    });
    const diameter = vue_cjs_prod.computed(() => MAGIC_RADIUS_CONSTANT / (1 - width.value / size.value) * 2);
    const strokeWidth = vue_cjs_prod.computed(() => width.value / size.value * diameter.value);
    const strokeDashOffset = vue_cjs_prod.computed(() => convertToUnit((100 - normalizedValue.value) / 100 * CIRCUMFERENCE));
    vue_cjs_prod.watchEffect(() => {
      intersectionRef.value = root.value;
      resizeRef.value = root.value;
    });
    return () => vue_cjs_prod.createVNode(props.tag, {
      "ref": root,
      "class": ["v-progress-circular", {
        "v-progress-circular--indeterminate": !!props.indeterminate,
        "v-progress-circular--visible": isIntersecting.value,
        "v-progress-circular--disable-shrink": props.indeterminate === "disable-shrink"
      }, themeClasses.value, sizeClasses.value, textColorClasses.value],
      "style": [sizeStyles.value, textColorStyles.value],
      "role": "progressbar",
      "aria-valuemin": "0",
      "aria-valuemax": "100",
      "aria-valuenow": props.indeterminate ? void 0 : normalizedValue.value
    }, {
      default: () => [vue_cjs_prod.createVNode("svg", {
        "style": {
          transform: `rotate(calc(-90deg + ${Number(props.rotate)}deg))`
        },
        "xmlns": "http://www.w3.org/2000/svg",
        "viewBox": `0 0 ${diameter.value} ${diameter.value}`
      }, [vue_cjs_prod.createVNode("circle", {
        "class": ["v-progress-circular__underlay", underlayColorClasses.value],
        "style": underlayColorStyles.value,
        "fill": "transparent",
        "cx": "50%",
        "cy": "50%",
        "r": MAGIC_RADIUS_CONSTANT,
        "stroke-width": strokeWidth.value,
        "stroke-dasharray": CIRCUMFERENCE,
        "stroke-dashoffset": 0
      }, null), vue_cjs_prod.createVNode("circle", {
        "class": "v-progress-circular__overlay",
        "fill": "transparent",
        "cx": "50%",
        "cy": "50%",
        "r": MAGIC_RADIUS_CONSTANT,
        "stroke-width": strokeWidth.value,
        "stroke-dasharray": CIRCUMFERENCE,
        "stroke-dashoffset": strokeDashOffset.value
      }, null)]), slots.default && vue_cjs_prod.createVNode("div", {
        "class": "v-progress-circular__content"
      }, [slots.default({
        value: normalizedValue.value
      })])]
    });
  }
});
const VRadio = defineComponent({
  name: "VRadio",
  props: {
    falseIcon: {
      type: IconValue,
      default: "$radioOff"
    },
    trueIcon: {
      type: IconValue,
      default: "$radioOn"
    }
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    useRender(() => vue_cjs_prod.createVNode(VSelectionControl, {
      "class": "v-radio",
      "trueIcon": props.trueIcon,
      "falseIcon": props.falseIcon,
      "type": "radio"
    }, slots));
    return {};
  }
});
const VRadioGroup = defineComponent({
  name: "VRadioGroup",
  inheritAttrs: false,
  props: __spreadProps(__spreadValues(__spreadValues({
    height: {
      type: [Number, String],
      default: "auto"
    }
  }, makeVInputProps()), makeSelectionControlProps()), {
    trueIcon: {
      type: IconValue,
      default: "$radioOn"
    },
    falseIcon: {
      type: IconValue,
      default: "$radioOff"
    },
    type: {
      type: String,
      default: "radio"
    }
  }),
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `radio-group-${uid}`);
    useRender(() => {
      const [inputAttrs, controlAttrs] = filterInputAttrs(attrs);
      const [inputProps, _1] = filterInputProps(props);
      const [controlProps, _2] = filterControlProps(props);
      const label = slots.label ? slots.label({
        label: props.label,
        props: {
          for: id.value
        }
      }) : props.label;
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "class": "v-radio-group"
      }, inputAttrs, inputProps), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            isDisabled,
            isReadonly
          } = _ref2;
          return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [label && vue_cjs_prod.createVNode(VLabel, {
            "for": id.value
          }, {
            default: () => [label]
          }), vue_cjs_prod.createVNode(VSelectionControlGroup, vue_cjs_prod.mergeProps(controlProps, {
            "id": id.value,
            "trueIcon": props.trueIcon,
            "falseIcon": props.falseIcon,
            "type": props.type,
            "disabled": isDisabled.value,
            "readonly": isReadonly.value
          }, controlAttrs), slots)]);
        }
      }));
    });
    return {};
  }
});
const VRangeSlider = defineComponent({
  name: "VRangeSlider",
  props: __spreadProps(__spreadValues(__spreadValues(__spreadValues({}, makeFocusProps()), makeVInputProps()), makeSliderProps()), {
    strict: Boolean,
    modelValue: {
      type: Array,
      default: () => [0, 0]
    }
  }),
  emits: {
    "update:focused": (value) => true,
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const startThumbRef = vue_cjs_prod.ref();
    const stopThumbRef = vue_cjs_prod.ref();
    const inputRef = vue_cjs_prod.ref();
    function getActiveThumb(e) {
      if (!startThumbRef.value || !stopThumbRef.value)
        return;
      const startOffset = getOffset(e, startThumbRef.value.$el, props.direction);
      const stopOffset = getOffset(e, stopThumbRef.value.$el, props.direction);
      const a = Math.abs(startOffset);
      const b = Math.abs(stopOffset);
      return a < b || a === b && startOffset < 0 ? startThumbRef.value.$el : stopThumbRef.value.$el;
    }
    const {
      min,
      max,
      mousePressed,
      roundValue,
      onSliderMousedown,
      onSliderTouchstart,
      trackContainerRef,
      position,
      hasLabels,
      activeThumbRef
    } = useSlider({
      props,
      handleSliderMouseUp: (newValue) => {
        var _startThumbRef$value;
        model.value = activeThumbRef.value === ((_startThumbRef$value = startThumbRef.value) == null ? void 0 : _startThumbRef$value.$el) ? [newValue, model.value[1]] : [model.value[0], newValue];
      },
      handleMouseMove: (newValue) => {
        var _startThumbRef$value3;
        const [start, stop] = model.value;
        if (!props.strict && start === stop && start !== min.value) {
          var _stopThumbRef$value, _startThumbRef$value2, _activeThumbRef$value;
          activeThumbRef.value = newValue > start ? (_stopThumbRef$value = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value.$el : (_startThumbRef$value2 = startThumbRef.value) == null ? void 0 : _startThumbRef$value2.$el;
          (_activeThumbRef$value = activeThumbRef.value) == null ? void 0 : _activeThumbRef$value.focus();
        }
        if (activeThumbRef.value === ((_startThumbRef$value3 = startThumbRef.value) == null ? void 0 : _startThumbRef$value3.$el)) {
          model.value = [Math.min(newValue, stop), stop];
        } else {
          model.value = [start, Math.max(start, newValue)];
        }
      },
      getActiveThumb
    });
    const model = useProxiedModel(props, "modelValue", void 0, (arr) => {
      if (!arr || !arr.length)
        return [0, 0];
      return arr.map((value) => roundValue(value));
    });
    const {
      isFocused,
      focus,
      blur
    } = useFocus(props);
    const trackStart = vue_cjs_prod.computed(() => position(model.value[0]));
    const trackStop = vue_cjs_prod.computed(() => position(model.value[1]));
    return () => {
      const [inputProps, _] = filterInputProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "class": ["v-slider", "v-range-slider", {
          "v-slider--has-labels": !!slots["tick-label"] || hasLabels.value,
          "v-slider--focused": isFocused.value,
          "v-slider--pressed": mousePressed.value,
          "v-slider--disabled": props.disabled
        }],
        "ref": inputRef
      }, inputProps, {
        "focused": isFocused.value
      }), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          var _startThumbRef$value4, _stopThumbRef$value4;
          let {
            id
          } = _ref2;
          return vue_cjs_prod.createVNode("div", {
            "class": "v-slider__container",
            "onMousedown": onSliderMousedown,
            "onTouchstartPassive": onSliderTouchstart
          }, [vue_cjs_prod.createVNode("input", {
            "id": `${id.value}_start`,
            "name": props.name || id.value,
            "disabled": props.disabled,
            "readonly": props.readonly,
            "tabindex": "-1",
            "value": model.value[0]
          }, null), vue_cjs_prod.createVNode("input", {
            "id": `${id.value}_stop`,
            "name": props.name || id.value,
            "disabled": props.disabled,
            "readonly": props.readonly,
            "tabindex": "-1",
            "value": model.value[1]
          }, null), vue_cjs_prod.createVNode(VSliderTrack, {
            "ref": trackContainerRef,
            "start": trackStart.value,
            "stop": trackStop.value
          }, {
            "tick-label": slots["tick-label"]
          }), vue_cjs_prod.createVNode(VSliderThumb, {
            "ref": startThumbRef,
            "focused": isFocused && activeThumbRef.value === ((_startThumbRef$value4 = startThumbRef.value) == null ? void 0 : _startThumbRef$value4.$el),
            "modelValue": model.value[0],
            "onUpdate:modelValue": (v) => model.value = [v, model.value[1]],
            "onFocus": (e) => {
              var _startThumbRef$value5, _stopThumbRef$value2;
              focus();
              activeThumbRef.value = (_startThumbRef$value5 = startThumbRef.value) == null ? void 0 : _startThumbRef$value5.$el;
              if (model.value[0] === model.value[1] && model.value[1] === min.value && e.relatedTarget !== ((_stopThumbRef$value2 = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value2.$el)) {
                var _startThumbRef$value6, _stopThumbRef$value3;
                (_startThumbRef$value6 = startThumbRef.value) == null ? void 0 : _startThumbRef$value6.$el.blur();
                (_stopThumbRef$value3 = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value3.$el.focus();
              }
            },
            "onBlur": () => {
              blur();
              activeThumbRef.value = void 0;
            },
            "min": min.value,
            "max": model.value[1],
            "position": trackStart.value
          }, {
            "thumb-label": slots["thumb-label"]
          }), vue_cjs_prod.createVNode(VSliderThumb, {
            "ref": stopThumbRef,
            "focused": isFocused && activeThumbRef.value === ((_stopThumbRef$value4 = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value4.$el),
            "modelValue": model.value[1],
            "onUpdate:modelValue": (v) => model.value = [model.value[0], v],
            "onFocus": (e) => {
              var _stopThumbRef$value5, _startThumbRef$value7;
              focus();
              activeThumbRef.value = (_stopThumbRef$value5 = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value5.$el;
              if (model.value[0] === model.value[1] && model.value[0] === max.value && e.relatedTarget !== ((_startThumbRef$value7 = startThumbRef.value) == null ? void 0 : _startThumbRef$value7.$el)) {
                var _stopThumbRef$value6, _startThumbRef$value8;
                (_stopThumbRef$value6 = stopThumbRef.value) == null ? void 0 : _stopThumbRef$value6.$el.blur();
                (_startThumbRef$value8 = startThumbRef.value) == null ? void 0 : _startThumbRef$value8.$el.focus();
              }
            },
            "onBlur": () => {
              blur();
              activeThumbRef.value = void 0;
            },
            "min": model.value[0],
            "max": max.value,
            "position": trackStop.value
          }, {
            "thumb-label": slots["thumb-label"]
          })]);
        }
      }));
    };
  }
});
const VRating = genericComponent()({
  name: "VRating",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues({
    name: String,
    itemAriaLabel: {
      type: String,
      default: "$vuetify.rating.ariaLabel.item"
    },
    activeColor: String,
    color: String,
    clearable: Boolean,
    disabled: Boolean,
    emptyIcon: {
      type: IconValue,
      default: "$ratingEmpty"
    },
    fullIcon: {
      type: IconValue,
      default: "$ratingFull"
    },
    halfIncrements: Boolean,
    hover: Boolean,
    length: {
      type: [Number, String],
      default: 5
    },
    readonly: Boolean,
    modelValue: {
      type: Number,
      default: 0
    },
    itemLabels: Array,
    itemLabelPosition: {
      type: String,
      default: "top",
      validator: (v) => ["top", "bottom"].includes(v)
    },
    ripple: Boolean
  }, makeDensityProps()), makeSizeProps()), makeTagProps()), makeThemeProps()),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      t
    } = useLocale();
    const {
      themeClasses
    } = provideTheme(props);
    const rating = useProxiedModel(props, "modelValue");
    const range2 = vue_cjs_prod.computed(() => createRange(Number(props.length), 1));
    const increments = vue_cjs_prod.computed(() => range2.value.flatMap((v) => props.halfIncrements ? [v - 0.5, v] : [v]));
    const hoverIndex = vue_cjs_prod.ref(-1);
    const focusIndex = vue_cjs_prod.ref(-1);
    const firstRef = vue_cjs_prod.ref();
    let isClicking = false;
    const itemState = vue_cjs_prod.computed(() => increments.value.map((value) => {
      var _props$activeColor;
      const isHovering = props.hover && hoverIndex.value > -1;
      const isFilled = rating.value >= value;
      const isHovered = hoverIndex.value >= value;
      const isFullIcon = isHovering ? isHovered : isFilled;
      const icon = isFullIcon ? props.fullIcon : props.emptyIcon;
      const activeColor = (_props$activeColor = props.activeColor) != null ? _props$activeColor : props.color;
      const color = isFilled || isHovered ? activeColor : props.color;
      return {
        isFilled,
        isHovered,
        icon,
        color
      };
    }));
    const eventState = vue_cjs_prod.computed(() => [0, ...increments.value].map((value) => {
      function onMouseenter() {
        hoverIndex.value = value;
      }
      function onMouseleave() {
        hoverIndex.value = -1;
      }
      function onFocus() {
        if (value === 0 && rating.value === 0) {
          var _firstRef$value;
          (_firstRef$value = firstRef.value) == null ? void 0 : _firstRef$value.focus();
        } else {
          focusIndex.value = value;
        }
      }
      function onBlur() {
        if (!isClicking)
          focusIndex.value = -1;
      }
      function onClick() {
        if (props.disabled || props.readonly)
          return;
        rating.value = rating.value === value && props.clearable ? 0 : value;
      }
      return {
        onMouseenter: props.hover ? onMouseenter : void 0,
        onMouseleave: props.hover ? onMouseleave : void 0,
        onFocus,
        onBlur,
        onClick
      };
    }));
    function onMousedown() {
      isClicking = true;
    }
    function onMouseup() {
      isClicking = false;
    }
    const name = vue_cjs_prod.computed(() => {
      var _props$name;
      return (_props$name = props.name) != null ? _props$name : `v-rating-${getUid()}`;
    });
    function VRatingItem(_ref2) {
      var _itemState$value$inde, _itemState$value$inde2;
      let {
        value,
        index: index2,
        showStar = true
      } = _ref2;
      const {
        onMouseenter,
        onMouseleave,
        onFocus,
        onBlur,
        onClick
      } = eventState.value[index2 + 1];
      const id = `${name.value}-${String(value).replace(".", "-")}`;
      const btnProps = {
        color: (_itemState$value$inde = itemState.value[index2]) == null ? void 0 : _itemState$value$inde.color,
        density: props.density,
        disabled: props.disabled,
        icon: (_itemState$value$inde2 = itemState.value[index2]) == null ? void 0 : _itemState$value$inde2.icon,
        ripple: props.ripple,
        size: props.size,
        tag: "span",
        variant: "plain"
      };
      return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("label", {
        "for": id,
        "class": {
          "v-rating__item--half": props.halfIncrements && value % 1 > 0,
          "v-rating__item--full": props.halfIncrements && value % 1 === 0
        },
        "onMousedown": onMousedown,
        "onMouseup": onMouseup,
        "onMouseenter": onMouseenter,
        "onMouseleave": onMouseleave
      }, [vue_cjs_prod.createVNode("span", {
        "class": "v-rating__hidden"
      }, [t(props.itemAriaLabel, value, props.length)]), !showStar ? void 0 : slots.item ? slots.item(__spreadProps(__spreadValues({}, itemState.value[index2]), {
        props: btnProps,
        value,
        index: index2
      })) : vue_cjs_prod.createVNode(VBtn, btnProps, null)]), vue_cjs_prod.createVNode("input", {
        "class": "v-rating__hidden",
        "name": name.value,
        "id": id,
        "type": "radio",
        "value": value,
        "checked": rating.value === value,
        "onClick": onClick,
        "onFocus": onFocus,
        "onBlur": onBlur,
        "ref": index2 === 0 ? firstRef : void 0,
        "readonly": props.readonly,
        "disabled": props.disabled
      }, null)]);
    }
    function createLabel(labelProps) {
      if (slots["item-label"])
        return slots["item-label"](labelProps);
      if (labelProps.label)
        return vue_cjs_prod.createVNode("span", null, [labelProps.label]);
      return vue_cjs_prod.createVNode("span", null, [vue_cjs_prod.createTextVNode("\xA0")]);
    }
    return () => {
      var _props$itemLabels;
      const hasLabels = !!((_props$itemLabels = props.itemLabels) != null && _props$itemLabels.length) || slots["item-label"];
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-rating", {
          "v-rating--hover": props.hover,
          "v-rating--readonly": props.readonly
        }, themeClasses.value]
      }, {
        default: () => [vue_cjs_prod.createVNode(VRatingItem, {
          "value": 0,
          "index": -1,
          "showStar": false
        }, null), range2.value.map((value, i) => {
          var _props$itemLabels2, _props$itemLabels3;
          return vue_cjs_prod.createVNode("div", {
            "class": "v-rating__wrapper"
          }, [hasLabels && props.itemLabelPosition === "top" ? createLabel({
            value,
            index: i,
            label: (_props$itemLabels2 = props.itemLabels) == null ? void 0 : _props$itemLabels2[i]
          }) : void 0, vue_cjs_prod.createVNode("div", {
            "class": ["v-rating__item", {
              "v-rating__item--focused": Math.ceil(focusIndex.value) === value
            }]
          }, [props.halfIncrements ? vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode(VRatingItem, {
            "value": value - 0.5,
            "index": i * 2
          }, null), vue_cjs_prod.createVNode(VRatingItem, {
            "value": value,
            "index": i * 2 + 1
          }, null)]) : vue_cjs_prod.createVNode(VRatingItem, {
            "value": value,
            "index": i
          }, null)]), hasLabels && props.itemLabelPosition === "bottom" ? createLabel({
            value,
            index: i,
            label: (_props$itemLabels3 = props.itemLabels) == null ? void 0 : _props$itemLabels3[i]
          }) : void 0]);
        })]
      });
    };
  }
});
function bias(val) {
  const c = 0.501;
  const x = Math.abs(val);
  return Math.sign(val) * (x / ((1 / c - 2) * (1 - x) + 1));
}
function calculateUpdatedOffset(_ref) {
  let {
    selectedElement,
    containerSize,
    contentSize,
    isRtl,
    currentScrollOffset,
    isHorizontal
  } = _ref;
  const clientSize = isHorizontal ? selectedElement.clientWidth : selectedElement.clientHeight;
  const offsetStart = isHorizontal ? selectedElement.offsetLeft : selectedElement.offsetTop;
  const adjustedOffsetStart = isRtl ? contentSize - offsetStart - clientSize : offsetStart;
  if (isRtl) {
    currentScrollOffset = -currentScrollOffset;
  }
  const totalSize = containerSize + currentScrollOffset;
  const itemOffset = clientSize + adjustedOffsetStart;
  const additionalOffset = clientSize * 0.4;
  if (adjustedOffsetStart <= currentScrollOffset) {
    currentScrollOffset = Math.max(adjustedOffsetStart - additionalOffset, 0);
  } else if (totalSize <= itemOffset) {
    currentScrollOffset = Math.min(currentScrollOffset - (totalSize - itemOffset - additionalOffset), contentSize - containerSize);
  }
  return isRtl ? -currentScrollOffset : currentScrollOffset;
}
function calculateCenteredOffset(_ref2) {
  let {
    selectedElement,
    containerSize,
    contentSize,
    isRtl,
    isHorizontal
  } = _ref2;
  const clientSize = isHorizontal ? selectedElement.clientWidth : selectedElement.clientHeight;
  const offsetStart = isHorizontal ? selectedElement.offsetLeft : selectedElement.offsetTop;
  if (isRtl) {
    const offsetCentered = contentSize - offsetStart - clientSize / 2 - containerSize / 2;
    return -Math.min(contentSize - containerSize, Math.max(0, offsetCentered));
  } else {
    const offsetCentered = offsetStart + clientSize / 2 - containerSize / 2;
    return Math.min(contentSize - containerSize, Math.max(0, offsetCentered));
  }
}
const VSlideGroupSymbol = Symbol.for("vuetify:v-slide-group");
const VSlideGroup = defineComponent({
  name: "VSlideGroup",
  props: __spreadValues(__spreadValues({
    centerActive: Boolean,
    direction: {
      type: String,
      default: "horizontal"
    },
    symbol: {
      type: null,
      default: VSlideGroupSymbol
    },
    nextIcon: {
      type: IconValue,
      default: "$next"
    },
    prevIcon: {
      type: IconValue,
      default: "$prev"
    },
    showArrows: {
      type: [Boolean, String],
      validator: (v) => typeof v === "boolean" || ["always", "desktop", "mobile"].includes(v)
    }
  }, makeTagProps()), makeGroupProps({
    selectedClass: "v-slide-group-item--active"
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      isRtl
    } = useRtl();
    const {
      mobile
    } = useDisplay();
    const group = useGroup(props, props.symbol);
    const isOverflowing = vue_cjs_prod.ref(false);
    const scrollOffset = vue_cjs_prod.ref(0);
    const containerSize = vue_cjs_prod.ref(0);
    const contentSize = vue_cjs_prod.ref(0);
    const isHorizontal = vue_cjs_prod.computed(() => props.direction === "horizontal");
    const {
      resizeRef: containerRef,
      contentRect: containerRect
    } = useResizeObserver();
    const {
      resizeRef: contentRef,
      contentRect
    } = useResizeObserver();
    vue_cjs_prod.watchEffect(() => {
      if (!containerRect.value || !contentRect.value)
        return;
      const sizeProperty = isHorizontal.value ? "width" : "height";
      containerSize.value = containerRect.value[sizeProperty];
      contentSize.value = contentRect.value[sizeProperty];
      isOverflowing.value = containerSize.value + 1 < contentSize.value;
    });
    const firstSelectedIndex = vue_cjs_prod.computed(() => {
      if (!group.selected.value.length)
        return -1;
      return group.items.value.findIndex((item) => item.id === group.selected.value[0]);
    });
    const lastSelectedIndex = vue_cjs_prod.computed(() => {
      if (!group.selected.value.length)
        return -1;
      return group.items.value.findIndex((item) => item.id === group.selected.value[group.selected.value.length - 1]);
    });
    vue_cjs_prod.watch(group.selected, () => {
      if (firstSelectedIndex.value < 0 || !contentRef.value)
        return;
      const selectedElement = contentRef.value.children[lastSelectedIndex.value];
      if (firstSelectedIndex.value === 0 || !isOverflowing.value) {
        scrollOffset.value = 0;
      } else if (props.centerActive) {
        scrollOffset.value = calculateCenteredOffset({
          selectedElement,
          containerSize: containerSize.value,
          contentSize: contentSize.value,
          isRtl: isRtl.value,
          isHorizontal: isHorizontal.value
        });
      } else if (isOverflowing.value) {
        scrollOffset.value = calculateUpdatedOffset({
          selectedElement,
          containerSize: containerSize.value,
          contentSize: contentSize.value,
          isRtl: isRtl.value,
          currentScrollOffset: scrollOffset.value,
          isHorizontal: isHorizontal.value
        });
      }
    });
    let firstOverflow = true;
    vue_cjs_prod.watch(isOverflowing, () => {
      if (!firstOverflow || !contentRef.value || firstSelectedIndex.value < 0)
        return;
      firstOverflow = false;
      const selectedElement = contentRef.value.children[firstSelectedIndex.value];
      scrollOffset.value = calculateCenteredOffset({
        selectedElement,
        containerSize: containerSize.value,
        contentSize: contentSize.value,
        isRtl: isRtl.value,
        isHorizontal: isHorizontal.value
      });
    });
    const disableTransition = vue_cjs_prod.ref(false);
    let startTouch = 0;
    let startOffset = 0;
    function onTouchstart(e) {
      const sizeProperty = isHorizontal.value ? "clientX" : "clientY";
      startOffset = scrollOffset.value;
      startTouch = e.touches[0][sizeProperty];
      disableTransition.value = true;
    }
    function onTouchmove(e) {
      if (!isOverflowing.value)
        return;
      const sizeProperty = isHorizontal.value ? "clientX" : "clientY";
      scrollOffset.value = startOffset + startTouch - e.touches[0][sizeProperty];
    }
    function onTouchend(e) {
      const maxScrollOffset = contentSize.value - containerSize.value;
      if (isRtl.value) {
        if (scrollOffset.value > 0 || !isOverflowing.value) {
          scrollOffset.value = 0;
        } else if (scrollOffset.value <= -maxScrollOffset) {
          scrollOffset.value = -maxScrollOffset;
        }
      } else {
        if (scrollOffset.value < 0 || !isOverflowing.value) {
          scrollOffset.value = 0;
        } else if (scrollOffset.value >= maxScrollOffset) {
          scrollOffset.value = maxScrollOffset;
        }
      }
      disableTransition.value = false;
    }
    function onScroll() {
      containerRef.value && (containerRef.value.scrollLeft = 0);
    }
    const isFocused = vue_cjs_prod.ref(false);
    function onFocusin(e) {
      isFocused.value = true;
      if (!isOverflowing.value || !contentRef.value)
        return;
      for (const el of e.composedPath()) {
        for (const item of contentRef.value.children) {
          if (item === el) {
            scrollOffset.value = calculateUpdatedOffset({
              selectedElement: item,
              containerSize: containerSize.value,
              contentSize: contentSize.value,
              isRtl: isRtl.value,
              currentScrollOffset: scrollOffset.value,
              isHorizontal: isHorizontal.value
            });
            return;
          }
        }
      }
    }
    function onFocusout(e) {
      isFocused.value = false;
    }
    function onFocus(e) {
      var _contentRef$value;
      if (!isFocused.value && !(e.relatedTarget && (_contentRef$value = contentRef.value) != null && _contentRef$value.contains(e.relatedTarget)))
        focus();
    }
    function onKeydown(e) {
      if (!contentRef.value)
        return;
      if (e.key === (isHorizontal.value ? "ArrowRight" : "ArrowDown")) {
        focus("next");
      } else if (e.key === (isHorizontal.value ? "ArrowLeft" : "ArrowUp")) {
        focus("prev");
      } else if (e.key === "Home") {
        focus("first");
      } else if (e.key === "End") {
        focus("last");
      }
    }
    function focus(location2) {
      if (!contentRef.value)
        return;
      if (!location2) {
        var _focusable$;
        contentRef.value.querySelector("[tabindex]");
        const focusable = [...contentRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute("disabled"));
        (_focusable$ = focusable[0]) == null ? void 0 : _focusable$.focus();
      } else if (location2 === "next") {
        var _contentRef$value$que;
        const el = (_contentRef$value$que = contentRef.value.querySelector(":focus")) == null ? void 0 : _contentRef$value$que.nextElementSibling;
        if (el)
          el.focus();
        else
          focus("first");
      } else if (location2 === "prev") {
        var _contentRef$value$que2;
        const el = (_contentRef$value$que2 = contentRef.value.querySelector(":focus")) == null ? void 0 : _contentRef$value$que2.previousElementSibling;
        if (el)
          el.focus();
        else
          focus("last");
      } else if (location2 === "first") {
        var _contentRef$value$fir;
        (_contentRef$value$fir = contentRef.value.firstElementChild) == null ? void 0 : _contentRef$value$fir.focus();
      } else if (location2 === "last") {
        var _contentRef$value$las;
        (_contentRef$value$las = contentRef.value.lastElementChild) == null ? void 0 : _contentRef$value$las.focus();
      }
    }
    function scrollTo(location2) {
      const sign = isRtl.value ? -1 : 1;
      const newAbosluteOffset = sign * scrollOffset.value + (location2 === "prev" ? -1 : 1) * containerSize.value;
      scrollOffset.value = sign * clamp(newAbosluteOffset, 0, contentSize.value - containerSize.value);
    }
    const contentStyles = vue_cjs_prod.computed(() => {
      const scrollAmount = scrollOffset.value <= 0 ? bias(-scrollOffset.value) : scrollOffset.value > contentSize.value - containerSize.value ? -(contentSize.value - containerSize.value) + bias(contentSize.value - containerSize.value - scrollOffset.value) : -scrollOffset.value;
      return {
        transform: `translate${isHorizontal.value ? "X" : "Y"}(${scrollAmount}px)`,
        transition: disableTransition.value ? "none" : "",
        willChange: disableTransition.value ? "transform" : ""
      };
    });
    const slotProps = vue_cjs_prod.computed(() => ({
      next: group.next,
      prev: group.prev,
      select: group.select,
      isSelected: group.isSelected
    }));
    const hasAffixes = vue_cjs_prod.computed(() => {
      switch (props.showArrows) {
        case "always":
          return true;
        case "desktop":
          return !mobile.value;
        case true:
          return isOverflowing.value || Math.abs(scrollOffset.value) > 0;
        case "mobile":
          return mobile.value || isOverflowing.value || Math.abs(scrollOffset.value) > 0;
        default:
          return !mobile.value && (isOverflowing.value || Math.abs(scrollOffset.value) > 0);
      }
    });
    const hasPrev = vue_cjs_prod.computed(() => {
      return hasAffixes.value && scrollOffset.value > 0;
    });
    const hasNext = vue_cjs_prod.computed(() => {
      if (!hasAffixes.value)
        return false;
      return contentSize.value > Math.abs(scrollOffset.value) + containerSize.value;
    });
    useRender(() => {
      var _slots$prev, _slots$prev2, _slots$default, _slots$next, _slots$next2;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-slide-group", {
          "v-slide-group--vertical": !isHorizontal.value,
          "v-slide-group--has-affixes": hasAffixes.value,
          "v-slide-group--is-overflowing": isOverflowing.value
        }],
        "tabindex": isFocused.value || group.selected.value.length ? -1 : 0,
        "onFocus": onFocus
      }, {
        default: () => [hasAffixes.value && vue_cjs_prod.createVNode("div", {
          "class": ["v-slide-group__prev", {
            "v-slide-group__prev--disabled": !hasPrev.value
          }],
          "onClick": () => scrollTo("prev")
        }, [(_slots$prev = (_slots$prev2 = slots.prev) == null ? void 0 : _slots$prev2.call(slots, slotProps.value)) != null ? _slots$prev : vue_cjs_prod.createVNode(VFadeTransition, null, {
          default: () => [vue_cjs_prod.createVNode(VIcon, {
            "icon": props.prevIcon
          }, null)]
        })]), vue_cjs_prod.createVNode("div", {
          "ref": containerRef,
          "class": "v-slide-group__container",
          "onScroll": onScroll
        }, [vue_cjs_prod.createVNode("div", {
          "ref": contentRef,
          "class": "v-slide-group__content",
          "style": contentStyles.value,
          "onTouchstartPassive": onTouchstart,
          "onTouchmovePassive": onTouchmove,
          "onTouchendPassive": onTouchend,
          "onFocusin": onFocusin,
          "onFocusout": onFocusout,
          "onKeydown": onKeydown
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, slotProps.value)])]), hasAffixes.value && vue_cjs_prod.createVNode("div", {
          "class": ["v-slide-group__next", {
            "v-slide-group__next--disabled": !hasNext.value
          }],
          "onClick": () => scrollTo("next")
        }, [(_slots$next = (_slots$next2 = slots.next) == null ? void 0 : _slots$next2.call(slots, slotProps.value)) != null ? _slots$next : vue_cjs_prod.createVNode(VFadeTransition, null, {
          default: () => [vue_cjs_prod.createVNode(VIcon, {
            "icon": props.nextIcon
          }, null)]
        })])]
      });
    });
    return {
      selected: group.selected,
      scrollTo,
      scrollOffset,
      focus
    };
  }
});
const VSlideGroupItem = defineComponent({
  name: "VSlideGroupItem",
  props: __spreadValues({}, makeGroupItemProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const slideGroupItem = useGroupItem(props, VSlideGroupSymbol);
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, {
        isSelected: slideGroupItem.isSelected.value,
        select: slideGroupItem.select,
        toggle: slideGroupItem.toggle,
        selectedClass: slideGroupItem.selectedClass.value
      });
    };
  }
});
const VSnackbar = defineComponent({
  name: "VSnackbar",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    app: Boolean,
    contentClass: {
      type: String,
      default: ""
    },
    multiLine: Boolean,
    timeout: {
      type: [Number, String],
      default: 5e3
    },
    vertical: Boolean,
    modelValue: Boolean
  }, makeLocationProps({
    location: "bottom"
  })), makePositionProps()), makeRoundedProps()), makeVariantProps()), makeTransitionProps({
    transition: "v-snackbar-transition"
  })),
  emits: {
    "update:modelValue": (v) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      locationStyles
    } = useLocation(props);
    const {
      positionClasses
    } = usePosition(props);
    const {
      scopeId
    } = useScopeId();
    const {
      colorClasses,
      colorStyles,
      variantClasses
    } = useVariant(props);
    const {
      roundedClasses
    } = useRounded(props);
    vue_cjs_prod.watch(isActive, startTimeout);
    vue_cjs_prod.watch(() => props.timeout, startTimeout);
    vue_cjs_prod.onMounted(() => {
      if (isActive.value)
        startTimeout();
    });
    let activeTimeout = -1;
    function startTimeout() {
      window.clearTimeout(activeTimeout);
      const timeout = Number(props.timeout);
      if (!isActive.value || timeout === -1)
        return;
      activeTimeout = window.setTimeout(() => {
        isActive.value = false;
      }, timeout);
    }
    function onPointerenter() {
      window.clearTimeout(activeTimeout);
    }
    useRender(() => {
      var _slots$default, _slots$actions;
      return vue_cjs_prod.createVNode(VOverlay, vue_cjs_prod.mergeProps({
        "modelValue": isActive.value,
        "onUpdate:modelValue": ($event) => isActive.value = $event,
        "class": ["v-snackbar", {
          "v-snackbar--active": isActive.value,
          "v-snackbar--multi-line": props.multiLine && !props.vertical,
          "v-snackbar--vertical": props.vertical
        }, positionClasses.value],
        "style": [colorStyles.value],
        "contentProps": {
          style: locationStyles.value
        },
        "persistent": true,
        "noClickAnimation": true,
        "scrim": false,
        "scrollStrategy": "none",
        "transition": props.transition
      }, scopeId), {
        default: () => [vue_cjs_prod.createVNode("div", {
          "class": ["v-snackbar__wrapper", colorClasses.value, roundedClasses.value, variantClasses.value],
          "onPointerenter": onPointerenter,
          "onPointerleave": startTimeout
        }, [genOverlays(false, "v-snackbar"), slots.default && vue_cjs_prod.createVNode("div", {
          "class": ["v-snackbar__content", props.contentClass],
          "role": "status",
          "aria-live": "polite"
        }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]), slots.actions && vue_cjs_prod.createVNode(VDefaultsProvider, {
          "defaults": {
            VBtn: {
              variant: "text",
              ripple: false
            }
          }
        }, {
          default: () => [vue_cjs_prod.createVNode("div", {
            "class": "v-snackbar__actions"
          }, [(_slots$actions = slots.actions) == null ? void 0 : _slots$actions.call(slots)])]
        })])],
        activator: slots.activator
      });
    });
  }
});
const VSwitch = defineComponent({
  name: "VSwitch",
  inheritAttrs: false,
  props: __spreadValues(__spreadValues({
    indeterminate: Boolean,
    inset: Boolean,
    flat: Boolean,
    loading: {
      type: [Boolean, String],
      default: false
    }
  }, makeVInputProps()), makeSelectionControlProps()),
  emits: {
    "update:indeterminate": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const indeterminate = useProxiedModel(props, "indeterminate");
    const {
      loaderClasses
    } = useLoader(props);
    const loaderColor = vue_cjs_prod.computed(() => {
      return typeof props.loading === "string" && props.loading !== "" ? props.loading : props.color;
    });
    function onChange() {
      if (indeterminate.value) {
        indeterminate.value = false;
      }
    }
    useRender(() => {
      const [inputAttrs, controlAttrs] = filterInputAttrs(attrs);
      const [inputProps, _1] = filterInputProps(props);
      const [controlProps, _2] = filterControlProps(props);
      const control = vue_cjs_prod.ref();
      function onClick() {
        var _control$value, _control$value$input;
        (_control$value = control.value) == null ? void 0 : (_control$value$input = _control$value.input) == null ? void 0 : _control$value$input.click();
      }
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "class": ["v-switch", {
          "v-switch--inset": props.inset
        }, {
          "v-switch--indeterminate": indeterminate.value
        }, loaderClasses.value]
      }, inputAttrs, inputProps), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            isDisabled,
            isReadonly,
            isValid
          } = _ref2;
          return vue_cjs_prod.createVNode(VSelectionControl, vue_cjs_prod.mergeProps({
            "ref": control
          }, controlProps, {
            "type": "checkbox",
            "onUpdate:modelValue": onChange,
            "aria-checked": indeterminate.value ? "mixed" : void 0,
            "disabled": isDisabled.value,
            "readonly": isReadonly.value
          }, controlAttrs), __spreadProps(__spreadValues({}, slots), {
            default: () => vue_cjs_prod.createVNode("div", {
              "class": "v-switch__track",
              "onClick": onClick
            }, null),
            input: (_ref3) => {
              let {
                textColorClasses
              } = _ref3;
              return vue_cjs_prod.createVNode("div", {
                "class": ["v-switch__thumb", textColorClasses.value]
              }, [props.loading && vue_cjs_prod.createVNode(LoaderSlot, {
                "name": "v-switch",
                "active": true,
                "color": isValid.value === false ? void 0 : loaderColor.value
              }, {
                default: (slotProps) => slots.loader ? slots.loader(slotProps) : vue_cjs_prod.createVNode(VProgressCircular, {
                  "active": slotProps.isActive,
                  "color": slotProps.color,
                  "indeterminate": true,
                  "size": "16",
                  "width": "2"
                }, null)
              })]);
            }
          }));
        }
      }));
    });
    return {};
  }
});
const VSystemBar = defineComponent({
  name: "VSystemBar",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    color: String,
    height: [Number, String],
    window: Boolean
  }, makeElevationProps()), makeLayoutItemProps()), makeRoundedProps()), makeTagProps()), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "color"));
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const height = vue_cjs_prod.computed(() => {
      var _props$height;
      return ((_props$height = props.height) != null ? _props$height : props.window) ? 32 : 24;
    });
    const {
      layoutItemStyles
    } = useLayoutItem({
      id: props.name,
      order: vue_cjs_prod.computed(() => parseInt(props.order, 10)),
      position: vue_cjs_prod.ref("top"),
      layoutSize: height,
      elementSize: height,
      active: vue_cjs_prod.computed(() => true),
      absolute: vue_cjs_prod.toRef(props, "absolute")
    });
    provideDefaults({
      VBtn: {
        variant: "text",
        density: "compact"
      }
    }, {
      scoped: true
    });
    return () => vue_cjs_prod.createVNode(props.tag, {
      "class": ["v-system-bar", {
        "v-system-bar--window": props.window
      }, themeClasses.value, backgroundColorClasses.value, elevationClasses.value, roundedClasses.value],
      "style": [backgroundColorStyles.value, layoutItemStyles.value]
    }, slots);
  }
});
const VTabsSymbol = Symbol.for("vuetify:v-tabs");
const VTab = defineComponent({
  name: "VTab",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues({
    fixed: Boolean,
    icon: [Boolean, String, Function, Object],
    prependIcon: IconValue,
    appendIcon: IconValue,
    stacked: Boolean,
    title: String,
    ripple: {
      type: Boolean,
      default: true
    },
    color: String,
    sliderColor: String,
    hideSlider: Boolean,
    direction: {
      type: String,
      default: "horizontal"
    }
  }, makeTagProps()), makeRouterProps()), makeGroupItemProps({
    selectedClass: "v-tab--selected"
  })), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots,
      attrs
    } = _ref;
    const {
      textColorClasses: sliderColorClasses,
      textColorStyles: sliderColorStyles
    } = useTextColor(props, "sliderColor");
    const isHorizontal = vue_cjs_prod.computed(() => props.direction === "horizontal");
    const isSelected = vue_cjs_prod.ref(false);
    const rootEl = vue_cjs_prod.ref();
    const sliderEl = vue_cjs_prod.ref();
    function updateSlider(_ref2) {
      let {
        value
      } = _ref2;
      isSelected.value = value;
      if (value) {
        var _rootEl$value, _rootEl$value$$el$par;
        const prevEl = (_rootEl$value = rootEl.value) == null ? void 0 : (_rootEl$value$$el$par = _rootEl$value.$el.parentElement) == null ? void 0 : _rootEl$value$$el$par.querySelector(".v-tab--selected .v-tab__slider");
        const nextEl = sliderEl.value;
        if (!prevEl || !nextEl)
          return;
        const color = getComputedStyle(prevEl).color;
        const prevBox = prevEl.getBoundingClientRect();
        const nextBox = nextEl.getBoundingClientRect();
        const xy = isHorizontal.value ? "x" : "y";
        const XY = isHorizontal.value ? "X" : "Y";
        const rightBottom = isHorizontal.value ? "right" : "bottom";
        const widthHeight = isHorizontal.value ? "width" : "height";
        const prevPos = prevBox[xy];
        const nextPos = nextBox[xy];
        const delta2 = prevPos > nextPos ? prevBox[rightBottom] - nextBox[rightBottom] : prevBox[xy] - nextBox[xy];
        const origin = Math.sign(delta2) > 0 ? isHorizontal.value ? "right" : "bottom" : Math.sign(delta2) < 0 ? isHorizontal.value ? "left" : "top" : "center";
        const size = Math.abs(delta2) + (Math.sign(delta2) < 0 ? prevBox[widthHeight] : nextBox[widthHeight]);
        const scale = size / Math.max(prevBox[widthHeight], nextBox[widthHeight]);
        const initialScale = prevBox[widthHeight] / nextBox[widthHeight];
        const sigma = 1.5;
        nextEl.animate({
          backgroundColor: [color, ""],
          transform: [`translate${XY}(${delta2}px) scale${XY}(${initialScale})`, `translate${XY}(${delta2 / sigma}px) scale${XY}(${(scale - 1) / sigma + 1})`, ""],
          transformOrigin: Array(3).fill(origin)
        }, {
          duration: 225,
          easing: standardEasing
        });
      }
    }
    useRender(() => {
      const [btnProps] = pick(props, ["href", "to", "replace", "icon", "stacked", "prependIcon", "appendIcon", "ripple", "theme", "disabled", "selectedClass", "value", "color"]);
      return vue_cjs_prod.createVNode(VBtn, vue_cjs_prod.mergeProps({
        "_as": "VTab",
        "symbol": VTabsSymbol,
        "ref": rootEl,
        "class": ["v-tab"],
        "tabindex": isSelected.value ? 0 : -1,
        "role": "tab",
        "aria-selected": String(isSelected.value),
        "block": props.fixed,
        "maxWidth": props.fixed ? 300 : void 0,
        "variant": "text",
        "rounded": 0
      }, btnProps, attrs, {
        "onGroup:selected": updateSlider
      }), {
        default: () => [slots.default ? slots.default() : props.title, !props.hideSlider && vue_cjs_prod.createVNode("div", {
          "ref": sliderEl,
          "class": ["v-tab__slider", sliderColorClasses.value],
          "style": sliderColorStyles.value
        }, null)]
      });
    });
    return {};
  }
});
function parseItems(items) {
  if (!items)
    return [];
  return items.map((item) => {
    if (typeof item === "string")
      return {
        title: item,
        value: item
      };
    return item;
  });
}
const VTabs = defineComponent({
  name: "VTabs",
  props: __spreadValues(__spreadValues({
    alignWithTitle: Boolean,
    color: String,
    direction: {
      type: String,
      default: "horizontal"
    },
    fixedTabs: Boolean,
    items: {
      type: Array,
      default: () => []
    },
    stacked: Boolean,
    backgroundColor: String,
    centered: Boolean,
    grow: Boolean,
    height: {
      type: [Number, String],
      default: void 0
    },
    hideSlider: Boolean,
    optional: Boolean,
    end: Boolean,
    sliderColor: String,
    modelValue: null
  }, makeDensityProps()), makeTagProps()),
  emits: {
    "update:modelValue": (v) => true
  },
  setup(props, _ref) {
    let {
      slots,
      emit
    } = _ref;
    const parsedItems = vue_cjs_prod.computed(() => parseItems(props.items));
    const {
      densityClasses
    } = useDensity(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "backgroundColor"));
    provideDefaults({
      VTab: {
        color: vue_cjs_prod.toRef(props, "color"),
        direction: vue_cjs_prod.toRef(props, "direction"),
        stacked: vue_cjs_prod.toRef(props, "stacked"),
        fixed: vue_cjs_prod.toRef(props, "fixedTabs"),
        sliderColor: vue_cjs_prod.toRef(props, "sliderColor"),
        hideSlider: vue_cjs_prod.toRef(props, "hideSlider")
      }
    });
    return () => vue_cjs_prod.createVNode(VSlideGroup, {
      "class": ["v-tabs", `v-tabs--${props.direction}`, {
        "v-tabs--align-with-title": props.alignWithTitle,
        "v-tabs--centered": props.centered,
        "v-tabs--fixed-tabs": props.fixedTabs,
        "v-tabs--grow": props.grow,
        "v-tabs--end": props.end,
        "v-tabs--stacked": props.stacked
      }, densityClasses.value, backgroundColorClasses.value],
      "style": backgroundColorStyles.value,
      "role": "tablist",
      "symbol": VTabsSymbol,
      "mandatory": "force",
      "direction": props.direction,
      "modelValue": props.modelValue,
      "onUpdate:modelValue": (v) => emit("update:modelValue", v)
    }, {
      default: () => [slots.default ? slots.default() : parsedItems.value.map((item) => vue_cjs_prod.createVNode(VTab, vue_cjs_prod.mergeProps(item, {
        "key": item.title
      }), null))]
    });
  }
});
const VTable = defineComponent({
  name: "VTable",
  props: __spreadValues(__spreadValues(__spreadValues({
    fixedHeader: Boolean,
    fixedFooter: Boolean,
    height: [Number, String]
  }, makeDensityProps()), makeThemeProps()), makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      densityClasses
    } = useDensity(props);
    return () => {
      var _slots$top, _slots$default, _slots$bottom;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-table", {
          "v-table--fixed-height": !!props.height,
          "v-table--fixed-header": props.fixedHeader,
          "v-table--fixed-footer": props.fixedFooter,
          "v-table--has-top": !!slots.top,
          "v-table--has-bottom": !!slots.bottom
        }, themeClasses.value, densityClasses.value]
      }, {
        default: () => [(_slots$top = slots.top) == null ? void 0 : _slots$top.call(slots), slots.default && vue_cjs_prod.createVNode("div", {
          "class": "v-table__wrapper",
          "style": {
            height: convertToUnit(props.height)
          }
        }, [vue_cjs_prod.createVNode("table", null, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)])]), (_slots$bottom = slots.bottom) == null ? void 0 : _slots$bottom.call(slots)]
      });
    };
  }
});
const VTextarea = defineComponent({
  name: "VTextarea",
  directives: {
    Intersect
  },
  inheritAttrs: false,
  props: __spreadValues(__spreadValues({
    autoGrow: Boolean,
    autofocus: Boolean,
    counter: [Boolean, Number, String],
    counterValue: Function,
    hint: String,
    persistentHint: Boolean,
    prefix: String,
    placeholder: String,
    persistentPlaceholder: Boolean,
    persistentCounter: Boolean,
    noResize: Boolean,
    rows: {
      type: [Number, String],
      default: 5,
      validator: (v) => !isNaN(parseFloat(v))
    },
    maxRows: {
      type: [Number, String],
      validator: (v) => !isNaN(parseFloat(v))
    },
    suffix: String
  }, makeVInputProps()), makeVFieldProps()),
  emits: {
    "click:clear": (e) => true,
    "click:control": (e) => true,
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      emit,
      slots
    } = _ref;
    const model = useProxiedModel(props, "modelValue");
    const counterValue = vue_cjs_prod.computed(() => {
      return typeof props.counterValue === "function" ? props.counterValue(model.value) : (model.value || "").toString().length;
    });
    const max = vue_cjs_prod.computed(() => {
      if (attrs.maxlength)
        return attrs.maxlength;
      if (!props.counter || typeof props.counter !== "number" && typeof props.counter !== "string")
        return void 0;
      return props.counter;
    });
    function onIntersect(isIntersecting, entries) {
      var _entries$0$target, _entries$0$target$foc;
      if (!props.autofocus || !isIntersecting)
        return;
      (_entries$0$target = entries[0].target) == null ? void 0 : (_entries$0$target$foc = _entries$0$target.focus) == null ? void 0 : _entries$0$target$foc.call(_entries$0$target);
    }
    const vInputRef = vue_cjs_prod.ref();
    const vFieldRef = vue_cjs_prod.ref();
    const isFocused = vue_cjs_prod.ref(false);
    const controlHeight = vue_cjs_prod.ref("auto");
    const textareaRef = vue_cjs_prod.ref();
    const isActive = vue_cjs_prod.computed(() => isFocused.value || props.persistentPlaceholder);
    const messages = vue_cjs_prod.computed(() => {
      return props.messages.length ? props.messages : isActive.value || props.persistentHint ? props.hint : "";
    });
    function onFocus() {
      if (textareaRef.value !== document.activeElement) {
        var _textareaRef$value;
        (_textareaRef$value = textareaRef.value) == null ? void 0 : _textareaRef$value.focus();
      }
      if (!isFocused.value)
        isFocused.value = true;
    }
    function onControlClick(e) {
      onFocus();
      emit("click:control", e);
    }
    function onClear(e) {
      e.stopPropagation();
      onFocus();
      vue_cjs_prod.nextTick(() => {
        model.value = "";
        emit("click:clear", e);
      });
    }
    const sizerRef = vue_cjs_prod.ref();
    function calculateInputHeight() {
      if (!props.autoGrow)
        return;
      vue_cjs_prod.nextTick(() => {
        if (!sizerRef.value)
          return;
        const style = getComputedStyle(sizerRef.value);
        const padding = parseFloat(style.getPropertyValue("--v-field-padding-top")) + parseFloat(style.getPropertyValue("--v-field-padding-bottom"));
        const height = sizerRef.value.scrollHeight;
        const lineHeight = parseFloat(style.lineHeight);
        const minHeight = parseFloat(props.rows) * lineHeight + padding;
        const maxHeight = parseFloat(props.maxRows) * lineHeight + padding || Infinity;
        controlHeight.value = convertToUnit(Math.min(maxHeight, Math.max(minHeight, height != null ? height : 0)));
      });
    }
    vue_cjs_prod.onMounted(calculateInputHeight);
    vue_cjs_prod.watch(model, calculateInputHeight);
    vue_cjs_prod.watch(() => props.rows, calculateInputHeight);
    vue_cjs_prod.watch(() => props.maxRows, calculateInputHeight);
    let observer;
    vue_cjs_prod.watch(sizerRef, (val) => {
      if (val) {
        observer = new ResizeObserver(calculateInputHeight);
        observer.observe(sizerRef.value);
      } else {
        var _observer;
        (_observer = observer) == null ? void 0 : _observer.disconnect();
      }
    });
    vue_cjs_prod.onBeforeUnmount(() => {
      var _observer2;
      (_observer2 = observer) == null ? void 0 : _observer2.disconnect();
    });
    useRender(() => {
      const hasCounter = !!(slots.counter || props.counter || props.counterValue);
      const [rootAttrs, inputAttrs] = filterInputAttrs(attrs);
      const [_a] = filterInputProps(props), _b = _a, inputProps = __objRest(_b, [
        "modelValue"
      ]);
      const [fieldProps] = filterFieldProps(props);
      return vue_cjs_prod.createVNode(VInput, vue_cjs_prod.mergeProps({
        "modelValue": model.value,
        "onUpdate:modelValue": ($event) => model.value = $event,
        "class": ["v-textarea", {
          "v-textarea--prefixed": props.prefix,
          "v-textarea--suffixed": props.suffix,
          "v-textarea--auto-grow": props.autoGrow,
          "v-textarea--no-resize": props.noResize || props.autoGrow
        }]
      }, rootAttrs, inputProps, {
        "messages": messages.value
      }), __spreadProps(__spreadValues({}, slots), {
        default: (_ref2) => {
          let {
            isDisabled,
            isDirty,
            isReadonly,
            isValid
          } = _ref2;
          return vue_cjs_prod.createVNode(VField, vue_cjs_prod.mergeProps({
            "style": {
              "--v-input-control-height": controlHeight.value
            },
            "onClick:control": onControlClick,
            "onClick:clear": onClear,
            "role": "textbox"
          }, fieldProps, {
            "active": isActive.value || isDirty.value,
            "dirty": isDirty.value || props.dirty,
            "focused": isFocused.value,
            "error": isValid.value === false
          }), __spreadProps(__spreadValues({}, slots), {
            default: (_ref3) => {
              let {
                props: _a2
              } = _ref3, _b2 = _a2, {
                class: fieldClass
              } = _b2, slotProps = __objRest(_b2, [
                "class"
              ]);
              return vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [props.prefix && vue_cjs_prod.createVNode("span", {
                "class": "v-text-field__prefix"
              }, [props.prefix]), vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("textarea", vue_cjs_prod.mergeProps({
                "ref": textareaRef,
                "class": fieldClass,
                "onUpdate:modelValue": ($event) => model.value = $event,
                "autofocus": props.autofocus,
                "readonly": isReadonly.value,
                "disabled": isDisabled.value,
                "placeholder": props.placeholder,
                "rows": props.rows,
                "name": props.name,
                "onFocus": onFocus,
                "onBlur": () => isFocused.value = false
              }, slotProps, inputAttrs), null), [[vue_cjs_prod.vModelText, model.value], [vue_cjs_prod.resolveDirective("intersect"), {
                handler: onIntersect
              }, null, {
                once: true
              }]]), props.autoGrow && vue_cjs_prod.withDirectives(vue_cjs_prod.createVNode("textarea", {
                "class": [fieldClass, "v-textarea__sizer"],
                "onUpdate:modelValue": ($event) => model.value = $event,
                "ref": sizerRef,
                "readonly": true,
                "aria-hidden": "true"
              }, null), [[vue_cjs_prod.vModelText, model.value]]), props.suffix && vue_cjs_prod.createVNode("span", {
                "class": "v-text-field__suffix"
              }, [props.suffix])]);
            }
          }));
        },
        details: hasCounter ? () => vue_cjs_prod.createVNode(vue_cjs_prod.Fragment, null, [vue_cjs_prod.createVNode("span", null, null), vue_cjs_prod.createVNode(VCounter, {
          "active": props.persistentCounter || isFocused.value,
          "value": counterValue.value,
          "max": max.value
        }, slots.counter)]) : void 0
      }));
    });
    return useForwardRef({}, vInputRef, vFieldRef, textareaRef);
  }
});
const VThemeProvider = defineComponent({
  name: "VThemeProvider",
  props: __spreadValues(__spreadValues({
    withBackground: Boolean
  }, makeThemeProps()), makeTagProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    return () => {
      var _slots$default, _slots$default2;
      if (!props.withBackground)
        return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots);
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-theme-provider", themeClasses.value]
      }, {
        default: () => [(_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots)]
      });
    };
  }
});
const VTimelineSymbol = Symbol.for("vuetify:timeline");
const VTimeline = defineComponent({
  name: "VTimeline",
  props: __spreadValues(__spreadValues(__spreadValues({
    align: {
      type: String,
      default: "center",
      validator: (v) => ["center", "start"].includes(v)
    },
    direction: {
      type: String,
      default: "vertical",
      validator: (v) => ["vertical", "horizontal"].includes(v)
    },
    side: {
      type: String,
      validator: (v) => v == null || ["start", "end"].includes(v)
    },
    lineInset: {
      type: [String, Number],
      default: 0
    },
    lineThickness: {
      type: [String, Number],
      default: 2
    },
    lineColor: String,
    truncateLine: {
      type: String,
      validator: (v) => ["start", "end", "both"].includes(v)
    }
  }, makeDensityProps()), makeTagProps()), makeThemeProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      themeClasses
    } = provideTheme(props);
    const {
      densityClasses
    } = useDensity(props);
    vue_cjs_prod.provide(VTimelineSymbol, {
      density: vue_cjs_prod.toRef(props, "density"),
      lineColor: vue_cjs_prod.toRef(props, "lineColor")
    });
    const sideClass = vue_cjs_prod.computed(() => {
      const side = props.side ? props.side : props.density !== "default" ? "end" : null;
      return side && `v-timeline--side-${side}`;
    });
    const truncateClasses = vue_cjs_prod.computed(() => {
      const classes = ["v-timeline--truncate-line-start", "v-timeline--truncate-line-end"];
      switch (props.truncateLine) {
        case "both":
          return classes;
        case "start":
          return classes[0];
        case "end":
          return classes[1];
        default:
          return null;
      }
    });
    return () => {
      var _slots$default;
      return vue_cjs_prod.createVNode(props.tag, {
        "class": ["v-timeline", `v-timeline--${props.direction}`, `v-timeline--align-${props.align}`, !props.lineInset && truncateClasses.value, {
          "v-timeline--inset-line": !!props.lineInset
        }, themeClasses.value, densityClasses.value, sideClass.value],
        "style": {
          "--v-timeline-line-thickness": convertToUnit(props.lineThickness),
          "--v-timeline-line-inset": convertToUnit(props.lineInset)
        }
      }, {
        default: () => [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]
      });
    };
  }
});
const VTimelineDivider = defineComponent({
  name: "VTimelineDivider",
  props: __spreadValues(__spreadValues(__spreadValues({
    hideDot: Boolean,
    lineColor: String,
    icon: IconValue,
    iconColor: String,
    fillDot: Boolean,
    dotColor: String
  }, makeRoundedProps()), makeSizeProps()), makeElevationProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const timeline = vue_cjs_prod.inject(VTimelineSymbol);
    if (!timeline)
      throw new Error("[Vuetify] Could not find v-timeline provider");
    const {
      sizeClasses,
      sizeStyles
    } = useSize(props, "v-timeline-divider__dot");
    const {
      backgroundColorStyles,
      backgroundColorClasses
    } = useBackgroundColor(vue_cjs_prod.toRef(props, "dotColor"));
    const {
      backgroundColorStyles: lineColorStyles,
      backgroundColorClasses: lineColorClasses
    } = useBackgroundColor(timeline.lineColor);
    const {
      roundedClasses
    } = useRounded(props, "v-timeline-divider__dot");
    const {
      elevationClasses
    } = useElevation(props);
    return () => vue_cjs_prod.createVNode("div", {
      "class": ["v-timeline-divider", {
        "v-timeline-divider--fill-dot": props.fillDot
      }]
    }, [!props.hideDot && vue_cjs_prod.createVNode("div", {
      "class": ["v-timeline-divider__dot", roundedClasses.value, sizeClasses.value, elevationClasses.value],
      "style": sizeStyles.value
    }, [vue_cjs_prod.createVNode("div", {
      "class": ["v-timeline-divider__inner-dot", roundedClasses.value, backgroundColorClasses.value],
      "style": backgroundColorStyles.value
    }, [slots.default ? slots.default({
      icon: props.icon,
      iconColor: props.iconColor,
      size: props.size
    }) : props.icon ? vue_cjs_prod.createVNode(VIcon, {
      "icon": props.icon,
      "color": props.iconColor,
      "size": props.size
    }, null) : void 0])]), vue_cjs_prod.createVNode("div", {
      "class": ["v-timeline-divider__line", lineColorClasses.value],
      "style": lineColorStyles.value
    }, null)]);
  }
});
const VTimelineItem = defineComponent({
  name: "VTimelineItem",
  props: __spreadValues(__spreadValues(__spreadValues(__spreadValues(__spreadValues({
    dotColor: String,
    fillDot: Boolean,
    hideDot: Boolean,
    hideOpposite: {
      type: Boolean,
      default: void 0
    },
    icon: IconValue,
    iconColor: String
  }, makeRoundedProps()), makeElevationProps()), makeSizeProps()), makeTagProps()), makeDimensionProps()),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const timeline = vue_cjs_prod.inject(VTimelineSymbol);
    if (!timeline)
      throw new Error("[Vuetify] Could not find v-timeline provider");
    const {
      dimensionStyles
    } = useDimension(props);
    const dotSize = vue_cjs_prod.ref(0);
    const dotRef = vue_cjs_prod.ref();
    vue_cjs_prod.watch(dotRef, (newValue) => {
      var _newValue$$el$querySe, _newValue$$el$querySe2;
      if (!newValue)
        return;
      dotSize.value = (_newValue$$el$querySe = (_newValue$$el$querySe2 = newValue.$el.querySelector(".v-timeline-divider__dot")) == null ? void 0 : _newValue$$el$querySe2.getBoundingClientRect().width) != null ? _newValue$$el$querySe : 0;
    }, {
      flush: "post"
    });
    return () => {
      var _slots$default, _slots$opposite;
      return vue_cjs_prod.createVNode("div", {
        "class": ["v-timeline-item", {
          "v-timeline-item--fill-dot": props.fillDot
        }],
        "style": {
          "--v-timeline-dot-size": convertToUnit(dotSize.value)
        }
      }, [vue_cjs_prod.createVNode("div", {
        "class": "v-timeline-item__body",
        "style": dimensionStyles.value
      }, [(_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots)]), vue_cjs_prod.createVNode(VTimelineDivider, {
        "ref": dotRef,
        "hideDot": props.hideDot,
        "icon": props.icon,
        "iconColor": props.iconColor,
        "size": props.size,
        "elevation": props.elevation,
        "dotColor": props.dotColor,
        "fillDot": props.fillDot,
        "rounded": props.rounded
      }, {
        default: slots.icon
      }), timeline.density.value !== "compact" && vue_cjs_prod.createVNode("div", {
        "class": "v-timeline-item__opposite"
      }, [!props.hideOpposite && ((_slots$opposite = slots.opposite) == null ? void 0 : _slots$opposite.call(slots))])]);
    };
  }
});
const VTooltip = genericComponent()({
  name: "VTooltip",
  inheritAttrs: false,
  props: __spreadValues({
    id: String,
    modelValue: Boolean,
    text: String,
    location: {
      type: String,
      default: "end"
    },
    origin: {
      type: String,
      default: "auto"
    }
  }, makeTransitionProps({
    transition: false
  })),
  emits: {
    "update:modelValue": (value) => true
  },
  setup(props, _ref) {
    let {
      attrs,
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      scopeId
    } = useScopeId();
    const uid = getUid();
    const id = vue_cjs_prod.computed(() => props.id || `v-tooltip-${uid}`);
    const location2 = vue_cjs_prod.computed(() => {
      return props.location.split(" ").length > 1 ? props.location : props.location + " center";
    });
    const origin = vue_cjs_prod.computed(() => {
      return props.origin === "auto" || props.origin === "overlap" || props.origin.split(" ").length > 1 || props.location.split(" ").length > 1 ? props.origin : props.origin + " center";
    });
    const transition = vue_cjs_prod.computed(() => {
      if (props.transition)
        return props.transition;
      return isActive.value ? "scale-transition" : "fade-transition";
    });
    return () => {
      return vue_cjs_prod.createVNode(VOverlay, vue_cjs_prod.mergeProps({
        "modelValue": isActive.value,
        "onUpdate:modelValue": ($event) => isActive.value = $event,
        "class": ["v-tooltip"],
        "id": id.value,
        "transition": transition.value,
        "absolute": true,
        "locationStrategy": "connected",
        "scrollStrategy": "reposition",
        "location": location2.value,
        "origin": origin.value,
        "min-width": 0,
        "offset": 10,
        "scrim": false,
        "persistent": true,
        "open-on-click": false,
        "open-on-hover": true,
        "close-on-back": false,
        "role": "tooltip",
        "eager": true,
        "activatorProps": {
          "aria-describedby": id.value
        }
      }, scopeId, attrs), {
        activator: slots.activator,
        default: function() {
          var _slots$default, _slots$default2;
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return (_slots$default = (_slots$default2 = slots.default) == null ? void 0 : _slots$default2.call(slots, ...args)) != null ? _slots$default : props.text;
        }
      });
    };
  }
});
const VValidation = defineComponent({
  name: "VValidation",
  props: __spreadValues({}, makeValidationProps()),
  emits: {
    "update:modelValue": (val) => true
  },
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const validation = useValidation(props, "validation");
    return () => {
      var _slots$default;
      return (_slots$default = slots.default) == null ? void 0 : _slots$default.call(slots, validation);
    };
  }
});
const components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VApp,
  VAppBar,
  VAppBarNavIcon,
  VAppBarTitle,
  VAlert,
  VAlertTitle,
  VAutocomplete,
  VAvatar,
  VBadge,
  VBanner,
  VBannerActions,
  VBannerAvatar,
  VBannerIcon,
  VBannerText,
  VBottomNavigation,
  VBreadcrumbs,
  VBreadcrumbsItem,
  VBreadcrumbsDivider,
  VBtn,
  VBtnGroup,
  VBtnToggle,
  VCard,
  VCardActions,
  VCardAvatar,
  VCardContent,
  VCardHeader,
  VCardHeaderText,
  VCardImg,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VCarousel,
  VCarouselItem,
  VCheckbox,
  VChip,
  VChipGroup,
  VCode,
  VColorPicker,
  VCombobox,
  VCounter,
  VDefaultsProvider,
  VDialog,
  VDivider,
  VExpansionPanels,
  VExpansionPanel,
  VExpansionPanelText,
  VExpansionPanelTitle,
  VField,
  VFieldLabel,
  VFileInput,
  VFooter,
  VForm,
  VContainer,
  VCol,
  VRow,
  VSpacer,
  VHover,
  VIcon,
  VComponentIcon,
  VSvgIcon,
  VLigatureIcon,
  VClassIcon,
  VImg,
  VInput,
  VItemGroup,
  VItem,
  VKbd,
  VLabel,
  VLayout,
  VLayoutItem,
  VLazy,
  VList,
  VListSubheader,
  VListImg,
  VListItem,
  VListItemAction,
  VListItemAvatar,
  VListItemHeader,
  VListItemIcon,
  VListItemMedia,
  VListItemSubtitle,
  VListItemTitle,
  VListGroup,
  VLocaleProvider,
  VMain,
  VMenu,
  VMessages,
  VNavigationDrawer,
  VNoSsr,
  VOverlay,
  VPagination,
  VParallax,
  VProgressCircular,
  VProgressLinear,
  VRadio,
  VRadioGroup,
  VRangeSlider,
  VRating,
  VResponsive,
  VSelect,
  VSelectionControl,
  VSelectionControlGroup,
  VSheet,
  VSlideGroupSymbol,
  VSlideGroup,
  VSlideGroupItem,
  VSlider,
  VSnackbar,
  VSwitch,
  VSystemBar,
  VTabs,
  VTab,
  VTable,
  VTextarea,
  VTextField,
  VThemeProvider,
  VTimeline,
  VTimelineItem,
  VToolbar,
  VToolbarTitle,
  VToolbarItems,
  VTooltip,
  VValidation,
  VWindow,
  VWindowItem,
  VDialogTransition,
  VCarouselTransition,
  VCarouselReverseTransition,
  VTabTransition,
  VTabReverseTransition,
  VMenuTransition,
  VFabTransition,
  VDialogBottomTransition,
  VDialogTopTransition,
  VFadeTransition,
  VScaleTransition,
  VScrollXTransition,
  VScrollXReverseTransition,
  VScrollYTransition,
  VScrollYReverseTransition,
  VSlideXTransition,
  VSlideXReverseTransition,
  VSlideYTransition,
  VSlideYReverseTransition,
  VExpandTransition,
  VExpandXTransition
}, Symbol.toStringTag, { value: "Module" }));
function mounted$2(el, binding) {
  var _modifierKeys$attr, _modifierKeys$char, _modifierKeys$child, _modifierKeys$sub;
  const modifiers = binding.modifiers || {};
  const value = binding.value;
  const _a = modifiers, {
    once,
    immediate
  } = _a, modifierKeys = __objRest(_a, [
    "once",
    "immediate"
  ]);
  const defaultValue = !Object.keys(modifierKeys).length;
  const {
    handler,
    options
  } = typeof value === "object" ? value : {
    handler: value,
    options: {
      attributes: (_modifierKeys$attr = modifierKeys == null ? void 0 : modifierKeys.attr) != null ? _modifierKeys$attr : defaultValue,
      characterData: (_modifierKeys$char = modifierKeys == null ? void 0 : modifierKeys.char) != null ? _modifierKeys$char : defaultValue,
      childList: (_modifierKeys$child = modifierKeys == null ? void 0 : modifierKeys.child) != null ? _modifierKeys$child : defaultValue,
      subtree: (_modifierKeys$sub = modifierKeys == null ? void 0 : modifierKeys.sub) != null ? _modifierKeys$sub : defaultValue
    }
  };
  const observer = new MutationObserver(function() {
    let mutations = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    let observer2 = arguments.length > 1 ? arguments[1] : void 0;
    handler == null ? void 0 : handler(mutations, observer2);
    if (once)
      unmounted$2(el, binding);
  });
  if (immediate)
    handler == null ? void 0 : handler([], observer);
  el._mutate = Object(el._mutate);
  el._mutate[binding.instance.$.uid] = {
    observer
  };
  observer.observe(el, options);
}
function unmounted$2(el, binding) {
  var _el$_mutate;
  if (!((_el$_mutate = el._mutate) != null && _el$_mutate[binding.instance.$.uid]))
    return;
  el._mutate[binding.instance.$.uid].observer.disconnect();
  delete el._mutate[binding.instance.$.uid];
}
const Mutate = {
  mounted: mounted$2,
  unmounted: unmounted$2
};
function mounted$1(el, binding) {
  var _binding$modifiers, _binding$modifiers2;
  const handler = binding.value;
  const options = {
    passive: !((_binding$modifiers = binding.modifiers) != null && _binding$modifiers.active)
  };
  window.addEventListener("resize", handler, options);
  el._onResize = Object(el._onResize);
  el._onResize[binding.instance.$.uid] = {
    handler,
    options
  };
  if (!((_binding$modifiers2 = binding.modifiers) != null && _binding$modifiers2.quiet)) {
    handler();
  }
}
function unmounted$1(el, binding) {
  var _el$_onResize;
  if (!((_el$_onResize = el._onResize) != null && _el$_onResize[binding.instance.$.uid]))
    return;
  const {
    handler,
    options
  } = el._onResize[binding.instance.$.uid];
  window.removeEventListener("resize", handler, options);
  delete el._onResize[binding.instance.$.uid];
}
const Resize = {
  mounted: mounted$1,
  unmounted: unmounted$1
};
function mounted(el, binding) {
  var _binding$modifiers;
  const {
    self: self2 = false
  } = (_binding$modifiers = binding.modifiers) != null ? _binding$modifiers : {};
  const value = binding.value;
  const options = typeof value === "object" && value.options || {
    passive: true
  };
  const handler = typeof value === "function" || "handleEvent" in value ? value : value.handler;
  const target = self2 ? el : binding.arg ? document.querySelector(binding.arg) : window;
  if (!target)
    return;
  target.addEventListener("scroll", handler, options);
  el._onScroll = Object(el._onScroll);
  el._onScroll[binding.instance.$.uid] = {
    handler,
    options,
    target: self2 ? void 0 : target
  };
}
function unmounted(el, binding) {
  var _el$_onScroll;
  if (!((_el$_onScroll = el._onScroll) != null && _el$_onScroll[binding.instance.$.uid]))
    return;
  const {
    handler,
    options,
    target = el
  } = el._onScroll[binding.instance.$.uid];
  target.removeEventListener("scroll", handler, options);
  delete el._onScroll[binding.instance.$.uid];
}
function updated(el, binding) {
  if (binding.value === binding.oldValue)
    return;
  unmounted(el, binding);
  mounted(el, binding);
}
const Scroll = {
  mounted,
  unmounted,
  updated
};
const directives = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ClickOutside,
  Intersect,
  Mutate,
  Resize,
  Ripple,
  Scroll,
  Touch
}, Symbol.toStringTag, { value: "Module" }));
const vuetify_d9e6adde = defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "light",
      themes: {
        light: {
          dark: false,
          colors: {
            primary: "#FA4238"
          }
        },
        dark: {
          dark: true,
          colors: {
            primary: "#FA4238"
          }
        }
      }
    }
  });
  nuxtApp.vueApp.use(vuetify);
});
const _plugins = [
  preload,
  componentsPlugin_1f80df3c,
  vueuseHead_5a9bcd9c,
  _630f84e0,
  _720e9498,
  vuetify_d9e6adde
];
const _sfc_main$7 = {
  __name: "error-404",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "404"
    },
    statusMessage: {
      type: String,
      default: "Not Found"
    },
    description: {
      type: String,
      default: "Sorry, the page you are looking for could not be found."
    },
    backHome: {
      type: String,
      default: "Go back home"
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}a{color:inherit;text-decoration:inherit}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-011aae6d><div class="fixed left-0 right-0 spotlight z-10" data-v-011aae6d></div><div class="max-w-520px text-center z-20" data-v-011aae6d><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-011aae6d>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-011aae6d>${serverRenderer.exports.ssrInterpolate(__props.description)}</p><div class="w-full flex items-center justify-center" data-v-011aae6d>`);
      _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "gradient-border text-md sm:text-xl py-2 px-4 sm:py-3 sm:px-6 cursor-pointer"
      }, {
        default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`${serverRenderer.exports.ssrInterpolate(__props.backHome)}`);
          } else {
            return [
              vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(__props.backHome), 1)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-404.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const Error404 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-011aae6d"]]);
const _sfc_main$6 = {
  __name: "error-500",
  __ssrInlineRender: true,
  props: {
    appName: {
      type: String,
      default: "Nuxt"
    },
    version: {
      type: String,
      default: ""
    },
    statusCode: {
      type: String,
      default: "500"
    },
    statusMessage: {
      type: String,
      default: "Server error"
    },
    description: {
      type: String,
      default: "This page is temporarily unavailable."
    }
  },
  setup(__props) {
    const props = __props;
    useHead({
      title: `${props.statusCode} - ${props.statusMessage} | ${props.appName}`,
      script: [],
      style: [
        {
          children: `*,:before,:after{-webkit-box-sizing:border-box;box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}*{--tw-ring-inset:var(--tw-empty, );--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(14, 165, 233, .5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000}:root{-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{margin:0;font-family:inherit;line-height:inherit}html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,"Apple Color Emoji","Segoe UI Emoji",Segoe UI Symbol,"Noto Color Emoji";line-height:1.5}h1,p{margin:0}h1{font-size:inherit;font-weight:inherit}`
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.exports.ssrRenderAttrs(vue_cjs_prod.mergeProps({ class: "font-sans antialiased bg-white dark:bg-black text-black dark:text-white grid min-h-screen place-content-center overflow-hidden" }, _attrs))} data-v-6aee6495><div class="fixed -bottom-1/2 left-0 right-0 h-1/2 spotlight" data-v-6aee6495></div><div class="max-w-520px text-center" data-v-6aee6495><h1 class="text-8xl sm:text-10xl font-medium mb-8" data-v-6aee6495>${serverRenderer.exports.ssrInterpolate(__props.statusCode)}</h1><p class="text-xl px-8 sm:px-0 sm:text-4xl font-light mb-16 leading-tight" data-v-6aee6495>${serverRenderer.exports.ssrInterpolate(__props.description)}</p></div></div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/@nuxt/ui-templates/dist/templates/error-500.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const Error500 = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-6aee6495"]]);
const _sfc_main$4 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    var _a;
    const props = __props;
    const error = props.error;
    (error.stack || "").split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n");
    const statusCode = String(error.statusCode || 500);
    const is404 = statusCode === "404";
    const statusMessage = (_a = error.statusMessage) != null ? _a : is404 ? "Page Not Found" : "Internal Server Error";
    const description = error.message || error.toString();
    const stack2 = void 0;
    const ErrorTemplate = is404 ? Error404 : Error500;
    return (_ctx, _push, _parent, _attrs) => {
      _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(ErrorTemplate), vue_cjs_prod.mergeProps({ statusCode: vue_cjs_prod.unref(statusCode), statusMessage: vue_cjs_prod.unref(statusMessage), description: vue_cjs_prod.unref(description), stack: vue_cjs_prod.unref(stack2) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const nuxtApp = useNuxtApp();
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    vue_cjs_prod.onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, throwError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_App = vue_cjs_prod.resolveComponent("App");
      serverRenderer.exports.ssrRenderSuspense(_push, {
        default: () => {
          if (vue_cjs_prod.unref(error)) {
            _push(serverRenderer.exports.ssrRenderComponent(vue_cjs_prod.unref(_sfc_main$4), { error: vue_cjs_prod.unref(error) }, null, _parent));
          } else {
            _push(serverRenderer.exports.ssrRenderComponent(_component_App, null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const layouts = {
  default: vue_cjs_prod.defineAsyncComponent(() => Promise.resolve().then(function() {
    return _default$1;
  }))
};
const defaultLayoutTransition = { name: "layout", mode: "out-in" };
const __nuxt_component_0 = vue_cjs_prod.defineComponent({
  props: {
    name: {
      type: [String, Boolean, Object],
      default: null
    }
  },
  setup(props, context) {
    const route = useRoute();
    return () => {
      var _a, _b, _c;
      const layout = (_b = (_a = vue_cjs_prod.isRef(props.name) ? props.name.value : props.name) != null ? _a : route.meta.layout) != null ? _b : "default";
      const hasLayout = layout && layout in layouts;
      return _wrapIf(vue_cjs_prod.Transition, hasLayout && ((_c = route.meta.layoutTransition) != null ? _c : defaultLayoutTransition), _wrapIf(layouts[layout], hasLayout, context.slots)).default();
    };
  }
});
const _sfc_main$2 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  const _component_NuxtLayout = __nuxt_component_0;
  const _component_NuxtPage = vue_cjs_prod.resolveComponent("NuxtPage");
  _push(serverRenderer.exports.ssrRenderComponent(_component_NuxtLayout, _attrs, {
    default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(serverRenderer.exports.ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
      } else {
        return [
          vue_cjs_prod.createVNode(_component_NuxtPage)
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/pages/runtime/app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const AppComponent = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["ssrRender", _sfc_ssrRender$2]]);
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext = {}) {
    const vueApp = vue_cjs_prod.createApp(_sfc_main$3);
    vueApp.component("App", AppComponent);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      ssrContext.error = ssrContext.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);
const _sfc_main$1 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  const _component_v_container = vue_cjs_prod.resolveComponent("v-container");
  const _component_v_img = vue_cjs_prod.resolveComponent("v-img");
  _push(serverRenderer.exports.ssrRenderComponent(_component_v_container, _attrs, {
    default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_container, { class: "d-flex justify-center mb-5" }, {
          default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(`<div class="text-h2"${_scopeId2}>Coming soon...</div>`);
            } else {
              return [
                vue_cjs_prod.createVNode("div", { class: "text-h2" }, "Coming soon...")
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_img, {
          src: "/logo/logo-no-background.png",
          "max-height": "400",
          class: "ma-5"
        }, null, _parent2, _scopeId));
      } else {
        return [
          vue_cjs_prod.createVNode(_component_v_container, { class: "d-flex justify-center mb-5" }, {
            default: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode("div", { class: "text-h2" }, "Coming soon...")
            ]),
            _: 1
          }),
          vue_cjs_prod.createVNode(_component_v_img, {
            src: "/logo/logo-no-background.png",
            "max-height": "400",
            class: "ma-5"
          })
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["ssrRender", _sfc_ssrRender$1]]);
const index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": index
}, Symbol.toStringTag, { value: "Module" }));
const _sfc_main = {
  name: "DefaultLayout",
  data: () => ({
    showDrawer: false,
    temporaryDrawer: true
  }),
  mounted() {
    setTimeout(() => {
      this.temporaryDrawer = false;
    }, 200);
  }
};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_app = vue_cjs_prod.resolveComponent("v-app");
  const _component_v_app_bar = vue_cjs_prod.resolveComponent("v-app-bar");
  const _component_v_app_bar_nav_icon = vue_cjs_prod.resolveComponent("v-app-bar-nav-icon");
  const _component_v_app_bar_title = vue_cjs_prod.resolveComponent("v-app-bar-title");
  const _component_v_img = vue_cjs_prod.resolveComponent("v-img");
  const _component_v_navigation_drawer = vue_cjs_prod.resolveComponent("v-navigation-drawer");
  const _component_v_main = vue_cjs_prod.resolveComponent("v-main");
  const _component_v_container = vue_cjs_prod.resolveComponent("v-container");
  const _component_v_footer = vue_cjs_prod.resolveComponent("v-footer");
  const _component_v_col = vue_cjs_prod.resolveComponent("v-col");
  _push(serverRenderer.exports.ssrRenderComponent(_component_v_app, vue_cjs_prod.mergeProps({ theme: "light" }, _attrs), {
    default: vue_cjs_prod.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_app_bar, {
          app: "",
          dark: "",
          density: "prominent",
          elevation: "0",
          "clipped-left": "",
          color: "primary",
          class: ["rounded-be-xl", { "rounded-bs-xl": !_ctx.showDrawer }]
        }, {
          prepend: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_v_app_bar_nav_icon, {
                onClick: ($event) => _ctx.showDrawer = !_ctx.showDrawer
              }, null, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_v_app_bar_nav_icon, {
                  onClick: vue_cjs_prod.withModifiers(($event) => _ctx.showDrawer = !_ctx.showDrawer, ["stop"])
                }, null, 8, ["onClick"])
              ];
            }
          }),
          default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_v_app_bar_title, null, {
                default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(serverRenderer.exports.ssrRenderComponent(_component_v_img, {
                      src: "/logo/name-no-background-white.png",
                      "max-height": "80",
                      class: "my-3"
                    }, null, _parent4, _scopeId3));
                  } else {
                    return [
                      vue_cjs_prod.createVNode(_component_v_img, {
                        src: "/logo/name-no-background-white.png",
                        "max-height": "80",
                        class: "my-3"
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_v_app_bar_title, null, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createVNode(_component_v_img, {
                      src: "/logo/name-no-background-white.png",
                      "max-height": "80",
                      class: "my-3"
                    })
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_navigation_drawer, {
          modelValue: _ctx.showDrawer,
          "onUpdate:modelValue": ($event) => _ctx.showDrawer = $event,
          app: "",
          clipped: "",
          dark: "",
          temporary: _ctx.temporaryDrawer,
          color: "primary",
          floating: ""
        }, null, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_main, null, {
          default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_v_container, null, {
                default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    serverRenderer.exports.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push4, _parent4, _scopeId3);
                  } else {
                    return [
                      vue_cjs_prod.renderSlot(_ctx.$slots, "default")
                    ];
                  }
                }),
                _: 3
              }, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_v_container, null, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.renderSlot(_ctx.$slots, "default")
                  ]),
                  _: 3
                })
              ];
            }
          }),
          _: 3
        }, _parent2, _scopeId));
        _push2(serverRenderer.exports.ssrRenderComponent(_component_v_footer, {
          app: "",
          dark: "",
          absolute: "",
          color: "primary",
          class: ["rounded-te-xl", { "rounded-ts-xl": !_ctx.showDrawer }]
        }, {
          default: vue_cjs_prod.withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(serverRenderer.exports.ssrRenderComponent(_component_v_col, {
                class: "text-center",
                cols: "12"
              }, {
                default: vue_cjs_prod.withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`${serverRenderer.exports.ssrInterpolate(new Date().getFullYear())} \u2014 <strong${_scopeId3}>AlvaSori</strong>`);
                  } else {
                    return [
                      vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(new Date().getFullYear()) + " \u2014 ", 1),
                      vue_cjs_prod.createVNode("strong", null, "AlvaSori")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                vue_cjs_prod.createVNode(_component_v_col, {
                  class: "text-center",
                  cols: "12"
                }, {
                  default: vue_cjs_prod.withCtx(() => [
                    vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(new Date().getFullYear()) + " \u2014 ", 1),
                    vue_cjs_prod.createVNode("strong", null, "AlvaSori")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
      } else {
        return [
          vue_cjs_prod.createVNode(_component_v_app_bar, {
            app: "",
            dark: "",
            density: "prominent",
            elevation: "0",
            "clipped-left": "",
            color: "primary",
            class: ["rounded-be-xl", { "rounded-bs-xl": !_ctx.showDrawer }]
          }, {
            prepend: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode(_component_v_app_bar_nav_icon, {
                onClick: vue_cjs_prod.withModifiers(($event) => _ctx.showDrawer = !_ctx.showDrawer, ["stop"])
              }, null, 8, ["onClick"])
            ]),
            default: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode(_component_v_app_bar_title, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createVNode(_component_v_img, {
                    src: "/logo/name-no-background-white.png",
                    "max-height": "80",
                    class: "my-3"
                  })
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["class"]),
          vue_cjs_prod.createVNode(_component_v_navigation_drawer, {
            modelValue: _ctx.showDrawer,
            "onUpdate:modelValue": ($event) => _ctx.showDrawer = $event,
            app: "",
            clipped: "",
            dark: "",
            temporary: _ctx.temporaryDrawer,
            color: "primary",
            floating: ""
          }, null, 8, ["modelValue", "onUpdate:modelValue", "temporary"]),
          vue_cjs_prod.createVNode(_component_v_main, null, {
            default: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode(_component_v_container, null, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.renderSlot(_ctx.$slots, "default")
                ]),
                _: 3
              })
            ]),
            _: 3
          }),
          vue_cjs_prod.createVNode(_component_v_footer, {
            app: "",
            dark: "",
            absolute: "",
            color: "primary",
            class: ["rounded-te-xl", { "rounded-ts-xl": !_ctx.showDrawer }]
          }, {
            default: vue_cjs_prod.withCtx(() => [
              vue_cjs_prod.createVNode(_component_v_col, {
                class: "text-center",
                cols: "12"
              }, {
                default: vue_cjs_prod.withCtx(() => [
                  vue_cjs_prod.createTextVNode(vue_cjs_prod.toDisplayString(new Date().getFullYear()) + " \u2014 ", 1),
                  vue_cjs_prod.createVNode("strong", null, "AlvaSori")
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["class"])
        ];
      }
    }),
    _: 3
  }, _parent));
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vue_cjs_prod.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
const _default$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": _default
}, Symbol.toStringTag, { value: "Module" }));

export { entry$1 as default };
//# sourceMappingURL=server.mjs.map
