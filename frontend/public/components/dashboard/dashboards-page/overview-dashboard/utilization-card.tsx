import * as React from 'react';
import * as _ from 'lodash-es';

import * as plugins from '../../../../plugins';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { Dropdown } from '../../../utils/dropdown';
import { getRangeVectorStats } from '../../../graphs/utils';
import { humanizePercentage, humanizeBinaryBytesWithoutB } from '../../../utils';
import { OverviewQuery, utilizationQueries } from './queries';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../../reducers/features';
import { getFlagsForExtensions, isDashboardExtensionInUse } from '../../utils';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

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
        />
        <UtilizationItem
          title="Memory"
          data={memoryStats}
          error={memoryUtilizationError}
          isLoading={!memoryUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[OverviewQuery.MEMORY_UTILIZATION]}
        />
        <UtilizationItem
          title="Disk Usage"
          data={storageStats}
          error={storageUtilizationError}
          isLoading={!storageUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[OverviewQuery.STORAGE_UTILIZATION]}
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
