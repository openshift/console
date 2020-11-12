import * as React from 'react';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { useBuildConfigsWatcher } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { WorkloadData } from '../../../topology-types';
import { Decorator } from '../Decorator';
import { getBuildDecoratorParts } from './build-decorator-utils';

export interface BuildDecoratorProps {
  resource: K8sResourceKind;
  workloadData: WorkloadData;
  radius: number;
  x: number;
  y: number;
}

const BuildDecorator: React.FC<BuildDecoratorProps> = ({
  resource,
  workloadData,
  radius,
  x,
  y,
}) => {
  const { buildConfigs } = useBuildConfigsWatcher(resource);
  const build = buildConfigs?.[0]?.builds?.[0];
  const { decoratorIcon, linkRef, tooltipContent } = getBuildDecoratorParts(workloadData, build);

  if (!decoratorIcon && !tooltipContent) {
    return null;
  }

  let decoratorContent = (
    <Decorator x={x} y={y} radius={radius}>
      <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
        <foreignObject width={radius} height={radius} style={{ fontSize: radius }}>
          {decoratorIcon}
        </foreignObject>
      </g>
    </Decorator>
  );

  if (linkRef) {
    decoratorContent = (
      <Link to={linkRef} className="odc-decorator__link">
        {decoratorContent}
      </Link>
    );
  }

  return (
    <Tooltip key="build" content={tooltipContent} position={TooltipPosition.left}>
      {decoratorContent}
    </Tooltip>
  );
};

export default BuildDecorator;
