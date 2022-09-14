import * as React from 'react';
import { PopoverProps } from '@patternfly/react-core';
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
import { resourcePathFromModel } from '@console/internal/components/utils';
import { PipelineRunModel } from '../../../models';
import { ComputedStatus } from '../../../types';
import {
  createStepStatus,
  StepStatus,
} from '../detail-page-tabs/pipeline-details/pipeline-step-utils';
import { PipelineVisualizationStepList } from '../detail-page-tabs/pipeline-details/PipelineVisualizationStepList';

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
  const stepList = data?.task?.status?.steps || [];
  const stepStatusList: StepStatus[] = stepList.map((step) =>
    createStepStatus(step, data?.task?.status),
  );
  const { pipelineRun } = data;
  const succeededStepsCount =
    stepStatusList.filter(({ status }) => status === ComputedStatus.Succeeded)?.length || 0;

  const badge =
    stepStatusList.length > 0 ? `${succeededStepsCount}/${stepStatusList.length}` : null;
  const badgePopoverParams: PopoverProps = {
    headerContent: <div>{element.getLabel()}</div>,
    bodyContent: (
      <PipelineVisualizationStepList
        isSpecOverview={false}
        taskName={element.getLabel()}
        steps={stepStatusList}
        isFinallyTask={false}
        hideHeader
      />
    ),
  };

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
          badgePopoverParams={badgePopoverParams}
          badge={badge}
          truncateLength={element.getData()?.label?.length}
        >
          {whenDecorator}
        </TaskNode>
      </g>
    </Layer>
  );

  return enableLogLink ? (
    <Link to={path}>
      <g data-test={`task ${element.getLabel()}`}>{taskNode}</g>
    </Link>
  ) : (
    taskNode
  );
};

export default observer(PipelineTaskNode);
