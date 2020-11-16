import * as React from 'react';
import { QuickStart, QuickStartStatus, QuickStartTaskStatus } from './utils/quick-start-types';
import QuickStartContent from './controller/QuickStartContent';
import QuickStartFooter from './controller/QuickStartFooter';
import { QuickStartContext, QuickStartContextValues } from './utils/quick-start-context';

type QuickStartControllerProps = {
  quickStart: QuickStart;
};

const QuickStartController: React.FC<QuickStartControllerProps> = ({ quickStart }) => {
  const {
    metadata: { name },
    spec: { tasks = [] },
  } = quickStart;
  const totalTasks = tasks?.length;
  const {
    activeQuickStartState,
    setActiveQuickStart,
    setQuickStartStatus,
    setQuickStartTaskNumber,
    setQuickStartTaskStatus,
  } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const status = activeQuickStartState?.status as QuickStartStatus;
  const taskNumber = activeQuickStartState?.taskNumber as number;
  const allTaskStatuses = tasks.map(
    (task, index) => activeQuickStartState[`taskStatus${index}`],
  ) as QuickStartTaskStatus[];
  const taskStatus = allTaskStatuses[taskNumber];
  const startQuickStart = React.useCallback(
    () => setQuickStartStatus(name, QuickStartStatus.IN_PROGRESS),
    [name, setQuickStartStatus],
  );

  const completeQuickStart = React.useCallback(
    () => setQuickStartStatus(name, QuickStartStatus.COMPLETE),
    [name, setQuickStartStatus],
  );

  const handleQuickStartChange = React.useCallback(
    (quickStartId: string) => setActiveQuickStart(quickStartId),
    [setActiveQuickStart],
  );

  const handleTaskStatusChange = React.useCallback(
    (newTaskStatus: QuickStartTaskStatus) => setQuickStartTaskStatus(newTaskStatus),
    [setQuickStartTaskStatus],
  );

  const handleNext = React.useCallback(() => {
    if (status === QuickStartStatus.NOT_STARTED) startQuickStart();
    if (status === QuickStartStatus.COMPLETE && taskNumber === totalTasks)
      return handleQuickStartChange('');

    if (
      status === QuickStartStatus.IN_PROGRESS &&
      taskStatus !== QuickStartTaskStatus.INIT &&
      taskNumber === totalTasks - 1
    )
      completeQuickStart();

    if (taskStatus === QuickStartTaskStatus.INIT)
      return handleTaskStatusChange(QuickStartTaskStatus.REVIEW);

    if (taskNumber < totalTasks) return setQuickStartTaskNumber(name, taskNumber + 1);

    return null;
  }, [
    completeQuickStart,
    handleQuickStartChange,
    handleTaskStatusChange,
    name,
    setQuickStartTaskNumber,
    startQuickStart,
    status,
    taskNumber,
    taskStatus,
    totalTasks,
  ]);

  const handleBack = React.useCallback(() => {
    if (taskNumber > -1) return setQuickStartTaskNumber(name, taskNumber - 1);

    return null;
  }, [name, setQuickStartTaskNumber, taskNumber]);

  const handleTaskSelect = React.useCallback(
    (selectedTaskNumber: number) => {
      setQuickStartTaskNumber(name, selectedTaskNumber);
      startQuickStart();
    },
    [name, setQuickStartTaskNumber, startQuickStart],
  );

  return (
    <>
      <QuickStartContent
        quickStart={quickStart}
        taskNumber={taskNumber}
        allTaskStatuses={allTaskStatuses}
        onTaskSelect={handleTaskSelect}
        onTaskReview={handleTaskStatusChange}
        onQuickStartChange={handleQuickStartChange}
      />
      <QuickStartFooter
        status={status}
        taskNumber={taskNumber}
        totalTasks={totalTasks}
        onNext={handleNext}
        onBack={handleBack}
      />
    </>
  );
};

export default QuickStartController;
