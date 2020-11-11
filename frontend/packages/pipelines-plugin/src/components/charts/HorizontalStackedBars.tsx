import * as React from 'react';
import classNames from 'classnames';
import './HorizontalStackedBars.scss';

export type StackedValue = {
  color: string;
  name: string;
  size: number;
};

export type HorizontalStackedBarsProps = {
  barGap?: number;
  height?: number | string;
  inline?: boolean;
  values: StackedValue[];
  width?: number | string;
};

const HorizontalStackedBars: React.FC<HorizontalStackedBarsProps> = ({
  barGap,
  height,
  inline,
  values,
  width,
}) => {
  return (
    <div
      className={classNames('odc-horizontal-stacked-bars', { 'is-inline': inline })}
      style={{ height, width, ['--bar-gap' as any]: barGap && `${barGap}px` }}
    >
      <div className="odc-horizontal-stacked-bars__bars">
        {values.map(({ color, name, size }) => (
          <div
            key={name}
            className="odc-horizontal-stacked-bars__data-bar"
            style={{
              background: color,
              flexGrow: size,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HorizontalStackedBars;
