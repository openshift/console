import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { getResource } from '../../../../../utils';
import Decorator from './Decorator';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useRoutesURL } from '../../../../../data-transforms/useRoutesURL';

interface DefaultDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const UrlDecorator: React.FC<DefaultDecoratorProps> = ({ element, radius, x, y }) => {
  const { t } = useTranslation();
  const resourceObj = getResource(element);
  const url = useRoutesURL(resourceObj);

  if (!url) {
    return null;
  }
  const label = t('topology~Open URL');
  return (
    <Tooltip key="route" content={label} position={TooltipPosition.right}>
      <Decorator x={x} y={y} radius={radius} href={url} external ariaLabel={label}>
        <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
          <ExternalLinkAltIcon style={{ fontSize: radius }} title={label} />
        </g>
      </Decorator>
    </Tooltip>
  );
};

export default UrlDecorator;
