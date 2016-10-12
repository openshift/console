angular.module('k8s')
.service('k8sPods', function(_, k8sDocker, k8sUtil, k8sEnum, $http, k8sResource) {
  'use strict';

  var defaultRestartPolicy = _.find(k8sEnum.RestartPolicy, function(o) { return o.default; });
  var fieldSelectors;

  this.log = function (podName, ns) {
    return $http({
      url: k8sResource.resourceURL(k8sEnum.Kind.POD, {ns: ns, name: podName, path: 'log'}),
      method: 'GET',
    })
    .then(function(result) {
      return result.data;
    });
  }

  this.clean = function(pod) {
    k8sUtil.nullifyEmpty(pod.metadata, ['annotations', 'labels']);
    k8sUtil.nullifyEmpty(pod.spec, ['volumes']);
    _.forEach(pod.spec.containers, function(c) {
      k8sDocker.clean(c);
    });
    k8sUtil.deleteNulls(pod.metadata);
    k8sUtil.deleteNulls(pod.spec);
  };

  fieldSelectors = {};

  fieldSelectors.nodeName = function(nodeName) {
    return 'spec.nodeName=' + nodeName;
  };

  fieldSelectors.node = function(node) {
    return fieldSelectors.nodeName(node.metadata.name);
  };

  this.fieldSelectors = fieldSelectors;

  this.getRestartPolicyById = function(id) {
    return _.find(k8sEnum.RestartPolicy, { id: id });
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
        dnsPolicy: 'ClusterFirst',
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
    _.forEach(k8sEnum.VolumeSource, function(v) {
      vol[v.id] = null;
    });
    return vol;
  };

  this.getVolumeType = function(volume) {
    if (!volume) {
      return null;
    }
    return _.find(k8sEnum.VolumeSource, function(v) {
      return !!volume[v.id];
    });
  };

  this.getVolumeMountPermissions = function(v) {
    if (!v){
      return null;
    }

    return v.readOnly ? 'Read-only' : 'Read/Write';
  }.bind(this);

  this.getVolumeMountsByPermissions = function(pod) {
    var m = {};

    if (!pod || !pod.spec) {
      return [];
    }

    var volumes = pod.spec.volumes.reduce((p, v) => {
      p[v.name] = v;
      return p;
    }, {});

    _.forEach(pod.spec.containers, function(c) {
      _.forEach(c.volumeMounts, function(v) {
        let k = `${v.name}_${v.readOnly ? 'ro' : 'rw'}`;
        let mount = {container: c.name, mountPath: v.mountPath};
        if ( k in m) {
          return m[k].mounts.push(mount);
        }
        m[k] = {mounts: [mount], name: v.name, readOnly: !!v.readOnly, volume: volumes[v.name]};
      });
    });

    return _.values(m);
  }.bind(this);

  this.getVolumeLocation = function(volume) {
    var vtype = this.getVolumeType(volume), info, typeID;

    if (!vtype) {
      return null;
    }

    function readOnlySuffix(readonly) {
      return '(' + (readonly ? 'ro' : 'rw') + ')';
    }

    function genericFormatter(volInfo) {
      var keys = Object.keys(volInfo).sort();
      var parts = keys.map(function(key) {
        if (key === 'readOnly') {
          return '';
        }
        return volInfo[key];
      });
      if (keys.indexOf('readOnly') !== -1) {
        parts.push(readOnlySuffix(volInfo.readOnly));
      }
      return parts.join(' ') || null;
    }

    typeID = vtype.id;
    info = volume[typeID];
    switch (typeID) {
      // Override any special formatting cases.
      case k8sEnum.VolumeSource.gitRepo.id:
        return info.repository + ':' + info.revision;
      case k8sEnum.VolumeSource.configMap.id:
      case k8sEnum.VolumeSource.emptyDir.id:
      case k8sEnum.VolumeSource.secret.id:
        return null;
      // Defaults to space separated sorted keys.
      default:
        return genericFormatter(info);
    }

    return '';
  }.bind(this);

});
