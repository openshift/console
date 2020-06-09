import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import { Link } from 'react-router-dom';
import { Tooltip } from '@patternfly/react-core';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { Firehose, resourcePathFromModel } from '@console/internal/components/utils';
import { runStatus } from '../../../../utils/pipeline-augment';
import { PipelineRunModel, TaskModel, ClusterTaskModel } from '../../../../models';
import { ColoredStatusIcon } from './StatusIcon';
import { PipelineVisualizationStepList } from './PipelineVisualizationStepList';
import TaskComponentTaskStatus from './TaskComponentTaskStatus';
import { createStepStatus, StepStatus, TaskStatus } from './pipeline-step-utils';

import './PipelineVisualizationTask.scss';

interface TaskProps {
  pipelineRunName?: string;
  name: string;
  loaded?: boolean;
  task?: {
    data: K8sResourceKind;
  };
  status?: TaskStatus;
  namespace: string;
  isPipelineRun: boolean;
  disableTooltip?: boolean;
  selected?: boolean;
}

interface PipelineVisualizationTaskProp {
  pipelineRunName?: string;
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
  disableTooltip?: boolean;
  selected?: boolean;
}

export const PipelineVisualizationTask: React.FC<PipelineVisualizationTaskProp> = ({
  pipelineRunName,
  task,
  namespace,
  pipelineRunStatus,
  disableTooltip,
  selected,
}) => {
  const taskStatus = task.status || {
    duration: '',
    reason: runStatus.Idle,
  };
  if (pipelineRunStatus === runStatus.Failed || pipelineRunStatus === runStatus.Cancelled) {
    if (task.status?.reason === runStatus.Idle || task.status?.reason === runStatus.Pending) {
      taskStatus.reason = runStatus.Cancelled;
    }
  }

  const taskComponent = (
    <TaskComponent
      pipelineRunName={pipelineRunName}
      name={task.name || ''}
      namespace={namespace}
      status={taskStatus}
      isPipelineRun={!!pipelineRunStatus}
      disableTooltip={disableTooltip}
      selected={selected}
    />
  );

  if (disableTooltip) {
    return taskComponent;
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
  return <Firehose resources={resources}>{taskComponent}</Firehose>;
};
const TaskComponent: React.FC<TaskProps> = ({
  pipelineRunName,
  namespace,
  task,
  status,
  name,
  isPipelineRun,
  disableTooltip,
  selected,
}) => {
  const stepList = _.get(task, ['data', 'spec', 'steps'], []);
  const stepStatusList: StepStatus[] = stepList.map((step) => createStepStatus(step, status));
  const showStatusState: boolean = isPipelineRun && !!status && !!status.reason;
  const visualName = name || _.get(task, ['metadata', 'name'], '');
  const path = pipelineRunName
    ? `${resourcePathFromModel(PipelineRunModel, pipelineRunName, namespace)}/logs/${name}`
    : undefined;
  const enableLogLink =
    status?.reason !== runStatus.Idle &&
    status?.reason !== runStatus.Pending &&
    status?.reason !== runStatus.Cancelled &&
    !!path;

  let taskPill = (
    <div className={cx('odc-pipeline-vis-task__content', { 'is-selected': selected })}>
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
          {showStatusState && <ColoredStatusIcon status={status.reason} height={18} width={18} />}
        </div>
      )}
    </div>
  );
  if (!disableTooltip) {
    taskPill = (
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
        {taskPill}
      </Tooltip>
    );
  }

  const visTask = (
    <>
      <div className="odc-pipeline-vis-task__connector" />
      {taskPill}
    </>
  );
  return (
    <div className={cx('odc-pipeline-vis-task', { 'is-linked': enableLogLink })}>
      {enableLogLink ? <Link to={path}>{visTask}</Link> : visTask}
    </div>
  );
};
