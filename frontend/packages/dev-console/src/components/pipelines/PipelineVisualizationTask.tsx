import * as React from 'react';
import * as cx from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import {
  SyncAltIcon,
  CheckCircleIcon,
  ErrorCircleOIcon,
  CircleIcon,
} from '@patternfly/react-icons';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';
import { getRunStatusColor, runStatus } from '../../utils/pipeline-augment';
import { PipelineVisualizationStepList } from './PipelineVisualizationStepList';

import './PipelineVisualizationTask.scss';

interface TaskProps {
  loaded?: boolean;
  task?: {
    data: K8sResourceKind;
  };
  status?: {
    reason: string;
    duration: string;
  };
  namespace: string;
}

interface PipelineVisualizationTaskProp {
  namespace: string;
  task: {
    taskRef: {
      name: string;
    };
    status?: {
      reason: string;
      duration: string;
    };
  };
  taskRun?: string;
}

interface StatusIconProps {
  status: string;
}
export const StatusIcon: React.FC<StatusIconProps> = ({ status }) => {
  switch (status) {
    case 'In Progress':
      return <SyncAltIcon className="fa-spin" />;

    case 'Succeeded':
      return <CheckCircleIcon className="is-done" />;

    case 'Failed':
      return <ErrorCircleOIcon className="is-done" />;

    default:
      return <CircleIcon className="is-idle" />;
  }
};

export const PipelineVisualizationTask: React.FC<PipelineVisualizationTaskProp> = (props) => {
  return (
    <Firehose
      resources={[
        {
          kind: 'Task',
          name: props.task.taskRef.name,
          namespace: props.namespace,
          prop: 'task',
        },
      ]}
    >
      <TaskComponent namespace={props.namespace} status={props.task.status} />
    </Firehose>
  );
};
const TaskComponent: React.FC<TaskProps> = (props) => {
  const task = props.task.data;
  const { status } = props;

  return (
    <li
      className={cx('odc-pipeline-vis-task')}
      style={{
        color:
          status && status.reason
            ? getRunStatusColor(status.reason).pftoken.value
            : getRunStatusColor(runStatus.Cancelled).pftoken.value,
      }}
    >
      <Tooltip
        position="bottom"
        enableFlip={false}
        content={<PipelineVisualizationStepList steps={(task.spec && task.spec.steps) || []} />}
      >
        <div className="odc-pipeline-vis-task__content">
          <div className={cx('odc-pipeline-vis-task__title', { 'is-text-center': !status })}>
            {task.metadata ? task.metadata.name : ''}
          </div>
          {status && status.reason && (
            <div className="odc-pipeline-vis-task__status">
              <StatusIcon status={status.reason} />
            </div>
          )}
          {status && status.duration && (
            <div className="odc-pipeline-vis-task__stepcount">({status.duration})</div>
          )}
        </div>
      </Tooltip>
    </li>
  );
};
