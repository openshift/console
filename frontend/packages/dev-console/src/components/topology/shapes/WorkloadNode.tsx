import * as React from 'react';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { Status, calculateRadius } from '@console/shared';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { routeDecoratorIcon } from '../../import/render-utils';
import { NodeProps, WorkloadData } from '../topology-types';
import Decorator from './Decorator';
import BaseNode from './BaseNode';
import KnativeIcon from './KnativeIcon';
import PodSet from './PodSet';

const WorkloadNode: React.FC<NodeProps<WorkloadData>> = ({
  data: workload,
  x,
  y,
  size,
  ...others
}) => {
  const { radius, decoratorRadius } = calculateRadius(size);
  const {
    data: {
      build,
      donutStatus: { isRollingOut },
    },
  } = workload;
  const repoIcon = routeDecoratorIcon(workload.data.editUrl, decoratorRadius);
  return (
    <BaseNode
      x={x}
      y={y}
      outerRadius={radius}
      innerRadius={isRollingOut ? radius * 0.45 : radius * 0.55}
      icon={workload.data.builderImage}
      label={workload.name}
      kind={workload.data.kind}
      {...others}
      attachments={[
        repoIcon && (
          <Tooltip key="edit" content="Edit Source Code" position={TooltipPosition.right}>
            <Decorator
              x={radius - decoratorRadius * 0.7}
              y={radius - decoratorRadius * 0.7}
              radius={decoratorRadius}
              href={workload.data.editUrl}
              external
            >
              <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                {repoIcon}
              </g>
            </Decorator>
          </Tooltip>
        ),
        workload.data.url && (
          <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
            <Decorator
              x={radius - decoratorRadius * 0.7}
              y={-radius + decoratorRadius * 0.7}
              radius={decoratorRadius}
              href={workload.data.url}
              external
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
              className="odc-decorator__link"
            >
              <Decorator
                x={-radius + decoratorRadius * 0.7}
                y={radius - decoratorRadius * 0.7}
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
      <PodSet size={size} data={workload.data.donutStatus} />
      {workload.data.isKnativeResource && (
        <KnativeIcon
          x={-radius * 0.15}
          y={-radius * 0.65}
          width={radius * 0.39}
          height={radius * 0.31}
        />
      )}
    </BaseNode>
  );
};

export default WorkloadNode;
