import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getGaugeValue } from '../../../../utils';

export const isResilencyActivity = (results: PrometheusResponse): boolean => {
  /**
   * Possible values for progress:
   *   - A float value of String type
   *   - 'NaN'
   *   - undefined
   */
  const progress: string = getGaugeValue(results);
  return parseFloat(progress) < 1;
};

export const DataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const progress = getGaugeValue(results);
  const formattedProgress = Math.round(parseFloat(progress) * 100);
  return (
    <>
      <Progress
        className="co-activity-item__progress"
        value={formattedProgress}
        size={ProgressSize.sm}
        title="Rebuilding data resiliency"
        label={`${formattedProgress}%`}
      />
    </>
  );
};

type DataResiliencyProps = {
  results: PrometheusResponse;
};
