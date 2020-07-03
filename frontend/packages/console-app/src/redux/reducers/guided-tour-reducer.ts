import { GuidedTourSidebarActions, Actions } from '../actions/guided-tour-actions';
import { RootState } from '@console/internal/redux';

export const guidedTourReducerName = 'guidedTour';

type State = {
  isExpanded: boolean;
  activeTourID: string;
};

const initialState: State = {
  isExpanded: false,
  activeTourID: '',
};

export default (state = initialState, action: GuidedTourSidebarActions) => {
  if (action.type === Actions.SetActiveGuidedTour) {
    return {
      isExpanded: !!action.payload.activeTourID,
      activeTourID: action.payload.activeTourID || state.activeTourID,
    };
  }

  return state;
};

export const isGuidedTourDrawerExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[guidedTourReducerName]?.isExpanded;

export const getActiveTourID = (state: RootState): string =>
  state.plugins?.console?.[guidedTourReducerName]?.activeTourID;
