import { Map, fromJS } from 'immutable';
import { QuickStartSidebarActions, Actions } from '../actions/quick-start-actions';
import { RootState } from '@console/internal/redux';
import {
  AllQuickStartStates,
  QuickStartState,
  QuickStartStatus,
  QuickStartTaskStatus,
} from '../../components/quick-starts/utils/quick-start-types';

export const quickStartReducerName = 'quickStart';

export const QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY = 'bridge/quick-start-redux-state';

type State = Map<string, any>;

const getDefaultQuickStartState = (totalTasks: number) => {
  const defaultQuickStartState = {
    status: QuickStartStatus.NOT_STARTED,
    taskNumber: 0,
  };
  if (totalTasks) {
    for (let i = 0; i < totalTasks; i++) {
      defaultQuickStartState[`taskStatus${i}`] = QuickStartTaskStatus.INIT;
    }
  }
  return Map(defaultQuickStartState);
};

export const getInitialState = (): State => {
  const persistedState = localStorage.getItem(QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY);

  let initialState;
  if (persistedState) {
    initialState = JSON.parse(persistedState);
  } else {
    initialState = {
      activeQuickStartId: '',
    };
    localStorage.setItem(QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY, JSON.stringify(initialState));
  }

  return fromJS(initialState);
};

const persistState = (state: State) =>
  localStorage.setItem(QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY, JSON.stringify(state.toJS()));

export default (state = getInitialState(), action: QuickStartSidebarActions) => {
  switch (action.type) {
    case Actions.SetActiveQuickStart: {
      const { quickStartId, totalTasks } = action.payload;
      const newState = state.withMutations((mutationState) =>
        mutationState
          .update('activeQuickStartId', (activeId) => {
            return quickStartId !== activeId ? quickStartId : '';
          })
          .updateIn(['allQuickStartStates', quickStartId], (quickStartState) => {
            if (!quickStartId || quickStartState) {
              return quickStartState;
            }

            return getDefaultQuickStartState(totalTasks);
          }),
      );
      persistState(newState);
      return newState;
    }

    case Actions.SetQuickStartStatus: {
      const { quickStartId, quickStartStatus } = action.payload;
      const newState = state.setIn(
        ['allQuickStartStates', quickStartId, 'status'],
        quickStartStatus,
      );
      persistState(newState);
      return newState;
    }

    case Actions.SetQuickStartTaskNumber: {
      const { quickStartTaskNumber } = action.payload;
      const quickStartId = state.get('activeQuickStartId');
      const newState = state.setIn(
        ['allQuickStartStates', quickStartId, 'taskNumber'],
        quickStartTaskNumber,
      );
      persistState(newState);
      return newState;
    }

    case Actions.SetQuickStartTaskStatus: {
      const { quickStartTaskStatus } = action.payload;
      const quickStartId = state.get('activeQuickStartId');
      const taskNumber = state.getIn(['allQuickStartStates', quickStartId, 'taskNumber']);
      const newState = state.setIn(
        ['allQuickStartStates', quickStartId, `taskStatus${taskNumber}`],
        quickStartTaskStatus,
      );
      persistState(newState);
      return newState;
    }

    default:
      return state;
  }
};

export const getActiveQuickStartID = (state: RootState): string =>
  state.plugins?.console?.[quickStartReducerName]?.get('activeQuickStartId');

export const getAllQuickStartStates = (state: RootState): AllQuickStartStates =>
  state.plugins?.console?.[quickStartReducerName]?.get('allQuickStartStates')?.toJS();

export const getActiveQuickStartState = (state: RootState): QuickStartState => {
  const reducerState = state.plugins?.console?.[quickStartReducerName];
  const quickStartId = getActiveQuickStartID(state);
  return reducerState?.getIn(['allQuickStartStates', quickStartId])?.toJS();
};

export const getActiveQuickStartStatus = (state: RootState): QuickStartStatus => {
  const reducerState = state.plugins?.console?.[quickStartReducerName];
  const quickStartId = getActiveQuickStartID(state);
  return reducerState?.getIn(['allQuickStartStates', quickStartId, 'status']);
};

export const getAllTaskStatuses = (state: RootState): QuickStartTaskStatus[] => {
  const reducerState = state.plugins?.console?.[quickStartReducerName];
  const quickStartId = getActiveQuickStartID(state);
  return reducerState?.getIn(['allQuickStartStates', quickStartId, 'allTaskStatuses']);
};

export const getCurrentTaskNumber = (state: RootState): number => {
  const reducerState = state.plugins?.console?.[quickStartReducerName];
  const quickStartId = getActiveQuickStartID(state);
  return reducerState?.getIn(['allQuickStartStates', quickStartId, 'taskNumber']);
};

export const getCurrentTaskStatus = (state: RootState): QuickStartTaskStatus => {
  const reducerState = state.plugins?.console?.[quickStartReducerName];
  const quickStartId = getActiveQuickStartID(state);
  const taskNumber = getCurrentTaskNumber(state);
  return reducerState?.getIn(['allQuickStartStates', quickStartId, `taskStatus${taskNumber}`]);
};
