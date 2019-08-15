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
  const getContent = (boxX: number, boxY: number): React.ReactNode => {
    return (
      <text x={boxX} y={boxY + 2} dominantBaseline="hanging" textAnchor="start">
        <tspan>{title}</tspan>
      </text>
    );
  };

  return (
    <SvgTooltip
      active={active}
      parentBox={parentBox}
      getContent={getContent}
      arrowPosition={position}
    />
  );
};

export default DecoratorTooltip;
