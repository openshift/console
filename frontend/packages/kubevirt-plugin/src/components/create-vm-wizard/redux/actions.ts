import {
  ALL_VM_WIZARD_TABS,
  ChangedCommonDataProp,
  ChangedCommonData,
  CommonData,
  DetectCommonDataChanges,
  VMSettingsField,
} from '../types';
import { cleanup, updateAndValidateState } from './utils';
import { getTabInitialState } from './initial-state';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActionType, InternalActionType, WizardActionDispatcher } from './types';
import { vmWizardInternalActions } from './internal-actions';

type VMWizardActions = { [key in ActionType]: WizardActionDispatcher };

export const vmWizardActions: VMWizardActions = {
  [ActionType.Create]: (id, commonData: CommonData) => (dispatch, getState) => {
    const prevState = getState(); // must be called before dispatch

    dispatch(
      vmWizardInternalActions[InternalActionType.Create](id, {
        tabs: ALL_VM_WIZARD_TABS.reduce((initial, tabKey) => {
          initial[tabKey] = getTabInitialState(tabKey, commonData);
          return initial;
        }, {}),
        commonData,
      }),
    );

    updateAndValidateState({
      id,
      changedCommonData: new Set<ChangedCommonDataProp>(DetectCommonDataChanges),
      dispatch,
      getState,
      prevState,
    });
  },
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
  [ActionType.SetVmSettingsFieldValue]: (id, key: VMSettingsField, value: string) => (
    dispatch,
    getState,
  ) => {
    const prevState = getState(); // must be called before dispatch
    dispatch(vmWizardInternalActions[InternalActionType.SetVmSettingsFieldValue](id, key, value));

    updateAndValidateState({
      id,
      dispatch,
      changedCommonData: new Set<ChangedCommonDataProp>(),
      getState,
      prevState,
    });
  },
  [ActionType.UpdateCommonData]: (id, commonData: CommonData, changedProps: ChangedCommonData) => (
    dispatch,
    getState,
  ) => {
    const prevState = getState(); // must be called before dispatch

    dispatch(vmWizardInternalActions[InternalActionType.UpdateCommonData](id, commonData));

    updateAndValidateState({ id, dispatch, changedCommonData: changedProps, getState, prevState });
  },
  [ActionType.SetNetworks]: (id, value: any, isValid: boolean, isLocked: boolean) => (dispatch) => {
    dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, value, isValid, isLocked));
  },
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
