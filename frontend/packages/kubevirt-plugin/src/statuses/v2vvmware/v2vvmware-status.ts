import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStatusPhase } from '../../selectors/selectors';
import { V2VVMwareStatus } from './constants';

type V2VVMwareStatusFlags = {
  hasConnectionFailed?: boolean;
  requestsVM?: boolean;
};

const hasV2vVMWareStatus = (v2vvmware: K8sResourceKind, flags: V2VVMwareStatusFlags) => {
  if (v2vvmware && flags.requestsVM) {
    return { status: V2VVMwareStatus.LOADING_VM_DETAIL };
  }

  const status = V2VVMwareStatus.fromPhase(getStatusPhase(v2vvmware));

  if (status) {
    return { status };
  }

  if (v2vvmware) {
    // object created without status and is connecting
    return { status: V2VVMwareStatus.CONNECTING };
  }

  return null;
};

const hasSetStatus = (flags: V2VVMwareStatusFlags) => {
  if (flags.hasConnectionFailed) {
    return { status: V2VVMwareStatus.CONNECTION_FAILED };
  }

  return null;
};

export const getV2vVMwareStatus = (
  v2vvmware?: K8sResourceKind,
  flags: V2VVMwareStatusFlags = { hasConnectionFailed: false, requestsVM: false },
) =>
  hasV2vVMWareStatus(v2vvmware, flags) ||
  hasSetStatus(flags) || { status: V2VVMwareStatus.UNKNOWN };

export const getSimpleV2vVMwareStatus = (
  v2vvmware: K8sResourceKind,
  flags: V2VVMwareStatusFlags = { hasConnectionFailed: false, requestsVM: false },
) => getV2vVMwareStatus(v2vvmware, flags).status;
