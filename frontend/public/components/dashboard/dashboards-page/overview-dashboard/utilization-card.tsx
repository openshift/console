import * as React from 'react';
import * as _ from 'lodash-es';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem, {
  TopConsumerPopoverProp,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
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
import { PopoverPosition } from '@patternfly/react-core';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeNumber,
  humanizeDecimalBytesPerSec,
} from '../../../utils/units';
import { getRangeVectorStats, getInstantVectorStats } from '../../../graphs/utils';
import { Dropdown } from '../../../utils/dropdown';
import { OverviewQuery, utilizationQueries, top25ConsumerQueries } from './queries';
import { connectToFlags, FlagsObject } from '../../../../reducers/features';
import * as plugins from '../../../../plugins';
import { NodeModel, PodModel, ProjectModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { Humanize } from '../../../utils/types';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

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
    setTimestamps,
  }) => {
    React.useEffect(() => {
      watchPrometheus(utilizationQuery, null, UTILIZATION_QUERY_HOUR_MAP[duration]);
      totalQuery && watchPrometheus(totalQuery);
      return () => {
        stopWatchPrometheusQuery(utilizationQuery, UTILIZATION_QUERY_HOUR_MAP[duration]);
        totalQuery && stopWatchPrometheusQuery(totalQuery);
      };
    }, [watchPrometheus, stopWatchPrometheusQuery, duration, utilizationQuery, totalQuery]);
    const [utilization, utilizationError] = getPrometheusQueryResponse(
      prometheusResults,
      utilizationQuery,
      UTILIZATION_QUERY_HOUR_MAP[duration],
    );
    const [total, totalError] = getPrometheusQueryResponse(prometheusResults, totalQuery);

    const stats = getRangeVectorStats(utilization);
    const max = getInstantVectorStats(total);

    setTimestamps && setTimestamps(stats.map((stat) => stat.x as Date));

    return (
      <UtilizationItem
        title={title}
        data={stats}
        error={utilizationError || totalError}
        isLoading={!utilization || !total}
        humanizeValue={humanizeValue}
        byteDataType={byteDataType}
        query={utilizationQuery}
        max={max.length ? max[0].y : null}
        TopConsumerPopover={TopConsumerPopover}
      />
    );
  },
);

export const UtilizationCard = connectToFlags(
  ...plugins.registry.getRequiredFlags([isDashboardsOverviewUtilizationItem]),
)(({ flags }) => {
  const queries = React.useMemo(() => getQueries(flags), [flags]);
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = React.useState(metricDurations[0]);

  const cpuPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="CPU"
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
        title="Memory"
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
        title="Filesystem"
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
        title="Pod count"
        current={current}
        consumers={podQueriesPopup}
        humanize={humanizeNumber}
        position={PopoverPosition.top}
      />
    )),
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
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title="CPU"
          utilizationQuery={queries[OverviewQuery.CPU_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.CPU_UTILIZATION].total}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          humanizeValue={humanizeCpuCores}
          setTimestamps={setTimestamps}
        />
        <PrometheusUtilizationItem
          title="Memory"
          utilizationQuery={queries[OverviewQuery.MEMORY_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.MEMORY_UTILIZATION].total}
          TopConsumerPopover={memPopover}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          utilizationQuery={queries[OverviewQuery.STORAGE_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.STORAGE_UTILIZATION].total}
          TopConsumerPopover={storagePopover}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
        />
        <PrometheusUtilizationItem
          title="Network Transfer"
          utilizationQuery={queries[OverviewQuery.NETWORK_UTILIZATION].utilization}
          totalQuery={queries[OverviewQuery.NETWORK_UTILIZATION].total}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
        <PrometheusUtilizationItem
          title="Pod count"
          utilizationQuery={queries[OverviewQuery.POD_UTILIZATION].utilization}
          TopConsumerPopover={podPopover}
          duration={duration}
          humanizeValue={humanizeNumber}
        />
      </UtilizationBody>
    </DashboardCard>
  );
});

type PrometheusUtilizationItemProps = DashboardItemProps & {
  utilizationQuery: string;
  totalQuery?: string;
  duration: string;
  title: string;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
  humanizeValue: Humanize;
  byteDataType?: ByteDataTypes;
  setTimestamps?: (timestamps: Date[]) => void;
};
