'use strict';

angular.module('k8s')
.service('k8sNodes', function (_) {

  this.isReady = function isReady (node) {
    if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
      return false;
    }

    const readyState = _.findWhere(node.status.conditions, { type: 'Ready' });
    if (!readyState) {
      return false;
    }

    return readyState.status === 'True';
  };

  this.isTrusted = (node) => {
    const untrusted = node.metadata.annotations['com.coreos.tpm/untrusted'];
    if (untrusted === undefined) {
      return false;
    }

    return !JSON.parse(untrusted);
  }
});
