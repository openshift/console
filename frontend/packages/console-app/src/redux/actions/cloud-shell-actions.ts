import { action, ActionType } from 'typesafe-actions';

export enum Actions {
  ToggleCloudShellExpanded = 'toggleCloudShellExpanded',
}

export const toggleCloudShellExpanded = () => action(Actions.ToggleCloudShellExpanded);

const actions = {
  toggleCloudShellExpanded,
};

export type CloudShellActions = ActionType<typeof actions>;
