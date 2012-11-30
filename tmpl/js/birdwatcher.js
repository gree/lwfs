/**
 * @license
 * birdwatcher.js
 * JavaScript Profiler
 * https://github.com/imaya/birdwatcher.js
 *
 * The MIT License
 *
 * Copyright (c) 2012 imaya
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (global) {

/** @const @type {boolean} */
var USE_ECMA5 = !!Object.getOwnPropertyDescriptor;

/** @define {string} profiler function name */
var name = 'BirdWatcher';

/** @type {function} */
var getPropDesc = Object.getOwnPropertyDescriptor;

this[name] = BirdWatcher;

/**
 * @type {!{log: function, warn: function, error: function}}
 * @const
 */
var NativeConsoleFunction = {
  log: console.log,
  warn: console.warn,
  error: console.error
};

/**
 * new profiler
 * @param {Array.<string>} target target prototype objects.
 * @constructor
 */
function BirdWatcher(target) {
  /** @type {Array.<string>} target function/object string list. */
  this.target = target;
  /** @type {Object} wrapped function list */
  this.wrapped = {};
  /** @type {Object} source function list */
  this.source = {};
  /** @type {Array.<string>} call stack. */
  this.stack = [];
  /** @type {Object} callgraph object. */
  this.callgraph = {};
  /** @type {number} max depth. */
  this.maxDepth = 10;
  /** @type {number} bird watcher id. */
  this.id = +new Date();
  /** @type {string} */
  this.reportUrl;
  /** @type {string} */
  this.reportId;
  /** @type {string} 'img'(default) or 'xhr' */
  this.sendMethod = 'img';
}

/**
 * start profiling.
 * @param {number=} opt_maxDepth max walk down depth.
 */
BirdWatcher.prototype.start = function(opt_maxDepth) {
  var target = this.target;
  /** @type {number} loop counter */
  var i;
  /** @type {number} loop limiter */
  var il;

  if (typeof opt_maxDepth === 'number') {
    this.maxDepth = opt_maxDepth;
  }

  for (i = 0, il = target.length; i < il; ++i) {
    this.wrap(target[i], 0);
  }
};

/**
 * stop profiling.
 */
BirdWatcher.prototype.stop = function() {
  /** @type {Object} */
  var wrapped = this.wrapped;
  /** @type {Array.<string>} function name parts */
  var parts;
  /** @type {string} function name */
  var method;
  /** @type {*} parent object */
  var parent;
  /** @type {string} wrapped function name */
  var i;

  // Object.keys 実装以前の処理系に対応するため for-in でまわす
  for (i in wrapped) {
    parts = i.split('.');

    method = parts.pop();
    parent = (parts.length > 0) ? eval(parts.join('.')) : global;

    if (parent[method] !== source[i]) {
      parent[method] = source[i];
    }
  }
};

/**
 * wrapper.
 * @param {string} parts function name parts.
 * @param {number} depth current depth.
 */
