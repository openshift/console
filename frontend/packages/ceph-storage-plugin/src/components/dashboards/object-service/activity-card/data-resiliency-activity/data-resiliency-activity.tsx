import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { formatPrometheusDuration } from '@console/internal/components/utils/datetime';
import { DataResiliency } from '../../../common/data-resiliency/data-resiliency-activity';
import { getGaugeValue } from '../../../../../utils';
import './data-resiliency-activity.scss';

export const NoobaaDataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const { t } = useTranslation();

  const eta = getGaugeValue(results[1]);
  const formattedEta = formatPrometheusDuration(parseInt(eta, 10) * 1000);

  return (
    <>
      <DataResiliency results={results[0]} />
      {eta && (
        <span className="text-secondary nb-data-resiliency__eta">
          {t('ceph-storage-plugin~Estimating {{formattedEta}} to completion', {
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
