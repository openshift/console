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
  setQuickStartTaskNumber: (taskNumber: number) => void;
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

  const startQuickStart = () => setQuickStartStatus(id, QuickStartStatus.IN_PROGRESS);

  const completeQuickStart = () => setQuickStartStatus(id, QuickStartStatus.COMPLETE);

  const resetQuickStart = () => setQuickStartStatus(id, QuickStartStatus.NOT_STARTED);

  const handleQuickStartChange = (quickStartId: string) => setActiveQuickStart(quickStartId);

  const handleTaskStatusChange = (newTaskStatus: QuickStartTaskStatus) =>
    setQuickStartTaskStatus(newTaskStatus);

  const handleNext = () => {
    const totalTasks = tasks?.length;

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

    if (taskNumber < totalTasks) return setQuickStartTaskNumber(taskNumber + 1);

    return null;
  };

  const handleBack = () => {
    if (status === QuickStartStatus.COMPLETE && taskNumber === tasks.length - 1)
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

    if (taskNumber > 0) return setQuickStartTaskNumber(taskNumber - 1);

    return null;
  };

  const handleTaskSelect = (selectedTaskNumber: number) => {
    setQuickStartTaskNumber(selectedTaskNumber);
    startQuickStart();
  };

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
  setQuickStartTaskNumber: (taskNumber: number) =>
    dispatch(QuickStartActions.setQuickStartTaskNumber(taskNumber)),
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
