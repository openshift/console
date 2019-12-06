import * as React from 'react';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { calculateRadius } from '@console/shared';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { routeDecoratorIcon } from '../../import/render-utils';
import { NodeProps, WorkloadData } from '../../topology2/topology-types';
import BuildDecorator from '../../topology2/components/nodes/build-decorators/BuildDecorator';
import Decorator from '../../topology2/components/nodes/Decorator';
import BaseNode from './BaseNode';
import KnativeIcon from '../../topology2/components/nodes/KnativeIcon';
import PodSet from '../../topology2/components/nodes/PodSet';

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
        <BuildDecorator
          key="build"
          workloadData={workload.data}
          x={-radius + decoratorRadius * 0.7}
          y={radius - decoratorRadius * 0.7}
          radius={decoratorRadius}
        />,
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
