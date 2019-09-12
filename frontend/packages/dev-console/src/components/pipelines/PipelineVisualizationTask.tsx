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
import HorizontalStackedBars, { StackedValue } from '../charts/HorizontalStackedBars';
import { PipelineVisualizationStepList } from './PipelineVisualizationStepList';
import { computeStepColor, TaskStatus } from './pipeline-step-utils';

import './PipelineVisualizationTask.scss';

interface TaskProps {
  name: string;
  loaded?: boolean;
  task?: {
    data: K8sResourceKind;
    spec?: {
      steps?: { name: string }[];
    };
  };
  status?: TaskStatus;
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
    status?: TaskStatus;
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
  const stepList = _.get(taskData, ['spec', 'steps'], []);
  const showStatusState: boolean = isPipelineRun && !!status && !!status.reason;

  return (
    <li className={cx('odc-pipeline-vis-task')}>
      <div className="odc-pipeline-vis-task__connector" />
      <Tooltip
        position="bottom"
        enableFlip={false}
        content={<PipelineVisualizationStepList steps={stepList} />}
      >
        <div className="odc-pipeline-vis-task__content">
          <div
            className={cx('odc-pipeline-vis-task__title-wrapper', {
              'is-text-center': !isPipelineRun,
            })}
          >
            <div className="odc-pipeline-vis-task__title">
              {name || _.get(task, ['metadata', 'name'], '')}
            </div>
            {showStatusState && <TaskComponentTaskStatus steps={stepList} status={status} />}
          </div>
          {isPipelineRun && (
            <div
              className="odc-pipeline-vis-task__status"
              style={{
                color:
                  status && status.reason
                    ? getRunStatusColor(status.reason).pftoken.value
                    : getRunStatusColor(runStatus.Cancelled).pftoken.value,
              }}
            >
              {showStatusState && <StatusIcon status={status.reason} height={18} width={18} />}
            </div>
          )}
        </div>
      </Tooltip>
    </li>
  );
};

interface TaskStatusProps {
  steps: { name: string }[];
  status: TaskStatus;
}

const TaskComponentTaskStatus: React.FC<TaskStatusProps> = ({ steps, status }) => {
  if (steps.length === 0) return null;

  const visualValues: StackedValue[] = steps.map((step) => {
    return {
      color: computeStepColor(step, status),
      name: step.name,
      size: 1,
    };
  });

  return <HorizontalStackedBars values={visualValues} barGap={2} height={2} />;
};
