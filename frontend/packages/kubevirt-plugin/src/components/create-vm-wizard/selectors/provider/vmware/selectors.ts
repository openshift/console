import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getSimpleV2vVMwareStatus, V2VVMwareStatus } from '../../../../../statuses/v2vvmware';
import { VMSettings } from '../../../redux/initial-state/types';
import { VMImportProvider, VMSettingsField, VMWareProviderField } from '../../../types';

export const getVmwareField = (
  vmSettings: VMSettings,
  key: VMWareProviderField,
  defaultValue: any = undefined,
) =>
  _.get(vmSettings, [VMSettingsField.PROVIDERS_DATA, VMImportProvider.VMWARE, key]) || defaultValue;

export const getVmwareAttribute = (
  vmSettings: VMSettings,
  key: VMWareProviderField,
  attribute = 'value',
  defaultValue: any = undefined,
) =>
  _.get(vmSettings, [VMSettingsField.PROVIDERS_DATA, VMImportProvider.VMWARE, key, attribute]) ||
  defaultValue;

export const getVmwareValue = (
  vmSettings: VMSettings,
  key: VMWareProviderField,
  defaultValue: any = undefined,
) => getVmwareAttribute(vmSettings, key, 'value', defaultValue);

export const getVms = (v2vvmware: K8sResourceKind, defaultValue) =>
  _.get(v2vvmware, 'spec.vms', defaultValue);

export const getThumbprint = (v2vvmware: K8sResourceKind) => _.get(v2vvmware, 'spec.thumbprint');

export const getLoadedVm = (v2vvmware: K8sResourceKind, vmName: string) =>
  v2vvmware &&
  vmName &&
  getSimpleV2vVMwareStatus(v2vvmware) === V2VVMwareStatus.CONNECTION_SUCCESSFUL
    ? getVms(v2vvmware, []).find((v) => _.get(v, 'name') === vmName && _.get(v, ['detail', 'raw']))
    : null;
