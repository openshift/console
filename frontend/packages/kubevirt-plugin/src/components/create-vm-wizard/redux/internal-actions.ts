import {
  CloudInitField,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
  VMWizardNetwork,
  VMWizardStorage,
  VMWizardTab,
} from '../types';
import { DeviceType } from '../../../constants/vm';
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
    error: string,
  ) => ({
    payload: {
      id,
      tab,
      isValid,
      hasAllRequiredFilled,
      error,
    },
    type: InternalActionType.SetTabValidity,
  }),
  [InternalActionType.SetTabLocked]: (id, tab: VMWizardTab, isLocked: boolean) => ({
    payload: {
      id,
      tab,
      isLocked,
    },
    type: InternalActionType.SetTabLocked,
  }),
  [InternalActionType.SetVmSettingsFieldValue]: (id, key: VMSettingsField, value: any) => ({
    payload: {
      id,
      key,
      value,
    },
    type: InternalActionType.SetVmSettingsFieldValue,
  }),
  [InternalActionType.UpdateVMSettingsProviderField]: (
    id,
    provider: VMImportProvider,
    key: VMWareProviderField,
    value: any,
  ) => ({
    payload: {
      id,
      provider,
      key,
      value,
    },
    type: InternalActionType.UpdateVMSettingsProviderField,
  }),

  [InternalActionType.UpdateVMSettingsProvider]: (id, provider: VMImportProvider, value: any) => ({
    payload: {
      id,
      provider,
      value,
    },
    type: InternalActionType.UpdateVMSettingsProvider,
  }),
  [InternalActionType.SetCloudInitFieldValue]: (id, key: CloudInitField, value: any) => ({
    payload: {
      id,
      key,
      value,
    },
    type: InternalActionType.SetCloudInitFieldValue,
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
  [InternalActionType.UpdateNIC]: (id, network: VMWizardNetwork) => ({
    payload: {
      id,
      network,
    },
    type: InternalActionType.UpdateNIC,
  }),
  [InternalActionType.RemoveNIC]: (id, networkID: string) => ({
    payload: {
      id,
      networkID,
    },
    type: InternalActionType.RemoveNIC,
  }),

  [InternalActionType.UpdateStorage]: (id, storage: VMWizardStorage) => ({
    payload: {
      id,
      storage,
    },
    type: InternalActionType.UpdateStorage,
  }),
  [InternalActionType.RemoveStorage]: (id, storageID: string) => ({
    payload: {
      id,
      storageID,
    },
    type: InternalActionType.RemoveStorage,
  }),
  [InternalActionType.SetDeviceBootOrder]: (
    id,
    deviceID: string,
    deviceType: DeviceType,
    bootOrder: number,
  ) => ({
    payload: {
      id,
      deviceID,
      deviceType,
      bootOrder,
    },
    type: InternalActionType.SetDeviceBootOrder,
  }),
  [InternalActionType.SetNetworks]: (id, networks: VMWizardNetwork[]) => ({
    payload: {
      id,
      value: networks,
    },
    type: InternalActionType.SetNetworks,
  }),
  [InternalActionType.SetStorages]: (id, value: VMWizardStorage[]) => ({
    payload: {
      id,
      value,
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
