import {
  ImportProvidersField,
  VMImportProvider,
  VMWareProviderField,
  VMWizardProps,
} from '../../../../types';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { iGetImportProviders, iGetImportProvidersValue } from '../../import-providers';
import { iGetCommonData } from '../../selectors';

export const iGetVMwareData = (state, id: string) =>
  iGetIn(iGetImportProviders(state, id), [
    ImportProvidersField.PROVIDERS_DATA,
    VMImportProvider.VMWARE,
  ]);

export const iGetVMWareField = (state, id: string, key: VMWareProviderField, defaultValue?) =>
  iGet(iGetVMwareData(state, id), key, defaultValue);

export const iGetVMWareFieldAttribute = (
  state,
  id,
  key: VMWareProviderField,
  attribute = 'value',
  defaultValue?,
) => iGet(iGetVMWareField(state, id, key), attribute, defaultValue);

export const iGetVMWareFieldValue = (state, id: string, key: VMWareProviderField, defaultValue?) =>
  iGetVMWareFieldAttribute(state, id, key, 'value', defaultValue);

export const isVMWareProvider = (state, id: string) =>
  iGetCommonData(state, id, VMWizardProps.isProviderImport) &&
  iGetImportProvidersValue(state, id, ImportProvidersField.PROVIDER) === VMImportProvider.VMWARE;

export const hasVMWareSettingsChanged = (
  prevState,
  state,
  id: string,
  ...keys: VMWareProviderField[]
) => !!keys.find((key) => iGetVMWareField(prevState, id, key) !== iGetVMWareField(state, id, key));

export const hasVMWareSettingsValueChanged = (
  prevState,
  state,
  id: string,
  ...keys: VMWareProviderField[]
) =>
  keys.find(
    (key) => iGetVMWareFieldValue(prevState, id, key) !== iGetVMWareFieldValue(state, id, key),
  );
