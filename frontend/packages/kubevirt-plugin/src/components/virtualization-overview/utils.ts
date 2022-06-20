import { getVmStatusFromPrintable, VMStatus } from '../../constants/vm/vm-status';
import { isVM, isVMI } from '../../selectors/check-type';
import { getVMStatus } from '../../statuses/vm/vm-status';

export const UNKNOWN = 'Unknown';

export const getPrintableVMStatus = (vmLike) => {
  let status = UNKNOWN;
  if (isVM(vmLike)) {
    status = vmLike?.status?.printableStatus || UNKNOWN;
  } else if (isVMI(vmLike)) {
    status = vmLike?.status?.phase || UNKNOWN;
  }
  return status;
};

export const getVMStatusFromBundle = (vmLike, statusResources): VMStatus => {
  const resources = {
    vm: vmLike,
    vmi: undefined,
    pods: statusResources.pods,
    pvcs: statusResources.pvcs,
    dvs: statusResources.dvs,
    migrations: statusResources.migrations,
  };
  return getVMStatus(resources)?.status || VMStatus.UNKNOWN;
};

export const getVmStatus = (vmLike, statusResources, printableVMStatusFlag): VMStatus => {
  const vmStatus: VMStatus = printableVMStatusFlag
    ? getVmStatusFromPrintable(getPrintableVMStatus(vmLike))
    : getVMStatusFromBundle(vmLike, statusResources);
  return vmStatus || VMStatus.UNKNOWN;
};

export const getVMStatusString = (vmLike, statusResources, printableVMStatusFlag) => {
  const vmStatus: VMStatus = getVmStatus(vmLike, statusResources, printableVMStatusFlag);
  return vmStatus?.toSimpleSortString() || UNKNOWN;
};
