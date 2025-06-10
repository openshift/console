import * as _ from 'lodash-es';
import i18next from 'i18next';
import { PodPhase } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ContainerSpec, ContainerStatus, PodKind, Volume, VolumeMount } from './types';

export type {
  PodPhase,
  PodReadiness,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';

const getRestartPolicy = (pod: PodKind) =>
  _.find(
    {
      Always: {
        // A unique id to identify the type, used as the value when communicating with the API.
        id: 'Always',
        // What is shown in the UI.
        label: i18next.t('public~Always restart'),
        // Description in the UI.
        description: i18next.t(
          'public~If the container restarts for any reason, restart it. Useful for stateless services that may fail from time to time.',
        ),
        // Default selection for new pods.
        default: true,
      },
      OnFailure: {
        id: 'OnFailure',
        label: i18next.t('public~Restart on failure'),
        description: i18next.t(
          'public~If the container exits with a non-zero status code, restart it.',
        ),
      },
      Never: {
        id: 'Never',
        label: i18next.t('public~Never restart'),
        description: i18next.t(
          'public~Never restart the container. Useful for containers that exit when they have completed a specific job, like a data import daemon.',
        ),
      },
    },
    { id: _.get<any, string>(pod, 'spec.restartPolicy') },
  );

export const VolumeSource = {
  emptyDir: {
    id: 'emptyDir',
    label: i18next.t('public~Container volume'),
    description: i18next.t("public~Temporary directory that shares a pod's lifetime."),
  },
  hostPath: {
    id: 'hostPath',
    label: i18next.t('public~Host directory'),
    description: i18next.t(
      'public~Pre-existing host file or directory, generally for privileged system daemons or other agents tied to the host.',
    ),
  },
  gitRepo: {
    id: 'gitRepo',
    label: i18next.t('public~Git repo'),
    description: i18next.t('public~Git repository at a particular revision.'),
  },
  nfs: {
    id: 'nfs',
    label: i18next.t('public~NFS'),
    description: i18next.t('public~NFS volume that will be mounted in the host machine.'),
  },
  secret: {
    id: 'secret',
    label: i18next.t('public~Secret'),
    description: i18next.t('public~Secret to populate volume.'),
  },
  gcePersistentDisk: {
    id: 'gcePersistentDisk',
    label: i18next.t('public~GCE Persistent Disk'),
    description: i18next.t('public~GCE disk resource attached to the host machine on demand.'),
  },
  awsElasticBlockStore: {
    id: 'awsElasticBlockStore',
    label: i18next.t('public~AWS Elastic Block Store'),
    description: i18next.t('public~AWS disk resource attached to the host machine on demand.'),
  },
  glusterfs: {
    id: 'glusterfs',
    label: i18next.t('public~Gluster FS'),
    description: i18next.t('public~GlusterFS volume that will be mounted on the host machine.'),
  },
  iscsi: {
    id: 'iscsi',
    label: i18next.t('public~iSCSI'),
    description: i18next.t('public~iSCSI disk attached to host machine on demand'),
  },
  configMap: {
    id: 'configMap',
    label: i18next.t('public~ConfigMap'),
    description: i18next.t('public~ConfigMap to be consumed in volume.'),
  },
  projected: {
    id: 'projected',
    label: i18next.t('public~Projected'),
    description: i18next.t(
      'public~A projected volume maps several existing volume sources into the same directory.',
    ),
  },
};

export const getVolumeType = (volume: Volume) => {
  if (!volume) {
    return null;
  }
  return _.find(VolumeSource, function (v) {
    return !!volume[v.id];
  });
};

const genericFormatter = (volInfo) => {
  const keys = Object.keys(volInfo).sort();
  const parts = keys.map(function (key) {
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
  // Include init containers in readiness count if ready and started is true. This is consistent with the CLI.
  const containerStatuses = pod?.status?.containerStatuses || [];
  const initContainerStatuses = pod?.status?.initContainerStatuses || [];

  const totalContainers =
    containerStatuses.length + initContainerStatuses.filter(({ started }) => started).length;

  const readyCount =
    containerStatuses.reduce((acc, { ready }: ContainerStatus) => (ready ? acc + 1 : acc), 0) +
    initContainerStatuses.reduce(
      (acc, { started, ready }: ContainerStatus) => (started && ready ? acc + 1 : acc),
      0,
    );

  return { readyCount, totalContainers };
};

// This logic is replicated from k8s (at this writing, Kubernetes 1.17)
// (See https://github.com/kubernetes/kubernetes/blob/release-1.17/pkg/printers/internalversion/printers.go)
export const podPhase = (pod: PodKind): PodPhase => {
  if (!pod || !pod.status) {
    return '';
  }

  if (pod.metadata.deletionTimestamp) {
    return 'Terminating';
  }

  if (pod.status.reason === 'NodeLost') {
    return 'Unknown';
  }

  if (pod.status.reason === 'Evicted') {
    return 'Evicted';
  }

  let initializing = false;
  let phase = pod.status.phase || pod.status.reason;

  _.each(pod.status.initContainerStatuses, (container: ContainerStatus, i: number) => {
    const { terminated, waiting } = container.state;
    const initContainerSpec = pod.spec.initContainers.find((c) => c.name === container.name);

    if (terminated && terminated.exitCode === 0) {
      return true;
    }

    if (initContainerSpec?.restartPolicy === 'Always' && container.started) {
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
    const containerStatuses = pod.status.containerStatuses || [];
    for (let i = containerStatuses.length - 1; i >= 0; i--) {
      const {
        state: { running, terminated, waiting },
        ready,
      } = containerStatuses[i];
      if (terminated && terminated.reason) {
        phase = terminated.reason;
      } else if (waiting && waiting.reason) {
        phase = waiting.reason;
      } else if (waiting && !waiting.reason) {
        phase = terminated.signal
          ? `Signal:${terminated.signal}`
          : `ExitCode:${terminated.exitCode}`;
      } else if (running && ready) {
        hasRunning = true;
      }
    }

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

export const isWindowsPod = (pod: PodKind): boolean => {
  return pod?.spec?.tolerations?.some((t) => t.key === 'os' && t.value === 'Windows');
};

export const isContainerCrashLoopBackOff = (pod: PodKind, containerName: string): boolean => {
  const containerStatus = pod?.status?.containerStatuses?.find((c) => c.name === containerName);
  const waitingReason = containerStatus?.state?.waiting?.reason;
  return waitingReason === 'CrashLoopBackOff';
};
