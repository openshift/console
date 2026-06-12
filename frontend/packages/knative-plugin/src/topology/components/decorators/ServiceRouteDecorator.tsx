import type { FC } from 'react';
import { useRef } from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { RhUiExternalLinkFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { Decorator } from '@console/topology/src/components/graph-view/components/nodes/decorators/Decorator';

type ServiceRouteDecoratorProps = {
  url: string;
  radius: number;
  x: number;
  y: number;
};

const ServiceRouteDecorator: FC<ServiceRouteDecoratorProps> = ({ url, radius, x, y }) => {
  const ref = useRef();
  const { t } = useTranslation('knative-plugin');
  return (
    <Tooltip triggerRef={ref} key="route" content={t('Open URL')} position={TooltipPosition.right}>
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external>
          <g transform="translate(-6.5, -6.5)">
            <RhUiExternalLinkFillIcon style={{ fontSize: radius }} title={t('Open URL')} />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};

export default ServiceRouteDecorator;
