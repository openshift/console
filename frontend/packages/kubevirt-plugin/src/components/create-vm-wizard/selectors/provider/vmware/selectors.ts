import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getSimpleV2vVMwareStatus, V2VVMwareStatus } from '../../../../../statuses/v2vvmware';

export const getVms = (v2vvmware: K8sResourceKind, defaultValue) =>
  _.get(v2vvmware, 'spec.vms', defaultValue);

export const getThumbprint = (v2vvmware: K8sResourceKind) => _.get(v2vvmware, 'spec.thumbprint');

export const getLoadedVm = (v2vvmware: K8sResourceKind, vmName: string) =>
  v2vvmware &&
  vmName &&
  getSimpleV2vVMwareStatus(v2vvmware) === V2VVMwareStatus.CONNECTION_SUCCESSFUL
    ? getVms(v2vvmware, []).find((v) => _.get(v, 'name') === vmName && _.get(v, ['detail', 'raw']))
    : null;
