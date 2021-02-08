import * as React from 'react';
import { TaskRunKind } from '../../types';
import { TaskRunModel } from '../../models';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import ResultsList from '../shared/results/ResultsList';
import TaskRunDetailsSection from './TaskRunDetailsSection';

import './TaskRunDetails.scss';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  return (
    <>
      <div className="co-m-pane__body">
        <TaskRunDetailsSection taskRun={taskRun} />
      </div>
      {taskRun.status?.taskResults && (
        <div className="co-m-pane__body">
          <ResultsList
            results={taskRun.status?.taskResults}
            resourceName={TaskRunModel.label}
            status={taskRunFilterReducer(taskRun)}
          />
        </div>
      )}
    </>
  );
};

export default TaskRunDetails;
