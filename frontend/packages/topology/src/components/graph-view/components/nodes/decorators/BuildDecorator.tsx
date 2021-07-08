import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BuildModel } from '@console/internal/models';
import { Status, useBuildConfigsWatcher } from '@console/shared';
import { getResource } from '../../../../../utils';
import BuildDecoratorBubble from './BuildDecoratorBubble';

interface BuildDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const BuildDecorator: React.FC<BuildDecoratorProps> = ({ element, radius, x, y }) => {
  const { t } = useTranslation();
  const resource = getResource(element);
  const { buildConfigs } = useBuildConfigsWatcher(resource);
  const build = buildConfigs?.[0]?.builds?.[0];

  if (!build) {
    return null;
  }

  const label = t('topology~Build {{status}}', { status: build.status?.phase });

  const link = `${resourcePathFromModel(
    BuildModel,
    build.metadata.name,
    build.metadata.namespace,
  )}/logs`;

  return (
    <Tooltip content={label} position={TooltipPosition.left}>
      <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={label} href={link}>
        <Status status={build.status.phase} iconOnly noTooltip />
      </BuildDecoratorBubble>
    </Tooltip>
  );
};

export default BuildDecorator;
