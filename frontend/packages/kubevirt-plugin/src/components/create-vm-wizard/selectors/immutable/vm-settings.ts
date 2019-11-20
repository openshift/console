import { hasTruthyValue, iGet, iGetIn } from '../../../../utils/immutable';
import { VMSettingsField, VMWizardTab } from '../../types';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { iGetCreateVMWizardTabs } from './selectors';

export const iGetFieldValue = (field, defaultValue = undefined) =>
  iGet(field, 'value', defaultValue);
export const iGetFieldKey = (field, defaultValue = undefined) => iGet(field, 'key', defaultValue);

export const isFieldRequired = (field) => hasTruthyValue(iGet(field, 'isRequired'));
export const isFieldHidden = (field) => hasTruthyValue(iGet(field, 'isHidden'));
export const isFieldDisabled = (field) => hasTruthyValue(iGet(field, 'isDisabled'));

export const iGetVmSettings = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.VM_SETTINGS, 'value']);
export const iGetVmSetting = (state, id: string, path, defaultValue = undefined) =>
  iGetIn(iGetVmSettings(state, id), path, defaultValue);

export const hasVmSettingsChanged = (prevState, state, id: string, ...keys: VMSettingsField[]) =>
  !!keys.find((key) => iGetVmSetting(prevState, id, [key]) !== iGetVmSetting(state, id, [key]));

export const iGetVmSettingAttribute = (
  state,
  id: string,
  key: VMSettingsField,
  attribute = 'value',
  defaultValue = undefined,
) => iGetVmSetting(state, id, [key, attribute], defaultValue);

export const iGetVmSettingValue = (
  state,
  id: string,
  key: VMSettingsField,
  defaultValue = undefined,
) => iGetVmSettingAttribute(state, id, key, 'value', defaultValue);

export const hasVMSettingsValueChanged = (
  prevState,
  state,
  id: string,
  ...keys: VMSettingsField[]
) =>
  keys.find((key) => iGetVmSettingValue(prevState, id, key) !== iGetVmSettingValue(state, id, key));

export const iGetProvisionSource = (state, id: string) =>
  ProvisionSource.fromString(iGetVmSettingValue(state, id, VMSettingsField.PROVISION_SOURCE_TYPE));
