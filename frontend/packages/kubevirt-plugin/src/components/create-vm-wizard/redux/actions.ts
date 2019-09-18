import {
  ALL_VM_WIZARD_TABS,
  ChangedCommonDataProp,
  ChangedCommonData,
  CommonData,
  DetectCommonDataChanges,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardTab,
} from '../types';
import { cleanup, updateAndValidateState } from './utils';
import { getTabInitialState } from './initial-state';
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
  [ActionType.SetVmSettingsFieldValue]: (id, key: VMSettingsField, value: string) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.SetVmSettingsFieldValue](id, key, value)),
    ),
  [ActionType.UpdateCommonData]: (id, commonData: CommonData, changedProps: ChangedCommonData) =>
    withUpdateAndValidateState(
      id,
      (dispatch) =>
        dispatch(vmWizardInternalActions[InternalActionType.UpdateCommonData](id, commonData)),
      changedProps,
    ),
  [ActionType.SetTabLocked]: (id, tab: VMWizardTab, isLocked: boolean) => (dispatch) => {
    dispatch(vmWizardInternalActions[InternalActionType.SetTabLocked](id, tab, isLocked));
  },
  [ActionType.UpdateNIC]: (id, network: VMWizardNetwork) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.UpdateNIC](id, network)),
    ),
  [ActionType.RemoveNIC]: (id, networkID: string) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.RemoveNIC](id, networkID)),
    ),
  [ActionType.SetNetworks]: (id, networks: VMWizardNetwork[]) =>
    withUpdateAndValidateState(id, (dispatch) =>
      dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, networks)),
    ),
  [ActionType.SetStorages]: (id, value: any, isValid: boolean, isLocked: boolean) => (dispatch) => {
    dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, value, isValid, isLocked));
  },
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
