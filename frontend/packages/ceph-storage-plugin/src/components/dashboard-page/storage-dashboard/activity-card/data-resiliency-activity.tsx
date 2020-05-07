import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { getResiliencyProgress } from '../../../../utils';

export const DataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const progress: number = getResiliencyProgress(results);
  const formattedProgress = Math.round(progress * 100);
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
