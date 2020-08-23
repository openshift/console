import { iGetIn } from '../../../../utils/immutable';
import { VMSettingsField, VMWizardTab } from '../../types';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { iGetCreateVMWizardTabs } from './common';

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

export const iGetProvisionSource = (state, id: string): ProvisionSource =>
  ProvisionSource.fromString(iGetVmSettingValue(state, id, VMSettingsField.PROVISION_SOURCE_TYPE));

export const iGetRelevantTemplateSelectors = (state, id: string) => {
  const os = iGetVmSettingAttribute(state, id, VMSettingsField.OPERATING_SYSTEM);
  const flavor = iGetVmSettingAttribute(state, id, VMSettingsField.FLAVOR);
  const workload = iGetVmSettingAttribute(state, id, VMSettingsField.WORKLOAD_PROFILE);

  return { os, flavor, workload };
};
