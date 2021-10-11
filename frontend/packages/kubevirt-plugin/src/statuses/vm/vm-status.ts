import * as _ from 'lodash';
import { K8sResourceKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { CONVERSION_PROGRESS_ANNOTATION } from '../../constants/v2v';
import { VMStatus } from '../../constants/vm/vm-status';
import { VMIPhase } from '../../constants/vmi/phase';
import { VirtualMachineImportModel } from '../../models';
import { getDeletetionTimestamp, getName, getNamespace, getOwnerReferences } from '../../selectors';
import {
  findVMIPod,
  getPodStatusPhase,
  getPVCNametoImporterPodsMapForVM,
} from '../../selectors/pod/selectors';
import {
  getAnnotationKeySuffix,
  getStatusConditionOfType,
  getStatusPhase,
} from '../../selectors/selectors';
import { findConversionPod } from '../../selectors/vm/combined';
import { isVMCreated, isVMExpectedRunning } from '../../selectors/vm/selectors';
import {
  findVMIMigration,
  getMigrationStatusPhase,
  isMigrating,
} from '../../selectors/vmi-migration';
import { isVMIPaused } from '../../selectors/vmi/basic';
import { PAUSED_VM_MODAL_MESSAGE } from '../../strings/vm/messages';
import {
  IMPORT_CDI_PENDING_MESSAGE,
  IMPORTING_CDI_ERROR_MESSAGE,
  IMPORTING_CDI_MESSAGE,
  IMPORTING_ERROR_VMWARE_MESSAGE,
  IMPORTING_VMWARE_MESSAGE,
  STARTING_MESSAGE,
  VMI_WAITING_MESSAGE,
} from '../../strings/vm/status';
import { VMIKind, VMKind } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import {
  compareOwnerReference,
  createBasicLookup,
  buildOwnerReference,
  buildOwnerReferenceForModel,
  parseNumber,
  parsePercentage,
} from '../../utils';
import {
  POD_PHASE_PENDING,
  POD_PHASE_SUCEEDED,
  POD_STATUS_ALL_ERROR,
  POD_STATUS_ALL_READY,
  POD_STATUS_NOT_SCHEDULABLE,
} from '../pod/constants';
import { getPodStatus } from '../pod/pod';
import { getVMImportStatus } from '../vm-import/vm-import-status';
import { VMStatusBundle } from './types';

const isPaused = (vmi: VMIKind): VMStatusBundle =>
  isVMIPaused(vmi) ? { status: VMStatus.PAUSED, message: PAUSED_VM_MODAL_MESSAGE } : null;

const isV2VVMWareConversion = (vm: VMKind, pods?: PodKind[]): VMStatusBundle => {
  if (!vm || !pods) {
    return null;
  }

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

const isV2VVMImportConversion = (vm: VMKind, vmImports?: VMImportKind[]): VMStatusBundle => {
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

const isBeingMigrated = (
  vm: VMKind,
  vmi: VMIKind,
  migrations?: K8sResourceKind[],
): VMStatusBundle => {
  const name = getName(vm || vmi);
  const namespace = getNamespace(vm || vmi);

  const migration = findVMIMigration(name, namespace, migrations);
  if (isMigrating(migration)) {
    const phase = getMigrationStatusPhase(migration);
    return {
      status: VMStatus.getMigrationStatus(phase),
      migration,
      detailedMessage: phase,
    };
  }
  return null;
};

const isBeingImported = (
  vm: VMKind,
  pods?: PodKind[],
  pvcs?: PersistentVolumeClaimKind[],
  dataVolumes?: V1alpha1DataVolume[],
): VMStatusBundle => {
  const pvcNameToImporterPodMap = getPVCNametoImporterPodsMapForVM(vm, pods, pvcs);
  if (_.isEmpty(pvcNameToImporterPodMap) || isVMCreated(vm)) {
    return null;
  }

  const dvLookup = createBasicLookup(dataVolumes, getName);

  const importerPodsStatuses = _.map(pvcNameToImporterPodMap, (pod, pvcName) => {
    const podStatus = getPodStatus(pod);
    const dataVolume = dvLookup[pvcName];

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
};

const isVMError = (vm: VMKind): VMStatusBundle => {
  const vmFailureCond = getStatusConditionOfType(vm, 'Failure');
  if (vmFailureCond) {
    return {
      status: VMStatus.VM_ERROR,
      detailedMessage: vmFailureCond.message,
    };
  }

  return null;
};

const isDeleting = (vm: VMKind, vmi: VMIKind): VMStatusBundle =>
  (vm && !!getDeletetionTimestamp(vm)) || (!vm && vmi && !!getDeletetionTimestamp(vmi))
    ? { status: VMStatus.DELETING }
    : null;

const isBeingStopped = (vm: VMKind, vmi: VMIKind): VMStatusBundle => {
  if (
    vm &&
    !isVMExpectedRunning(vm, vmi) &&
    isVMCreated(vm) &&
    getStatusPhase<VMIPhase>(vmi) !== VMIPhase.Succeeded
  ) {
    return {
      status: VMStatus.STOPPING,
    };
  }

  return null;
};

const isOff = (vm: VMKind, vmi: VMIKind): VMStatusBundle => {
  return vm && !isVMExpectedRunning(vm, vmi) ? { status: VMStatus.STOPPED } : null;
};

const isError = (vm: VMKind, vmi: VMIKind, launcherPod: PodKind): VMStatusBundle => {
  const vmiFailureCond = getStatusConditionOfType(vmi, 'Failure');
  if (vmiFailureCond) {
    return { status: VMStatus.VMI_ERROR, detailedMessage: vmiFailureCond.message };
  }

  if ((vmi || isVMCreated(vm)) && launcherPod) {
    const podStatus = getPodStatus(launcherPod);
    if (POD_STATUS_ALL_ERROR.includes(podStatus.status)) {
      return {
        ...podStatus,
        status: VMStatus.LAUNCHER_POD_ERROR,
        pod: launcherPod,
      };
    }
  }
  return null;
};

const isRunning = (vmi: VMIKind): VMStatusBundle => {
  if (getStatusPhase(vmi) === VMIPhase.Running) {
    return {
      status: VMStatus.RUNNING,
    };
  }
  return null;
};

const isStarting = (vm: VMKind, vmi: VMIKind, launcherPod: PodKind = null): VMStatusBundle => {
  if (vm && isVMCreated(vm) && isVMExpectedRunning(vm, vmi)) {
    // created but not yet ready
    if (launcherPod) {
      const podStatus = getPodStatus(launcherPod);
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

const isWaitingForVMI = (vm: VMKind, vmi: VMIKind): VMStatusBundle => {
  if (vm && !isVMCreated(vm) && isVMExpectedRunning(vm, vmi)) {
    return { status: VMStatus.VMI_WAITING, message: VMI_WAITING_MESSAGE };
  }
  return null;
};

export const getVMStatus = ({
  vm,
  vmi,
  pods,
  migrations,
  pvcs,
  dataVolumes,
  vmImports,
}: {
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  pvcs?: PersistentVolumeClaimKind[];
  dataVolumes?: V1alpha1DataVolume[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
}): VMStatusBundle => {
  const launcherPod = findVMIPod(vmi, pods);

  return (
    isPaused(vmi) ||
    isV2VVMWareConversion(vm, pods) || // these statuses must precede isRunning() because they do not rely on ready vms
    isV2VVMImportConversion(vm, vmImports) ||
    isBeingMigrated(vm, vmi, migrations) ||
    isBeingImported(vm, pods, pvcs, dataVolumes) ||
    isVMError(vm) ||
    isDeleting(vm, vmi) ||
    isBeingStopped(vm, vmi) ||
    isOff(vm, vmi) ||
    isError(vm, vmi, launcherPod) ||
    isRunning(vmi) ||
    isStarting(vm, vmi, launcherPod) ||
    isWaitingForVMI(vm, vmi) ||
    ([VMIPhase.Scheduling, VMIPhase.Scheduled].includes(getStatusPhase<VMIPhase>(vmi)) && {
      status: VMStatus.STARTING,
      message: STARTING_MESSAGE,
    }) ||
    (getStatusPhase(vmi) === VMIPhase.Pending && {
      status: VMStatus.VMI_WAITING,
      message: VMI_WAITING_MESSAGE,
    }) ||
    (getStatusPhase(vmi) === VMIPhase.Failed && { status: VMStatus.VMI_ERROR }) || {
      status: VMStatus.UNKNOWN,
    }
  );
};

export const getVMConditionsStatus = ({
  vm,
  vmi,
  pods,
  migrations,
  pvcs,
  dataVolumes,
}: {
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  pvcs?: PersistentVolumeClaimKind[];
  dataVolumes?: V1alpha1DataVolume[];
}): VMStatusBundle => {
  const launcherPod = findVMIPod(vmi, pods);

  return (
    isOff(vm, vmi) ||
    isVMError(vm) ||
    isError(vm, vmi, launcherPod) ||
    isBeingImported(vm, pods, pvcs, dataVolumes) ||
    isWaitingForVMI(vm, vmi) ||
    (getStatusPhase(vmi) === VMIPhase.Pending && {
      status: VMStatus.VMI_WAITING,
      message: VMI_WAITING_MESSAGE,
    }) ||
    (getStatusPhase(vmi) === VMIPhase.Failed && { status: VMStatus.VMI_ERROR }) ||
    isBeingMigrated(vm, vmi, migrations) || {
      status: VMStatus.UNKNOWN,
    }
  );
};
