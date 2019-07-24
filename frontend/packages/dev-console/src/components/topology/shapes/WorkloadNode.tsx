import * as React from 'react';
import { PenIcon, ExternalLinkAltIcon, OutlinedCheckCircleIcon } from '@patternfly/react-icons';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens';
import { Status, calculateRadius, PodStatus } from '@console/shared';
import { Link } from 'react-router-dom';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildConfigModel } from '@console/internal/models';
import { NodeProps, WorkloadData } from '../topology-types';
import Decorator from './Decorator';
import BaseNode from './BaseNode';
import KnativeIcon from './KnativeIcon';

const WorkloadNode: React.FC<NodeProps<WorkloadData>> = ({
  data: workload,
  x,
  y,
  size,
  selected,
  onSelect,
}) => {
  const { radius, podStatusOuterRadius, podStatusInnerRadius, decoratorRadius } = calculateRadius(
    size,
  );
  const {
    data: {
      donutStatus: { build },
    },
  } = workload;

  return (
    <BaseNode
      x={x}
      y={y}
      outerRadius={radius}
      innerRadius={radius * 0.55}
      icon={workload.data.builderImage}
      label={workload.name}
      kind={workload.data.kind}
      selected={selected}
      onSelect={onSelect}
      attachments={[
        workload.data.editUrl && (
          <Decorator
            key="edit"
            x={radius - decoratorRadius * 0.7}
            y={radius - decoratorRadius * 0.7}
            radius={decoratorRadius}
            href={workload.data.editUrl}
            external
            title="Edit Source Code"
          >
            <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
              <PenIcon style={{ fontSize: decoratorRadius }} />
            </g>
          </Decorator>
        ),
        workload.data.url && (
          <Decorator
            key="route"
            x={radius - decoratorRadius * 0.7}
            y={-radius + decoratorRadius * 0.7}
            radius={decoratorRadius}
            href={workload.data.url}
            external
            title="Open URL"
          >
            <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
              <ExternalLinkAltIcon style={{ fontSize: decoratorRadius }} />
            </g>
          </Decorator>
        ),
        build && (
          <Link
            key="build"
            to={resourcePathFromModel(
              BuildConfigModel,
              build.metadata.ownerReferences[0].name,
              build.metadata.namespace,
            )}
          >
            <Decorator
              x={-radius + decoratorRadius * 0.7}
              y={radius - decoratorRadius * 0.7}
              radius={decoratorRadius}
              title={`${build.metadata.name} ${build.status && build.status.phase}`}
            >
              <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                {build.status.phase === 'Complete' ? (
                  <OutlinedCheckCircleIcon color={successColor.value} />
                ) : (
                  <foreignObject
                    width={decoratorRadius}
                    height={decoratorRadius}
                    style={{ fontSize: decoratorRadius }}
                  >
                    <Status
                      title={`${build.metadata.name} ${build.status && build.status.phase}`}
                      status={build.status.phase}
                      iconOnly
                    />
                  </foreignObject>
                )}
              </g>
            </Decorator>
          </Link>
        ),
      ]}
    >
      <PodStatus
        x={-size / 2}
        y={-size / 2}
        innerRadius={podStatusInnerRadius}
        outerRadius={podStatusOuterRadius}
        data={workload.data.donutStatus.pods}
        size={size}
      />
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
