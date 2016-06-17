/**
 * Firehose of all websocket events in the system with built-in buffering.
 */
angular.module('bridge.service')
.service('firehose', function(wsFactory, k8s, $rootScope) {
  'use strict';

  // TODO(sym3tri): reduce this down to a single websocket once upstream k8s changes are in.
  var sockets = {};

  function connectSocket(name) {
    const kind = k8s.enum.Kind[name];

    sockets[kind.labelPlural] = wsFactory(kind.labelPlural, {
      scope: $rootScope,
      host: 'auto',
      reconnect: true,
      path: k8s.resource.watchURL(kind),
      jsonParse: true,
      bufferEnabled: true,
      bufferFlushInterval: 500,
      bufferMax: 1000,
    }).onmessage(msg => {
      const eventTypes = k8s.events[kind.plural];
      let event;
      switch (msg.type) {
        case 'ADDED':
          event = eventTypes.ADDED;
          break;
        case 'MODIFIED':
          event = eventTypes.MODIFIED;
          break;
        case 'DELETED':
          event = eventTypes.DELETED;
          break;
        default:
          return;
      }
      $rootScope.$broadcast(event, { resource: msg.object });
    });
  }

  this.start = function() {
    ['POD', 'SERVICE', 'REPLICATIONCONTROLLER', 'REPLICASET', 'DEPLOYMENT', 'NODE', 'NAMESPACE', 'CONFIGMAP'].forEach(connectSocket);
  };

  this.lock = function() {};

  this.unlock = function() {};

});
