import * as React from 'react';
import * as _ from 'lodash';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  Dropdown,
  humanizeDecimalBytes,
  humanizeCpuCores as humanizeCpuCoresUtil,
} from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { findVMPod } from '../../../selectors/pod/selectors';
import { getUtilizationQueries, VMQueries } from './queries';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

// TODO: extend humanizeCpuCores() from @console/internal for the flexibility of space
const humanizeCpuCores = (v) => {
  const humanized = humanizeCpuCoresUtil(v);
  // add space betwee value and unit
  const val = humanized.string.match(/[\d.]+/) || [humanized.string];
  humanized.string = `${val[0]} ${humanized.unit}`;
  return humanized;
};

export const VMUtilizationCard = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const [duration, setDuration] = React.useState(metricDurations[0]);
    const { vm, pods } = React.useContext(VMDashboardContext);
    const vmName = getName(vm);
    const namespace = getNamespace(vm);
    const launcherPodName = getName(findVMPod(vm, pods));
    const queries = React.useMemo(
      () =>
        getUtilizationQueries({
          vmName,
          namespace,
          launcherPodName,
        }),
      [vmName, namespace, launcherPodName],
    );
    React.useEffect(() => {
      _.values(queries).forEach((query) =>
        watchPrometheus(query, namespace, UTILIZATION_QUERY_HOUR_MAP[duration]),
      );
      return () => {
        _.values(queries).forEach((query) =>
          stopWatchPrometheusQuery(query, UTILIZATION_QUERY_HOUR_MAP[duration]),
        );
      };
    }, [watchPrometheus, stopWatchPrometheusQuery, queries, namespace, duration]);

    const [cpuUtilization, cpuError] = getPrometheusQueryResponse(
      prometheusResults,
      queries[VMQueries.CPU_USAGE],
      UTILIZATION_QUERY_HOUR_MAP[duration],
    );
    const [memoryUtilization, memoryError] = getPrometheusQueryResponse(
      prometheusResults,
      queries[VMQueries.MEMORY_USAGE],
      UTILIZATION_QUERY_HOUR_MAP[duration],
    );
    const [fsUtilization, fsError] = getPrometheusQueryResponse(
      prometheusResults,
      queries[VMQueries.FILESYSTEM_USAGE],
      UTILIZATION_QUERY_HOUR_MAP[duration],
    );
    const [netUtilizationInOut, netErrorInOut] = getPrometheusQueryResponse(
      prometheusResults,
      queries[VMQueries.NETWORK_INOUT_USAGE],
      UTILIZATION_QUERY_HOUR_MAP[duration],
    );

    const cpuStats = getRangeVectorStats(cpuUtilization);
    const memoryStats = getRangeVectorStats(memoryUtilization);
    const fsStats = getRangeVectorStats(fsUtilization);
    const netStats = getRangeVectorStats(netUtilizationInOut);

    /* TODO: use when multi-line charts are ready
    const netStats = [
      getRangeVectorStats(netUtilizationIn),
      getRangeVectorStats(netUtilizationOut),
    ];
    const netDataUnits = ['In', 'Out'];
    */

    return (
      <DashboardCard>
        <DashboardCardHeader>
          <DashboardCardTitle>Utilization</DashboardCardTitle>
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
            isLoading={!namespace || !cpuUtilization}
            humanizeValue={humanizeCpuCores}
            query={queries[VMQueries.CPU_USAGE]}
            error={cpuError}
          />
          <UtilizationItem
            title="Memory"
            data={memoryStats}
            isLoading={!namespace || !memoryUtilization}
            humanizeValue={humanizeDecimalBytes}
            query={queries[VMQueries.MEMORY_USAGE]}
            error={memoryError}
          />
          <UtilizationItem
            title="Filesystem"
            data={fsStats}
            isLoading={!namespace || !fsUtilization}
            humanizeValue={humanizeDecimalBytes}
            query={queries[VMQueries.FILESYSTEM_USAGE]}
            error={fsError}
          />
          <UtilizationItem
            title="Network Transfer"
            data={netStats}
            isLoading={!namespace || !netUtilizationInOut}
            humanizeValue={humanizeDecimalBytes}
            query={queries[VMQueries.NETWORK_INOUT_USAGE]}
            error={netErrorInOut}
          />
        </UtilizationBody>
      </DashboardCard>
    );
  },
);
VMUtilizationCard.displayName = 'VMUtilizationCard';
