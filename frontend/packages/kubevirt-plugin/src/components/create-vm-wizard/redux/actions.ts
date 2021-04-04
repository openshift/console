import { DeviceType } from '../../../constants/vm';
import { isStepHidden } from '../selectors/immutable/wizard-selectors';
import {
  ALL_VM_WIZARD_TABS,
  ChangedCommonData,
  ChangedCommonDataProp,
  CloudInitField,
  CommonData,
  DetectCommonDataChanges,
  ImportProvidersField,
  VM_WIZARD_DIFFICULT_TABS,
  VMImportProvider,
  VMSettingsField,
  VMWareProviderField,
  VMWizardNetwork,
  VMWizardStorage,
  VMWizardTab,
} from '../types';
import { getTabInitialState } from './initial-state/initial-state';
import { vmWizardInternalActions } from './internal-actions';
import { createVMAction } from './main-actions/create-vm';
import { disposeWizard } from './main-actions/dispose-wizard';
import { withUpdateAndValidateState } from './main-actions/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionType, InternalActionType, WizardActionDispatcher } from './types';

type VMWizardActions = { [key in ActionType]: WizardActionDispatcher };

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
            transient: {
              goToStep: undefined,
            },
            commonData,
          }),
        ),
      new Set<ChangedCommonDataProp>(DetectCommonDataChanges),
    ),
  [ActionType.Dispose]: disposeWizard,
  [ActionType.CreateVM]: createVMAction,
  [ActionType.SetGoToStep]: (id, tab: VMWizardTab) => (dispatch, getState) => {
    if (!isStepHidden(getState(), id, tab)) {
      dispatch(vmWizardInternalActions[InternalActionType.SetGoToStep](id, tab));
      // Hack to make changing steps work through CreateVMWizardFooter
      setTimeout(
        () => dispatch(vmWizardInternalActions[InternalActionType.SetGoToStep](id, null)),
        250,
      );
    }
  },
  [ActionType.OpenDifficultTabs]: (id) => (dispatch, getState) => {
    VM_WIZARD_DIFFICULT_TABS.forEach((difficultTab) => {
      if (isStepHidden(getState(), id, difficultTab)) {
        dispatch(vmWizardInternalActions[InternalActionType.SetTabHidden](id, difficultTab, false));
      }
    });
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
