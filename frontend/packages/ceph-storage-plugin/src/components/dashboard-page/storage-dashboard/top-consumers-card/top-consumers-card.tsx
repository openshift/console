import * as React from 'react';
import * as _ from 'lodash';
import * as plugins from '@console/internal/plugins';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DashboardStorageExtension } from '@console/plugin-sdk';
import { connectToFlags, FlagsObject, WithFlagsProps } from '@console/internal/reducers/features';
import {
  getFlagsForExtensions,
  isDashboardExtensionInUse,
} from '@console/internal/components/dashboards-page/utils';
import { BY_REQUESTED, BY_USED, PODS, PROJECTS, STORAGE_CLASSES } from '../../../../constants';
import { TOP_CONSUMER_QUERIES } from '../../../../constants/queries';
import { TopConsumersBody } from './top-consumers-card-body';
import './top-consumers-card.scss';

const TopConsumerResourceValue = {
  [PROJECTS]: 'PROJECTS_',
  [STORAGE_CLASSES]: 'STORAGE_CLASSES_',
  [PODS]: 'PODS_',
};
const TopConsumerSortByValue = {
  [BY_USED]: 'BY_USED',
  [BY_REQUESTED]: 'BY_REQUESTED',
};
const TopConsumerResourceValueMapping = {
  Projects: 'namespace',
  'Storage Classes': 'storageclass',
  Pods: 'pod',
};

const getTopConsumersQueriesMap = (
  pluginItem: DashboardStorageExtension,
  topConsumers: TopConsumersQueries,
  category: string,
): TopConsumersQueries => {
  const { name } = pluginItem.properties;
  const queryName = `${name}_${category}`;
  if (!topConsumers[queryName]) {
    TopConsumerResourceValue[name] = _.replace(queryName, category, '');
    TopConsumerResourceValueMapping[name] = pluginItem.properties.metricType;
    topConsumers[queryName] = pluginItem.properties.query;
  }
  return topConsumers;
};

const getItems = (plugin: DashboardStorageExtension[], flags: FlagsObject) =>
  plugin.filter((e) => isDashboardExtensionInUse(e, flags));

const getTopConsumersQueries = (flags: FlagsObject) => {
  let topConsumers: TopConsumersQueries = { ...TOP_CONSUMER_QUERIES };
  getItems(plugins.registry.getDashboardsStorageTopConsumerUsed(), flags).forEach((pluginItem) => {
    topConsumers = getTopConsumersQueriesMap(
      pluginItem,
      topConsumers,
      TopConsumerSortByValue[BY_USED],
    );
  });
  getItems(plugins.registry.getDashboardsStorageTopConsumerRequested(), flags).forEach(
    (pluginItem) => {
      topConsumers = getTopConsumersQueriesMap(
        pluginItem,
        topConsumers,
        TopConsumerSortByValue[BY_REQUESTED],
      );
    },
  );
  return topConsumers;
};

const TopConsumerCard: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  flags = {},
}) => {
  const metricTypes = _.keys(TopConsumerResourceValue);
  const sortByTypes = _.keys(TopConsumerSortByValue);
  const metricTypesOptions = _.zipObject(metricTypes, metricTypes);
  const sortByOptions = _.zipObject(sortByTypes, sortByTypes);

  const [metricType, setMetricType] = React.useState(metricTypes[0]);
  const [sortBy, setSortBy] = React.useState(sortByTypes[0]);
  React.useEffect(() => {
    const topConsumers = getTopConsumersQueries(flags);
    const query =
      topConsumers[TopConsumerResourceValue[metricType] + TopConsumerSortByValue[sortBy]];
    watchPrometheus(query);
    return () => stopWatchPrometheusQuery(query);
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPrometheus, stopWatchPrometheusQuery, metricType, sortBy, JSON.stringify(flags)]);

  const topConsumers = getTopConsumersQueries(flags);
  const topConsumerStats = prometheusResults.getIn([
    topConsumers[TopConsumerResourceValue[metricType] + TopConsumerSortByValue[sortBy]],
    'data',
  ]) as PrometheusResponse;
  const topConsumerStatsError = prometheusResults.getIn([
    topConsumers[TopConsumerResourceValue[metricType] + TopConsumerSortByValue[sortBy]],
    'loadError',
  ]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Top Consumers</DashboardCardTitle>
        <div>
          <Dropdown
            className="btn-group ceph-top-consumer-card__dropdown--right"
            id="metric-type"
            items={metricTypesOptions}
            onChange={setMetricType}
            selectedKey={metricType}
            title={metricType}
          />
          <Dropdown
            className="btn-group ceph-top-consumer-card__dropdown--left"
            id="sort-by"
            items={sortByOptions}
            onChange={setSortBy}
            selectedKey={sortBy}
            title={sortBy}
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--top-margin">
        <TopConsumersBody
          topConsumerStats={topConsumerStats}
          error={topConsumerStatsError}
          metricType={TopConsumerResourceValueMapping[metricType]}
          sortByOption={sortBy}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default connectToFlags(
  ...getFlagsForExtensions(plugins.registry.getDashboardsStorageTopConsumerUsed()),
)(withDashboardResources(TopConsumerCard));

type TopConsumersQueries = {
  [queryType: string]: string;
};
