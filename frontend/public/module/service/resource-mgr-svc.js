angular.module('bridge.service')
.service('resourceMgrSvc', function(k8s, arraySvc) {
  'use strict';

  // Updates a resource in a list if it exists and is newer,
  // or appends to the list if a previous version is not found.
  this.updateInList = function(list, resource) {
    var current;
    if (!list || !resource || !resource.metadata) {
      return;
    }

    current = k8s.util.findByUID(list, resource.metadata.uid);
    if (current && current.metadata && current.metadata.resourceVersion !==
          resource.metadata.resourceVersion) {
      arraySvc.remove(list, current);
    }
    list.push(resource);
  };

});
