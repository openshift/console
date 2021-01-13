import { createContext, useCallback } from 'react';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY } from './const';
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
  startQuickStart?: (quickStartId: string, totalTasks: number) => void;
  restartQuickStart?: (quickStartId: string, totalTasks: number) => void;
  nextStep?: (totalTasks: number) => void;
  previousStep?: () => void;
  setQuickStartTaskNumber?: (quickStartId: string, taskNumber: number) => void;
  setQuickStartTaskStatus?: (taskStatus: QuickStartTaskStatus) => void;
  getQuickStartForId?: (id: string) => QuickStartState;
};

export const QuickStartContext = createContext<QuickStartContextValues>({ activeQuickStartID: '' });

const getInitialState = () =>
  localStorage.getItem(QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY))
    : {};

const getDefaultQuickStartState = (totalTasks: number, initialStatus?: QuickStartStatus) => {
  const defaultQuickStartState = {
    status: initialStatus || QuickStartStatus.NOT_STARTED,
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

  const startQuickStart = useCallback(
    (quickStartId: string, totalTasks?: number) => {
      setActiveQuickStartID((id) => {
        if (!id || id !== quickStartId) {
          return quickStartId;
        }
        return id;
      });
      setAllQuickStartStates((qs) => {
        if (qs.hasOwnProperty(quickStartId)) {
          return {
            ...qs,
            [quickStartId]: { ...qs[quickStartId], status: QuickStartStatus.IN_PROGRESS },
          };
        }
        return {
          ...qs,
          [quickStartId]: getDefaultQuickStartState(totalTasks, QuickStartStatus.IN_PROGRESS),
        };
      });
    },
    [setActiveQuickStartID, setAllQuickStartStates],
  );

  const restartQuickStart = useCallback(
    (quickStartId: string, totalTasks: number) => {
      setActiveQuickStartID((id) => {
        if (!id || id !== quickStartId) {
          return quickStartId;
        }
        return id;
      });
      setAllQuickStartStates((qs) => ({
        ...qs,
        [quickStartId]: getDefaultQuickStartState(totalTasks, QuickStartStatus.IN_PROGRESS),
      }));
    },
    [setActiveQuickStartID, setAllQuickStartStates],
  );

  const nextStep = useCallback(
    (totalTasks: number) => {
      if (!activeQuickStartID) return;

      setAllQuickStartStates((qs) => {
        const quickStart = qs[activeQuickStartID];
        const status = quickStart?.status;
        const taskNumber = quickStart?.taskNumber;
        const taskStatus = quickStart[`taskStatus${taskNumber}`];

        let updatedStatus;
        let updatedTaskNumber;
        let updatedTaskStatus;

        if (status === QuickStartStatus.NOT_STARTED) {
          updatedStatus = QuickStartStatus.IN_PROGRESS;
        } else if (
          status === QuickStartStatus.IN_PROGRESS &&
          taskStatus !== QuickStartTaskStatus.INIT &&
          taskNumber === totalTasks - 1
        ) {
          updatedStatus = QuickStartStatus.COMPLETE;
        }

        if (taskStatus === QuickStartTaskStatus.INIT) {
          updatedTaskStatus = QuickStartTaskStatus.REVIEW;
        }

        if (taskNumber < totalTasks && !updatedTaskStatus) {
          updatedTaskNumber = taskNumber + 1;
        }

        const newState = {
          ...qs,
          [activeQuickStartID]: {
            ...quickStart,
            ...(updatedStatus ? { status: updatedStatus } : {}),
            ...(updatedTaskNumber > -1 ? { taskNumber: updatedTaskNumber } : {}),
            ...(updatedTaskStatus ? { [`taskStatus${taskNumber}`]: updatedTaskStatus } : {}),
          },
        };
        return newState;
      });
    },
    [activeQuickStartID, setAllQuickStartStates],
  );

  const previousStep = useCallback(() => {
    setAllQuickStartStates((qs) => {
      const quickStart = qs[activeQuickStartID];
      const taskNumber = quickStart?.taskNumber;

      if (taskNumber < 0) return qs;

      return { ...qs, [activeQuickStartID]: { ...quickStart, taskNumber: taskNumber - 1 } };
    });
  }, [activeQuickStartID, setAllQuickStartStates]);

  const setQuickStartTaskNumber = useCallback(
    (quickStartId: string, taskNumber: number) => {
      setAllQuickStartStates((qs) => {
        const quickStart = qs[quickStartId];
        const status = quickStart?.status;
        let updatedStatus;
        if (taskNumber > -1 && status === QuickStartStatus.NOT_STARTED) {
          updatedStatus = QuickStartStatus.IN_PROGRESS;
        }
        const updatedQuickStart = {
          ...quickStart,
          ...(updatedStatus ? { status: updatedStatus } : {}),
          taskNumber,
        };
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

  const activeQuickStartState = allQuickStartStates?.[activeQuickStartID] ?? {};

  const getQuickStartForId = useCallback((id: string) => allQuickStartStates[id], [
    allQuickStartStates,
  ]);

  return {
    activeQuickStartID,
    activeQuickStartState,
    allQuickStartStates,
    setActiveQuickStart,
    startQuickStart,
    restartQuickStart,
    nextStep,
    previousStep,
    setQuickStartTaskNumber,
    setQuickStartTaskStatus,
    getQuickStartForId,
  };
};
