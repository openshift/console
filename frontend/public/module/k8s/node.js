'use strict';

angular.module('k8s')
.service('k8sNodes', function (_) {

  this.isReady = function isReady (node) {
    if (!node || !node.status || !node.status.conditions || !node.status.conditions.length) {
      return false;
    }

    const readyState = _.find(node.status.conditions, { type: 'Ready' });
    if (!readyState) {
      return false;
    }

    return readyState.status === 'True';
  };

  this.isTrusted = (node) => {
    const UNTRUSTED_ANNOTATION_KEY = 'com.coreos.tpm/untrusted';

    if (!node || !node.metadata || !node.metadata.annotations || !node.metadata.annotations.hasOwnProperty(UNTRUSTED_ANNOTATION_KEY)) {
      return false;
    }

    let untrusted;
    try {
      untrusted = JSON.parse(node.metadata.annotations[UNTRUSTED_ANNOTATION_KEY]);
    } catch (error) {
      untrusted = true; // we don't trust node with malformed annotation
    }

    return !untrusted;
  }
});
