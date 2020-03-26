import * as _ from 'lodash-es';

import { ContainerSpec, ContainerStatus, PodKind, Volume, VolumeMount } from './';

const getRestartPolicy = (pod: PodKind) =>
  _.find(
    {
      Always: {
        // A unique id to identify the type, used as the value when communicating with the API.
        id: 'Always',
        // What is shown in the UI.
        label: 'Always Restart',
        // Description in the UI.
        description:
          'If the container restarts for any reason, restart it. ' +
          'Useful for stateless services that may fail from time to time.',
        // Default selection for new pods.
        default: true,
      },
      OnFailure: {
        id: 'OnFailure',
        label: 'Restart On Failure',
        description: 'If the container exits with a non-zero status code, restart it.',
      },
      Never: {
        id: 'Never',
        label: 'Never Restart',
        description:
          'Never restart the container. ' +
          'Useful for containers that exit when they have completed a specific job, like a data import daemon.',
      },
    },
    { id: _.get<any, string>(pod, 'spec.restartPolicy') },
  );

export const VolumeSource = {
  emptyDir: {
    id: 'emptyDir',
    label: 'Container Volume',
    description: "Temporary directory that shares a pod's lifetime.",
  },
  hostPath: {
    id: 'hostPath',
    label: 'Host Directory',
    description:
      'Pre-existing host file or directory, ' +
      'generally for privileged system daemons or other agents tied to the host.',
  },
  gitRepo: {
    id: 'gitRepo',
    label: 'Git Repo',
    description: 'Git repository at a particular revision.',
  },
  nfs: {
    id: 'nfs',
    label: 'NFS',
    description: 'NFS volume that will be mounted in the host machine.',
  },
  secret: {
    id: 'secret',
    label: 'Secret',
    description: 'Secret to populate volume.',
  },
  gcePersistentDisk: {
    id: 'gcePersistentDisk',
    label: 'GCE Persistent Disk',
    description: 'GCE disk resource attached to the host machine on demand.',
  },
  awsElasticBlockStore: {
    id: 'awsElasticBlockStore',
    label: 'AWS Elastic Block Store',
    description: 'AWS disk resource attached to the host machine on demand.',
  },
  glusterfs: {
    id: 'glusterfs',
    label: 'Gluster FS',
    description: 'GlusterFS volume that will be mounted on the host machine.',
  },
  iscsi: {
    id: 'iscsi',
    label: 'iSCSI',
    description: 'iSCSI disk attached to host machine on demand',
  },
  configMap: {
    id: 'configMap',
    label: 'ConfigMap',
    description: 'ConfigMap to be consumed in volume.',
  },
  projected: {
    id: 'projected',
    label: 'Projected',
    description: 'A projected volume maps several existing volume sources into the same directory.',
  },
};

export const getVolumeType = (volume: Volume) => {
  if (!volume) {
    return null;
  }
  return _.find(VolumeSource, function(v) {
    return !!volume[v.id];
  });
};

const genericFormatter = (volInfo) => {
  const keys = Object.keys(volInfo).sort();
  const parts = keys.map(function(key) {
    if (key === 'readOnly') {
      return '';
    }
    return volInfo[key];
  });
  if (keys.indexOf('readOnly') !== -1) {
    parts.push(volInfo.readOnly ? 'ro' : 'rw');
  }
  return parts.join(' ') || null;
};

export const getVolumeLocation = (volume: Volume) => {
  const vtype = getVolumeType(volume);
  if (!vtype) {
    return null;
  }

  const typeID = vtype.id;
  const info = volume[typeID];
  switch (typeID) {
    // Override any special formatting cases.
    case VolumeSource.gitRepo.id:
      return `${info.repository}:${info.revision}`;
    case VolumeSource.configMap.id:
    case VolumeSource.emptyDir.id:
    case VolumeSource.secret.id:
    case VolumeSource.projected.id:
      return null;
    // Defaults to space separated sorted keys.
    default:
      return genericFormatter(info);
  }
};

export const getRestartPolicyLabel = (pod: PodKind) => _.get(getRestartPolicy(pod), 'label', '');

export type PodReadiness = string;
export type PodPhase = string;

export const getVolumeMountPermissions = (v: VolumeMount) => {
  if (!v) {
    return null;
  }

  return v.readOnly ? 'Read-only' : 'Read/Write';
};

