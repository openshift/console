
// for eval
global.angular = (function () {
  'use strict';

  var noop = function () {};

  var noobject = (function () {
    if (global.Proxy && Proxy.createFunction) {
      var p = Proxy.createFunction({
        getOwnPropertyDescriptor: function (name) {
          return Object.getOwnPropertyDescriptor({}, name)
        },
        getPropertyDescriptor: function (name) {
          return Object.getPropertyDescriptor({}, name)
        },
        get: function (reciever, name) {
          return p;
        },
        getOwnPropertyNames: function () {
          return Object.getOwnPropertyNames({});
        },
        getPropertyNames: function () {
          return Object.getPropertyNames({});
        }
      }, function () {
        return p;
      });

      return p;
    } else {
      return noop;
    }
  }());

  function createStack () {
    return (new Error()).stack;
  }

  var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
  var FN_ARG_SPLIT = /,/;
  var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
  var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

  function annotate (fn) {
    var $inject,
        fnText,
        argDecl,
        last;

    if (typeof fn == 'function') {
      if (!($inject = fn.$inject)) {
        $inject = [];
        fnText = fn.toString().replace(STRIP_COMMENTS, '');
        argDecl = fnText.match(FN_ARGS);
        argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg) {
          arg.replace(FN_ARG, function(all, underscore, name) {
            $inject.push(name);
          });
        });
      }
    } else if (fn instanceof Array) {
      last = fn.length - 1;
      $inject = fn.slice(0, last);
    }
    return $inject;
  }

  function constructArray (fn, dependencies) {
    return '[' +
      dependencies.
        map(function (arg) {
          return "'" + arg + "'";
        }).
        concat([
          fn.toString()
        ]).
        join(', ') +
      ']';
  }

  function mock (name, fn) {
    if (fn instanceof Array) {
      return module;
    } else if (typeof fn === 'object') {
      Object.keys(fn).forEach(function (prop) {
        mock(null, fn[prop]);
      });
      return module;
    }

    var original = fn.toString();
    var dependencies = annotate(fn);

    if (dependencies.length === 0) {
      return module;
    }

    var frame = createStack().split('\n').filter(function (line) {
      return line.indexOf('eval') > 0;
    }).join('')

    var match = /\<anonymous\>:([0-9]+):([0-9]+)/.exec(frame);
    var line = parseInt(match[1], 10);
    var col = parseInt(match[2], 10);

    var before = global.js.split('\n').
                           slice(0);

    before.length = line;
    before[before.length-1] = before[before.length-1].substr(0, col-1)

    before = before.join('\n');

    var after = global.js.split('\n').slice(line-1).join('\n').substr(col-1);

    var rewritten = constructArray(original, dependencies);

    global.js = before + after.replace(original, rewritten);

    return module;
  }

  var module = {
    controller: mock,

    directive: function (name, fn) {
      mock(name, fn);
      if (typeof fn === 'function') {
        var controller = (new fn()).controller;
        if (controller && typeof controller === 'function') {
          mock(null, controller);
        }
      }
    },

    filter: mock,
    service: mock,
    factory: mock,

    constant: function () { return module; },
    value: function () { return module; },

    provider: function (name, fn) {
      mock(name, fn);
      if (typeof fn === 'function') {
        var $get = (new fn()).$get;
        if ($get && typeof $get === 'function') {
          mock(null, $get);
        }
      }
      return module;
    },
    decorator: mock,

    config: function (fn) {
      // gotta account for controller: [function] and resolve: { map }

      // let's pretend we know that routeProvider is the first arg

      var ret = mock(null, fn);

      var mockRouteProvider = {
        when: function (path, obj) {
          if (typeof obj.controller === 'function') {
            mock(null, obj.controller);
          }
          if (typeof obj.resolve === 'object') {
            Object.keys(obj.resolve).forEach(function (key) {
              if (typeof obj.resolve[key] === 'function') {
                mock(null, obj.resolve[key])
              }
            });
          }
          return this;
        }
      }

      var routeProviderIndex = annotate(fn).indexOf('$routeProvider');
      if (routeProviderIndex > -1) {

        var argArray = annotate(fn).map(function () {
          return noobject;
        });

        argArray[routeProviderIndex] = mockRouteProvider;

        fn.apply(null, argArray);
      }

      return ret;
    },
    run: function (fn) { return mock(null, fn); }
  };

  return {
    module: function () {
      return module;
    }
  };
}());

// naive safeguard against arbitrary code execution
global.require = function () {};

module.exports = function run (js) {
  global.js = js;
  eval(global.js);

  return global.js;
};
