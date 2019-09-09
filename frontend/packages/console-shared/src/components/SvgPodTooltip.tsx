import * as React from 'react';
import { podColor } from '@console/shared';
import SvgTooltip from './SvgTooltip';

const STATUS_BOX_SIZE = 10;

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

  return (
    <SvgTooltip active={active} parentBox={parentBox}>
      <rect
        width={STATUS_BOX_SIZE}
        height={STATUS_BOX_SIZE}
        x={0}
        y={4}
        style={{ fill: podColor[datum.x] }}
      />
      <text x={15} y={0} dy="1em" textAnchor="start">
        <tspan>{datum.x}</tspan>
        {datum.x !== 'Scaled to 0' && datum.x !== 'Autoscaled to 0' && datum.x !== 'Idle' && (
          <tspan dx={20}>{Math.round(datum.y)}</tspan>
        )}
      </text>
    </SvgTooltip>
  );
};

export default PodTooltip;
