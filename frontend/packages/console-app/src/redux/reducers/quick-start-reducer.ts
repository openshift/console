import { QuickStartSidebarActions, Actions } from '../actions/quick-start-actions';
import { RootState } from '@console/internal/redux';

export const quickStartReducerName = 'quickStart';

type State = {
  isExpanded: boolean;
  activeQuickStartID: string;
};

const initialState: State = {
  isExpanded: false,
  activeQuickStartID: '',
};

export default (state = initialState, action: QuickStartSidebarActions) => {
  if (action.type === Actions.SetActiveQuickStart) {
    return {
      isExpanded: !!action.payload.activeQuickStartID,
      activeQuickStartID: action.payload.activeQuickStartID || state.activeQuickStartID,
    };
  }

  return state;
};

export const isQuickStartDrawerExpanded = (state: RootState): boolean =>
  !!state.plugins?.console?.[quickStartReducerName]?.isExpanded;

export const getActiveQuickStartID = (state: RootState): string =>
  state.plugins?.console?.[quickStartReducerName]?.activeQuickStartID;
