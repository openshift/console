import * as React from 'react';
import * as _ from 'lodash';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  Dropdown,
  humanizeDecimalBytes,
  humanizeSeconds,
} from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
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
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { getUtilizationQueries, VMQueries } from './queries';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const readPrometheusResult = (prometheusResults, query) => {
  const data = prometheusResults.getIn([query, 'data']) as PrometheusResponse;
  const error = prometheusResults.getIn([query, 'loadError']);
  return [data, error];
};

export const VMUtilizationCard = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const [duration, setDuration] = React.useState(metricDurations[0]);
    const { vm } = React.useContext(VMDashboardContext);
    const vmName = getName(vm);
    const namespace = getNamespace(vm);
    const queries = React.useMemo(
      () =>
        getUtilizationQueries({
          vmName,
          namespace,
          duration: UTILIZATION_QUERY_HOUR_MAP[duration],
        }),
      [vmName, namespace, duration],
    );
    React.useEffect(() => {
      _.values(queries).forEach((query) => watchPrometheus(query, namespace));
      return () => {
        _.values(queries).forEach((query) => stopWatchPrometheusQuery(query));
      };
    }, [watchPrometheus, stopWatchPrometheusQuery, queries, namespace, duration]);

    const [cpuUtilization, cpuError] = readPrometheusResult(
      prometheusResults,
      queries[VMQueries.CPU_USAGE],
    );
    const [memoryUtilization, memoryError] = readPrometheusResult(
      prometheusResults,
      queries[VMQueries.MEMORY_USAGE],
    );
    const [fsUtilization, fsError] = readPrometheusResult(
      prometheusResults,
      queries[VMQueries.FILESYSTEM_USAGE],
    );
    const [netUtilizationIn, netErrorIn] = readPrometheusResult(
      prometheusResults,
      queries[VMQueries.NETWORK_IN_USAGE],
    );
    const [netUtilizationOut, netErrorOut] = readPrometheusResult(
      prometheusResults,
      queries[VMQueries.NETWORK_OUT_USAGE],
    );

    const cpuStats = getRangeVectorStats(cpuUtilization);
    const memoryStats = getRangeVectorStats(memoryUtilization);
    const fsStats = getRangeVectorStats(fsUtilization);
    const netStats = [
      getRangeVectorStats(netUtilizationIn),
      getRangeVectorStats(netUtilizationOut),
    ];
    const netDataUnits = ['In', 'Out'];

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
        <DashboardCardBody>
          <UtilizationBody timestamps={cpuStats.map((stat) => stat.x as Date)}>
            <UtilizationItem
              title="CPU"
              data={cpuStats}
              isLoading={!namespace || !cpuUtilization}
              humanizeValue={humanizeSeconds}
              query={queries[VMQueries.CPU_USAGE]}
              error={cpuError}
            />
          </UtilizationBody>
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
            dataUnits={netDataUnits}
            isLoading={!namespace || !netUtilizationIn || !netUtilizationOut}
            humanizeValue={humanizeDecimalBytes}
            query={queries[VMQueries.FILESYSTEM_USAGE]}
            error={netErrorIn || netErrorOut}
          />
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);
VMUtilizationCard.displayName = 'VMUtilizationCard';
