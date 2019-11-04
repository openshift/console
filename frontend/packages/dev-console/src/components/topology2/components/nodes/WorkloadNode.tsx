import * as React from 'react';
import { Status, calculateRadius } from '@console/shared';
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
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import Decorator from '../../../topology/shapes/Decorator';
import { routeDecoratorIcon } from '../../../import/render-utils';
import PodSet from '../../../topology/shapes/PodSet';
import KnativeIcon from '../../../topology/shapes/KnativeIcon';
import BaseNode from './BaseNode';

export type WorkloadNodeProps = {
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const WorkloadNode: React.FC<WorkloadNodeProps> = ({ element, urlAnchorRef, ...rest }) => {
  const { width, height } = element.getBounds();
  const workloadData = element.getData().data;
  const size = Math.min(width, height);
  const { build, donutStatus } = workloadData;
  const { radius, decoratorRadius } = calculateRadius(size);
  const repoIcon = routeDecoratorIcon(workloadData.editUrl, decoratorRadius);
  const cx = width / 2;
  const cy = height / 2;

  return (
    <g>
      <BaseNode
        outerRadius={radius}
        innerRadius={donutStatus && donutStatus.isRollingOut ? radius * 0.45 : radius * 0.55}
        icon={workloadData.builderImage}
        kind={workloadData.kind}
        element={element}
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
          build && (
            <Tooltip
              key="build"
              content={`${build.metadata.name} ${build.status && build.status.phase}`}
              position={TooltipPosition.left}
            >
              <Link
                to={`${resourcePathFromModel(
                  BuildModel,
                  build.metadata.name,
                  build.metadata.namespace,
                )}/logs`}
                className="odc2-decorator__link"
              >
                <Decorator
                  x={cx - radius + decoratorRadius * 0.7}
                  y={cy + radius - decoratorRadius * 0.7}
                  radius={decoratorRadius}
                >
                  <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                    <foreignObject
                      width={decoratorRadius}
                      height={decoratorRadius}
                      style={{ fontSize: decoratorRadius }}
                    >
                      <Status status={build.status.phase} iconOnly noTooltip />
                    </foreignObject>
                  </g>
                </Decorator>
              </Link>
            </Tooltip>
          ),
        ]}
      >
        <PodSet size={size} x={cx} y={cy} data={workloadData.donutStatus} />
        {workloadData.isKnativeResource && (
          <KnativeIcon
            x={cx - radius * 0.15}
            y={cy - radius * 0.65}
            width={radius * 0.39}
            height={radius * 0.31}
          />
        )}
      </BaseNode>
    </g>
  );
};

export default observer(WorkloadNode);
