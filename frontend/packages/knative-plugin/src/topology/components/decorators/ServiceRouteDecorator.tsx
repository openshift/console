import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Decorator } from '@console/topology/src/components/graph-view';

type ServiceRouteDecoratorProps = {
  url: string;
  radius: number;
  x: number;
  y: number;
};

const ServiceRouteDecorator: React.FC<ServiceRouteDecoratorProps> = ({ url, radius, x, y }) => {
  const { t } = useTranslation();
  return (
    <Tooltip key="route" content={t('knative-plugin~Open URL')} position={TooltipPosition.right}>
      <Decorator x={x} y={y} radius={radius} href={url} external>
        <g transform="translate(-6.5, -6.5)">
          <ExternalLinkAltIcon style={{ fontSize: radius }} title={t('knative-plugin~Open URL')} />
        </g>
      </Decorator>
    </Tooltip>
  );
};

export default ServiceRouteDecorator;
