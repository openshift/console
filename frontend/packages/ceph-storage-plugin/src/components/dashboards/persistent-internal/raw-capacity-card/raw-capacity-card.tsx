import * as React from 'react';
import { compose } from 'redux';
import { useTranslation } from 'react-i18next';

import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';

import { CapacityCard, CapacityCardProps } from '../../common/capacity-card/capacity-card';
import { CAPACITY_INFO_QUERIES } from '../../../../queries';

const queries = (() => Object.values(CAPACITY_INFO_QUERIES))();

// Enchance instantVectorStats to directly parse the values (else loading state won't be accurate)
const parser = compose((val) => val?.[0]?.y, getInstantVectorStats);

const RawCapacityCard: React.FC = () => {
  const { t } = useTranslation();
  const [values, loading] = usePrometheusQueries(queries, parser as any);
  const loadError = values.every((item) => typeof item === 'undefined' || item === 0);

  const totalCapacityMetric = values?.[0] as number;
  const usedCapacityMetric = values?.[1] as number;
  const availableCapacityMetric = totalCapacityMetric - usedCapacityMetric;
  const description = t(
    'ceph-storage-plugin~Raw capacity is the absolute total disk space available to the array subsystem.',
  );

  const props: CapacityCardProps = {
    totalCapacityMetric,
    usedCapacityMetric,
    availableCapacityMetric,
    description,
    loading,
    loadError,
  };

  return <CapacityCard {...props} />;
};

export default RawCapacityCard;
