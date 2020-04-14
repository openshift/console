import {
  ImportProvidersField,
  OvirtProviderField,
  VMImportProvider,
  VMWareProviderField,
} from '../../../types';
import { iGetIn } from '../../../../../utils/immutable';
import { iGetImportProviders } from '../import-providers';

export const iGetProviderField = (
  state,
  wizardReduxID: string,
  provider: VMImportProvider,
  ovirtKey: OvirtProviderField,
  vmwareKey: VMWareProviderField,
) =>
  iGetIn(iGetImportProviders(state, wizardReduxID), [
    ImportProvidersField.PROVIDERS_DATA,
    provider,
    provider === VMImportProvider.OVIRT ? ovirtKey : vmwareKey,
  ]);

export const iGetProviderFieldAttribute = (
  state,
  wizardReduxID: string,
  provider: VMImportProvider,
  attribute: string,
  ovirtKey: OvirtProviderField,
  vmwareKey: VMWareProviderField,
) =>
  iGetIn(iGetImportProviders(state, wizardReduxID), [
    ImportProvidersField.PROVIDERS_DATA,
    provider,
    provider === VMImportProvider.OVIRT ? ovirtKey : vmwareKey,
    attribute,
  ]);

export const iGetProviderFieldValue = (
  state,
  wizardReduxID: string,
  provider: VMImportProvider,
  ovirtKey: OvirtProviderField,
  vmwareKey: VMWareProviderField,
) => iGetProviderFieldAttribute(state, wizardReduxID, provider, 'value', ovirtKey, vmwareKey);
