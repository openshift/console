import * as React from 'react';
import { Dispatch, connect } from 'react-redux';
import { RootState } from '@console/internal/redux';
import * as QuickStartActions from '../../redux/actions/quick-start-actions';
import { getActiveQuickStartState } from '../../redux/reducers/quick-start-reducer';
import {
  QuickStart,
  QuickStartStatus,
  QuickStartTaskStatus,
  QuickStartState,
} from './utils/quick-start-types';
import QuickStartContent from './controller/QuickStartContent';
import QuickStartFooter from './controller/QuickStartFooter';

type OwnProps = {
  quickStart: QuickStart;
};

type StateProps = {
  activeQuickStartState: QuickStartState;
};

type DispatchProps = {
  setActiveQuickStart: (quickStartId: string) => void;
  setQuickStartStatus: (quickStartId: string, status: QuickStartStatus) => void;
  setQuickStartTaskNumber: (quickStartId: string, taskNumber: number) => void;
  setQuickStartTaskStatus: (taskStatus: QuickStartTaskStatus) => void;
};

type MergeProps = {
  status?: QuickStartStatus;
  taskNumber?: number;
  taskStatus?: QuickStartTaskStatus;
  allTaskStatuses?: QuickStartTaskStatus[];
};

type QuickStartControllerProps = OwnProps & DispatchProps & MergeProps;

const QuickStartController: React.FC<QuickStartControllerProps> = ({
  quickStart,
  status,
  taskNumber,
  taskStatus,
  allTaskStatuses,
  setActiveQuickStart,
  setQuickStartStatus,
  setQuickStartTaskNumber,
  setQuickStartTaskStatus,
}) => {
  const { id, tasks } = quickStart;
  const totalTasks = tasks?.length;

  const startQuickStart = React.useCallback(
    () => setQuickStartStatus(id, QuickStartStatus.IN_PROGRESS),
    [id, setQuickStartStatus],
  );

  const completeQuickStart = React.useCallback(
    () => setQuickStartStatus(id, QuickStartStatus.COMPLETE),
    [id, setQuickStartStatus],
  );

  const resetQuickStart = React.useCallback(
    () => setQuickStartStatus(id, QuickStartStatus.NOT_STARTED),
    [id, setQuickStartStatus],
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
    if (status === QuickStartStatus.NOT_STARTED) return startQuickStart();
    if (status === QuickStartStatus.COMPLETE) return handleQuickStartChange('');

    if (
      status === QuickStartStatus.IN_PROGRESS &&
      taskStatus !== QuickStartTaskStatus.INIT &&
      taskNumber === totalTasks - 1
    )
      return completeQuickStart();

    if (taskStatus === QuickStartTaskStatus.INIT)
      return handleTaskStatusChange(QuickStartTaskStatus.REVIEW);

    if (taskNumber < totalTasks) return setQuickStartTaskNumber(id, taskNumber + 1);

    return null;
  }, [
    completeQuickStart,
    handleQuickStartChange,
    handleTaskStatusChange,
    id,
    setQuickStartTaskNumber,
    startQuickStart,
    status,
    taskNumber,
    taskStatus,
    totalTasks,
  ]);

  const handleBack = React.useCallback(() => {
    if (status === QuickStartStatus.COMPLETE && taskNumber === totalTasks - 1)
      return startQuickStart();

    if (
      status === QuickStartStatus.IN_PROGRESS &&
      taskStatus === QuickStartTaskStatus.INIT &&
      taskNumber === 0
    )
      return resetQuickStart();

    if (taskStatus === QuickStartTaskStatus.SUCCESS || taskStatus === QuickStartTaskStatus.FAILED)
      return handleTaskStatusChange(QuickStartTaskStatus.REVIEW);

    if (taskStatus === QuickStartTaskStatus.REVIEW)
      return handleTaskStatusChange(QuickStartTaskStatus.INIT);

    if (taskNumber > 0) return setQuickStartTaskNumber(id, taskNumber - 1);

    return null;
  }, [
    handleTaskStatusChange,
    id,
    resetQuickStart,
    setQuickStartTaskNumber,
    startQuickStart,
    status,
    taskNumber,
    taskStatus,
    totalTasks,
  ]);

  const handleTaskSelect = React.useCallback(
    (selectedTaskNumber: number) => {
      setQuickStartTaskNumber(id, selectedTaskNumber);
      startQuickStart();
    },
    [id, setQuickStartTaskNumber, startQuickStart],
  );

  return (
    <>
      <QuickStartContent
        quickStart={quickStart}
        status={status}
        taskNumber={taskNumber}
        allTaskStatuses={allTaskStatuses}
        onTaskSelect={handleTaskSelect}
        onTaskReview={handleTaskStatusChange}
        onQuickStartChange={handleQuickStartChange}
      />
      <QuickStartFooter status={status} onNext={handleNext} onBack={handleBack} />
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activeQuickStartState: getActiveQuickStartState(state),
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setActiveQuickStart: (quickStartId: string, totalTasks?: number) =>
    dispatch(QuickStartActions.setActiveQuickStart(quickStartId, totalTasks)),
  setQuickStartStatus: (quickStartId: string, quickStartStatus: QuickStartStatus) =>
    dispatch(QuickStartActions.setQuickStartStatus(quickStartId, quickStartStatus)),
  setQuickStartTaskNumber: (quickStartId: string, taskNumber: number) =>
    dispatch(QuickStartActions.setQuickStartTaskNumber(quickStartId, taskNumber)),
  setQuickStartTaskStatus: (taskStatus: QuickStartTaskStatus) =>
    dispatch(QuickStartActions.setQuickStartTaskStatus(taskStatus)),
});

const mergeProps = (
  stateProps: StateProps,
  dispatchProps: DispatchProps,
  ownProps: OwnProps,
): QuickStartControllerProps => {
  const { activeQuickStartState } = stateProps;
  const { quickStart } = ownProps;
  const { status, taskNumber } = activeQuickStartState;
  const allTaskStatuses = quickStart.tasks.map(
    (task, index) => activeQuickStartState[`taskStatus${index}`],
  );
  const taskStatus = allTaskStatuses[taskNumber];

  return {
    quickStart,
    status,
    taskNumber,
    taskStatus,
    allTaskStatuses,
    ...dispatchProps,
  };
};

export default connect<StateProps, DispatchProps, OwnProps, QuickStartControllerProps>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(QuickStartController);
