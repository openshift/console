import * as React from 'react';
import { PrometheusResponse } from '@console/shared/src/types/monitoring';
import { formatDuration } from '@console/internal/components/utils/datetime';
import { DataResiliency } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/activity-card/data-resiliency-activity';
import { getGaugeValue } from '../../../utils';
import './data-resiliency-activity.scss';

export const NoobaaDataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const eta = getGaugeValue(results[1]);
  const formattedEta = formatDuration(eta * 1000);
  return (
    <>
      <DataResiliency results={results[0]} />
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
