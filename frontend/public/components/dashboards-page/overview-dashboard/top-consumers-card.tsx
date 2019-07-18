import * as React from 'react';
import * as _ from 'lodash-es';


import { connectToExtensions, Extension, isDashboardsOverviewTopConsumerItem } from '@console/plugin-sdk';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { ConsumersBody, ConsumersFilter, metricTypeMap } from '../../dashboard/top-consumers-card';
import {
  NODES,
  PODS,
} from '../../dashboard/top-consumers-card/strings';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { Dropdown } from '../../utils';
import { OverviewQuery, topConsumersQueries } from './queries';
import { getInstantVectorStats } from '../../graphs/utils';
import { BarChart } from '../../graphs/bar';
import { DataPoint } from '../../graphs';
import { MetricType } from '../../dashboard/top-consumers-card/metric-type';
import { useEffectDeepCompare } from '../../utils/use-effect-deep-compare';

const topConsumersQueryMap: TopConsumersMap = {
  [PODS]: {
    metric: 'pod_name',
    queries: {
      [MetricType.CPU]: topConsumersQueries[OverviewQuery.PODS_BY_CPU],
      [MetricType.MEMORY]: topConsumersQueries[OverviewQuery.PODS_BY_MEMORY],
      [MetricType.STORAGE]: topConsumersQueries[OverviewQuery.PODS_BY_STORAGE],
    },
  },
  [NODES]: {
    metric: 'node',
    queries: {
      [MetricType.CPU]: topConsumersQueries[OverviewQuery.NODES_BY_CPU],
      [MetricType.MEMORY]: topConsumersQueries[OverviewQuery.NODES_BY_MEMORY],
      [MetricType.STORAGE]: topConsumersQueries[OverviewQuery.NODES_BY_STORAGE],
      [MetricType.NETWORK]: topConsumersQueries[OverviewQuery.NODES_BY_NETWORK],
    },
  },
};

const TopConsumersCard_: React.FC<TopConsumersCardProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  topConsumerQueries,
}) => {
  const [type, setType] = React.useState(PODS);
  const [sortOption, setSortOption] = React.useState(MetricType.CPU);

  useEffectDeepCompare(() => {
    const currentQuery = topConsumerQueries[type].queries[sortOption];
    watchPrometheus(currentQuery);
    return () => stopWatchPrometheusQuery(currentQuery);
  }, [watchPrometheus, stopWatchPrometheusQuery, type, sortOption], [topConsumerQueries]);

  const topConsumersType = topConsumerQueries[type];
  const metricTypeSort = metricTypeMap[sortOption];
  const currentQuery = topConsumersType.queries[sortOption];
  const topConsumersResult = prometheusResults.getIn([currentQuery, 'result']);

  const stats = getInstantVectorStats(topConsumersResult, topConsumersType.metric, metricTypeSort.humanize);

  const data = topConsumersType.mutator ? topConsumersType.mutator(stats) : stats;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Top Consumers</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ConsumersFilter>
          <Dropdown
            buttonClassName="co-overview-consumers__dropdown"
            dropDownClassName="co-overview-consumers__dropdown"
            className="btn-group co-overview-consumers__dropdown co-overview-consumers__dropdown--right"
            items={_.mapValues(topConsumerQueries, (v, key) => key)}
            onChange={(v: string) => {
              setType(v);
              if (!topConsumerQueries[v].queries[sortOption]) {
                setSortOption(Object.keys(topConsumerQueries[v].queries)[0] as MetricType);
              }
            }}
            selectedKey={type}
            title={type}
          />
          <Dropdown
            className="btn-group co-overview-consumers__dropdown co-overview-consumers__dropdown--left"
            buttonClassName="co-overview-consumers__dropdown"
            dropDownClassName="co-overview-consumers__dropdown"
            items={_.mapValues(topConsumersType.queries, (v, key) => key)}
            onChange={(v: MetricType) => setSortOption(v)}
            selectedKey={sortOption}
            title={sortOption}
          />
        </ConsumersFilter>
        <ConsumersBody>
          <BarChart
            data={data}
            query={currentQuery}
            title={`${type} by ${metricTypeSort.description}`}
            loading={!topConsumersResult}
          />
        </ConsumersBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

const mapExtensionsToProps = (extensions: Extension[]) => {
  const topConsumerQueries = {...topConsumersQueryMap};

  extensions.filter(isDashboardsOverviewTopConsumerItem).forEach(pluginItem => {
    if (!topConsumerQueries[pluginItem.properties.name]) {
      topConsumerQueries[pluginItem.properties.name] = {
        metric: pluginItem.properties.metric,
        queries: pluginItem.properties.queries,
        mutator: pluginItem.properties.mutator,
      };
    }
  });
  return {
    topConsumerQueries,
  };
};

export const TopConsumersCard = withDashboardResources(connectToExtensions(mapExtensionsToProps)(TopConsumersCard_));

export type ConsumerMutator = (data: DataPoint[]) => DataPoint[];

type TopConsumersMap = {
  [key: string]: {
    metric: string,
    queries: { [key in MetricType]?: string },
    mutator?: ConsumerMutator,
  },
};

type TopConsumersCardProps = DashboardItemProps & {
  topConsumerQueries: TopConsumersMap;
};
