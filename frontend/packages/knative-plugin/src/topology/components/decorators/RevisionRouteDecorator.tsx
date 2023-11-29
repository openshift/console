import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Decorator } from '@console/topology/src/components/graph-view';
import { getResource } from '@console/topology/src/utils';
import { useRoutesURL } from '../../../utils/useRoutesURL';

interface RevisionRouteDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const RevisionRouteDecorator: React.FC<RevisionRouteDecoratorProps> = ({
  element,
  radius,
  x,
  y,
}) => {
  const ref = React.useRef();
  const { t } = useTranslation();
  const resourceObj = getResource(element);
  const url = useRoutesURL(resourceObj);

  if (!url) {
    return null;
  }
  return (
    <Tooltip
      triggerRef={ref}
      key="route"
      content={t('knative-plugin~Open URL')}
      position={TooltipPosition.right}
    >
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
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

export default RevisionRouteDecorator;
