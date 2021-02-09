import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getResiliencyProgress } from '../../../../utils';

export const DataResiliency: React.FC<DataResiliencyProps> = ({ results }) => {
  const { t } = useTranslation();

  const progress: number = getResiliencyProgress(results);
  const formattedProgress = Math.round(progress * 100);
  return (
    <>
      <Progress
        className="co-activity-item__progress"
        value={formattedProgress}
        size={ProgressSize.sm}
        title={t('ceph-storage-plugin~Rebuilding data resiliency')}
        label={t('ceph-storage-plugin~{{formattedProgress, number}}%', { formattedProgress })}
      />
    </>
  );
};

type DataResiliencyProps = {
  results: PrometheusResponse;
};
