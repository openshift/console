import { K8sResourceCondition, K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { getAnnotations, getOwnerReferences } from '@console/shared/src/selectors/common'; // do not import just from shared - causes cycles
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { buildOwnerReference, buildOwnerReferenceForModel, parseNumber } from '../../utils';
import {
  getAnnotationKeySuffix,
  getStatusConditionOfType,
  getStatusConditions,
  getStatusPhase,
} from '../../selectors/selectors';
import {
  findVMIMigration,
  getMigrationStatusPhase,
  isMigrating,
} from '../../selectors/vmi-migration';
import {
  findVMIPod,
  getPodContainerStatuses,
  getPodStatusPhase,
  getVMImporterPods,
} from '../../selectors/pod/selectors';
import {
  findConversionPod,
  getVMStatusConditions,
  isVMCreated,
  isVMI,
  isVMReady,
  isVMRunning,
} from '../../selectors/vm';
import { getPodStatus } from '../pod/pod';
import {
  POD_PHASE_PENDING,
  POD_PHASE_SUCEEDED,
  POD_STATUS_ALL_ERROR,
  POD_STATUS_ALL_READY,
  POD_STATUS_NOT_SCHEDULABLE,
} from '../pod/constants';
import { VMIKind, VMKind } from '../../types';
import {
  CONVERSION_PROGRESS_ANNOTATION,
  VM_IMPORT_PROGRESS_ANNOTATION,
  VM_STATUS_ERROR,
  VM_STATUS_IMPORT_ERROR,
  VM_STATUS_IMPORT_PENDING,
  VM_STATUS_IMPORTING,
  VM_STATUS_MIGRATING,
  VM_STATUS_OFF,
  VM_STATUS_PAUSED,
  VM_STATUS_POD_ERROR,
  VM_STATUS_RUNNING,
  VM_STATUS_STARTING,
  VM_STATUS_STOPPING,
  VM_STATUS_UNKNOWN,
  VM_STATUS_V2V_CONVERSION_ERROR,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
  VM_STATUS_V2V_CONVERSION_PENDING,
  VM_STATUS_V2V_VM_IMPORT_ERROR,
  VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS,
  VM_STATUS_VMI_WAITING,
} from './constants';
import { Status } from '..';
import { isVMIPaused } from '../../selectors/vmi/basic';
import { VMILikeEntityKind } from '../../types/vmLike';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VirtualMachineImportModel } from '../../models';
import { VirtualMachineImportConditionType } from '../vm-import/types';
import { VMImportSucceededConditionReason } from '../vm-import/vm-import-succeeded-condition-reason';

const isBeingMigrated = (vm: VMILikeEntityKind, migrations?: K8sResourceKind[]): VMStatus => {
  const migration = findVMIMigration(vm, migrations);
  if (isMigrating(migration)) {
    return { status: VM_STATUS_MIGRATING, message: getMigrationStatusPhase(migration) };
  }
  return null;
};

const isBeingStopped = (vm: VMILikeEntityKind, launcherPod: PodKind = null): VMStatus => {
  if (isVMI(vm)) {
    return null;
  }

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

  return null;
};

const isOff = (vm: VMKind): VMStatus => (isVMRunning(vm) ? null : { status: VM_STATUS_OFF });

const isReady = (vmi: VMIKind, launcherPod: PodKind): VMStatus => {
  if ((getStatusPhase(vmi) || '').toLowerCase() === 'running') {
    // we are all set
    return {
      status: VM_STATUS_RUNNING,
      launcherPod,
    };
  }
  return null;
};

const isPaused = (vmi: VMIKind): VMStatus =>
  isVMIPaused(vmi) ? { status: VM_STATUS_PAUSED } : null;

const isVMError = (vm: VMILikeEntityKind): VMStatus => {
  // is an issue with the VM definition?
  const condition = getVMStatusConditions(vm)[0];
  if (condition) {
    // Do we need to analyze additional conditions in the array? Probably not.
    if (condition.type === 'Failure') {
      return { status: VM_STATUS_ERROR, message: condition.message };
    }
  }
  return null;
};

const isCreated = (vm: VMILikeEntityKind, launcherPod: PodKind = null): VMStatus => {
  if (isVMI(vm)) {
    return null;
  }

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
  return null;
};

const isBeingImported = (vm: VMKind, pods?: PodKind[]): VMStatus => {
  const importerPods = getVMImporterPods(vm, pods);
  if (importerPods && importerPods.length > 0 && !isVMCreated(vm)) {
    const importerPodsStatuses = importerPods.map((pod) => {
      const podStatus = getPodStatus(pod);
      if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
        let status = VM_STATUS_IMPORT_ERROR;
        if (
          podStatus.status === POD_STATUS_NOT_SCHEDULABLE &&
          getPodStatusPhase(pod) === POD_PHASE_PENDING
        ) {
          status = VM_STATUS_IMPORT_PENDING;
        }

        return {
          ...podStatus,
          message: podStatus.message,
          status,
          pod,
        };
      }
      return {
        status: VM_STATUS_IMPORTING,
        message: podStatus.message,
        pod,
      };
    });
    const importErrorOrPendingStatus = importerPodsStatuses.find((status) =>
      [VM_STATUS_IMPORT_PENDING, VM_STATUS_IMPORT_ERROR].includes(status.status),
    );
    const message = importerPodsStatuses
      .map((podStatus) => `${podStatus.pod.metadata.name}: ${podStatus.message}`)
      .join('\n\n');

    return {
      status: importErrorOrPendingStatus ? importErrorOrPendingStatus.status : VM_STATUS_IMPORTING,
      message,
      pod: importErrorOrPendingStatus ? importErrorOrPendingStatus.pod : importerPods[0],
      importerPodsStatuses,
    };
  }
  return null;
};

