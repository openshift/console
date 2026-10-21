import type { ActionType } from 'typesafe-actions';
import { action } from 'typesafe-actions';

export enum Actions {
  SetCloudShellExpanded = 'setCloudShellExpanded',
  SetCloudShellActive = 'setCloudShellActive',
  SetCloudShellCommand = 'setCloudShellCommand',
}

export const setCloudShellCommand = (command: string | null) =>
  action(Actions.SetCloudShellCommand, { command });

export const setCloudShellExpanded = (isExpanded: boolean) =>
  action(Actions.SetCloudShellExpanded, { isExpanded });

export const setCloudShellActive = (isActive: boolean) =>
  action(Actions.SetCloudShellActive, { isActive });

const actions = {
  setCloudShellExpanded,
  setCloudShellActive,
  setCloudShellCommand,
};

export type CloudShellActions = ActionType<typeof actions>;
