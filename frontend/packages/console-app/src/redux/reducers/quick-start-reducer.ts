import { QuickStartSidebarActions, Actions } from '../actions/quick-start-actions';
import { RootState } from '@console/internal/redux';
import {
  QuickStartStates,
  QuickStartState,
  QuickStartStatus,
} from '../../components/quick-starts/utils/quick-start-types';

export const quickStartReducerName = 'quickStart';

type State = {
  activeQuickStartID: string;
  quickStartStates?: QuickStartStates;
};

const defaultQuickStartState: QuickStartState = {
  status: QuickStartStatus.NOT_STARTED,
  currentTask: -1,
  taskStatus: [],
};

const initialState: State = {
  activeQuickStartID: '',
  quickStartStates: {},
};

export default (state = initialState, action: QuickStartSidebarActions) => {
  if (action.type === Actions.SetActiveQuickStart) {
    const { activeQuickStartID: actionID } = action.payload;
    const { activeQuickStartID: stateID, quickStartStates: oldQuickStartStates } = state;
    const activeQuickStartID = actionID !== stateID ? actionID : '';
    const initState = activeQuickStartID && !oldQuickStartStates.hasOwnProperty(activeQuickStartID);
    const newQuickStartStates = {
      quickStartStates: {
        ...oldQuickStartStates,
        [activeQuickStartID]: defaultQuickStartState,
      },
    };
    return {
      ...state,
      activeQuickStartID,
      ...(initState ? newQuickStartStates : {}),
    };
  }

  return state;
};

export const getActiveQuickStartID = (state: RootState): string =>
  state.plugins?.console?.[quickStartReducerName]?.activeQuickStartID;

export const getQuickStartStates = (state: RootState): QuickStartStates =>
  state.plugins?.console?.[quickStartReducerName]?.quickStartStates;
