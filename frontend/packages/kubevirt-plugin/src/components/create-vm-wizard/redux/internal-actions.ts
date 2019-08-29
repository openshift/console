import { VMSettingsField, VMWizardTab } from '../types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionBatch, InternalActionType, WizardInternalActionDispatcher } from './types';

type VMWizardInternalActions = { [key in InternalActionType]: WizardInternalActionDispatcher };

export const vmWizardInternalActions: VMWizardInternalActions = {
  [InternalActionType.Create]: (id, value: any) => ({
    payload: {
      id,
      value,
    },
    type: InternalActionType.Create,
  }),

  [InternalActionType.Dispose]: (id) => ({
    payload: {
      id,
    },
    type: InternalActionType.Dispose,
  }),
  [InternalActionType.Update]: (id, value) => ({
    payload: {
      id,
      value,
    },
    type: InternalActionType.Update,
  }),
  [InternalActionType.UpdateCommonData]: (id, value) => ({
    payload: {
      id,
      value,
    },
    type: InternalActionType.UpdateCommonData,
  }),
  [InternalActionType.SetTabValidity]: (
    id,
    tab: VMWizardTab,
    isValid: boolean,
    hasAllRequiredFilled: boolean,
  ) => ({
    payload: {
      id,
      tab,
      isValid,
      hasAllRequiredFilled,
    },
    type: InternalActionType.SetTabValidity,
  }),
  [InternalActionType.SetVmSettingsFieldValue]: (id, key: VMSettingsField, value: string) => ({
    payload: {
      id,
      key,
      value,
    },
    type: InternalActionType.SetVmSettingsFieldValue,
  }),
  [InternalActionType.UpdateVmSettingsField]: (id, key: VMSettingsField, value) => ({
    payload: {
      id,
      key,
      value,
    },
    type: InternalActionType.UpdateVmSettingsField,
  }),
  [InternalActionType.SetInVmSettings]: (id, path: string[], value) => ({
    payload: {
      id,
      path,
      value,
    },
    type: InternalActionType.SetInVmSettings,
  }),
  [InternalActionType.SetInVmSettingsBatch]: (id, batch: ActionBatch) => ({
    payload: {
      id,
      batch,
    },
    type: InternalActionType.SetInVmSettingsBatch,
  }),
  [InternalActionType.UpdateVmSettings]: (id, value) => ({
    payload: {
      id,
      value,
    },
    type: InternalActionType.UpdateVmSettings,
  }),
  [InternalActionType.SetNetworks]: (id, value, isValid: boolean, isLocked: boolean) => ({
    payload: {
      id,
      value,
      isValid,
      isLocked,
    },
    type: InternalActionType.SetNetworks,
  }),
  [InternalActionType.SetStorages]: (id, value, isValid: boolean, isLocked: boolean) => ({
    payload: {
      id,
      value,
      isValid,
      isLocked,
    },
    type: InternalActionType.SetStorages,
  }),
  [InternalActionType.SetResults]: (
    id,
    value,
    isValid: boolean,
    isLocked: boolean,
    isPending: boolean,
  ) => ({
    payload: {
      id,
      value,
      isValid,
      isLocked,
      isPending,
    },
    type: InternalActionType.SetResults,
  }),
};
