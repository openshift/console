angular.module('k8s')
.service('k8sNodes', function(_) {
  'use strict';

  this.isReady = function(node) {
    var readyState;
    if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
      return false;
    }

    readyState = _.findWhere(node.status.conditions, { type: 'Ready' });
    if (!readyState) {
      return false;
    }

    if (readyState.status.toLowerCase() === true) {
      return true;
    }

    if (readyState.status.toLowerCase() === 'true') {
      return true;
    }

    return false;
  };

  this.getReadyStateLabel = function(node) {
    return this.isReady(node) ? 'Ready' : 'Not Ready';
  }.bind(this);

});
