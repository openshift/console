import * as React from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Status, useBuildConfigsWatcher } from '@console/shared';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import BuildDecoratorBubble from './BuildDecoratorBubble';

type BuildConfigDecoratorProps = {
  resource: K8sResourceKind;
  radius: number;
  x: number;
  y: number;
};

const BuildConfigDecorator: React.FC<BuildConfigDecoratorProps> = ({ resource, radius, x, y }) => {
  const { buildConfigs } = useBuildConfigsWatcher(resource);
  const build = buildConfigs?.[0]?.builds?.[0];

  if (!build) {
    return null;
  }

  const link = `${resourcePathFromModel(
    BuildModel,
    build.metadata.name,
    build.metadata.namespace,
  )}/logs`;

  return (
    <Tooltip
      content={`Build ${build.status && build.status.phase}`}
      position={TooltipPosition.left}
    >
      <Link to={link} className="odc-decorator__link">
        <BuildDecoratorBubble x={x} y={y} radius={radius}>
          <Status status={build.status.phase} iconOnly noTooltip />
        </BuildDecoratorBubble>
      </Link>
    </Tooltip>
  );
};

export default BuildConfigDecorator;
