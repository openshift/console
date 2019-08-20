import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import {
  SyncAltIcon,
  CheckCircleIcon,
  CircleIcon,
  ExclamationCircleIcon,
  BanIcon,
  PendingIcon,
} from '@patternfly/react-icons';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';
import { getRunStatusColor, runStatus } from '../../utils/pipeline-augment';
import { PipelineVisualizationStepList } from './PipelineVisualizationStepList';

import './PipelineVisualizationTask.scss';

interface TaskProps {
  name: string;
  loaded?: boolean;
  task?: {
    data: K8sResourceKind;
  };
  status?: {
    reason: string;
    duration: string;
  };
  namespace: string;
  isPipelineRun: boolean;
}

interface PipelineVisualizationTaskProp {
  namespace: string;
  task: {
    name?: string;
    taskRef: {
      name: string;
    };
    status?: {
      reason: string;
      duration: string;
    };
  };
  taskRun?: string;
  pipelineRunStatus?: string;
}

interface StatusIconProps {
  status: string;
  height?: number;
  width?: number;
}

export const SkippedIcon: React.FC<StatusIconProps> = ({ height, width }) => {
  return <div style={{ height, width }} className="fa fa-angle-double-right" />;
};
export const StatusIcon: React.FC<StatusIconProps> = ({ status, ...props }) => {
  switch (status) {
    case runStatus['In Progress']:
      return <SyncAltIcon {...props} className="fa-spin" />;

    case runStatus.Succeeded:
      return <CheckCircleIcon {...props} />;

    case runStatus.Failed:
      return <ExclamationCircleIcon {...props} />;

    case runStatus.Pending:
      return <PendingIcon {...props} />;

    case runStatus.Cancelled:
      return <BanIcon {...props} />;

    case runStatus.Skipped:
      return <SkippedIcon {...props} status={status} />;

    default:
      return <CircleIcon {...props} />;
  }
};

export const PipelineVisualizationTask: React.FC<PipelineVisualizationTaskProp> = ({
  task,
  namespace,
  pipelineRunStatus,
}) => {
  const taskStatus = task.status || {
    duration: '',
    reason: runStatus.Idle,
  };
  if (pipelineRunStatus === runStatus.Failed) {
    if (task.status && !['Succeeded', 'Failed'].includes(task.status.reason)) {
      taskStatus.reason = runStatus.Cancelled;
    }
  }
  return (
    <Firehose
      resources={[
        {
          kind: 'Task',
          name: task.taskRef.name,
          namespace,
          prop: 'task',
        },
      ]}
    >
      <TaskComponent
        name={task.name || ''}
        namespace={namespace}
        status={taskStatus}
        isPipelineRun={!!pipelineRunStatus}
      />
    </Firehose>
  );
};
const TaskComponent: React.FC<TaskProps> = ({ task, status, name, isPipelineRun }) => {
  const taskData = task.data;
  return (
    <li className={cx('odc-pipeline-vis-task')}>
      <div className="odc-pipeline-vis-task__connector" />
      <Tooltip
        position="bottom"
        enableFlip={false}
        content={
          <PipelineVisualizationStepList steps={(taskData.spec && taskData.spec.steps) || []} />
        }
      >
        <div className="odc-pipeline-vis-task__content">
          <div className={cx('odc-pipeline-vis-task__title', { 'is-text-center': !isPipelineRun })}>
            {name || _.get(task, ['metadata', 'name'], '')}
          </div>
          {isPipelineRun && status && status.reason && (
            <div
              className="odc-pipeline-vis-task__status"
              style={{
                color:
                  status && status.reason
                    ? getRunStatusColor(status.reason).pftoken.value
                    : getRunStatusColor(runStatus.Cancelled).pftoken.value,
              }}
            >
              <StatusIcon status={status.reason} height={18} width={18} />
            </div>
          )}
        </div>
      </Tooltip>
    </li>
  );
};
