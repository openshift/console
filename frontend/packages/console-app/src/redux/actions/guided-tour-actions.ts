import { action, ActionType } from 'typesafe-actions';

export enum Actions {
  SetActiveGuidedTour = 'setActiveGuidedTour',
}

export const setActiveGuidedTour = (activeTourID: string) =>
  action(Actions.SetActiveGuidedTour, { activeTourID });

const actions = {
  setActiveGuidedTour,
};

export type GuidedTourSidebarActions = ActionType<typeof actions>;
