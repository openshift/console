import * as React from 'react';
import { calculateRadius } from '@console/shared';
import {
  Node,
  observer,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@console/topology';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { routeDecoratorIcon } from '../../../import/render-utils';
import Decorator from './Decorator';
import PodSet from './PodSet';
import BuildDecorator from './build-decorators/BuildDecorator';
import BaseNode from './BaseNode';

export type WorkloadNodeProps = {
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const WorkloadNode: React.FC<WorkloadNodeProps> = ({
  element,
  urlAnchorRef,
  canDrop,
  dropTarget,
  ...rest
}) => {
  const { width, height } = element.getBounds();
  const workloadData = element.getData().data;
  const size = Math.min(width, height);
  const { donutStatus, editUrl, cheEnabled } = workloadData;
  const { radius, decoratorRadius } = calculateRadius(size);
  const cx = width / 2;
  const cy = height / 2;
  const repoIcon = routeDecoratorIcon(editUrl, decoratorRadius, cheEnabled);
  const tipContent = `Create a ${
    element.getData().operatorBackedService ? 'binding' : 'visual'
  } connector`;

  return (
    <g>
      <Tooltip content={tipContent} trigger="manual" isVisible={dropTarget && canDrop}>
        <BaseNode
          outerRadius={radius}
          innerRadius={donutStatus && donutStatus.isRollingOut ? radius * 0.45 : radius * 0.55}
          icon={!workloadData.showPodCount ? workloadData.builderImage : undefined}
          kind={workloadData.kind}
          element={element}
          dropTarget={dropTarget}
          canDrop={canDrop}
          {...rest}
          attachments={[
            repoIcon && (
              <Tooltip key="edit" content="Edit Source Code" position={TooltipPosition.right}>
                <Decorator
                  x={cx + radius - decoratorRadius * 0.7}
                  y={cy + radius - decoratorRadius * 0.7}
                  radius={decoratorRadius}
                  href={workloadData.editUrl}
                  external
                >
                  <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                    {repoIcon}
                  </g>
                </Decorator>
              </Tooltip>
            ),
            workloadData.url && (
              <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
                <Decorator
                  x={cx + radius - decoratorRadius * 0.7}
                  y={cy + -radius + decoratorRadius * 0.7}
                  radius={decoratorRadius}
                  href={workloadData.url}
                  external
                  circleRef={urlAnchorRef}
                >
                  <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                    <ExternalLinkAltIcon style={{ fontSize: decoratorRadius }} alt="Open URL" />
                  </g>
                </Decorator>
              </Tooltip>
            ),
            <BuildDecorator
              key="build"
              workloadData={workloadData}
              x={cx - radius + decoratorRadius * 0.7}
              y={cy + radius - decoratorRadius * 0.7}
              radius={decoratorRadius}
            />,
          ]}
        >
          <PodSet
            size={size}
            x={cx}
            y={cy}
            data={workloadData.donutStatus}
            showPodCount={workloadData.showPodCount}
          />
        </BaseNode>
      </Tooltip>
    </g>
  );
};

export default observer(WorkloadNode);
