import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem, {
  TopConsumerPopoverProp,
  MultilineUtilizationItem,
  QueryWithDescription,
  LimitRequested,
  trimSecondsXMutator,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  useExtensions,
  DashboardsOverviewUtilizationItem,
  isDashboardsOverviewUtilizationItem,
} from '@console/plugin-sdk';
import { PopoverPosition } from '@patternfly/react-core';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeNumber,
  humanizeDecimalBytesPerSec,
} from '../../../utils/units';
import { getRangeVectorStats, getInstantVectorStats } from '../../../graphs/utils';
import {
  OverviewQuery,
  utilizationQueries,
  top25ConsumerQueries,
  multilineQueries,
} from '@console/shared/src/promql/cluster-dashboard';
import { NodeModel, PodModel, ProjectModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { Humanize } from '../../../utils/types';
import { DataPoint, PrometheusResponse } from '../../../graphs';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { DEFAULT_DURATION, useDateRange } from '@console/shared';

const cpuQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_CPU],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.PODS_BY_CPU],
    model: PodModel,
    metric: 'pod',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_CPU],
    model: NodeModel,
    metric: 'instance',
  },
];

const memQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_MEMORY],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.PODS_BY_MEMORY],
    model: PodModel,
    metric: 'pod',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_MEMORY],
    model: NodeModel,
    metric: 'instance',
  },
];

const storageQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_STORAGE],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.PODS_BY_STORAGE],
    model: PodModel,
    metric: 'pod',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_STORAGE],
    model: NodeModel,
    metric: 'instance',
  },
];

const podQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_PODS],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_PODS],
    model: NodeModel,
    metric: 'node',
  },
];

const networkInQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_NETWORK_IN],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.PODS_BY_NETWORK_IN],
    model: PodModel,
    metric: 'pod',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_NETWORK_IN],
    model: NodeModel,
    metric: 'instance',
  },
];

const networkOutQueriesPopup = [
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_NETWORK_OUT],
    model: ProjectModel,
    metric: 'namespace',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.PODS_BY_NETWORK_OUT],
    model: PodModel,
    metric: 'pod',
  },
  {
    query: top25ConsumerQueries[OverviewQuery.NODES_BY_NETWORK_OUT],
    model: NodeModel,
    metric: 'instance',
  },
];

export const PrometheusUtilizationItem = withDashboardResources<PrometheusUtilizationItemProps>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    utilizationQuery,
    totalQuery,
    duration,
    title,
    TopConsumerPopover,
    humanizeValue,
    byteDataType,
    namespace,
    isDisabled = false,
    limitQuery,
    requestQuery,
    setLimitReqState,
    startDate,
    endDate,
    updateEndDate,
  }) => {
    let utilization: PrometheusResponse, utilizationError: any;
    let total: PrometheusResponse, totalError: any;
    let max: DataPoint<number>[];
    let limit: PrometheusResponse, limitError: any;
    let request: PrometheusResponse, requestError: any;
    let isLoading = false;

    React.useEffect(() => {
      if (!isDisabled) {
        watchPrometheus(utilizationQuery, namespace, duration);
        totalQuery && watchPrometheus(totalQuery, namespace);
        limitQuery && watchPrometheus(limitQuery, namespace, duration);
        requestQuery && watchPrometheus(requestQuery, namespace, duration);
        return () => {
          stopWatchPrometheusQuery(utilizationQuery, duration);
          totalQuery && stopWatchPrometheusQuery(totalQuery);
          limitQuery && stopWatchPrometheusQuery(limitQuery, duration);
          requestQuery && stopWatchPrometheusQuery(requestQuery, duration);
        };
      }
    }, [
      watchPrometheus,
      stopWatchPrometheusQuery,
      duration,
      utilizationQuery,
      totalQuery,
      namespace,
      isDisabled,
      limitQuery,
      requestQuery,
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
        title={title}
        utilization={utilization}
        limit={limit}
        requested={request}
        error={utilizationError || totalError || limitError || requestError}
        isLoading={isLoading}
        humanizeValue={humanizeValue}
        byteDataType={byteDataType}
        query={[utilizationQuery, limitQuery, requestQuery]}
        max={max && max.length ? max[0].y : null}
        TopConsumerPopover={TopConsumerPopover}
        setLimitReqState={setLimitReqState}
        startDate={startDate}
        endDate={endDate}
        updateEndDate={updateEndDate}
      />
    );
  },
);

