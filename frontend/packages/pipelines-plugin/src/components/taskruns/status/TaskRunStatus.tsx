import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { TaskRunKind } from '../../../utils/pipeline-augment';
import { taskRunFilterReducer } from '../../../utils/pipeline-filter-reducer';
import { TaskRunModel } from '../../../models';
import PipelineResourceStatus from '../../pipelineruns/status/PipelineResourceStatus';
import { getTRLogSnippet } from '../logs/taskRunLogSnippet';
import StatusPopoverContent from '../../pipelineruns/status/StatusPopoverContent';

type TaskRunStatusProps = {
  status: string;
  taskRun: TaskRunKind;
};
const TaskRunStatus: React.FC<TaskRunStatusProps> = ({ status, taskRun }) => {
  const { t } = useTranslation();
  return (
    <PipelineResourceStatus status={status} title={taskRunFilterReducer(taskRun, t)}>
      <StatusPopoverContent
        logDetails={getTRLogSnippet(taskRun, t)}
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
