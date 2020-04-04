import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getSimpleV2VPRoviderStatus, V2VProviderStatus } from '../../../../statuses/v2v';

export const getVms = (providerCR: K8sResourceKind, defaultValue) =>
  _.get(providerCR, 'spec.vms', defaultValue);

export const getLoadedVm = (providerCR: K8sResourceKind, vmID: string) =>
  providerCR &&
  vmID &&
  getSimpleV2VPRoviderStatus(providerCR) === V2VProviderStatus.CONNECTION_SUCCESSFUL
    ? getVms(providerCR, []).find((v) => _.get(v, 'id') === vmID && _.get(v, ['detail', 'raw']))
    : null;
