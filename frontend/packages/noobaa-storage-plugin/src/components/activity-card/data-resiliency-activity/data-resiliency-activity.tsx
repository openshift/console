import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { formatDuration } from '@console/internal/components/utils/datetime';
import { DataResiliency } from '@console/ceph-storage-plugin/src/components/dashboards/common/data-resiliency/data-resiliency-activity';
import { getGaugeValue } from '../../../utils';
import './data-resiliency-activity.scss';

export const NoobaaDataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const { t } = useTranslation();

  const eta = getGaugeValue(results[1]);
  const formattedEta = formatDuration(eta * 1000);

  return (
    <>
      <DataResiliency results={results[0]} />
      {eta && (
        <span className="text-secondary nb-data-resiliency__eta">
          {t('noobaa-storage-plugin~Estimating {{formattedEta}} to completion', {
            formattedEta,
          })}
        </span>
      )}
    </>
  );
};

type DataResiliencyProps = {
  results: PrometheusResponse[];
};
