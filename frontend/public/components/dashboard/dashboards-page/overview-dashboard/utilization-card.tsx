import * as React from 'react';
import * as _ from 'lodash-es';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { metricTypeMap } from '@console/shared/src/components/dashboard/top-consumers-card/ConsumersFilter';
import { MetricType } from '@console/shared/src/components/dashboard/top-consumers-card/metric-type';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { getRangeVectorStats } from '../../../graphs/utils';
import { humanizePercentage, humanizeBinaryBytes } from '../../../utils';
import { Dropdown } from '../../../utils/dropdown';
import { OverviewQuery, utilizationQueries, top25ConsumerQueries } from './queries';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../../reducers/features';
import { getFlagsForExtensions, isDashboardExtensionInUse } from '../../utils';
import * as plugins from '../../../../plugins';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const cpuQueriesPopup = [
  top25ConsumerQueries[OverviewQuery.PODS_BY_CPU],
  top25ConsumerQueries[OverviewQuery.NODES_BY_CPU],
  top25ConsumerQueries[OverviewQuery.PROJECTS_BY_CPU],
];

const memQueriesPopup = [
  top25ConsumerQueries[OverviewQuery.PODS_BY_MEMORY],
  top25ConsumerQueries[OverviewQuery.NODES_BY_MEMORY],
  top25ConsumerQueries[OverviewQuery.PROJECTS_BY_MEMORY],
];

const storageQueriesPopup = [
  top25ConsumerQueries[OverviewQuery.PODS_BY_STORAGE],
  top25ConsumerQueries[OverviewQuery.NODES_BY_STORAGE],
  top25ConsumerQueries[OverviewQuery.PROJECTS_BY_STORAGE],
];

const getQueries = (flags: FlagsObject) => {
  const pluginQueries = {};
  plugins.registry
    .getDashboardsOverviewQueries()
    .filter((e) => isDashboardExtensionInUse(e, flags))
    .forEach((pluginQuery) => {
      const queryKey = pluginQuery.properties.queryKey;
      if (!pluginQueries[queryKey]) {
        pluginQueries[queryKey] = pluginQuery.properties.query;
      }
    });
  return _.defaults(pluginQueries, utilizationQueries);
};

const getItems = (flags: FlagsObject) =>
  plugins.registry
    .getDashboardsOverviewUtilizationItems()
    .filter((e) => isDashboardExtensionInUse(e, flags));

const UtilizationCard_: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  flags = {},
}) => {
  const [duration, setDuration] = React.useState(metricDurations[0]);
  React.useEffect(() => {
    const queries = getQueries(flags);
    Object.keys(queries).forEach((key) =>
      watchPrometheus(queries[key] + UTILIZATION_QUERY_HOUR_MAP[duration]),
    );

    const pluginItems = getItems(flags);
    pluginItems.forEach((item) =>
      watchPrometheus(item.properties.query + UTILIZATION_QUERY_HOUR_MAP[duration]),
    );

    return () => {
      Object.keys(queries).forEach((key) =>
        stopWatchPrometheusQuery(queries[key] + UTILIZATION_QUERY_HOUR_MAP[duration]),
      );
      pluginItems.forEach((item) =>
        stopWatchPrometheusQuery(item.properties.query + UTILIZATION_QUERY_HOUR_MAP[duration]),
      );
    };
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPrometheus, stopWatchPrometheusQuery, JSON.stringify(flags), duration]);

  const queries = getQueries(flags);
  const cpuUtilization = prometheusResults.getIn([
    queries[OverviewQuery.CPU_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]);
  const cpuUtilizationError = prometheusResults.getIn([
    queries[OverviewQuery.CPU_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const memoryUtilization = prometheusResults.getIn([
    queries[OverviewQuery.MEMORY_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]);
  const memoryUtilizationError = prometheusResults.getIn([
    queries[OverviewQuery.MEMORY_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);
  const storageUtilization = prometheusResults.getIn([
    queries[OverviewQuery.STORAGE_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'data',
  ]);
  const storageUtilizationError = prometheusResults.getIn([
    queries[OverviewQuery.STORAGE_UTILIZATION] + UTILIZATION_QUERY_HOUR_MAP[duration],
    'loadError',
  ]);

  const cpuStats = getRangeVectorStats(cpuUtilization);
  const memoryStats = getRangeVectorStats(memoryUtilization);
  const storageStats = getRangeVectorStats(storageUtilization);

  const pluginItems = getItems(flags);

  const cpuPopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="CPU"
        current={current}
        query={cpuQueriesPopup}
        humanize={metricTypeMap[MetricType.CPU].humanize}
      />
    ),
    [],
  );

  const memPopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="Memory"
        current={current}
        query={memQueriesPopup}
        humanize={metricTypeMap[MetricType.MEMORY].humanize}
      />
    ),
    [],
  );

  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="Disk Usage"
        current={current}
        query={storageQueriesPopup}
        humanize={metricTypeMap[MetricType.STORAGE].humanize}
      />
    ),
    [],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Utilization</DashboardCardTitle>
        <Dropdown
          items={metricDurationsOptions}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <UtilizationBody timestamps={cpuStats.map((stat) => stat.x as Date)}>
        <UtilizationItem
          title="CPU"
          data={cpuStats}
          error={cpuUtilizationError}
          isLoading={!cpuUtilization}
          humanizeValue={humanizePercentage}
          query={queries[OverviewQuery.CPU_UTILIZATION]}
          TopConsumerPopover={cpuPopover}
        />
        <UtilizationItem
          title="Memory"
          data={memoryStats}
          error={memoryUtilizationError}
          isLoading={!memoryUtilization}
          humanizeValue={humanizeBinaryBytes}
          query={queries[OverviewQuery.MEMORY_UTILIZATION]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
        />
        <UtilizationItem
          title="Disk Usage"
          data={storageStats}
          error={storageUtilizationError}
          isLoading={!storageUtilization}
          humanizeValue={humanizeBinaryBytes}
          query={queries[OverviewQuery.STORAGE_UTILIZATION]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
        />
        {pluginItems.map(({ properties }, index) => {
          const utilization = prometheusResults.getIn([properties.query, 'data']);
          const utilizationError = prometheusResults.getIn([properties.query, 'loadError']);
          const utilizationStats = getRangeVectorStats(utilization);
          return (
            <UtilizationItem
              key={index}
              title={properties.title}
              data={utilizationStats}
              error={utilizationError}
              isLoading={!utilization}
              humanizeValue={properties.humanizeValue}
              query={properties.query}
            />
          );
        })}
      </UtilizationBody>
    </DashboardCard>
  );
};

export const UtilizationCard = connectToFlags(
  ...getFlagsForExtensions([
    ...plugins.registry.getDashboardsOverviewQueries(),
    ...plugins.registry.getDashboardsOverviewUtilizationItems(),
  ]),
)(withDashboardResources(UtilizationCard_));
