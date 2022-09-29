import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  DEFAULT_LAYER,
  DEFAULT_WHEN_OFFSET,
  Layer,
  Node,
  ScaleDetailsLevel,
  TaskNode,
  TOP_LAYER,
  useDetailsLevel,
  useHover,
  WhenDecorator,
  WithContextMenuProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/lib-core';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ClusterTaskModel, PipelineRunModel, TaskModel } from '../../../models';
import { ComputedStatus, TaskKind } from '../../../types';
import {
  createStepStatus,
  StepStatus,
} from '../detail-page-tabs/pipeline-details/pipeline-step-utils';
import { PipelineVisualizationStepList } from '../detail-page-tabs/pipeline-details/PipelineVisualizationStepList';
import { NodeType } from './const';

type PipelineTaskNodeProps = {
  element: Node;
} & WithContextMenuProps &
  WithSelectionProps;

const PipelineTaskNode: React.FunctionComponent<PipelineTaskNodeProps> = ({
  element,
  onContextMenu,
  contextMenuOpen,
  ...rest
}) => {
  const data = element.getData();
  const [hover, hoverRef] = useHover();
  const detailsLevel = useDetailsLevel();
  const isFinallyTask = element.getType() === NodeType.FINALLY_NODE;
  let resources;
  if (data?.task.taskRef.kind === ClusterTaskModel.kind) {
    resources = {
      kind: referenceForModel(ClusterTaskModel),
      name: data?.task.taskRef.name,
      prop: 'task',
    };
  } else {
    resources = {
      kind: referenceForModel(TaskModel),
      name: data?.task.taskRef.name,
      namespace: data.pipeline.metadata.namespace,
      prop: 'task',
    };
  }
  const [task] = useK8sWatchResource<TaskKind>(resources);

  const stepList = data?.task?.status?.steps || task?.spec?.steps || [];

  const stepStatusList: StepStatus[] = stepList.map((step) =>
    createStepStatus(step, data?.task?.status),
  );
  const { pipelineRun } = data;
  const succeededStepsCount = stepStatusList.filter(
    ({ status }) => status === ComputedStatus.Succeeded,
  ).length;

  const badge =
    stepStatusList.length > 0 && data?.status
      ? `${succeededStepsCount}/${stepStatusList.length}`
      : null;

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach((key) => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  const hasTaskIcon = !!(data.taskIconClass || data.taskIcon);
  const whenDecorator = data.whenStatus ? (
    <WhenDecorator
      element={element}
      status={data.whenStatus}
      leftOffset={
        hasTaskIcon
          ? DEFAULT_WHEN_OFFSET + (element.getBounds().height - 4) * 0.75
          : DEFAULT_WHEN_OFFSET
      }
    />
  ) : null;

  const { name: plrName, namespace } = pipelineRun?.metadata;
  const path = plrName
    ? `${resourcePathFromModel(PipelineRunModel, plrName, namespace)}/logs/${element.getLabel()}`
    : undefined;

  const enableLogLink =
    data?.status !== ComputedStatus.Idle &&
    data?.status !== ComputedStatus.Pending &&
    data?.status !== ComputedStatus.Cancelled &&
    data?.status !== ComputedStatus.Skipped &&
    !!path;

  const taskNode = (
    <Layer
      id={
        detailsLevel !== ScaleDetailsLevel.high && (hover || contextMenuOpen)
          ? TOP_LAYER
          : DEFAULT_LAYER
      }
    >
      <g ref={hoverRef} style={{ cursor: enableLogLink ? 'pointer' : 'default' }}>
        <TaskNode
          element={element}
          onContextMenu={data.showContextMenu ? onContextMenu : undefined}
          contextMenuOpen={contextMenuOpen}
          scaleNode={(hover || contextMenuOpen) && detailsLevel !== ScaleDetailsLevel.high}
          hideDetailsAtMedium
          {...passedData}
          {...rest}
          badge={badge}
          truncateLength={element.getData()?.label?.length}
        >
          {whenDecorator}
        </TaskNode>
      </g>
    </Layer>
  );

  const taskWithTooltip = (
    <Tooltip
      position="bottom"
      enableFlip={false}
      content={
        <PipelineVisualizationStepList
          isSpecOverview={!data?.status}
          taskName={element.getLabel()}
          steps={stepStatusList}
          isFinallyTask={isFinallyTask}
        />
      }
    >
      {taskNode}
    </Tooltip>
  );
  return enableLogLink ? (
    <Link to={path}>
      <g data-test={`task ${element.getLabel()}`}>{taskWithTooltip}</g>
    </Link>
  ) : (
    taskWithTooltip
  );
};

export default React.memo(observer(PipelineTaskNode));
