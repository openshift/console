import {
  ImportProvidersField,
  VMImportProvider,
  OvirtProviderField,
  VMWizardProps,
} from '../../../../types';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { iGetImportProviders, iGetImportProvidersValue } from '../../import-providers';
import { iGetCommonData } from '../../selectors';

export const iGetOvirtData = (state, id: string) =>
  iGetIn(iGetImportProviders(state, id), [
    ImportProvidersField.PROVIDERS_DATA,
    VMImportProvider.OVIRT,
  ]);

export const iGetOvirtField = (state, id: string, key: OvirtProviderField, defaultValue?) =>
  iGet(iGetOvirtData(state, id), key, defaultValue);

export const iGetOvirtFieldAttribute = (
  state,
  id,
  key: OvirtProviderField,
  attribute = 'value',
  defaultValue?,
) => iGet(iGetOvirtField(state, id, key), attribute, defaultValue);

export const iGetOvirtFieldValue = (state, id: string, key: OvirtProviderField, defaultValue?) =>
  iGetOvirtFieldAttribute(state, id, key, 'value', defaultValue);

export const isOvirtProvider = (state, id: string) =>
  iGetCommonData(state, id, VMWizardProps.isProviderImport) &&
  iGetImportProvidersValue(state, id, ImportProvidersField.PROVIDER) === VMImportProvider.OVIRT;

export const hasOvirtSettingsChanged = (
  prevState,
  state,
  id: string,
  ...keys: OvirtProviderField[]
) => keys.find((key) => iGetOvirtField(prevState, id, key) !== iGetOvirtField(state, id, key));

export const hasOvirtSettingsValueChanged = (
  prevState,
  state,
  id: string,
  ...keys: OvirtProviderField[]
) =>
  keys.find(
    (key) => iGetOvirtFieldValue(prevState, id, key) !== iGetOvirtFieldValue(state, id, key),
  );
