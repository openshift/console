/**
 * Firehose of all websocket events in the system with built-in buffering.
 */
angular.module('bridge.service')
.service('firehose', function(_, wsFactory, k8s, $interval, $rootScope) {
  'use strict';

  // TODO(sym3tri): reduce this down to a single websocket once upstream k8s changes are in.
  var sockets = {};

  function connectSocket(id, kind) {
    return wsFactory(id, {
      scope: $rootScope,
      host: 'auto',
      reconnect: true,
      path: k8s.resource.watchURL(kind),
      jsonParse: true,
      bufferEnabled: true,
      bufferFlushInterval: 500,
      bufferMax: 1000,
    });
  }

  // Emits a resource event from a websocket msg.
  function emitPodEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.POD_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.POD_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.POD_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitServiceEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.SERVICE_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.SERVICE_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.SERVICE_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitRCEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.RC_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.RC_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.RC_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitRSEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.RS_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.RS_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.RS_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitDeploymentEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.DEPLOYMENT_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.DEPLOYMENT_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.DEPLOYMENT_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitNodeEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.NODE_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.NODE_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.NODE_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  function emitNamespaceEvent(msg) {
    var evt;
    switch (msg.type) {
      case 'ADDED':
        evt = k8s.events.NAMESPACE_ADDED;
        break;
      case 'MODIFIED':
        evt = k8s.events.NAMESPACE_MODIFIED;
        break;
      case 'DELETED':
        evt = k8s.events.NAMESPACE_DELETED;
        break;
    }
    if (evt) {
      $rootScope.$broadcast(evt, { resource: msg.object });
    }
  }

  this.start = function() {
    sockets.podList = connectSocket('podList', k8s.enum.Kind.POD)
      .onmessage(emitPodEvent);

    sockets.serviceList = connectSocket('serviceList', k8s.enum.Kind.SERVICE)
      .onmessage(emitServiceEvent);

    sockets.rcList = connectSocket('rcList', k8s.enum.Kind.REPLICATIONCONTROLLER)
      .onmessage(emitRCEvent);

    sockets.rsList = connectSocket('rsList', k8s.enum.Kind.REPLICASET)
      .onmessage(emitRSEvent);

    sockets.deploymentList = connectSocket('deploymentList', k8s.enum.Kind.DEPLOYMENT)
      .onmessage(emitDeploymentEvent);

    sockets.nodeList = connectSocket('nodeList', k8s.enum.Kind.NODE)
      .onmessage(emitNodeEvent);

    sockets.namespaceList = connectSocket('namespaceList', k8s.enum.Kind.NAMESPACE)
      .onmessage(emitNamespaceEvent);
  };

  this.lock = function() {
  };

  this.unlock = function() {
  };

});
