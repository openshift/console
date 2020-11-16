import { createContext, useCallback } from 'react';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY } from '../../../redux/reducers/quick-start-reducer';
import {
  AllQuickStartStates,
  QuickStartState,
  QuickStartStatus,
  QuickStartTaskStatus,
} from './quick-start-types';

export type QuickStartContextValues = {
  activeQuickStartID: string;
  allQuickStartStates?: AllQuickStartStates;
  activeQuickStartState?: QuickStartState;
  setActiveQuickStart?: (quickStartId: string, totalTasks?: number) => void;
  setQuickStartStatus?: (quickStartId: string, status: QuickStartStatus) => void;
  setQuickStartTaskNumber?: (quickStartId: string, taskNumber: number) => void;
  setQuickStartTaskStatus?: (taskStatus: QuickStartTaskStatus) => void;
  resetQuickStart?: (quickStartId: string, totalTasks: number) => void;
  getQuickStartForId?: (id: string) => QuickStartState;
};

export const QuickStartContext = createContext<QuickStartContextValues>({ activeQuickStartID: '' });

const getInitialState = () =>
  localStorage.getItem(QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(QUICK_START_REDUX_STATE_LOCAL_STORAGE_KEY))
    : {};

const getDefaultQuickStartState = (totalTasks: number) => {
  const defaultQuickStartState = {
    status: QuickStartStatus.NOT_STARTED,
    taskNumber: -1,
  };
  if (totalTasks) {
    for (let i = 0; i < totalTasks; i++) {
      defaultQuickStartState[`taskStatus${i}`] = QuickStartTaskStatus.INIT;
    }
  }
  return defaultQuickStartState;
};

const QUICK_START_KEY = 'console.quickstart';
const ACTIVE_QUICK_START_ID_KEY = `${QUICK_START_KEY}.active`;
const ALL_QUICK_START_STATE_KEY = `${QUICK_START_KEY}.allStates`;

const useActiveQuickStartId = () =>
  useUserSettings<string>(ACTIVE_QUICK_START_ID_KEY, getInitialState()?.activeQuickStartId ?? '');
const useAllQuickStartStates = () =>
  useUserSettings(ALL_QUICK_START_STATE_KEY, getInitialState()?.allQuickStartStates ?? {});

export const useValuesForQuickStartContext = (): QuickStartContextValues => {
  const [activeQuickStartID, setActiveQuickStartID] = useActiveQuickStartId();
  const [allQuickStartStates, setAllQuickStartStates] = useAllQuickStartStates();

  const setActiveQuickStart = useCallback(
    (quickStartId: string, totalTasks?: number) => {
      setActiveQuickStartID((id) => (id !== quickStartId ? quickStartId : ''));
      setAllQuickStartStates((qs) =>
        !quickStartId || qs[quickStartId]
          ? qs
          : { ...qs, [quickStartId]: getDefaultQuickStartState(totalTasks) },
      );
    },
    [setActiveQuickStartID, setAllQuickStartStates],
  );

  const setQuickStartStatus = useCallback(
    (quickStartId: string, status: QuickStartStatus) => {
      setAllQuickStartStates((qs) => {
        const quickStart = qs[quickStartId];
        const updatedQuickStart = { ...quickStart, status };
        return { ...qs, [quickStartId]: updatedQuickStart };
      });
    },
    [setAllQuickStartStates],
  );
  const setQuickStartTaskNumber = useCallback(
    (quickStartId: string, taskNumber: number) => {
      setAllQuickStartStates((qs) => {
        const quickStart = qs[quickStartId];
        const updatedQuickStart = { ...quickStart, taskNumber };
        return { ...qs, [quickStartId]: updatedQuickStart };
      });
    },
    [setAllQuickStartStates],
  );
  const setQuickStartTaskStatus = useCallback(
    (taskStatus: QuickStartTaskStatus) => {
      const quickStart = allQuickStartStates[activeQuickStartID];
      const { taskNumber } = quickStart;
      const updatedQuickStart = { ...quickStart, [`taskStatus${taskNumber}`]: taskStatus };
      setAllQuickStartStates((qs) => ({ ...qs, [activeQuickStartID]: updatedQuickStart }));
    },
    [allQuickStartStates, activeQuickStartID, setAllQuickStartStates],
  );
  const resetQuickStart = useCallback(
    (quickStartId: string, totalTasks: number) => {
      setAllQuickStartStates((qs) => ({
        ...qs,
        [quickStartId]: getDefaultQuickStartState(totalTasks),
      }));
    },
    [setAllQuickStartStates],
  );
  const activeQuickStartState = allQuickStartStates?.[activeQuickStartID] ?? {};
  const getQuickStartForId = useCallback((id: string) => allQuickStartStates[id], [
    allQuickStartStates,
  ]);
  return {
    activeQuickStartID,
    activeQuickStartState,
    allQuickStartStates,
    setActiveQuickStart,
    setQuickStartStatus,
    setQuickStartTaskNumber,
    setQuickStartTaskStatus,
    resetQuickStart,
    getQuickStartForId,
  };
};
