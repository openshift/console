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
import { isDashboardsOverviewUtilizationItem } from '@console/plugin-sdk';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { humanizeBinaryBytes, humanizeCpuCores } from '../../../utils/units';
import { getRangeVectorStats, getInstantVectorStats } from '../../../graphs/utils';
import { Dropdown } from '../../../utils/dropdown';
import { OverviewQuery, utilizationQueries, top25ConsumerQueries } from './queries';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../../reducers/features';
import * as plugins from '../../../../plugins';
import { NodeModel, PodModel, ProjectModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const cpuQueriesPopup = [
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
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_CPU],
    model: ProjectModel,
    metric: 'namespace',
  },
];

const memQueriesPopup = [
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
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_MEMORY],
    model: ProjectModel,
    metric: 'namespace',
  },
];

const storageQueriesPopup = [
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
  {
    query: top25ConsumerQueries[OverviewQuery.PROJECTS_BY_STORAGE],
    model: ProjectModel,
    metric: 'namespace',
  },
];

const getQueries = (flags: FlagsObject) => {
  const pluginQueries = {};
  plugins.registry
    .getDashboardsOverviewUtilizationItems()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags))
    .forEach((pluginQuery) => {
      const id = pluginQuery.properties.id;
      if (!pluginQueries[id]) {
        pluginQueries[id] = {
          utilization: pluginQuery.properties.query,
          total: pluginQuery.properties.totalQuery,
        };
      }
    });
  return _.defaults(pluginQueries, utilizationQueries);
};

const UtilizationCard_: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  flags = {},
}) => {
  const [duration, setDuration] = React.useState(metricDurations[0]);
  React.useEffect(() => {
    const queries = getQueries(flags);
    Object.keys(queries).forEach((key) => {
      watchPrometheus(queries[key].utilization, null, UTILIZATION_QUERY_HOUR_MAP[duration]);
      if (queries[key].total) {
        watchPrometheus(queries[key].total);
      }
    });
    return () => {
      Object.keys(queries).forEach((key) => {
        stopWatchPrometheusQuery(queries[key].utilization, UTILIZATION_QUERY_HOUR_MAP[duration]);
        if (queries[key].total) {
          stopWatchPrometheusQuery(queries[key].total);
        }
      });
    };
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPrometheus, stopWatchPrometheusQuery, JSON.stringify(flags), duration]);

  const queries = getQueries(flags);
  const [cpuUtilization, cpuUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.CPU_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [cpuTotal, cpuTotalError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.CPU_UTILIZATION].total,
  );
  const [memoryUtilization, memoryUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.MEMORY_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [memoryTotal, memoryTotalError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.MEMORY_UTILIZATION].total,
  );
  const [storageUtilization, storageUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.STORAGE_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [storageTotal, storageTotalError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[OverviewQuery.STORAGE_UTILIZATION].total,
  );

  const cpuStats = getRangeVectorStats(cpuUtilization);
  const cpuMax = getInstantVectorStats(cpuTotal);
  const memoryStats = getRangeVectorStats(memoryUtilization);
  const memoryMax = getInstantVectorStats(memoryTotal);
  const storageStats = getRangeVectorStats(storageUtilization);
  const storageMax = getInstantVectorStats(storageTotal);

  const cpuPopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="CPU"
        current={current}
        consumers={cpuQueriesPopup}
        humanize={humanizeCpuCores}
      />
    ),
    [],
  );

  const memPopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="Memory"
        current={current}
        consumers={memQueriesPopup}
        humanize={humanizeBinaryBytes}
      />
    ),
    [],
  );

  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title="Disk Usage"
        current={current}
        consumers={storageQueriesPopup}
        humanize={humanizeBinaryBytes}
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
          error={cpuUtilizationError || cpuTotalError}
          isLoading={!cpuUtilization || !cpuTotal}
          humanizeValue={humanizeCpuCores}
          query={utilizationQueries[OverviewQuery.CPU_UTILIZATION].utilization}
          TopConsumerPopover={cpuPopover}
          max={cpuMax.length ? cpuMax[0].y : null}
        />
        <UtilizationItem
          title="Memory"
          data={memoryStats}
          error={memoryUtilizationError || memoryTotalError}
          isLoading={!memoryUtilization || !memoryTotal}
          humanizeValue={humanizeBinaryBytes}
          query={utilizationQueries[OverviewQuery.MEMORY_UTILIZATION].utilization}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          max={memoryMax.length ? memoryMax[0].y : null}
        />
        <UtilizationItem
          title="Disk Usage"
          data={storageStats}
          error={storageUtilizationError || storageTotalError}
          isLoading={!storageUtilization || !storageTotal}
          humanizeValue={humanizeBinaryBytes}
          query={utilizationQueries[OverviewQuery.STORAGE_UTILIZATION].utilization}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
          max={storageMax.length ? storageMax[0].y : null}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export const UtilizationCard = connectToFlags(
  ...plugins.registry.getRequiredFlags([isDashboardsOverviewUtilizationItem]),
)(withDashboardResources(UtilizationCard_));
