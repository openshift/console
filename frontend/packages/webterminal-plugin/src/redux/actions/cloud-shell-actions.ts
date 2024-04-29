import { Dispatch } from 'redux';
import { action, ActionType } from 'typesafe-actions';
import { RootState } from '@console/internal/redux';
import { isCloudShellExpanded, isCloudShellActive } from '../reducers/cloud-shell-selectors';

export enum Actions {
  SetCloudShellExpanded = 'setCloudShellExpanded',
  SetCloudShellActive = 'setCloudShellActive',
  SetCloudShellCommand = 'setCloudShellCommand',
}

export const setCloudShellCommand = (command: string | null) =>
  action(Actions.SetCloudShellCommand, { command });

export const setCloudShellExpanded = (isExpanded: boolean) =>
  action(Actions.SetCloudShellExpanded, { isExpanded });

export const toggleCloudShellExpanded = () => async (
  dispatch: Dispatch,
  getState: () => RootState,
) => {
  const expanded = isCloudShellExpanded(getState());
  if (expanded && isCloudShellActive(getState())) {
    (
      await import(
        '@console/webterminal-plugin/src/components/cloud-shell/cloudShellConfirmationModal'
      )
    ).default(() => dispatch(setCloudShellExpanded(false)));
  } else {
    dispatch(setCloudShellExpanded(!expanded));
  }
};

export const setCloudShellActive = (isActive: boolean) =>
  action(Actions.SetCloudShellActive, { isActive });

const actions = {
  setCloudShellExpanded,
  setCloudShellActive,
  setCloudShellCommand,
};

export type CloudShellActions = ActionType<typeof actions>;
