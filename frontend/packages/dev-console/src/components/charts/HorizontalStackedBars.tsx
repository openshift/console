import * as React from 'react';
import './HorizontalStackedBars.scss';

export type StackedValue = {
  color: string;
  name: string;
  size: number;
};

export type HorizontalStackedBarsProps = {
  disableAnimation?: boolean;
  height?: number | string;
  values: StackedValue[];
  width?: number | string;
};

const HorizontalStackedBars: React.FC<HorizontalStackedBarsProps> = ({
  disableAnimation,
  height,
  values,
  width,
}) => {
  return (
    <div className="odc-horizontal-stacked-bars" style={{ height, width }}>
      <div className="odc-horizontal-stacked-bars__bars">
        {values.map(({ color, name, size }) => (
          <div
            key={name}
            className="odc-horizontal-stacked-bars__data-bar"
            style={{
              background: color,
              flexGrow: size,
              transition: disableAnimation ? 'initial' : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HorizontalStackedBars;
