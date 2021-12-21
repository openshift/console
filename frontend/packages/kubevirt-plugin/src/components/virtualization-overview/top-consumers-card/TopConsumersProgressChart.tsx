import * as React from 'react';
import { Progress, ProgressMeasureLocation, ProgressSize } from '@patternfly/react-core';

import './top-consumers-card.scss';

type TopConsumersProgressChartProps = {
  title: string;
  value: number;
  labelValue: number;
  labelUnit: string;
  maxValue: number;
};

export const TopConsumersProgressChart: React.FC<TopConsumersProgressChartProps> = ({
  title,
  value,
  labelValue,
  labelUnit,
  maxValue,
}) => (
  <>
    <div className="kv-top-consumers-card__progress-chart--title">{title}</div>
    <Progress
      value={value}
      size={ProgressSize.sm}
      max={maxValue}
      label={`${labelValue} ${labelUnit}`}
      measureLocation={ProgressMeasureLocation.outside}
      aria-label="kv-top-consumers-card-chart"
    />
  </>
);
