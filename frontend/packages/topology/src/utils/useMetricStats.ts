import { useMemo } from 'react';
import * as _ from 'lodash';
import { MetricStats } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared/src';
import { getPodMetricStats } from './metricStats';
import { useOverviewMetrics } from './useOverviewMetrics';

export const useMetricStats = (resource: K8sResourceKind): MetricStats => {
  const metrics = useOverviewMetrics();
  const { podData, loaded } = usePodsWatcher(resource, resource.kind, resource.metadata.namespace);
  const memoryStats = useMemo(() => {
    if (_.isEmpty(metrics) || !loaded) {
      return null;
    }
    return getPodMetricStats(metrics, podData);
  }, [loaded, metrics, podData]);

  return memoryStats;
};
