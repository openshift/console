import { K8sResourceKind } from '@console/internal/module/k8s';
import { getStatusPhase } from '../../selectors/selectors';
import { V2VProviderStatus } from './constants';

type V2VProviderStatusFlags = {
  hasConnectionFailed?: boolean;
  requestsVM?: boolean;
};

const hasV2VStatus = (providerCR: K8sResourceKind, flags: V2VProviderStatusFlags) => {
  if (providerCR && flags.requestsVM) {
    return { status: V2VProviderStatus.LOADING_VM_DETAIL };
  }

  const status = V2VProviderStatus.fromPhase(getStatusPhase(providerCR));

  if (status) {
    return { status };
  }

  if (providerCR) {
    // object created without status and is connecting
    return { status: V2VProviderStatus.CONNECTING };
  }

  return null;
};

const hasSetStatus = (flags: V2VProviderStatusFlags) => {
  if (flags.hasConnectionFailed) {
    return { status: V2VProviderStatus.CONNECTION_FAILED };
  }

  return null;
};

export const getV2VProviderStatus = (
  providerCR?: K8sResourceKind,
  flags: V2VProviderStatusFlags = { hasConnectionFailed: false, requestsVM: false },
) =>
  hasV2VStatus(providerCR, flags) || hasSetStatus(flags) || { status: V2VProviderStatus.UNKNOWN };

export const getSimpleV2VPRoviderStatus = (
  providerCR: K8sResourceKind,
  flags: V2VProviderStatusFlags = { hasConnectionFailed: false, requestsVM: false },
) => getV2VProviderStatus(providerCR, flags).status;