const isV2VVMImportConversion = (vm: VMILikeEntityKind, vmImports?: VMImportKind[]): VMStatus => {
  const vmImportOwnerReference = (getOwnerReferences(vm) || []).find((reference) =>
    compareOwnerReference(reference, buildOwnerReferenceForModel(VirtualMachineImportModel), true),
  );
  if (!vmImportOwnerReference || !vmImports) {
    return null;
  }
  const vmImport = vmImports.find((i) =>
    compareOwnerReference(buildOwnerReference(i), vmImportOwnerReference),
  );

  if (!vmImport) {
    return null;
  }

  const suceededCond: K8sResourceCondition = getStatusConditionOfType(
    vmImport,
    VirtualMachineImportConditionType.Succeeded,
  );

  if (suceededCond?.status === 'True') {
    const reason = VMImportSucceededConditionReason.fromString(suceededCond.reason);
    if (!reason?.hasfailed()) {
      return null;
    }
    return {
      status: VM_STATUS_V2V_VM_IMPORT_ERROR,
      message: `${suceededCond.reason}: ${suceededCond.message}`,
      vmImport,
    };
  }

  // TODO double check in the future - show error?
  const failedProgressingCondType: VirtualMachineImportConditionType = [
    VirtualMachineImportConditionType.MappingRulesChecking,
    VirtualMachineImportConditionType.Validating,
    VirtualMachineImportConditionType.Processing,
  ].find((type) => getStatusConditionOfType(vmImport, type)?.status === 'False');

  const progressingCondType: VirtualMachineImportConditionType =
    failedProgressingCondType ||
    [
      VirtualMachineImportConditionType.Processing,
      VirtualMachineImportConditionType.Validating,
      VirtualMachineImportConditionType.MappingRulesChecking,
    ].find((type) => getStatusConditionOfType(vmImport, type)?.status === 'True');

  const progressingCondMaybe: K8sResourceCondition = progressingCondType
    ? getStatusConditionOfType(vmImport, progressingCondType)
    : getStatusConditions(vmImport, [])[0];

  const progress = parseNumber(getAnnotations(vmImport, {})[VM_IMPORT_PROGRESS_ANNOTATION], 0);

  return {
    status: VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS,
    message:
      progressingCondMaybe && `${progressingCondMaybe.reason}: ${progressingCondMaybe.message}`,
    vmImport,
    progress,
  };
};

const isV2VVMWareConversion = (vm: VMILikeEntityKind, pods?: PodKind[]): VMStatus => {
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
  return null;
};

const isWaitingForVMI = (vm: VMKind): VMStatus => {
  // assumption: spec.running === true
  if (!isVMCreated(vm)) {
    return { status: VM_STATUS_VMI_WAITING };
  }
  return null;
};

export const getVMStatus = ({
  vm,
  vmi,
  pods,
  migrations,
  vmImports,
}: {
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
}): VMStatus => {
  const vmLike = vm || vmi;
  const launcherPod = findVMIPod(vmi, pods);
  return (
    isPaused(vmi) ||
    isV2VVMWareConversion(vmLike, pods) || // these statuses must precede isRunning() because they do not rely on ready vms
    isV2VVMImportConversion(vmLike, vmImports) || //  -||-
    isBeingMigrated(vmLike, migrations) || //  -||-
    (vm && isBeingImported(vm, pods)) || //  -||-
    isBeingStopped(vmLike, launcherPod) ||
    (vm && isOff(vm)) ||
    isReady(vmi, launcherPod) ||
    isVMError(vmLike) ||
    isCreated(vmLike, launcherPod) ||
    (!vmi && vm && isWaitingForVMI(vm)) ||
    (getStatusPhase(vmi) === 'Running' && { status: VM_STATUS_RUNNING }) ||
    (['Scheduling', 'Scheduled'].includes(getStatusPhase(vmi)) && { status: VM_STATUS_STARTING }) ||
    (getStatusPhase(vmi) === 'Pending' && { status: VM_STATUS_VMI_WAITING }) ||
    (getStatusPhase(vmi) === 'Failed' && { status: VM_STATUS_ERROR }) || {
      status: VM_STATUS_UNKNOWN,
    }
  );
};

export const isVmOff = (vmStatus: VMStatus) => vmStatus.status === VM_STATUS_OFF;

export type VMStatus = Status & {
  pod?: PodKind;
  launcherPod?: PodKind;
  vmImport?: VMImportKind;
  progress?: number;
  importerPodsStatuses?: {
    message: string;
    status: string;
    pod: PodKind;
  }[];
};
