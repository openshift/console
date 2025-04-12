import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import { taskRunFilterReducer } from '../../utils/pipeline-filter-reducer';
import ResultsList from '../shared/results/ResultsList';
import TaskRunDetailsSection from './TaskRunDetailsSection';

export interface TaskRunDetailsProps {
  obj: TaskRunKind;
}

const TaskRunDetails: React.FC<TaskRunDetailsProps> = ({ obj: taskRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <TaskRunDetailsSection taskRun={taskRun} />
      </PaneBody>
      {taskRun?.status?.taskResults || taskRun?.status?.results ? (
        <PaneBody>
          <ResultsList
            results={taskRun.status?.taskResults || taskRun.status?.results}
            resourceName={t(TaskRunModel.labelKey)}
            status={taskRunFilterReducer(taskRun)}
          />
        </PaneBody>
      ) : null}
    </>
  );
};

export default TaskRunDetails;