BirdWatcher.prototype.wrap = function(parts, depth) {
  /** @type {BirdWatcher} myself */
  var that = this;
  /** @type {*} target object */
  var obj;
  /** @type {string} object name */
  var name;
  /** @type {string} method method name */
  var method;
  /** @type {*} parent object */
  var parent;
  /** @type {number} loop counter */
  var i;
  /** @type {number} loop limiter */
  var il;
  /** @type {string} property name */
  var prop;
  /** @type {function} wrapper function */
  var wrapFunc;
  /** @type {Object} property descriptor */
  var propDesc;

  // depth limiter
  if (depth >= this.maxDepth) {
    return;
  }

  // target object
  obj = global[parts[0]];
  name = parts[0];
  for (i = 1, il = parts.length; i < il; ++i) {
    // update object, name
    obj = obj[parts[i]];
    name += parts[i].indexOf("'") === -1 ?
      ("['" + parts[i] + "']") : ('["' + parts[i] + '"]');

    // block prototype.constructor
    if (parts[i - 1] === 'prototype' && parts[i] === 'constructor') {
      return;
    }
  }

  switch (typeof obj) {
    // function
    case 'function':
      // setup
      if (this.wrapped[name] === void 0) {
        this.wrapped[name] = {
          self: 0,
          total: 0,
          count: 0
        };
        this.source[name] = obj;
      }

      // wrap
      if (typeof this.wrapped[name] === 'object') {
        method = parts.pop();
        parent = parts.length > 0 ? eval(parts.join('.')) : global;

        this.callgraph[name] = {};

        // avoid native method
        if (parent[method].apply === void 0) {
          break;
        }

        // constructor
        parent[method] = (function(name) {
          // prototype wrapper
          for (prop in obj.prototype) {
            if (USE_ECMA5) {
              propDesc = getPropDesc(obj.prototype, prop);
              if (propDesc && typeof propDesc.get === 'function') {
                continue;
              }
            }
            if (typeof(obj.prototype[prop]) === 'function') {
              that.wrap.call(
                that,
                parts.concat(method, 'prototype', prop),
                depth + 2
              );
            }
          }

          var f = Function;
          var p = typeof performance === 'object' ? performance : void 0;

          /**
           * wrap constructor function.
           * @return {*} original fnction's return value.
           * @private
           */
          var func = this[name] = function() {
            /** @type {function} original function */
            var sourceFunc = that.source[name];
            /** @type {Array} wrapped function list */
            var wrapped = that.wrapped;
            /** @type {Array} call stack */
            var stack = that.stack;
            /** @type {number} start time */
            var start;
            /** @type {*} original function's return value */
            var retval;
            /** @type {number} end time */
            var end;
            /** @type {number} run time */
            var sub;
            /** @type {name} prev stack name */
            var prev;
            /** @type {Object} callgraph */
            var callgraph = that.callgraph;

            //- benchmarks ------------------------------------------------
            stack.push(name);

            // 現在時刻取得を利用できるものの中から高精度、高速なものを選択.
            start =
              p && p.now       instanceof f ? p.now()       :
              p && p.webkitNow instanceof f ? p.webkitNow() :
              Date.now         instanceof f ? Date.now()    :
              /* default */                   +new Date();
            retval = sourceFunc.apply(this, arguments);
            end =
              p && p.now       instanceof f ? p.now()       :
              p && p.webkitNow instanceof f ? p.webkitNow() :
              Date.now         instanceof f ? Date.now()    :
              /* default */                   +new Date();

            stack.pop();
            //-------------------------------------------------------------

            // profiler countup
            sub = end - start;
            ++wrapped[name].count;
            wrapped[name].total += sub;
            wrapped[name].self += sub;

            // calculate self-time and callgraph
            if (stack.length > 0) {
              prev = stack[stack.length - 1];
              wrapped[prev].self -= sub;
              callgraph[prev][name] = callgraph[prev][name] + 1 || 1;
            }

            return retval;
          };

          // copy property
          for (prop in obj) {
            func[prop] = obj[prop];
          }

          // copy prototype
          func.prototype = obj.prototype;

          return func;
        }).call(global, name);
      }
      break;
      // namespace
    case 'object':
      if (obj !== null) {
        for (i in obj) {
          this.wrap(parts.concat(i), depth + 1);
        }
      }
      break;
  }
};

/**
 * report profiling result.
 */
BirdWatcher.prototype.report = function() {
  if (console && typeof console.log === 'function') {
    console.log(this.reportString());
    console.log(this.reportCallgraphString());
  }
};

/**
 * report callgraph string.
 * @return {string} callgraph string.
 */
