import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { formatDuration } from '@console/internal/components/utils/datetime';
import { getGaugeValue, getResiliencyProgress } from '../../../utils';
import { MAX_PROGRESS } from '../../../constants';
import './data-resiliency-activity.scss';

export const isDataResiliencyActivity = (response: PrometheusResponse): boolean => {
  const progress = getGaugeValue(response);
  return progress < MAX_PROGRESS;
};

export const DataResiliencyActivity: React.FC<DataResiliencyProps> = ({ results }) => {
  const progress = getResiliencyProgress(results[0]);
  const eta = getGaugeValue(results[1]);
  const formattedEta = formatDuration(eta * 1000);
  return (
    <>
      <Progress
        className="co-activity-item__progress"
        value={progress}
        size={ProgressSize.sm}
        title="Rebuilding data resiliency"
        label={`${progress}%`}
      />
      {eta && (
        <span className="text-secondary nb-data-resiliency__eta">
          Estimating {formattedEta} to completion
        </span>
      )}
    </>
  );
};

type DataResiliencyProps = {
  results: PrometheusResponse[];
};
