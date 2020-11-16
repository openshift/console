import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { TaskRunKind } from '../../../utils/pipeline-augment';
import { TaskRunModel } from '../../../models';
import PipelineResourceStatus from '../../pipelineruns/status/PipelineResourceStatus';
import { getTRLogSnippet } from '../logs/taskRunLogSnippet';
import StatusPopoverContent from '../../pipelineruns/status/StatusPopoverContent';

type TaskRunStatusProps = {
  status: string;
  taskRun: TaskRunKind;
};
const TaskRunStatus: React.FC<TaskRunStatusProps> = ({ status, taskRun }) => (
  <PipelineResourceStatus status={status}>
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
          View Logs
        </Link>
      }
    />
  </PipelineResourceStatus>
);

export default TaskRunStatus;
