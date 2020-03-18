import {
  ALL_VM_WIZARD_TABS,
  ChangedCommonDataProp,
  ChangedCommonData,
  CommonData,
  DetectCommonDataChanges,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardTab,
  VMWizardStorage,
  CloudInitField,
  VMWareProviderField,
  VMImportProvider,
  ImportProvidersField,
} from '../types';
import { DeviceType } from '../../../constants/vm';
import { cleanup, updateAndValidateState } from './utils';
import { getTabInitialState } from './initial-state/initial-state';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionType, InternalActionType, WizardActionDispatcher } from './types';
import { vmWizardInternalActions } from './internal-actions';

type VMWizardActions = { [key in ActionType]: WizardActionDispatcher };

const withUpdateAndValidateState = (
  id: string,
  resolveAction,
  changedCommonData?: Set<ChangedCommonDataProp>,
) => (dispatch, getState) => {
  const prevState = getState(); // must be called before dispatch in resolveAction

  resolveAction(dispatch, getState);

  updateAndValidateState({
    id,
    dispatch,
    changedCommonData: changedCommonData || new Set<ChangedCommonDataProp>(),
    getState,
    prevState,
  });
};

export const vmWizardActions: VMWizardActions = {
  [ActionType.Create]: (id, commonData: CommonData) =>
    withUpdateAndValidateState(
      id,
      (dispatch) =>
        dispatch(
          vmWizardInternalActions[InternalActionType.Create](id, {
            tabs: ALL_VM_WIZARD_TABS.reduce((initial, tabKey) => {
              initial[tabKey] = getTabInitialState(tabKey, commonData);
              return initial;
            }, {}),
            extraWSQueries: {},
            commonData,
          }),
        ),
      new Set<ChangedCommonDataProp>(DetectCommonDataChanges),
    ),
  [ActionType.Dispose]: (id) => (dispatch, getState) => {
    const prevState = getState(); // must be called before dispatch
    cleanup({
      id,
      changedCommonData: new Set<ChangedCommonDataProp>(),
      dispatch,
      prevState,
      getState,
    });

    dispatch(vmWizardInternalActions[InternalActionType.Dispose](id));
  },
  [ActionType.SetVmSettingsFieldValue]: (id, key: VMSettingsField, value: any) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.SetVmSettingsFieldValue](id, key, value)),
    ),
  [ActionType.SetImportProvidersFieldValue]: (id, key: ImportProvidersField, value: any) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(
        vmWizardInternalActions[InternalActionType.SetImportProvidersFieldValue](id, key, value),
      ),
    ),
  [ActionType.UpdateImportProviderField]: (
    id,
    provider: VMImportProvider,
    key: VMWareProviderField | any,
    value: any,
  ) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateImportProviderField](
          id,
          provider,
          key,
          value,
        ),
      ),
    ),
  [ActionType.SetCloudInitFieldValue]: (id, key: CloudInitField, value: any) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](id, key, value)),
    ),
  [ActionType.UpdateCommonData]: (id, commonData: CommonData, changedProps?: ChangedCommonData) =>
    withUpdateAndValidateState(
      id,
      (dispatch) => {
        if (commonData) {
          dispatch(vmWizardInternalActions[InternalActionType.UpdateCommonData](id, commonData));
        }
      },
      changedProps,
    ),
  [ActionType.SetTabLocked]: (id, tab: VMWizardTab, isLocked: boolean) => (dispatch) => {
    dispatch(vmWizardInternalActions[InternalActionType.SetTabLocked](id, tab, isLocked));
  },
  [ActionType.SetTabHidden]: (id, tab: VMWizardTab, isHidden: boolean) => (dispatch) => {
    dispatch(vmWizardInternalActions[InternalActionType.SetTabHidden](id, tab, isHidden));
  },
  [ActionType.UpdateNIC]: (id, network: VMWizardNetwork) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.UpdateNIC](id, network)),
    ),
  [ActionType.RemoveNIC]: (id, networkID: string) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.RemoveNIC](id, networkID)),
    ),

  [ActionType.UpdateStorage]: (id, storage: VMWizardStorage) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.UpdateStorage](id, storage)),
    ),
  [ActionType.RemoveStorage]: (id, storageID: string) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.RemoveStorage](id, storageID)),
    ),
  [ActionType.SetDeviceBootOrder]: (
    id,
    deviceID: string,
    deviceType: DeviceType,
    bootOrder: number,
  ) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(
        vmWizardInternalActions[InternalActionType.SetDeviceBootOrder](
          id,
          deviceID,
          deviceType,
          bootOrder,
        ),
      ),
    ),
  [ActionType.SetResults]: (
    id,
    value: any,
    isValid: boolean,
    isLocked: boolean,
    isPending: boolean,
  ) => (dispatch) => {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetResults](
        id,
        value,
        isValid,
        isLocked,
        isPending,
      ),
    );
  },
};
