import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { getName, getOwnerReferences } from '@console/shared/src/selectors/common'; // do not import just from shared - causes cycles
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import {
  buildOwnerReference,
  buildOwnerReferenceForModel,
  parseNumber,
  parsePercentage,
} from '../../utils';
import { getAnnotationKeySuffix, getLabelValue, getStatusPhase } from '../../selectors/selectors';
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
import { isVMIPaused } from '../../selectors/vmi/basic';
import { VMILikeEntityKind } from '../../types/vmLike';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VirtualMachineImportModel } from '../../models';
import { getVMImportStatus } from '../vm-import/vm-import-status';
import { VMStatus } from '../../constants/vm/vm-status';
import { VMStatusBundle } from './types';
import {
  IMPORTING_CDI_ERROR_MESSAGE,
  IMPORTING_ERROR_VMWARE_MESSAGE,
  IMPORTING_CDI_MESSAGE,
  IMPORTING_VMWARE_MESSAGE,
  VMI_WAITING_MESSAGE,
  STARTING_MESSAGE,
  IMPORT_CDI_PENDING_MESSAGE,
} from '../../strings/vm/status';
import { CDI_KUBEVIRT_IO, STORAGE_IMPORT_PVC_NAME } from '../../constants';
import { CONVERSION_PROGRESS_ANNOTATION } from '../../constants/v2v';
import { PAUSED_VM_MODAL_MESSAGE } from '../../constants/vm';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';

const isPaused = (vmi: VMIKind): VMStatusBundle =>
  isVMIPaused(vmi) ? { status: VMStatus.PAUSED, message: PAUSED_VM_MODAL_MESSAGE } : null;

const isV2VVMWareConversion = (vm: VMILikeEntityKind, pods?: PodKind[]): VMStatusBundle => {
  const conversionPod = findConversionPod(vm, pods);
  const podPhase = getPodStatusPhase(conversionPod);
  if (conversionPod && podPhase !== POD_PHASE_SUCEEDED) {
    const conversionPodStatus = getPodStatus(conversionPod);
    if (podPhase === POD_PHASE_PENDING) {
      return {
        ...conversionPodStatus,
        status: VMStatus.V2V_CONVERSION_PENDING,
        message: IMPORTING_VMWARE_MESSAGE,
        detailedMessage: conversionPodStatus.message,
        pod: conversionPod,
        progress: null,
      };
    }
    if (POD_STATUS_ALL_ERROR.includes(conversionPodStatus.status)) {
      return {
        ...conversionPodStatus,
        status: VMStatus.V2V_CONVERSION_ERROR,
        message: IMPORTING_ERROR_VMWARE_MESSAGE,
        detailedMessage: conversionPodStatus.message,
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
      status: VMStatus.V2V_CONVERSION_IN_PROGRESS,
      message: IMPORTING_VMWARE_MESSAGE,
      pod: conversionPod,
      progress,
    };
  }
  return null;
};

const isV2VVMImportConversion = (
  vm: VMILikeEntityKind,
  vmImports?: VMImportKind[],
): VMStatusBundle => {
  const vmImportOwnerReference = (getOwnerReferences(vm) || []).find((reference) =>
    compareOwnerReference(reference, buildOwnerReferenceForModel(VirtualMachineImportModel), true),
  );
  if (!vmImportOwnerReference || !vmImports) {
    return null;
  }
  const vmImport = vmImports.find((i) =>
    compareOwnerReference(buildOwnerReference(i), vmImportOwnerReference),
  );

  const statusBundle = getVMImportStatus({ vmImport });

  if (statusBundle.status.isCompleted() || statusBundle.status.isUnknown()) {
    return null;
  }

  return {
    ...statusBundle,
    status: VMStatus.fromV2VImportStatus(statusBundle.status),
  };
};

const isBeingMigrated = (vm: VMILikeEntityKind, migrations?: K8sResourceKind[]): VMStatusBundle => {
  const migration = findVMIMigration(vm, migrations);
  if (isMigrating(migration)) {
    return {
      status: VMStatus.MIGRATING,
      migration,
      detailedMessage: getMigrationStatusPhase(migration),
    };
  }
  return null;
};

const isBeingImported = (
  vm: VMKind,
  pods?: PodKind[],
  dataVolumes?: V1alpha1DataVolume[],
): VMStatusBundle => {
  const importerPods = getVMImporterPods(vm, pods);
  if (importerPods && importerPods.length > 0 && !isVMCreated(vm)) {
    const dvLookup = createBasicLookup(dataVolumes, getName);
    const importerPodsStatuses = importerPods.map((pod) => {
      const podStatus = getPodStatus(pod);
      const dvName = getLabelValue(pod, `${CDI_KUBEVIRT_IO}/${STORAGE_IMPORT_PVC_NAME}`);
      const dataVolume = dvLookup[dvName];

      if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
        let status = VMStatus.CDI_IMPORT_ERROR;
        if (
          podStatus.status === POD_STATUS_NOT_SCHEDULABLE &&
          getPodStatusPhase(pod) === POD_PHASE_PENDING
        ) {
          status = VMStatus.CDI_IMPORT_PENDING;
        }

        return {
          message: podStatus.message,
          status,
          progress: null,
          dataVolume,
          pod,
        };
      }
      return {
        status: VMStatus.CDI_IMPORTING,
        message: podStatus.message,
        pod,
        dataVolume,
        progress: parsePercentage(dataVolume?.status?.progress, 0),
      };
    });
    const importStatus =
      importerPodsStatuses.find(({ status }) => status.isError()) ||
      importerPodsStatuses.find(({ status }) => status.isPending()) ||
      importerPodsStatuses[0];
    const resultStatus = importStatus?.status || VMStatus.CDI_IMPORT_PENDING;
    return {
      status: resultStatus,
      message: resultStatus.isError()
        ? IMPORTING_CDI_ERROR_MESSAGE
        : resultStatus.isPending()
        ? IMPORT_CDI_PENDING_MESSAGE
        : IMPORTING_CDI_MESSAGE,
      importerPodsStatuses,
    };
  }
  return null;
};

