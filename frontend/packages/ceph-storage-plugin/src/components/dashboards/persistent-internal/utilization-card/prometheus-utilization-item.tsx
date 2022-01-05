import * as React from 'react';
import { PrometheusResponse } from '@console/internal/module/k8s';
import { useUtilizationDuration } from '@console/shared/src/hooks/useUtilizationDuration';
import { DataPoint } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { Humanize } from '@console/internal/components/utils';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import { UtilizationItem } from './utilization-item';

enum LIMIT_STATE {
  ERROR = 'ERROR',
  WARN = 'WARN',
  OK = 'OK',
}

export const PrometheusUtilizationItem = withDashboardResources<PrometheusUtilizationItemProps>(
  ({
    utilizationQuery,
    title,
    totalQuery,
    humanizeValue,
    byteDataType,
    TopConsumerPopover,
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    namespace,
    isDisabled = false,
    limitQuery,
    requestQuery,
    setLimitReqState,
  }) => {
    let utilization: PrometheusResponse;
    let utilizationError: any;
    let total: PrometheusResponse;
    let totalError: any;
    let max: DataPoint<number>[];
    let limit: PrometheusResponse;
    let limitError: any;
    let request: PrometheusResponse;
    let requestError: any;
    let isLoading = false;
    const { duration } = useUtilizationDuration();

    // eslint-disable-next-line consistent-return
    React.useEffect(() => {
      if (!isDisabled) {
        watchPrometheus(utilizationQuery, namespace, duration);
        return () => {
          stopWatchPrometheusQuery(utilizationQuery, duration);
        };
      }
    }, [
      watchPrometheus,
      stopWatchPrometheusQuery,
      duration,
      utilizationQuery,
      namespace,
      isDisabled,
    ]);

    if (!isDisabled) {
      [utilization, utilizationError] = getPrometheusQueryResponse(
        prometheusResults,
        utilizationQuery,
        duration,
      );
      [total, totalError] = getPrometheusQueryResponse(prometheusResults, totalQuery);
      [limit, limitError] = getPrometheusQueryResponse(prometheusResults, limitQuery, duration);
      [request, requestError] = getPrometheusQueryResponse(
        prometheusResults,
        requestQuery,
        duration,
      );

      max = getInstantVectorStats(total);
      isLoading = !utilization || (totalQuery && !total) || (limitQuery && !limit);
    }

    return (
      <UtilizationItem
        TopConsumerPopover={TopConsumerPopover}
        byteDataType={byteDataType}
        error={utilizationError || totalError || limitError || requestError}
        humanizeValue={humanizeValue}
        isLoading={isLoading}
        limit={limit}
        max={max && max.length ? max[0].y : null}
        query={[utilizationQuery, limitQuery, requestQuery]}
        requested={request}
        setLimitReqState={setLimitReqState}
        title={title}
        utilization={utilization}
      />
    );
  },
);

type TopConsumerPopoverProp = {
  current: string;
  max?: string;
  limit?: string;
  available?: string;
  requested?: string;
  total?: string;
  limitState?: LIMIT_STATE;
  requestedState?: LIMIT_STATE;
};

type PrometheusCommonProps = {
  title: string;
  humanizeValue: Humanize;
  byteDataType?: ByteDataTypes;
  namespace?: string;
  isDisabled?: boolean;
};

type LimitRequested = {
  limit: LIMIT_STATE;
  requested: LIMIT_STATE;
};

type PrometheusUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    utilizationQuery: string;
    totalQuery?: string;
    limitQuery?: string;
    requestQuery?: string;
    TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
    setLimitReqState?: (state: LimitRequested) => void;
  };
