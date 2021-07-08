import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { TaskRunModel } from '../../../models';
import { TaskRunKind } from '../../../types';
import { taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import PipelineResourceStatus from '../../pipelineruns/status/PipelineResourceStatus';
import StatusPopoverContent from '../../pipelineruns/status/StatusPopoverContent';
import { getTRLogSnippet } from '../logs/taskRunLogSnippet';

type TaskRunStatusProps = {
  status: string;
  taskRun: TaskRunKind;
};
const TaskRunStatus: React.FC<TaskRunStatusProps> = ({ status, taskRun }) => {
  const { t } = useTranslation();
  return (
    <PipelineResourceStatus status={status} title={taskRunFilterReducer(taskRun)}>
      <StatusPopoverContent
        logDetails={getTRLogSnippet(taskRun)}
        namespace={taskRun.metadata.namespace}
        link={
          <Link
            to={`${resourcePathFromModel(
              TaskRunModel,
              taskRun.metadata.name,
              taskRun.metadata.namespace,
            )}/logs`}
          >
            {t('pipelines-plugin~View logs')}
          </Link>
        }
      />
    </PipelineResourceStatus>
  );
};

export default TaskRunStatus;
