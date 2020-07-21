import { action, ActionType } from 'typesafe-actions';

export enum Actions {
  SetActiveQuickStart = 'setActiveQuickStart',
}

export const setActiveQuickStart = (activeQuickStartID: string) =>
  action(Actions.SetActiveQuickStart, { activeQuickStartID });

const actions = {
  setActiveQuickStart,
};

export type QuickStartSidebarActions = ActionType<typeof actions>;
