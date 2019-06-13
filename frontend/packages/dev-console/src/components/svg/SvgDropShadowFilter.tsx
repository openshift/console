import * as React from 'react';
import SvgDefs from './SvgDefs';

export interface SvgDropShadowFilterProps {
  // The unique ID that identifies the filter.
  // It is also used to uniquely identify the def entry to prevent duplicates.
  id: string;
  dx?: number;
  dy?: number;
  stdDeviation?: number;
  floodOpacity?: number;
  floodColor?: string;
}

const SvgDropShadowFilter: React.FC<SvgDropShadowFilterProps> = ({
  id,
  dx = 0,
  dy = 1,
  stdDeviation = 2,
  floodColor = '#030303',
  floodOpacity = 0.2,
}) => (
  <SvgDefs id={id}>
    <filter
      id={id}
      x={`-${stdDeviation * 12.5}%`}
      y={`-${stdDeviation * 12.5}%`}
      width={`${100 + stdDeviation * 25}%`}
      height={`${100 + stdDeviation * 25}%`}
    >
      <feDropShadow
        dx={dx}
        dy={dy}
        stdDeviation={stdDeviation}
        floodColor={floodColor}
        floodOpacity={floodOpacity}
      />
    </filter>
  </SvgDefs>
);

export default SvgDropShadowFilter;
