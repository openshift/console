import * as React from 'react';
import QuickStartContent from './controller/QuickStartContent';
import QuickStartFooter from './controller/QuickStartFooter';
import { QuickStartContext, QuickStartContextValues } from './utils/quick-start-context';
import { QuickStart, QuickStartStatus, QuickStartTaskStatus } from './utils/quick-start-types';

type QuickStartControllerProps = {
  quickStart: QuickStart;
  nextQuickStarts?: QuickStart[];
  footerClass: string;
  contentRef: React.Ref<HTMLDivElement>;
};

const QuickStartController: React.FC<QuickStartControllerProps> = ({
  quickStart,
  nextQuickStarts,
  contentRef,
  footerClass,
}) => {
  const {
    metadata: { name },
    spec: { tasks = [] },
  } = quickStart;
  const totalTasks = tasks?.length;
  const {
    activeQuickStartState,
    setActiveQuickStart,
    setQuickStartTaskNumber,
    setQuickStartTaskStatus,
    nextStep,
    previousStep,
  } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const status = activeQuickStartState?.status as QuickStartStatus;
  const taskNumber = activeQuickStartState?.taskNumber as number;
  const allTaskStatuses = tasks.map(
    (task, index) => activeQuickStartState[`taskStatus${index}`],
  ) as QuickStartTaskStatus[];

  const handleQuickStartChange = React.useCallback(
    (quickStartId: string) => setActiveQuickStart(quickStartId),
    [setActiveQuickStart],
  );

  const handleTaskStatusChange = React.useCallback(
    (newTaskStatus: QuickStartTaskStatus) => setQuickStartTaskStatus(newTaskStatus),
    [setQuickStartTaskStatus],
  );

  const getQuickStartActiveTask = React.useCallback(() => {
    let activeTaskNumber = 0;
    while (
      activeTaskNumber !== totalTasks &&
      activeQuickStartState[`taskStatus${activeTaskNumber}`] !== QuickStartTaskStatus.INIT
    ) {
      activeTaskNumber++;
    }
    return activeTaskNumber;
  }, [totalTasks, activeQuickStartState]);

  const handleQuickStartContinue = React.useCallback(() => {
    const activeTaskNumber = getQuickStartActiveTask();
    setQuickStartTaskNumber(name, activeTaskNumber);
  }, [getQuickStartActiveTask, setQuickStartTaskNumber, name]);

  const handleNext = React.useCallback(() => {
    if (status === QuickStartStatus.COMPLETE && taskNumber === totalTasks)
      return handleQuickStartChange('');

    if (status !== QuickStartStatus.NOT_STARTED && taskNumber === -1) {
      return handleQuickStartContinue();
    }

    return nextStep(totalTasks);
  }, [handleQuickStartChange, nextStep, status, taskNumber, totalTasks, handleQuickStartContinue]);

  const handleBack = React.useCallback(() => {
    return previousStep();
  }, [previousStep]);

  const handleTaskSelect = React.useCallback(
    (selectedTaskNumber: number) => {
      setQuickStartTaskNumber(name, selectedTaskNumber);
    },
    [name, setQuickStartTaskNumber],
  );

  return (
    <>
      <QuickStartContent
        quickStart={quickStart}
        nextQuickStarts={nextQuickStarts}
        taskNumber={taskNumber}
        allTaskStatuses={allTaskStatuses}
        onTaskSelect={handleTaskSelect}
        onTaskReview={handleTaskStatusChange}
        onQuickStartChange={handleQuickStartChange}
        ref={contentRef}
      />
      <QuickStartFooter
        status={status}
        taskNumber={taskNumber}
        totalTasks={totalTasks}
        onNext={handleNext}
        onBack={handleBack}
        footerClass={footerClass}
        quickStartId={quickStart.metadata.name}
      />
    </>
  );
};

export default QuickStartController;
