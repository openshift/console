import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { parseNumber } from '../../utils';
import { getAnnotationKeySuffix, getStatusPhase } from '../../selectors/selectors';
import {
  isMigrating,
  findVMIMigration,
  getMigrationStatusPhase,
} from '../../selectors/vmi-migration';
import {
  findVMPod,
  getVMImporterPods,
  getPodStatusPhase,
  getPodContainerStatuses,
} from '../../selectors/pod/selectors';
import {
  isVMRunning,
  isVMReady,
  isVMCreated,
  findConversionPod,
  getVMStatusConditions,
} from '../../selectors/vm';
import { getPodStatus } from '../pod/pod';
import {
  POD_STATUS_ALL_ERROR,
  POD_STATUS_ALL_READY,
  POD_STATUS_NOT_SCHEDULABLE,
  POD_PHASE_SUCEEDED,
  POD_PHASE_PENDING,
} from '../pod/constants';
import { NOT_HANDLED } from '../constants';
import { VMKind, VMIKind } from '../../types';
import {
  VM_STATUS_V2V_CONVERSION_ERROR,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
  VM_STATUS_POD_ERROR,
  VM_STATUS_ERROR,
  VM_STATUS_IMPORT_ERROR,
  VM_STATUS_IMPORTING,
  VM_STATUS_MIGRATING,
  VM_STATUS_OFF,
  VM_STATUS_RUNNING,
  VM_STATUS_STARTING,
  VM_STATUS_STOPPING,
  VM_STATUS_VMI_WAITING,
  VM_STATUS_UNKNOWN,
  VM_SIMPLE_STATUS_OTHER,
  VM_STATUS_V2V_CONVERSION_PENDING,
  CONVERSION_PROGRESS_ANNOTATION,
} from './constants';
import { Status } from '..';

const isBeingMigrated = (vm: VMKind, migrations?: K8sResourceKind[]): VMStatus => {
  const migration = findVMIMigration(vm, migrations);
  if (isMigrating(migration)) {
    return { status: VM_STATUS_MIGRATING, message: getMigrationStatusPhase(migration) };
  }
  return NOT_HANDLED;
};

const isBeingStopped = (vm: VMKind, launcherPod: PodKind = null): VMStatus => {
  if (isVMReady(vm) || isVMCreated(vm)) {
    const podStatus = getPodStatus(launcherPod);
    const containerStatuses = getPodContainerStatuses(launcherPod);

    if (containerStatuses) {
      const terminatedContainers = containerStatuses.filter(
        (containerStatus) => containerStatus.state.terminated,
      );
      const runningContainers = containerStatuses.filter(
        (containerStatus) => containerStatus.state.running,
      );
      if (terminatedContainers.length > 0 || (runningContainers.length > 0 && !isVMRunning(vm))) {
        return {
          ...podStatus,
          status: VM_STATUS_STOPPING,
          launcherPod,
        };
      }
    }
  }

  return NOT_HANDLED;
};

const isRunning = (vm: VMKind): VMStatus =>
  isVMRunning(vm) ? NOT_HANDLED : { status: VM_STATUS_OFF };

const isReady = (vmi: VMIKind, launcherPod: PodKind): VMStatus => {
  if ((getStatusPhase(vmi) || '').toLowerCase() === 'running') {
    // we are all set
    return {
      status: VM_STATUS_RUNNING,
      launcherPod,
    };
  }
  return NOT_HANDLED;
};

const isVMError = (vm: VMKind): VMStatus => {
  // is an issue with the VM definition?
  const condition = getVMStatusConditions(vm)[0];
  if (condition) {
    // Do we need to analyze additional conditions in the array? Probably not.
    if (condition.type === 'Failure') {
      return { status: VM_STATUS_ERROR, message: condition.message };
    }
  }
  return NOT_HANDLED;
};

const isCreated = (vm: VMKind, launcherPod: PodKind = null): VMStatus => {
  if (isVMCreated(vm)) {
    // created but not yet ready
    if (launcherPod) {
      const podStatus = getPodStatus(launcherPod);
      if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
        return {
          ...podStatus,
          status: VM_STATUS_POD_ERROR,
          launcherPod,
        };
      }
      if (!POD_STATUS_ALL_READY.includes(podStatus.status)) {
        return {
          ...podStatus,
          status: VM_STATUS_STARTING,
          launcherPod,
        };
      }
    }
    return { status: VM_STATUS_STARTING, launcherPod };
  }
  return NOT_HANDLED;
};

