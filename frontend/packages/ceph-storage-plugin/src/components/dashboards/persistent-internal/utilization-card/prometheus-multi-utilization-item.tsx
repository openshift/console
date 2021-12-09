import * as React from 'react';
import { useUtilizationDuration } from '@console/shared/src/hooks/useUtilizationDuration';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { Humanize } from '@console/internal/components/utils';

import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import { MultilineUtilizationItem } from './multi-utilization-item';

export const PrometheusMultilineUtilizationItem = withDashboardResources<
  PrometheusMultilineUtilizationItemProps
>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    queries,
    title,
    humanizeValue,
    namespace,
    isDisabled = false,
    chartType,
  }) => {
    const { duration } = useUtilizationDuration();
    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
      if (!isDisabled) {
        queries.forEach((q) => watchPrometheus(q.query, namespace, duration));
        return () => {
          queries.forEach((q) => stopWatchPrometheusQuery(q.query, duration));
        };
      }
    }, [watchPrometheus, stopWatchPrometheusQuery, duration, queries, namespace, isDisabled]);

    const trimSecondsXMutator = (x: number) => {
      const d = new Date(x * 1000);
      d.setSeconds(0, 0);
      return d;
    };

    const stats = [];
    let hasError = false;
    let isLoading = false;
    if (!isDisabled) {
      // eslint-disable-next-line consistent-return
      queries.forEach((query) => {
        const [response, responseError] = getPrometheusQueryResponse(
          prometheusResults,
          query.query,
          duration,
        );
        if (responseError) {
          hasError = true;
          return false;
        }
        if (!response) {
          isLoading = true;
          return false;
        }
        stats.push(getRangeVectorStats(response, query.desc, null, trimSecondsXMutator)?.[0] || []);
      });
    }

    return (
      <MultilineUtilizationItem
        title={title}
        data={stats}
        error={hasError}
        isLoading={isLoading}
        humanizeValue={humanizeValue}
        queries={queries}
        chartType={chartType}
      />
    );
  },
);

type PrometheusCommonProps = {
  title: string;
  humanizeValue: Humanize;
  namespace?: string;
  isDisabled?: boolean;
};

type QueryWithDescription = {
  query: string;
  desc: string;
};

type PrometheusMultilineUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    queries: QueryWithDescription[];
    chartType?: 'stacked-area' | 'grouped-line';
  };
