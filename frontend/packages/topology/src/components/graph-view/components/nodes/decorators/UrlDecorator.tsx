import type { FC } from 'react';
import { useRef } from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import type { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { useRoutesURL } from '../../../../../data-transforms/useRoutesURL';
import { getResource } from '../../../../../utils';
import Decorator from './Decorator';

interface DefaultDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const UrlDecorator: FC<DefaultDecoratorProps> = ({ element, radius, x, y }) => {
  const ref = useRef();
  const { t } = useTranslation();
  const resourceObj = getResource(element);
  const url = useRoutesURL(resourceObj);
  if (!url) {
    return null;
  }
  const label = t('topology~Open URL');
  return (
    <Tooltip triggerRef={ref} key="route" content={label} position={TooltipPosition.right}>
      <g ref={ref}>
        <Decorator x={x} y={y} radius={radius} href={url} external ariaLabel={label}>
          <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
            <ExternalLinkAltIcon style={{ fontSize: radius }} title={label} />
          </g>
        </Decorator>
      </g>
    </Tooltip>
  );
};

export default UrlDecorator;
