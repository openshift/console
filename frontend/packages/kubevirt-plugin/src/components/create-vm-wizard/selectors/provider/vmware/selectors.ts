import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ImportProvidersSettings } from '../../../redux/initial-state/types';
import { ImportProvidersField, VMImportProvider, VMWareProviderField } from '../../../types';
import { getSimpleV2VPRoviderStatus, V2VProviderStatus } from '../../../../../statuses/v2v';
import { getVms } from '../selectors';

export const getVmwareField = (
  importSettings: ImportProvidersSettings,
  key: VMWareProviderField,
  defaultValue: any = undefined,
) =>
  _.get(importSettings, [ImportProvidersField.PROVIDERS_DATA, VMImportProvider.VMWARE, key]) ||
  defaultValue;

export const getVmwareAttribute = (
  importSettings: ImportProvidersSettings,
  key: VMWareProviderField,
  attribute = 'value',
  defaultValue: any = undefined,
) =>
  _.get(importSettings, [
    ImportProvidersField.PROVIDERS_DATA,
    VMImportProvider.VMWARE,
    key,
    attribute,
  ]) || defaultValue;

export const getVmwareValue = (
  importSettings: ImportProvidersSettings,
  key: VMWareProviderField,
  defaultValue: any = undefined,
) => getVmwareAttribute(importSettings, key, 'value', defaultValue);

export const getThumbprint = (v2vvmware: K8sResourceKind) => _.get(v2vvmware, 'spec.thumbprint');

export const getLoadedVm = (providerCR: K8sResourceKind, vmName: string) =>
  providerCR &&
  vmName &&
  getSimpleV2VPRoviderStatus(providerCR) === V2VProviderStatus.CONNECTION_SUCCESSFUL
    ? getVms(providerCR, []).find((v) => _.get(v, 'name') === vmName && _.get(v, ['detail', 'raw']))
    : null;
