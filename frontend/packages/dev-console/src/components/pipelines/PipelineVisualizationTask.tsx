import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { Link } from 'react-router-dom';
import { Tooltip } from '@patternfly/react-core';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { Firehose, resourcePathFromModel } from '@console/internal/components/utils';
import { runStatus } from '../../utils/pipeline-augment';
import { PipelineRunModel, TaskModel, ClusterTaskModel } from '../../models';
import { PipelineVisualizationStepList } from './PipelineVisualizationStepList';
import { ColoredStatusIcon } from './StatusIcon';
import TaskComponentTaskStatus from './TaskComponentTaskStatus';
import { createStepStatus, StepStatus, TaskStatus } from './pipeline-step-utils';

import './PipelineVisualizationTask.scss';

interface TaskProps {
  pipelineRun?: string;
  name: string;
  loaded?: boolean;
  task?: {
    data: K8sResourceKind;
  };
  status?: TaskStatus;
  namespace: string;
  isPipelineRun: boolean;
}

interface PipelineVisualizationTaskProp {
  pipelineRun?: string;
  namespace: string;
  task: {
    name?: string;
    taskRef: {
      name: string;
      kind?: string;
    };
    status?: TaskStatus;
  };
  taskRun?: string;
  pipelineRunStatus?: string;
}

export const PipelineVisualizationTask: React.FC<PipelineVisualizationTaskProp> = ({
  pipelineRun,
  task,
  namespace,
  pipelineRunStatus,
}) => {
  const taskStatus = task.status || {
    duration: '',
    reason: runStatus.Idle,
  };
  if (pipelineRunStatus === runStatus.Failed) {
    if (
      task.status &&
      task.status.reason !== runStatus.Succeeded &&
      task.status.reason !== runStatus.Failed
    ) {
      taskStatus.reason = runStatus.Cancelled;
    }
  }
  let resources;
  if (task.taskRef.kind === ClusterTaskModel.kind) {
    resources = [
      {
        kind: referenceForModel(ClusterTaskModel),
        name: task.taskRef.name,
        prop: 'task',
      },
    ];
  } else {
    resources = [
      {
        kind: referenceForModel(TaskModel),
        name: task.taskRef.name,
        namespace,
        prop: 'task',
      },
    ];
  }
  return (
    <Firehose resources={resources}>
      <TaskComponent
        pipelineRun={pipelineRun}
        name={task.name || ''}
        namespace={namespace}
        status={taskStatus}
        isPipelineRun={!!pipelineRunStatus}
      />
    </Firehose>
  );
};
const TaskComponent: React.FC<TaskProps> = ({
  pipelineRun,
  namespace,
  task,
  status,
  name,
  isPipelineRun,
}) => {
  const taskData: K8sResourceKind = task.data;
  const stepList = _.get(taskData, ['spec', 'steps'], []);
  const stepStatusList: StepStatus[] = stepList.map((step) => createStepStatus(step, status));
  const showStatusState: boolean = isPipelineRun && !!status && !!status.reason;
  const visualName = name || _.get(task, ['metadata', 'name'], '');
  const path = pipelineRun
    ? `${resourcePathFromModel(PipelineRunModel, pipelineRun, namespace)}/logs/${name}`
    : undefined;
  const visTask = (
    <>
      <div className="odc-pipeline-vis-task__connector" />
      <Tooltip
        position="bottom"
        enableFlip={false}
        content={
          <PipelineVisualizationStepList
            isSpecOverview={!isPipelineRun}
            taskName={visualName}
            steps={stepStatusList}
          />
        }
      >
        <div className="odc-pipeline-vis-task__content">
          <div
            className={cx('odc-pipeline-vis-task__title-wrapper', {
              'is-text-center': !isPipelineRun,
            })}
          >
            <div className="odc-pipeline-vis-task__title">{visualName}</div>
            {showStatusState && <TaskComponentTaskStatus steps={stepStatusList} />}
          </div>
          {isPipelineRun && (
            <div className="odc-pipeline-vis-task__status">
              {showStatusState && (
                <ColoredStatusIcon status={status.reason} height={18} width={18} />
              )}
            </div>
          )}
        </div>
      </Tooltip>
    </>
  );
  return (
    <li className={cx('odc-pipeline-vis-task')}>
      {path ? <Link to={path}>{visTask}</Link> : visTask}
    </li>
  );
};
