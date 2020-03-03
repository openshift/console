import * as React from 'react';
import * as _ from 'lodash-es';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationItem, {
  TopConsumerPopoverProp,
  MultilineUtilizationItem,
  QueryWithDescription,
} from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
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
import {
  OverviewQuery,
  utilizationQueries,
  top25ConsumerQueries,
  multilineQueries,
} from './queries';
import { connectToFlags, FlagsObject } from '../../../../reducers/features';
import * as plugins from '../../../../plugins';
import { NodeModel, PodModel, ProjectModel } from '../../../../models';
import { getPrometheusQueryResponse } from '../../../../actions/dashboards';
import { Humanize } from '../../../utils/types';
import {
  useMetricDuration,
  UTILIZATION_QUERY_HOUR_MAP,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { DataPoint, PrometheusResponse } from '../../../graphs';

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
    metric: 'node',
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
    adjustDuration,
    title,
    TopConsumerPopover,
    humanizeValue,
    byteDataType,
    setTimestamps,
    namespace,
    isDisabled = false,
  }) => {
    let stats = [];
    let utilization: PrometheusResponse, utilizationError: any;
    let total: PrometheusResponse, totalError: any;
    let max: DataPoint<number>[];
    let isLoading = false;

    const effectiveDuration = React.useMemo(
      () =>
        adjustDuration
          ? adjustDuration(UTILIZATION_QUERY_HOUR_MAP[duration])
          : UTILIZATION_QUERY_HOUR_MAP[duration],
      [adjustDuration, duration],
    );
    React.useEffect(() => {
      if (!isDisabled) {
        watchPrometheus(utilizationQuery, namespace, effectiveDuration);
        totalQuery && watchPrometheus(totalQuery, namespace);
        return () => {
          stopWatchPrometheusQuery(utilizationQuery, effectiveDuration);
          totalQuery && stopWatchPrometheusQuery(totalQuery);
        };
      }
    }, [
      watchPrometheus,
      stopWatchPrometheusQuery,
      effectiveDuration,
      utilizationQuery,
      totalQuery,
      namespace,
      isDisabled,
    ]);

    if (!isDisabled) {
      [utilization, utilizationError] = getPrometheusQueryResponse(
        prometheusResults,
        utilizationQuery,
        effectiveDuration,
      );
      [total, totalError] = getPrometheusQueryResponse(prometheusResults, totalQuery);

      stats = getRangeVectorStats(utilization);
      max = getInstantVectorStats(total);

      setTimestamps && setTimestamps(stats.map((stat) => stat.x as Date));
      isLoading = !utilization || (totalQuery && !total);
    }

    return (
      <UtilizationItem
        title={title}
        data={stats}
        error={utilizationError || totalError}
        isLoading={isLoading}
        humanizeValue={humanizeValue}
        byteDataType={byteDataType}
        query={utilizationQuery}
        max={max && max.length ? max[0].y : null}
        TopConsumerPopover={TopConsumerPopover}
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
    adjustDuration,
    title,
    TopConsumerPopovers,
    humanizeValue,
    byteDataType,
    namespace,
    isDisabled = false,
  }) => {
    const effectiveDuration = React.useMemo(
      () =>
        adjustDuration
          ? adjustDuration(UTILIZATION_QUERY_HOUR_MAP[duration])
          : UTILIZATION_QUERY_HOUR_MAP[duration],
      [adjustDuration, duration],
    );
    React.useEffect(() => {
      if (!isDisabled) {
        queries.forEach((q) => watchPrometheus(q.query, namespace, effectiveDuration));
        return () => {
          queries.forEach((q) => stopWatchPrometheusQuery(q.query, effectiveDuration));
        };
      }
    }, [
      watchPrometheus,
      stopWatchPrometheusQuery,
      duration,
      queries,
      namespace,
      isDisabled,
      effectiveDuration,
    ]);

    const stats = [];
    let hasError = false;
    let isLoading = false;
    if (!isDisabled) {
      _.forEach(queries, (query) => {
        const [response, responseError] = getPrometheusQueryResponse(
          prometheusResults,
          query.query,
          effectiveDuration,
        );
        if (responseError) {
          hasError = true;
          return false;
        }
        if (!response) {
          isLoading = true;
          return false;
        }
        stats.push(
          getRangeVectorStats(response).map((dp) => {
            dp.x.setSeconds(0, 0);
            return {
              ...dp,
              description: query.desc,
            } as DataPoint<Date>;
          }),
        );
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
      />
    );
  },
);

export const UtilizationCard = connectToFlags(
  ...plugins.registry.getGatingFlagNames([isDashboardsOverviewUtilizationItem]),
)(({ flags }) => {
  const queries = React.useMemo(() => getQueries(flags), [flags]);
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration();

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

  const networkInPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="Network in"
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
        title="Network out"
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
        <DashboardCardTitle>Cluster Utilization</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
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
        <PrometheusMultilineUtilizationItem
          title="Network Transfer"
          queries={multilineQueries[OverviewQuery.NETWORK_UTILIZATION]}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
          TopConsumerPopovers={[networkInPopover, networkOutPopover]}
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

type PrometheusCommonProps = {
  duration: string;
  adjustDuration?: (start: number) => number;
  title: string;
  humanizeValue: Humanize;
  byteDataType?: ByteDataTypes;
  namespace?: string;
  isDisabled?: boolean;
};

type PrometheusUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    utilizationQuery: string;
    totalQuery?: string;
    TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProp>;
    setTimestamps?: (timestamps: Date[]) => void;
  };

type PrometheusMultilineUtilizationItemProps = DashboardItemProps &
  PrometheusCommonProps & {
    queries: QueryWithDescription[];
    TopConsumerPopovers?: React.ComponentType<TopConsumerPopoverProp>[];
  };
