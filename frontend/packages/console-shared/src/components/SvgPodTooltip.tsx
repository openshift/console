import * as React from 'react';
import { podColor } from '@console/shared';
import SvgTooltip from './SvgTooltip';

type TooltipProps = {
  datum?: any;
  active?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};

const PodTooltip: React.FunctionComponent<TooltipProps> = ({
  datum = null,
  active = false,
  x,
  y,
  width,
  height,
}) => {
  if (!datum) {
    return null;
  }

  const parentBox = { x, y, width, height };

  const getTipContent = (boxX: number, boxY: number): React.ReactNode => {
    return (
      <React.Fragment>
        <rect width={10} height={10} x={boxX} y={boxY + 3} style={{ fill: podColor[datum.x] }} />
        <text x={boxX + 15} y={boxY + 2} textAnchor="start" dominantBaseline="hanging">
          <tspan>{datum.x}</tspan>
          {datum.x !== 'Scaled to 0' && datum.x !== 'Autoscaled to 0' && datum.x !== 'Idle' && (
            <tspan dx={20}>{Math.round(datum.y)}</tspan>
          )}
        </text>
      </React.Fragment>
    );
  };

  return <SvgTooltip active={active} parentBox={parentBox} getContent={getTipContent} />;
};

export default PodTooltip;
