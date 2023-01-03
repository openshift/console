import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Status } from '@console/shared';
import { BuildDecoratorBubble } from '@console/topology/src/components/graph-view';
import { releaseStatus } from '../../utils/helm-utils';

type HelmReleaseStatusDecoratorProps = {
  element: Node;
  radius: number;
  x: number;
  y: number;
};

const HelmReleaseStatusDecorator: React.FC<HelmReleaseStatusDecoratorProps> = ({
  element,
  radius,
  x,
  y,
}) => {
  const { t } = useTranslation();
  const { data } = element.getData();

  if (!data) {
    return null;
  }
  const status = releaseStatus(data.status);
  const label = t('helm-plugin~Helm release is {{status}}', { status });

  return (
    <Tooltip content={label} position={TooltipPosition.left}>
      <BuildDecoratorBubble x={x} y={y} radius={radius} ariaLabel={label}>
        <Status status={status} iconOnly noTooltip />
      </BuildDecoratorBubble>
    </Tooltip>
  );
};

export default HelmReleaseStatusDecorator;
