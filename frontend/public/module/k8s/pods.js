angular.module('k8s')
.service('k8sPods', function(_, pkg, k8sDocker, k8sUtil, k8sEnum) {
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

  this.getRestartPolicyById = function(id) {
    return _.findWhere(k8sEnum.RestartPolicy, { id: id });
  };

  this.getRestartPolicyLabelById = function(id) {
    var p = this.getRestartPolicyById(id);
    if (p && p.label) {
      return p.label;
    }
    return '';
  }.bind(this);

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
        restartPolicy: defaultRestartPolicy.id,
        volumes: [],
      },
    };
  };

  this.getEmptyVolume = function() {
    var vol = {
      name: null,
    };
    // Add all known volume types to the empty volume for binding.
    _.each(k8sEnum.VolumeSource, function(v) {
      vol[v.id] = null;
    });
    return vol;
  };

  this.getVolumeType = function(volume) {
    if (!volume) {
      return null;
    }
    return _.find(k8sEnum.VolumeSource, function(v) {
      return !pkg.isEmpty(volume[v.id]);
    });
  };

});