BirdWatcher.prototype.reportCallgraphString = function() {
  /** @type {string} call-start function name */
  var from;
  /** @type {string} call-end function name */
  var to;
  /*: @type {Array.<Array>} lines buffer */
  var lines = [];
  /** @type {Array} line buffer */
  var line;
  /** @type {Array.<string>} output buffer */
  var result = [];
  /** @type {Array.<number>} max string length */
  var max = [0, 0, 0];
  /** @type {*} temporary variable for calculation */
  var tmp;
  /** @type {number} loop counter */
  var i;
  /** @type {number} loop limiter */
  var il;
  /** @type {number} loop counter */
  var j;
  /** @type {number} loop limiter */
  var jl;
  /** @type {Object} callgraph object shortcut */
  var callgraph = this.callgraph;

  // head
  line = ['from', 'to', 'count'];
  for (i = 0, il = line.length; i < il; ++i) {
    max[i] = Math.max(max[i], ('' + line[i]).length);
  }
  lines.push(line);

  // body
  for (from in callgraph) {
    i = callgraph[from];
    for (to in i) {
      if (i[to] > 0) {
        // line
        line = [from, to, i[to]];
        lines.push(line);

        // max
        for (tmp = 0, il = line.length; tmp < il; ++tmp) {
          max[tmp] = Math.max(max[tmp], ('' + line[tmp]).length);
        }
      }
    }
  }

  // print
  for(i = 0, il = lines.length; i < il; ++i) {
    line = lines[i];

    // print
    tmp = [];
    for (j = 0, jl = line.length; j < jl; ++j) {
      tmp[j] = x(' ', max[j] - (''+line[j]).length) + line[j];
    }
    result.push(tmp.join(' '));

    // head/body separator
    if (i === 0) {
      tmp = 0;
      for (j = 0, jl = max.length; j < jl; ++j) {
        tmp += max[j];
      }
      result.push(x('-', tmp + max.length - 1));
    }
  }

  return result.join("\n");
};

/**
 * report profile string.
 * @param {Object=} wrapped wrapped function list.
 * @return {string} profiling result.
 */
BirdWatcher.prototype.reportString = function(wrapped) {
  /** @type {Array.<string>} object keys */
  var keys = [];
  /** @type {number} loop counter */
  var i;
  /** @type {number} loop limiter */
  var il;
  /** @type {number} loop counter */
  var j;
  /** @type {number} loop limiter */
  var jl;
  /** @type {string} function name */
  var name;
  /** @type {Array.<number>} max string length */
  var max = [0, 0, 0, 0];
  /** @type {Array.<Arry>} lines buffer */
  var lines = [];
  /** @type {Array} line buffer */
  var line;
  /** @type {Array} output buffer */
  var result = [];
  /** @type {*} temporary variable for calulation */
  var tmp;

  if (wrapped === void 0) {
    wrapped = this.wrapped;
  }

  for (i in wrapped) {
    keys.push(i);
  }

  keys.sort(function(a, b) {
    return wrapped[a].self > wrapped[b].self ? -1 :
    wrapped[a].self < wrapped[b].self ? 1 :
    0;
  });

  // header
  line = ["function", "count", "total(ms)", "self(ms)"];
  for (i = 0, il = line.length; i < il; ++i) {
    max[i] = Math.max(max[i], ('' + line[i]).length);
  }
  lines.push(line);

  // body
  for (i = 0, il = keys.length; i < il; ++i) {
    name = keys[i];
    line = [name, wrapped[name].count, wrapped[name].total, wrapped[name].self];
    lines.push(line);

    // max
    for (j = 0, jl = line.length; j < jl; ++j) {
      max[j] = Math.max(max[j], ('' + line[j]).length);
    }
  }

  // print
  for(i = 0, il = lines.length; i < il; ++i) {
    line = lines[i];

    // count > 0
    if (i === 0 || line[1] > 0) {
      tmp = [];
      for (j = 0, jl = line.length; j < jl; ++j) {
        tmp[j] = x(' ', max[j] - (''+line[j]).length) + line[j];
      }
      result.push(tmp.join(' '));
    }
    // head/body separator
    if (i === 0) {
      tmp = 0;
      for (j = 0, jl = max.length; j < jl; ++j) {
        tmp += max[j];
      }
      result.push(x('-', tmp + max.length - 1));
    }
  }

  return result.join("\n");
};

/**
 * @param {string} url socket.io url string.
 * @param {Object} obj message object.
 */
