import * as k8sDocker from './docker';
import {k8sEnum} from './enum';
import {util} from './util';

const defaultRestartPolicy = _.find(k8sEnum.RestartPolicy, o => o.default);

const getRestartPolicyById = id => _.find(k8sEnum.RestartPolicy, {id});

export const clean = pod => {
  util.nullifyEmpty(pod.metadata, ['annotations', 'labels']);
  util.nullifyEmpty(pod.spec, ['volumes']);
  _.forEach(pod.spec.containers, function(c) {
    k8sDocker.clean(c);
  });
  util.deleteNulls(pod.metadata);
  util.deleteNulls(pod.spec);
};

export const getRestartPolicyLabelById = id => {
  var p = getRestartPolicyById(id);
  if (p && p.label) {
    return p.label;
  }
  return '';
};

export const getEmpty = ns => {
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

export const getVolumeType = volume => {
  if (!volume) {
    return null;
  }
  return _.find(k8sEnum.VolumeSource, function(v) {
    return !!volume[v.id];
  });
};

export const getVolumeMountPermissions = v => {
  if (!v) {
    return null;
  }

  return v.readOnly ? 'Read-only' : 'Read/Write';
};

export const getVolumeMountsByPermissions = pod => {
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
};

export const getVolumeLocation = volume => {
  var vtype = getVolumeType(volume), info, typeID;

  if (!vtype) {
    return null;
  }

  function readOnlySuffix(readonly) {
    return `(${readonly ? 'ro' : 'rw'})`;
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
      return `${info.repository}:${info.revision}`;
    case k8sEnum.VolumeSource.configMap.id:
    case k8sEnum.VolumeSource.emptyDir.id:
    case k8sEnum.VolumeSource.secret.id:
      return null;
    // Defaults to space separated sorted keys.
    default:
      return genericFormatter(info);
  }
};
