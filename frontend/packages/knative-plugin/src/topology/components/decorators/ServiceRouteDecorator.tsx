import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { useTranslation } from 'react-i18next';
import { Decorator } from '@console/topology/src/components/graph-view';

type ServiceRouteDecoratorProps = {
  url: string;
  radius: number;
  x: number;
  y: number;
};

const ServiceRouteDecorator: React.FC<ServiceRouteDecoratorProps> = ({ url, radius, x, y }) => {
  const ref = React.useRef();
  const { t } = useTranslation();
  return (
    <Tooltip
      triggerRef={ref}
      key="route"
      content={t('knative-plugin~Open URL')}
      position={TooltipPosition.right}
    >
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external>
          <g transform="translate(-6.5, -6.5)">
            <ExternalLinkAltIcon
              style={{ fontSize: radius }}
              title={t('knative-plugin~Open URL')}
            />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};

export default ServiceRouteDecorator;
