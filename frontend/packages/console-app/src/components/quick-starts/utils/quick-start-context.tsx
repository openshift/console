import * as React from 'react';
import {
  QuickStartContext,
  QuickStartContextProvider,
  QuickStartContextValues,
  getDefaultQuickStartState,
  QuickStartStatus,
  QuickStartTaskStatus,
  getTaskStatusKey,
  QUICKSTART_TASKS_INITIAL_STATES,
} from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import {
  MarkdownExecuteSnippet,
  useInlineExecuteCommandShowdownExtension,
  useMultilineExecuteCommandShowdownExtension,
} from '@console/shared';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';

export { QuickStartContext };
export { QuickStartContextProvider };

const QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY = 'bridge/quick-start-redux-state';

const getInitialState = () =>
  localStorage.getItem(QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(QUICKSTART_REDUX_STATE_LOCAL_STORAGE_KEY))
    : {};

const QUICK_START_KEY = 'console.quickstart';
const ACTIVE_QUICK_START_ID_KEY = `${QUICK_START_KEY}.active`;
const ALL_QUICK_START_STATE_KEY = `${QUICK_START_KEY}.allStates`;

const useActiveQuickStartId = () =>
  useUserSettings<string>(ACTIVE_QUICK_START_ID_KEY, getInitialState()?.activeQuickStartId ?? '');
const useAllQuickStartStates = () =>
  useUserSettings(ALL_QUICK_START_STATE_KEY, getInitialState()?.allQuickStartStates ?? {});

export const useValuesForQuickStartContext = (): QuickStartContextValues => {
  const { i18n } = useTranslation();
  const [activeQuickStartID, setActiveQuickStartID] = useActiveQuickStartId();
  const [allQuickStartStates, setAllQuickStartStates] = useAllQuickStartStates();
  const fireTelemetryEvent = useTelemetry();
  const inlineExecuteCommandShowdownExtension = useInlineExecuteCommandShowdownExtension();
  const multilineExecuteCommandShowdownExtension = useMultilineExecuteCommandShowdownExtension();

  const startQuickStart = React.useCallback(
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
      fireTelemetryEvent('Quick Start Initiated', {
        id: quickStartId,
        type: 'start',
      });
    },
    [setActiveQuickStartID, setAllQuickStartStates, fireTelemetryEvent],
  );

  const restartQuickStart = React.useCallback(
    (quickStartId: string, totalTasks: number) => {
      setActiveQuickStartID((id) => {
        if (!id || id !== quickStartId) {
          return quickStartId;
        }
        return id;
      });
      setAllQuickStartStates((qs) => ({
        ...qs,
        [quickStartId]: getDefaultQuickStartState(totalTasks, QuickStartStatus.NOT_STARTED),
      }));
      fireTelemetryEvent('Quick Start Initiated', {
        id: quickStartId,
        type: 'restart',
      });
    },
    [setActiveQuickStartID, setAllQuickStartStates, fireTelemetryEvent],
  );

  const nextStep = React.useCallback(
    (totalTasks: number) => {
      if (!activeQuickStartID) return;

      setAllQuickStartStates((qs) => {
        const quickStart = qs[activeQuickStartID];
        const status = quickStart?.status;
        const taskNumber = quickStart?.taskNumber;
        const taskStatus = quickStart[getTaskStatusKey(taskNumber)];

        let updatedStatus;
        let updatedTaskNumber;
        let updatedTaskStatus;

        if (status === QuickStartStatus.NOT_STARTED) {
          fireTelemetryEvent('Quick Start Initiated', {
            id: activeQuickStartID,
            type: 'start',
          });
          updatedStatus = QuickStartStatus.IN_PROGRESS;
        } else if (
          status === QuickStartStatus.IN_PROGRESS &&
          !QUICKSTART_TASKS_INITIAL_STATES.includes(taskStatus) &&
          taskNumber === totalTasks - 1
        ) {
          fireTelemetryEvent('Quick Start Completed', {
            id: activeQuickStartID,
          });
          updatedStatus = QuickStartStatus.COMPLETE;
        }

        if (taskStatus === QuickStartTaskStatus.VISITED) {
          updatedTaskStatus = QuickStartTaskStatus.REVIEW;
        }

        if (taskNumber < totalTasks && !updatedTaskStatus) {
          updatedTaskNumber = taskNumber + 1;
        }
        const markInitialStepVisited =
          updatedTaskNumber > -1 &&
          quickStart[getTaskStatusKey(updatedTaskNumber)] === QuickStartTaskStatus.INIT
            ? QuickStartTaskStatus.VISITED
            : quickStart[getTaskStatusKey(updatedTaskNumber)];
        const newState = {
          ...qs,
          [activeQuickStartID]: {
            ...quickStart,
            ...(updatedStatus ? { status: updatedStatus } : {}),
            ...(updatedTaskNumber > -1
              ? {
                  taskNumber: updatedTaskNumber,
                  [getTaskStatusKey(updatedTaskNumber)]: markInitialStepVisited,
                }
              : {}),
            ...(updatedTaskStatus ? { [getTaskStatusKey(taskNumber)]: updatedTaskStatus } : {}),
          },
        };
        return newState;
      });
    },
    [activeQuickStartID, setAllQuickStartStates, fireTelemetryEvent],
  );

  const language = localStorage.getItem('bridge/language') || 'en';
  const resourceBundle = i18n.getResourceBundle(language, 'quickstart');
  return {
    language,
    resourceBundle,
    activeQuickStartID,
    allQuickStartStates,
    setActiveQuickStartID,
    setAllQuickStartStates,
    startQuickStart,
    restartQuickStart,
    nextStep,
    footer: {
      show: false,
    },
    markdown: {
      extensions: [inlineExecuteCommandShowdownExtension, multilineExecuteCommandShowdownExtension],
      renderExtension: (docContext: HTMLDocument, rootSelector: string) => (
        <>
          <MarkdownExecuteSnippet docContext={docContext} rootSelector={rootSelector} />
        </>
      ),
    },
  };
};
