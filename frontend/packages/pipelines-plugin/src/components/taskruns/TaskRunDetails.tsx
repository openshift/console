import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import ResultsList from '../shared/results/ResultsList';
import TaskRunDetailsSection from './TaskRunDetailsSection';

import './TaskRunDetails.scss';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <TaskRunDetailsSection taskRun={taskRun} />
      </div>
      {taskRun.status?.taskResults && (
        <div className="co-m-pane__body">
          <ResultsList
            results={taskRun.status?.taskResults}
            resourceName={t(TaskRunModel.labelKey)}
            status={taskRunFilterReducer(taskRun)}
          />
        </div>
      )}
    </>
  );
};

export default TaskRunDetails;
