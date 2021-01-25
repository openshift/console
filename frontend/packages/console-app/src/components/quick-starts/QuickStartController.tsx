import * as React from 'react';
import { QuickStart, QuickStartStatus, QuickStartTaskStatus } from './utils/quick-start-types';
import QuickStartContent from './controller/QuickStartContent';
import QuickStartFooter from './controller/QuickStartFooter';
import { QuickStartContext, QuickStartContextValues } from './utils/quick-start-context';

type QuickStartControllerProps = {
  quickStart: QuickStart;
  footerClass: string;
  contentRef: React.Ref<HTMLDivElement>;
};

const QuickStartController: React.FC<QuickStartControllerProps> = ({
  quickStart,
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

  const handleNext = React.useCallback(() => {
    if (status === QuickStartStatus.COMPLETE && taskNumber === totalTasks)
      return handleQuickStartChange('');

    return nextStep(totalTasks);
  }, [handleQuickStartChange, nextStep, status, taskNumber, totalTasks]);

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
      />
    </>
  );
};

export default QuickStartController;
