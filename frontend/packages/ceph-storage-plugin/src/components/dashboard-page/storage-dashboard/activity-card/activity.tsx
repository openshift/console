import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getResiliencyProgress } from '../../../../selectors';

export const isDataResiliencyActivity = (results: PrometheusResponse): boolean => {
  const progress = getResiliencyProgress(results);
  return progress && progress < 100;
};

export const DataResiliencyActivity: React.FC<DataResiliencyProps> = ({ results }) => {
  const progress = getResiliencyProgress(results);
  return (
    <>
      <Progress
        className="co-activity-item__progress"
        value={progress}
        size={ProgressSize.sm}
        title="Rebuilding data resiliency"
        label={`${progress}%`}
      />
    </>
  );
};

type DataResiliencyProps = {
  results: PrometheusResponse;
};
