import * as React from 'react';
import { useSize } from '@console/topology';
import SvgResourceIcon from './ResourceIcon';

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;
const CONTENT_MARGIN = 40;

type GroupNodeProps = {
  title: string;
  kind?: string;
  children?: React.ReactNode;
};

const GroupNode: React.FC<GroupNodeProps> = ({ children, kind, title }) => {
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;
  return (
    <>
      <SvgResourceIcon ref={iconRef} x={TOP_MARGIN} y={LEFT_MARGIN} kind={kind} leftJustified />
      {title && (
        <text
          className="odc-group-node__title"
          x={LEFT_MARGIN + iconWidth + TEXT_MARGIN}
          y={TOP_MARGIN + iconHeight}
          textAnchor="start"
          dy="-0.25em"
        >
          {title}
        </text>
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
