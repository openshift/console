import type { FC } from 'react';
import { useRef } from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { RhUiExternalLinkFillIcon } from '@patternfly/react-icons';
import type { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { useRoutesURL } from '../../../../../data-transforms/useRoutesURL';
import { getResource } from '../../../../../utils/topology-utils';
import { Decorator } from './Decorator';

interface DefaultDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

export const UrlDecorator: FC<DefaultDecoratorProps> = ({ element, radius, x, y }) => {
  const ref = useRef();
  const { t } = useTranslation('topology');
  const resourceObj = getResource(element);
  const url = useRoutesURL(resourceObj);
  if (!url) {
    return null;
  }
  const label = t('Open URL');
  return (
    <Tooltip triggerRef={ref} key="route" content={label} position={TooltipPosition.right}>
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external ariaLabel={label}>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
            <RhUiExternalLinkFillIcon style={{ fontSize: radius }} title={label} />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};