const isBeingImported = (vm: VMKind, pods?: PodKind[]): VMStatus => {
  const importerPods = getVMImporterPods(vm, pods);
  if (importerPods && importerPods.length > 0 && !isVMCreated(vm)) {
    const importerPodsStatuses = importerPods.map((pod) => {
      const podStatus = getPodStatus(pod);
      if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
        return {
          ...podStatus,
          message: POD_STATUS_NOT_SCHEDULABLE
            ? 'Importer pod scheduling failed.'
            : podStatus.message,
          status: VM_STATUS_IMPORT_ERROR,
          pod,
        };
      }
      return {
        status: VM_STATUS_IMPORTING,
        message: podStatus.message,
        pod,
      };
    });
    const importErrorStatus = importerPodsStatuses.find(
      (status) => status.status === VM_STATUS_IMPORT_ERROR,
    );
    const message = importerPodsStatuses
      .map((podStatus) => `${podStatus.pod.metadata.name}: ${podStatus.message}`)
      .join('\n\n');

    return {
      status: importErrorStatus ? importErrorStatus.status : VM_STATUS_IMPORTING,
      message,
      pod: importErrorStatus ? importErrorStatus.pod : importerPods[0],
      importerPodsStatuses,
    };
  }
  return NOT_HANDLED;
};

const isV2VConversion = (vm: VMKind, pods?: PodKind[]): VMStatus => {
  const conversionPod = findConversionPod(vm, pods);
  const podPhase = getPodStatusPhase(conversionPod);
  if (conversionPod && podPhase !== POD_PHASE_SUCEEDED) {
    const conversionPodStatus = getPodStatus(conversionPod);
    if (
      conversionPodStatus.status === POD_STATUS_NOT_SCHEDULABLE &&
      podPhase === POD_PHASE_PENDING
    ) {
      return {
        ...conversionPodStatus,
        status: VM_STATUS_V2V_CONVERSION_PENDING,
        pod: conversionPod,
        progress: null,
      };
    }
    if (POD_STATUS_ALL_ERROR.includes(conversionPodStatus.status)) {
      return {
        ...conversionPodStatus,
        status: VM_STATUS_V2V_CONVERSION_ERROR,
        pod: conversionPod,
        progress: null,
      };
    }
    const progress = parseNumber(
      getAnnotationKeySuffix(conversionPod, CONVERSION_PROGRESS_ANNOTATION),
      0,
    );
    return {
      ...conversionPodStatus,
      status: VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
      message: `${progress}% progress`,
      pod: conversionPod,
      progress,
    };
  }
  return NOT_HANDLED;
};

const isWaitingForVMI = (vm: VMKind): VMStatus => {
  // assumption: spec.running === true
  if (!isVMCreated(vm)) {
    return { status: VM_STATUS_VMI_WAITING };
  }
  return NOT_HANDLED;
};

export const getVMStatus = ({
  vm,
  vmi,
  pods,
  migrations,
}: {
  vm: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
}): VMStatus => {
  const launcherPod = findVMPod(vm, pods);
  return (
    isV2VConversion(vm, pods) || // these statuses must precede isRunning() because they do not rely on ready vms
    isBeingMigrated(vm, migrations) || //  -||-
    isBeingImported(vm, pods) || //  -||-
    isBeingStopped(vm, launcherPod) ||
    isRunning(vm) ||
    isReady(vmi, launcherPod) ||
    isVMError(vm) ||
    isCreated(vm, launcherPod) ||
    isWaitingForVMI(vm) || { status: VM_STATUS_UNKNOWN }
  );
};

export const getSimpleVMStatus = (
  vm: VMKind,
  pods?: PodKind[],
  migrations?: K8sResourceKind[],
  vmi?: VMIKind,
) => {
  const vmStatus = getVMStatus({ vm, vmi, pods, migrations }).status;
  return vmStatus === VM_STATUS_OFF || vmStatus === VM_STATUS_RUNNING
    ? vmStatus
    : VM_SIMPLE_STATUS_OTHER;
};

export type VMStatus = Status & {
  pod?: PodKind;
  launcherPod?: PodKind;
  progress?: number;
  importerPodsStatuses?: {
    message: string;
    status: string;
    pod: PodKind;
  }[];
};
