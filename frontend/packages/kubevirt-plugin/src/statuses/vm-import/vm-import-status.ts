import { getAnnotations } from '@console/shared/src/selectors/common'; // do not import just from shared - causes cycles
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { K8sResourceCondition } from '@console/internal/module/k8s';
import { parseNumber } from '../../utils';
import {
  getStatusConditionOfType,
  getStatusConditions,
  isConditionStatusTrue,
} from '../../selectors/selectors';
import { VirtualMachineImportConditionType, VMImportStatus } from './types';
import { VM_IMPORT_PROGRESS_ANNOTATION } from '../../constants/v2v-import/constants';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { IMPORTING_ERROR_OVIRT_MESSAGE, IMPORTING_OVIRT_MESSAGE } from '../../strings/vm/status';

const isV2VVMImportConversion = (vmImport?: VMImportKind): VMImportStatus => {
  if (!vmImport) {
    return null;
  }

  const failedProgressingCondType: VirtualMachineImportConditionType = [
    VirtualMachineImportConditionType.Succeeded,
    VirtualMachineImportConditionType.MappingRulesChecking,
    VirtualMachineImportConditionType.Validating,
    VirtualMachineImportConditionType.Processing,
  ].find((type) => {
    const condition = getStatusConditionOfType(vmImport, type);
    return condition && !isConditionStatusTrue(condition);
  });

  if (failedProgressingCondType) {
    const failedCond: K8sResourceCondition = getStatusConditionOfType(
      vmImport,
      failedProgressingCondType,
    );

    return {
      status: V2VVMImportStatus.ERROR,
      message: IMPORTING_ERROR_OVIRT_MESSAGE,
      detailedMessage: failedCond && `${failedCond.reason}: ${failedCond.message}`,
      vmImport,
    };
  }

  const suceededCond: K8sResourceCondition = getStatusConditionOfType(
    vmImport,
    VirtualMachineImportConditionType.Succeeded,
  );

  if (suceededCond) {
    // must be 'True' due to the check above
    return {
      status: V2VVMImportStatus.COMPLETE,
      detailedMessage: `${suceededCond.reason}: ${suceededCond.message}`,
      vmImport,
    };
  }

  const progressingCondType: VirtualMachineImportConditionType = [
    VirtualMachineImportConditionType.Processing,
    VirtualMachineImportConditionType.Validating,
    VirtualMachineImportConditionType.MappingRulesChecking,
  ].find((type) => isConditionStatusTrue(getStatusConditionOfType(vmImport, type)));

  const progressingCond: K8sResourceCondition = progressingCondType
    ? getStatusConditionOfType(vmImport, progressingCondType)
    : getStatusConditions(vmImport, [])[0];

  const progress = parseNumber(getAnnotations(vmImport, {})[VM_IMPORT_PROGRESS_ANNOTATION], 0);

  return {
    status: V2VVMImportStatus.IN_PROGRESS,
    message: IMPORTING_OVIRT_MESSAGE,
    detailedMessage: progressingCond && `${progressingCond.reason}: ${progressingCond.message}`,
    vmImport,
    progress,
  };
};

export const getVMImportStatus = ({ vmImport }: { vmImport?: VMImportKind }): VMImportStatus => {
  return (
    isV2VVMImportConversion(vmImport) || {
      status: V2VVMImportStatus.UNKNOWN,
    }
  );
};
