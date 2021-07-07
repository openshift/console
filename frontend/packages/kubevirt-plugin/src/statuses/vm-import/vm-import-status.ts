import * as _ from 'lodash';
import { K8sResourceCondition } from '@console/internal/module/k8s';
import { VM_IMPORT_PROGRESS_ANNOTATION } from '../../constants/v2v-import/constants';
import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { VMStatus as VMStatusEnum } from '../../constants/vm/vm-status';
import { VMImportWrappper } from '../../k8s/wrapper/vm-import/vm-import-wrapper';
import {
  getAnnotations,
  getStatusConditionOfType,
  getStatusConditions,
  isConditionStatusTrue,
} from '../../selectors/selectors';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { parseNumber } from '../../utils';
import { VMStatusBundle } from '../vm/types';
import { VirtualMachineImportConditionType, VMImportStatusBundle } from './types';

const isV2VVMImportConversion = (vmImport?: VMImportKind): VMImportStatusBundle => {
  if (!vmImport) {
    return null;
  }

  const statusConditions = getStatusConditions(vmImport);

  if (_.isEmpty(statusConditions)) {
    return {
      status: V2VVMImportStatus.PENDING,
    };
  }

  const failedFinalStateCondType: VirtualMachineImportConditionType = [
    VirtualMachineImportConditionType.Succeeded,
    VirtualMachineImportConditionType.MappingRulesVerified,
    VirtualMachineImportConditionType.Valid,
  ].find((type) => {
    const condition = getStatusConditionOfType(vmImport, type);
    return condition && !isConditionStatusTrue(condition);
  });

  if (failedFinalStateCondType) {
    const failedCond: K8sResourceCondition = getStatusConditionOfType(
      vmImport,
      failedFinalStateCondType,
    );

    return {
      status: V2VVMImportStatus.ERROR,
      message: `${new VMImportWrappper(vmImport).getResolvedVMTargetName()} could not be imported.`,
      detailedMessage: failedCond && `${failedCond.reason}: ${failedCond.message}`,
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
    };
  }

  const progressingCondType: VirtualMachineImportConditionType = [
    VirtualMachineImportConditionType.Processing,
    VirtualMachineImportConditionType.Valid,
    VirtualMachineImportConditionType.MappingRulesVerified,
  ].find((type) => isConditionStatusTrue(getStatusConditionOfType(vmImport, type)));

  const progressingCond: K8sResourceCondition = progressingCondType
    ? getStatusConditionOfType(vmImport, progressingCondType)
    : statusConditions[0];

  const progress = parseNumber(getAnnotations(vmImport, {})[VM_IMPORT_PROGRESS_ANNOTATION], 0);

  return {
    status: V2VVMImportStatus.IN_PROGRESS,
    message: `${new VMImportWrappper(vmImport).getResolvedVMTargetName()} is being imported.`,
    detailedMessage: progressingCond && `${progressingCond.reason}: ${progressingCond.message}`,
    progress,
  };
};

type Parameters = {
  vmImport?: VMImportKind;
};

export const getVMImportStatus = ({ vmImport }: Parameters): VMImportStatusBundle => {
  const bundle = isV2VVMImportConversion(vmImport) || {
    status: V2VVMImportStatus.UNKNOWN,
  };
  bundle.vmImport = vmImport;
  return bundle;
};

export const getVMImportStatusAsVMStatus = ({
  vmImport,
}: Parameters): VMStatusBundle & { vmImportStatus?: V2VVMImportStatus } => {
  const vmImportStatusBundle = getVMImportStatus({ vmImport });
  return {
    ...vmImportStatusBundle,
    vmImportStatus: vmImportStatusBundle.status,
    status: VMStatusEnum.fromV2VImportStatus(vmImportStatusBundle.status) || VMStatusEnum.UNKNOWN, // no Completed status in VM list
  };
};
