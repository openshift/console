angular.module('k8s')
.provider('k8sConfig', function() {
  'use strict';

  var basePath;
  this.setBasePath = function(path) {
    basePath = path;
  };
  this.$get = function() {
    return {
      getBasePath: function() {
        return basePath;
      },
    };
  };
})

.service('k8s', function(_, k8sEvents, k8sEnum, k8sResource, k8sUtil, k8sLabels, k8sPods, k8sServices, k8sDocker,
  k8sReplicationcontrollers, k8sLifecycle) {
  'use strict';

  this.lifecycle = k8sLifecycle;
  this.labels = k8sLabels;
  this.events = k8sEvents;
  this.enum = k8sEnum;
  this.docker = k8sDocker;
  this.resource = k8sResource;
  this.search = k8sResource.list;
  this.util = k8sUtil;
  this.nodes = {
    list: _.partial(k8sResource.list, k8sEnum.Kind.NODE),
    get: _.partial(k8sResource.get, k8sEnum.Kind.NODE),
  };

  this.services = _.extend(k8sServices, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.SERVICE),
    get: _.partial(k8sResource.get, k8sEnum.Kind.SERVICE),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.SERVICE),
    create: function(svc) {
      k8sServices.clean(svc);
      return k8sResource.create(k8sEnum.Kind.SERVICE, svc);
    },
    update: function(svc) {
      k8sServices.clean(svc);
      return k8sResource.update(k8sEnum.Kind.SERVICE, svc);
    },
  });

  this.pods = _.extend(k8sPods, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.POD),
    get: _.partial(k8sResource.get, k8sEnum.Kind.POD),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.POD),
    create: function(pod) {
      k8sPods.clean(pod);
      return k8sResource.create(k8sEnum.Kind.POD, pod);
    },
    update: function(pod) {
      k8sPods.clean(pod);
      return k8sResource.update(k8sEnum.Kind.POD, pod);
    },
  });

  // Gets all the pods running on a given node.
  this.pods.listByNode = function(node) {
    // TODO(sym3tri): filter by label query for machine first if possible.
    return this.pods.list().then(function(pods) {
      return _.filter(pods, function(p) {
        return p.status && p.status.host === node.metadata.name;
      });
    });
  }.bind(this);

  this.replicationcontrollers = _.extend(k8sReplicationcontrollers, {
    list: _.partial(k8sResource.list, k8sEnum.Kind.REPLICATIONCONTROLLER),
    get: _.partial(k8sResource.get, k8sEnum.Kind.REPLICATIONCONTROLLER),
    delete: _.partial(k8sResource.delete, k8sEnum.Kind.REPLICATIONCONTROLLER),
    create: function(rc) {
      k8sReplicationcontrollers.clean(rc);
      return k8sResource.create(k8sEnum.Kind.REPLICATIONCONTROLLER, rc);
    },
    update: function(rc) {
      k8sReplicationcontrollers.clean(rc);
      return k8sResource.update(k8sEnum.Kind.REPLICATIONCONTROLLER, rc);
    },
  });

});