export const getVolumeMountsByPermissions = (pod: PodKind) => {
  if (!pod || !pod.spec || !pod.spec.volumes) {
    return [];
  }
  const m = {};

  const volumes = (pod.spec.volumes || []).reduce((p, v: Volume) => {
    p[v.name] = v;
    return p;
  }, {});

  _.forEach(pod.spec.containers, (c: ContainerSpec) => {
    _.forEach(c.volumeMounts, (v: VolumeMount) => {
      const k = `${v.name}_${v.readOnly ? 'ro' : 'rw'}`;
      const mount = { container: c.name, mountPath: v.mountPath, subPath: v.subPath };
      if (k in m) {
        return m[k].mounts.push(mount);
      }
      m[k] = { mounts: [mount], name: v.name, readOnly: !!v.readOnly, volume: volumes[v.name] };
    });
  });

  return _.values(m);
};

export const podRestarts = (pod: PodKind): number => {
  if (!pod || !pod.status) {
    return 0;
  }
  const { initContainerStatuses = [], containerStatuses = [] } = pod.status;
  const isInitializing = initContainerStatuses.some(({ state }) => {
    return !state.terminated || state.terminated.exitCode !== 0;
  });
  const toCheck = isInitializing ? initContainerStatuses : containerStatuses;
  return toCheck.reduce(
    (restartCount, status: ContainerStatus) => restartCount + status.restartCount,
    0,
  );
};

export const podReadiness = (pod: PodKind): { readyCount: number; totalContainers: number } => {
  // Don't include init containers in readiness count. This is consistent with the CLI.
  const containerStatuses = pod?.status?.containerStatuses || [];
  return containerStatuses.reduce(
    (acc, { ready }: ContainerStatus) => {
      if (ready) {
        acc.readyCount = acc.readyCount + 1;
      }
      return acc;
    },
    { readyCount: 0, totalContainers: containerStatuses.length },
  );
};

// This logic is replicated from k8s (at this writing, Kubernetes 1.15)
// (See https://github.com/kubernetes/kubernetes/blob/release-1.15/pkg/printers/internalversion/printers.go)
export const podPhase = (pod: PodKind): PodPhase => {
  if (!pod || !pod.status) {
    return '';
  }

  if (pod.metadata.deletionTimestamp) {
    return 'Terminating';
  }

  if (pod.status.reason === 'Evicted') {
    return 'Evicted';
  }

  let initializing = false;
  let phase = pod.status.phase || pod.status.reason;

  _.each(pod.status.initContainerStatuses, (container: ContainerStatus, i: number) => {
    const { terminated, waiting } = container.state;
    if (terminated && terminated.exitCode === 0) {
      return true;
    }

    initializing = true;
    if (terminated && terminated.reason) {
      phase = `Init:${terminated.reason}`;
    } else if (terminated && !terminated.reason) {
      phase = terminated.signal
        ? `Init:Signal:${terminated.signal}`
        : `Init:ExitCode:${terminated.exitCode}`;
    } else if (waiting && waiting.reason && waiting.reason !== 'PodInitializing') {
      phase = `Init:${waiting.reason}`;
    } else {
      phase = `Init:${i}/${pod.status.initContainerStatuses.length}`;
    }
    return false;
  });

  if (!initializing) {
    let hasRunning = false;
    _.each(pod.status.containerStatuses, (container: ContainerStatus) => {
      const { running, terminated, waiting } = container.state;
      if (terminated && terminated.reason) {
        phase = terminated.reason;
      } else if (waiting && waiting.reason) {
        phase = waiting.reason;
      } else if (waiting && !waiting.reason) {
        phase = terminated.signal
          ? `Signal:${terminated.signal}`
          : `ExitCode:${terminated.exitCode}`;
      } else if (running && container.ready) {
        hasRunning = true;
      }
    });

    // Change pod status back to "Running" if there is at least one container
    // still reporting as "Running" status.
    if (phase === 'Completed' && hasRunning) {
      phase = 'Running';
    }
  }

  return phase;
};

export const podPhaseFilterReducer = (pod: PodKind): PodPhase => {
  const status = podPhase(pod);
  if (status === 'Terminating') {
    return status;
  }
  if (status.includes('CrashLoopBackOff')) {
    return 'CrashLoopBackOff';
  }
  return _.get(pod, 'status.phase', 'Unknown');
};