export const PrometheusMultilineUtilizationItem = withDashboardResources<
  PrometheusMultilineUtilizationItemProps
>(
  ({
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    queries,
    duration,
    title,
    TopConsumerPopovers,
    humanizeValue,
    byteDataType,
    namespace,
    isDisabled = false,
    startDate,
    endDate,
    updateEndDate,
  }) => {
    React.useEffect(() => {
      if (!isDisabled) {
        queries.forEach((q) => watchPrometheus(q.query, namespace, duration));
        return () => {
          queries.forEach((q) => stopWatchPrometheusQuery(q.query, duration));
        };
      }
    }, [watchPrometheus, stopWatchPrometheusQuery, duration, queries, namespace, isDisabled]);

    const stats = [];
    let hasError = false;
    let isLoading = false;
    if (!isDisabled) {
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
        byteDataType={byteDataType}
        queries={queries}
        TopConsumerPopovers={TopConsumerPopovers}
        startDate={startDate}
        endDate={endDate}
        updateEndDate={updateEndDate}
      />
    );
  },
);

const getQueries = (itemExtensions: DashboardsOverviewUtilizationItem[]) => {
  const pluginQueries = {};
  itemExtensions.forEach((e) => {
    if (!pluginQueries[e.properties.id]) {
      pluginQueries[e.properties.id] = {
        utilization: e.properties.query,
        total: e.properties.totalQuery,
      };
    }
  });
  return _.defaults(pluginQueries, utilizationQueries);
};

export const UtilizationCard = () => {
  const { t } = useTranslation();

  const itemExtensions = useExtensions<DashboardsOverviewUtilizationItem>(
    isDashboardsOverviewUtilizationItem,
  );

  const queries = React.useMemo(() => getQueries(itemExtensions), [itemExtensions]);

  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [startDate, endDate, updateEndDate] = useDateRange(duration);

  const cpuPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~CPU')}
        current={current}
        consumers={cpuQueriesPopup}
        humanize={humanizeCpuCores}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const memPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Memory')}
        current={current}
        consumers={memQueriesPopup}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const storagePopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Filesystem')}
        current={current}
        consumers={storageQueriesPopup}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const podPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Pod count')}
        current={current}
        consumers={podQueriesPopup}
        humanize={humanizeNumber}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const networkInPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Network in')}
        current={current}
        consumers={networkInQueriesPopup}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  const networkOutPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~Network out')}
        current={current}
        consumers={networkOutQueriesPopup}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    )),
    [],
  );

  return (
    <DashboardCard data-test-id="utilization-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('public~Cluster utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown onChange={setDuration} />
      </DashboardCardHeader>
      <UtilizationBody startDate={startDate} endDate={endDate}>
        <PrometheusUtilizationItem
          title={t('public~CPU')}
          utilizationQuery={queries[OverviewQuery.CPU_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.CPU_UTILIZATION].total}
          requestQuery={queries[OverviewQuery.CPU_UTILIZATION].requests}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          humanizeValue={humanizeCpuCores}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('public~Memory')}
          utilizationQuery={queries[OverviewQuery.MEMORY_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.MEMORY_UTILIZATION].total}
          requestQuery={queries[OverviewQuery.MEMORY_UTILIZATION].requests}
          TopConsumerPopover={memPopover}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('public~Filesystem')}
          utilizationQuery={queries[OverviewQuery.STORAGE_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.STORAGE_UTILIZATION].total}
          TopConsumerPopover={storagePopover}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusMultilineUtilizationItem
          title={t('public~Network transfer')}
          queries={multilineQueries[OverviewQuery.NETWORK_UTILIZATION]}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
          TopConsumerPopovers={[networkInPopover, networkOutPopover]}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('public~Pod count')}
          utilizationQuery={queries[OverviewQuery.POD_UTILIZATION].utilization}
          TopConsumerPopover={podPopover}
          duration={duration}
          humanizeValue={humanizeNumber}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

type PrometheusCommonProps = {
  duration: number;
  title: string;
  humanizeValue: Humanize;
  byteDataType?: ByteDataTypes;
  namespace?: string;
  isDisabled?: boolean;
  startDate: Date;
  endDate: Date;
  updateEndDate: (endDate: Date) => void;
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

type PrometheusMultilineUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    queries: QueryWithDescription[];
    TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProp>[];
  };