BirdWatcher.prototype.send = (function() {
  /** @type {number} */
  var requestId = 0;

  return function() {
    switch (this.sendMethod) {
      case 'xhr':
        sendByXHR.apply(this, arguments);
        break;
      case 'img': /* FALLTHROUGH */
      default:
        sendByImg.apply(this, arguments);
        break;
    }
  };

  /**
   * @param {string} url socket.io url string.
   * @param {Object} obj message object.
   */
  function createRequestURL(url, obj) {
    return [
      url,
      url.charAt(url.length - 1) !== '/' ? '/' : '',
      '?',
      this.id,
      '+',
      requestId++,
      '&',
      escape(JSON.stringify(obj))
    ].join('');
  }

  /**
   * @param {string} url socket.io url string.
   * @param {Object} obj message object.
   */
  function sendByImg(url, obj) {
    /** @type {number} retry counter. */
    var retry = 0;
    /** @type {number} retry timer id. */
    var timer;
    /** @type {HTMLImageElement} dummy image element. */
    var img = document.createElement('img');

    img.style.display = 'none';
    img.src = createRequestURL(url, obj);

    document.body.appendChild(img);

    // 100ms ごと img 要素の削除を試行する(10回までリトライ)
    timer = setInterval(function() {
      try {
        img.parentNode.removeChild(img);
      } catch(e) {
        if (retry++ < 10) {
          return;
        }
      }
      clearInterval(timer);
    }, 100);
  }

  /**
   * @param {string} url socket.io url string.
   * @param {Object} obj message object.
   */
   function sendByXHR(url, obj) {
    /** @type {XMLHttpRequest} */
    var xhr = new XMLHttpRequest();

    xhr.open('GET', createRequestURL(url, obj), true);
    xhr.send();
  }
})();

/**
 * @param {...Object} var_args message objects.
 */
BirdWatcher.prototype.reportRemoteMessage = function() {
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  if (typeof this.reportId !== 'string') {
    throw new Error('invalid report identifier');
  }
  if (typeof this.reportUrl !== 'string') {
    throw new Error('invalid report url');
  }

  for (i = 0, il = arguments.length; i < il; ++i) {
    this.send(this.reportUrl, {
      id: this.reportId,
      data: {
        message: arguments[i]
      }
    });
  }
};

/**
 * report to remote.
 */
BirdWatcher.prototype.reportRemote = function() {
  var now = typeof Date.now === 'function' ? Date.now() : +new Date();
  this.reportRemoteMessage({type: 'stat',      date: now, data: this.wrapped});
  this.reportRemoteMessage({type: 'callgraph', date: now, data: this.callgraph});
};

BirdWatcher.prototype.enableRemoteLog = function() {
  var target = ['log', 'warn', 'error'];
  var fakeFunction = {
    log: fakeConsoleLog,
    warn: fakeConsoleWarn,
    error: fakeConsoleError
  };
  var that = this;
  var i;
  var il;
  var prop;

  for (i = 0, il = target.length; i < il; ++i) {
    prop = target[i];
    console[prop] = fakeFunction[prop];
  }

  function fakeConsoleLog() {
    that.reportRemoteMessage({
      type: 'log',
      date: +new Date(),
      data: Array.prototype.slice.apply(arguments)
    });
    return NativeConsoleFunction.log.apply(console, arguments);
  }
  function fakeConsoleWarn() {
    that.reportRemoteMessage({
      type: 'warn',
      date: +new Date(),
      data: Array.prototype.slice.apply(arguments)
    });
    return NativeConsoleFunction.warn.apply(console, arguments);
  }
  function fakeConsoleError() {
    that.reportRemoteMessage({
      type: 'error',
      date: +new Date(),
      data: Array.prototype.slice.apply(arguments)
    });
    return NativeConsoleFunction.error.apply(console, arguments);
  }
};

BirdWatcher.prototype.disableRemoteLog = function() {
  var target = ['log', 'warn', 'error'];
  var i;
  var il;
  var prop;

  for (i = 0, il = target.length; i < il; ++i) {
    prop = target[i];
    console[prop] = NativeConsoleFunction[prop];
  }
};

/**
 * generate repeated string.
 * @param {string} c source string.
 * @param {number} num repeat times.
 * @return {string} repeated string.
 * @private
 */
function x(c, num) {
  var str = '';
  while (num--) {
    str += c;
  }
  return str;
}

// end of scope
}).call(this, this);

/* vim:set expandtab ts=2 sw=2 tw=80: */
