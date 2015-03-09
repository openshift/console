angular.module('k8s')
.service('k8sPods', function(_, k8sDocker, k8sUtil, k8sEnum) {
  'use strict';

  var defaultRestartPolicy = _.find(k8sEnum.RestartPolicy, function(o) { return o.default; });

  this.clean = function(pod) {
    k8sUtil.nullifyEmpty(pod.metadata, ['annotations', 'labels']);
    k8sUtil.nullifyEmpty(pod.spec, ['volumes']);
    _.each(pod.spec.containers, function(c) {
      k8sDocker.clean(c);
    });
    k8sUtil.deleteNulls(pod.metadata);
    k8sUtil.deleteNulls(pod.spec);
  };

  this.getRestartPolicyByValue = function(value) {
    return _.find(k8sEnum.RestartPolicy, function(o) {
      return _.keys(o.value)[0] === _.keys(value)[0];
    });
  };

  this.getRestartPolicyById = function(id) {
    return _.find(k8sEnum.RestartPolicy, function(o) { return o.id === id; });
  };

  this.getEmpty = function(ns) {
    return {
      metadata: {
        annotations: [],
        labels: [],
        name: null,
        namespace: ns || k8sEnum.DefaultNS,
      },
      spec: {
        containers: [],
        dnsPolicy: 'Default',
        restartPolicy: defaultRestartPolicy.value,
        volumes: [],
      },
    };
  };

  this.getEmptyVolume = function() {
    return {
      name: null,
      source: {
        emptyDir: null,
        gitRepo: null,
        hostPath: null,
        persistentDisk: null,
      }
    };
  };

});
