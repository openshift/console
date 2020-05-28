import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { getName, getNamespace, getOwnerReferences } from '@console/shared/src/selectors/common'; // do not import just from shared - causes cycles
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import {
  buildOwnerReference,
  buildOwnerReferenceForModel,
  parseNumber,
  parsePercentage,
} from '../../utils';
import {
  getAnnotationKeySuffix,
  getLabelValue,
  getStatusConditionOfType,
  getStatusPhase,
} from '../../selectors/selectors';
import {
  findVMIMigration,
  getMigrationStatusPhase,
  isMigrating,
} from '../../selectors/vmi-migration';
import { findVMIPod, getPodStatusPhase, getVMImporterPods } from '../../selectors/pod/selectors';
import { findConversionPod, isVMCreated, isVMExpectedRunning } from '../../selectors/vm';
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
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { VirtualMachineImportModel } from '../../models';
import { getVMImportStatus } from '../vm-import/vm-import-status';
import { VMStatus } from '../../constants/vm/vm-status';
import { VMStatusBundle } from './types';
import {
  IMPORT_CDI_PENDING_MESSAGE,
  IMPORTING_CDI_ERROR_MESSAGE,
  IMPORTING_CDI_MESSAGE,
  IMPORTING_ERROR_VMWARE_MESSAGE,
  IMPORTING_VMWARE_MESSAGE,
  STARTING_MESSAGE,
  VMI_WAITING_MESSAGE,
} from '../../strings/vm/status';
import { CDI_KUBEVIRT_IO, STORAGE_IMPORT_PVC_NAME } from '../../constants';
import { CONVERSION_PROGRESS_ANNOTATION } from '../../constants/v2v';
import { PAUSED_VM_MODAL_MESSAGE } from '../../constants/vm';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VMIPhase } from '../../constants/vmi/phase';

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

const isBeingStopped = (vm: VMKind): VMStatusBundle => {
  if (vm && !isVMExpectedRunning(vm) && isVMCreated(vm)) {
    return {
      status: VMStatus.STOPPING,
    };
  }

  return null;
};

const isOff = (vm: VMKind): VMStatusBundle => {
  return vm && !isVMExpectedRunning(vm) ? { status: VMStatus.OFF } : null;
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
        status: VMStatus.POD_ERROR,
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

const isStarting = (vm: VMKind, launcherPod: PodKind = null): VMStatusBundle => {
  if (vm && isVMExpectedRunning(vm) && isVMCreated(vm)) {
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

const isWaitingForVMI = (vm: VMKind): VMStatusBundle => {
  if (vm && isVMExpectedRunning(vm) && !isVMCreated(vm)) {
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
  const launcherPod = findVMIPod(vmi, pods);

  return (
    isPaused(vmi) ||
    isV2VVMWareConversion(vm, pods) || // these statuses must precede isRunning() because they do not rely on ready vms
    isV2VVMImportConversion(vm, vmImports) ||
    isBeingMigrated(vm, vmi, migrations) ||
    isBeingImported(vm, pods, dataVolumes) ||
    isVMError(vm) ||
    isBeingStopped(vm) ||
    isOff(vm) ||
    isError(vm, vmi, launcherPod) ||
    isRunning(vmi) ||
    isStarting(vm, launcherPod) ||
    isWaitingForVMI(vm) ||
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
