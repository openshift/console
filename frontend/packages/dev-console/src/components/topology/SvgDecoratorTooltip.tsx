import * as React from 'react';
import { TooltipPosition } from '@patternfly/react-core';
import SvgTooltip from '@console/shared/src/components/SvgTooltip';

type TooltipProps = {
  active?: boolean;
  title: string;
  x: number;
  y: number;
  radius: number;
  position?: TooltipPosition;
};

const DecoratorTooltip: React.FunctionComponent<TooltipProps> = ({
  active = false,
  title,
  x,
  y,
  radius,
  position = TooltipPosition.left,
}) => {
  const parentBox = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };

  return (
    <SvgTooltip active={active} parentBox={parentBox} arrowPosition={position}>
      <text x={0} y={0} textAnchor="start" dy="1em">
        <tspan>{title}</tspan>
      </text>
    </SvgTooltip>
  );
};

export default DecoratorTooltip;
