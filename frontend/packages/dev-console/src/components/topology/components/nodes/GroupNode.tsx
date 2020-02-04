import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import {
  truncateMiddle,
  shouldTruncate,
  TruncateOptions,
} from '@console/internal/components/utils';
import { useSize, useHover } from '@console/topology';
import SvgResourceIcon from './ResourceIcon';
import SvgCircledIcon from '../../../svg/SvgCircledIcon';

import './GroupNode.scss';

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;
const CONTENT_MARGIN = 40;

const truncateOptions: TruncateOptions = {
  length: 35,
};

type GroupNodeProps = {
  title: string;
  kind?: string;
  children?: React.ReactNode;
  typeIconClass?: string;
};

const GroupNode: React.FC<GroupNodeProps> = ({ children, kind, title, typeIconClass }) => {
  const [textHover, textHoverRef] = useHover();
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;
  return (
    <>
      {typeIconClass && (
        <SvgCircledIcon
          className="odc-group-node__type-icon"
          x={10}
          y={-10}
          width={20}
          height={20}
          iconClass={typeIconClass}
        />
      )}
      <SvgResourceIcon ref={iconRef} x={TOP_MARGIN} y={LEFT_MARGIN} kind={kind} leftJustified />
      {title && (
        <Tooltip
          content={title}
          position={TooltipPosition.top}
          trigger="manual"
          isVisible={textHover && shouldTruncate(title, truncateOptions)}
        >
          <text
            ref={textHoverRef}
            className="odc-group-node__title"
            x={LEFT_MARGIN + iconWidth + TEXT_MARGIN}
            y={TOP_MARGIN + iconHeight}
            textAnchor="start"
            dy="-0.25em"
          >
            {truncateMiddle(title, truncateOptions)}
          </text>
        </Tooltip>
      )}
      {children && (
        <g
          transform={`translate(${LEFT_MARGIN + iconWidth}, ${TOP_MARGIN +
            iconHeight +
            CONTENT_MARGIN})`}
        >
          {children}
        </g>
      )}
    </>
  );
};

export default GroupNode;