const isBeingStopped = (vm: VMILikeEntityKind, launcherPod: PodKind = null): VMStatusBundle => {
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
          status: VMStatus.STOPPING,
          pod: launcherPod,
        };
      }
    }
  }

  return null;
};

const isOff = (vm: VMKind): VMStatusBundle => (isVMRunning(vm) ? null : { status: VMStatus.OFF });

const isReady = (vmi: VMIKind, launcherPod: PodKind): VMStatusBundle => {
  if ((getStatusPhase(vmi) || '').toLowerCase() === 'running') {
    // we are all set
    return {
      status: VMStatus.RUNNING,
      pod: launcherPod,
    };
  }
  return null;
};

const isVMError = (vm: VMILikeEntityKind): VMStatusBundle => {
  // is an issue with the VM definition?
  const condition = getVMStatusConditions(vm)[0];
  if (condition) {
    // Do we need to analyze additional conditions in the array? Probably not.
    if (condition.type === 'Failure') {
      return { status: VMStatus.VM_ERROR, detailedMessage: condition.message };
    }
  }
  return null;
};

const isCreated = (vm: VMILikeEntityKind, launcherPod: PodKind = null): VMStatusBundle => {
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
          status: VMStatus.POD_ERROR,
          pod: launcherPod,
        };
      }
      if (!POD_STATUS_ALL_READY.includes(podStatus.status)) {
        return {
          ...podStatus,
          status: VMStatus.STARTING,
          message: STARTING_MESSAGE,
          detailedMessage: podStatus.message,
          pod: launcherPod,
        };
      }
    }
    return { status: VMStatus.STARTING, message: STARTING_MESSAGE, pod: launcherPod };
  }
  return null;
};

const isWaitingForVMI = (vm: VMKind): VMStatusBundle => {
  // assumption: spec.running === true
  if (!isVMCreated(vm)) {
    return { status: VMStatus.VMI_WAITING, message: VMI_WAITING_MESSAGE };
  }
  return null;
};

export const getVMStatus = ({
  vm,
  vmi,
  pods,
  migrations,
  dataVolumes,
  vmImports,
}: {
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  dataVolumes?: V1alpha1DataVolume[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
}): VMStatusBundle => {
  const vmLike = vm || vmi;
  const launcherPod = findVMIPod(vmi, pods);
  return (
    isPaused(vmi) ||
    isV2VVMWareConversion(vmLike, pods) || // these statuses must precede isRunning() because they do not rely on ready vms
    isV2VVMImportConversion(vmLike, vmImports) || //  -||-
    isBeingMigrated(vmLike, migrations) || //  -||-
    (vm && isBeingImported(vm, pods, dataVolumes)) || //  -||-
    isBeingStopped(vmLike, launcherPod) ||
    (vm && isOff(vm)) ||
    isReady(vmi, launcherPod) ||
    isVMError(vmLike) ||
    isCreated(vmLike, launcherPod) ||
    (!vmi && vm && isWaitingForVMI(vm)) ||
    (getStatusPhase(vmi) === 'Running' && { status: VMStatus.RUNNING }) ||
    (['Scheduling', 'Scheduled'].includes(getStatusPhase(vmi)) && {
      status: VMStatus.STARTING,
      message: STARTING_MESSAGE,
    }) ||
    (getStatusPhase(vmi) === 'Pending' && { status: VMStatus.VMI_WAITING }) ||
    (getStatusPhase(vmi) === 'Failed' && { status: VMStatus.VM_ERROR }) || {
      status: VMStatus.UNKNOWN,
    }
  );
};
