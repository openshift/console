import { iGetIn } from '../../../../utils/immutable';
import { ImportProvidersField, VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './common';

export const iGetImportProviders = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.IMPORT_PROVIDERS, 'value']);

export const iGetImportProvidersField = (
  state,
  id: string,
  path: string[],
  defaultValue = undefined,
) => iGetIn(iGetImportProviders(state, id), path, defaultValue);

export const iGetImportProvidersAttribute = (
  state,
  id: string,
  key: ImportProvidersField,
  attribute = 'value',
  defaultValue = undefined,
) => iGetImportProvidersField(state, id, [key, attribute], defaultValue);

export const iGetImportProvidersValue = (
  state,
  id: string,
  key: ImportProvidersField,
  defaultValue = undefined,
) => iGetImportProvidersAttribute(state, id, key, 'value', defaultValue);

export const hasImportProvidersChanged = (
  prevState,
  state,
  id: string,
  ...keys: ImportProvidersField[]
) =>
  !!keys.find(
    (key) =>
      iGetImportProvidersField(prevState, id, [key]) !== iGetImportProvidersField(state, id, [key]),
  );
