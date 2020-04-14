import * as _ from 'lodash';
import { ImportProvidersSettings } from '../../../redux/initial-state/types';
import { ImportProvidersField, VMImportProvider, OvirtProviderField } from '../../../types';

export const getOvirtField = (
  importSettings: ImportProvidersSettings,
  key: OvirtProviderField,
  defaultValue: any = undefined,
) =>
  _.get(importSettings, [ImportProvidersField.PROVIDERS_DATA, VMImportProvider.OVIRT, key]) ||
  defaultValue;

export const getOvirtAttribute = (
  importSettings: ImportProvidersSettings,
  key: OvirtProviderField,
  attribute = 'value',
  defaultValue: any = undefined,
) =>
  _.get(importSettings, [
    ImportProvidersField.PROVIDERS_DATA,
    VMImportProvider.OVIRT,
    key,
    attribute,
  ]) || defaultValue;

export const getOvirtValue = (
  importSettings: ImportProvidersSettings,
  key: OvirtProviderField,
  defaultValue: any = undefined,
) => getOvirtAttribute(importSettings, key, 'value', defaultValue);
