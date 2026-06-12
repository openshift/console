import type { FC } from 'react';
import { useRef } from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { RhUiExternalLinkFillIcon } from '@patternfly/react-icons';
import type { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Decorator } from '@console/topology/src/components/graph-view/components/nodes/decorators/Decorator';
import { getResource } from '@console/topology/src/utils/topology-utils';
import { useRoutesURL } from '../../../utils/useRoutesURL';

interface RevisionRouteDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const RevisionRouteDecorator: FC<RevisionRouteDecoratorProps> = ({ element, radius, x, y }) => {
  const ref = useRef();
  const { t } = useTranslation('knative-plugin');
  const resourceObj = getResource(element);
  const url = useRoutesURL(resourceObj);

  if (!url) {
    return null;
  }
  return (
    <Tooltip triggerRef={ref} key="route" content={t('Open URL')} position={TooltipPosition.right}>
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
            <RhUiExternalLinkFillIcon style={{ fontSize: radius }} title={t('Open URL')} />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};

export default RevisionRouteDecorator;
