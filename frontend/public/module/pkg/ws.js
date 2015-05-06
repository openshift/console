/**
 * @fileOverview
 * WebSocket factory and utility wrapper.
 * Uses angular scope to send events.
 *
 * TODO(sym3tri):
 *    - buffer messages?
 *    - auto-reconnect: on/off, exp backoff
 *    - disconnect/reconect when tab loses/gains focus
 *    - ability to defer opening socket to manual call
 *    - support default options.
 */

(function() {
  'use strict';

  function WSFactoryProvider() {

    var defaultOptions = {},
        wsCache = {};

    this.defaults = function(options) {
      if (options) {
        defaultOptions = options;
      } else {
        return defaultOptions;
      }
    };

    this.$get = function($log, $window) {

      function validOptions(o) {
        if (!o.host) {
          $log.error('missing required host argument');
          return false;
        }
        if (!o.scope) {
          $log.error('missing required scope argument');
          return false;
        }
        return true;
      }

      function createURL(host, path) {
        var url;

        if (host === 'auto') {
          if ($window.protocol === 'https:') {
            url = 'wss://';
          } else {
            url = 'ws://';
          }
          url += $window.location.host;
        } else {
          url = host;
        }

        if (path) {
          url += path;
        }
        return url;
      }

      function WebSocketWrapper(id, options) {
        var that = this;
        this.id = id;
        this.options = options;
        this.url = createURL(options.host, options.path);
        this.ws = new WebSocket(this.url);
        this.state = 'init';

        this.ws.onopen = function() {
          this.state = 'open';
          that._broadcast('open');
        };

        this.ws.onclose = function() {
          // TODO: pass along all arguments
          that.destroy();
        };

        this.ws.onerror = function(code, reason) {
          // TODO: pass along all arguments
          that._broadcast('error', code, reason);
        };

        this.ws.onmessage = function(e) {
          var data = e.data;
          if (this.state === 'destroyed') {
            return;
          }
          if (that.options.jsonParse) {
            data = JSON.parse(data);
          }
          that._broadcast('message', data);
        };

        this._deregisterFns = [
          options.scope.$on('$destroy', function() {
            that.destroy();
          })
        ];
      }

      WebSocketWrapper.prototype._broadcast = function(type) {
        var name, args;
        if (this.state === 'destroyed') {
          return;
        }
        name = 'ws.' + type + '.' + this.id;
        args = Array.prototype.slice.call(arguments);
        args.shift();
        args.unshift(name);
        this.options.scope.$broadcast.apply(this.options.scope, args);
      };

      WebSocketWrapper.prototype.destroy = function() {
        if (this.state === 'destroyed') {
          return;
        }
        this.ws.close();
        this.state = 'destroyed';
        this._broadcast('close');
        this._deregisterFns.forEach(function(deregister) {
          deregister();
        });
        delete wsCache[this.id];
        delete this.ws;
        delete this.options;
      };

      function wsFactory(id, options) {
        if (!options) {
          return wsCache[id];
        }
        // websocket with id already exists
        if (wsCache[id]) {
          return wsCache[id];
        }
        // create new websocket
        if (validOptions(options)) {
          wsCache[id] = new WebSocketWrapper(id, options);
          return wsCache[id];
        }
      }

      wsFactory.destroy = function(id) {
        var ws = wsCache[id];
        if (!ws) {
          return;
        }
        ws.destroy();
      };

      wsFactory.destroyAll = function() {
        Object.keys(wsCache).forEach(wsFactory.destroy);
      };

      return wsFactory;
    };

  }

  angular.module('core.pkg').provider('wsFactory', WSFactoryProvider);

}());
