import * as React from 'react';
import * as _ from 'lodash-es';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
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
import { Dropdown } from '../../utils/dropdown';
import {
  humanizeCpuCores,
  humanizeNumber,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '../../utils';
import { getRangeVectorStats } from '../../graphs/utils';
import { PrometheusResponse } from '../../graphs';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getName } from '@console/shared';
import { getUtilizationQueries, ProjectQueries, getLinkableQueries } from './queries';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

export const UtilizationCard = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const [duration, setDuration] = React.useState(metricDurations[0]);
    const { obj } = React.useContext(ProjectDashboardContext);
    const projectName = getName(obj);
    const queries = React.useMemo(
      () => getUtilizationQueries(projectName, UTILIZATION_QUERY_HOUR_MAP[duration]),
      [projectName, duration],
    );
    const linkableQueries = React.useMemo(() => getLinkableQueries(projectName), [projectName]);
    React.useEffect(() => {
      if (projectName) {
        _.values(queries).forEach((query) => watchPrometheus(query, projectName));
        return () => {
          _.values(queries).forEach((query) => stopWatchPrometheusQuery(query));
        };
      }
    }, [watchPrometheus, stopWatchPrometheusQuery, queries, projectName, duration]);

    const cpuUtilization = prometheusResults.getIn([
      queries[ProjectQueries.CPU_USAGE],
      'data',
    ]) as PrometheusResponse;
    const cpuError = prometheusResults.getIn([queries[ProjectQueries.CPU_USAGE], 'loadError']);
    const memoryUtilization = prometheusResults.getIn([
      queries[ProjectQueries.MEMORY_USAGE],
      'data',
    ]) as PrometheusResponse;
    const memoryError = prometheusResults.getIn([
      queries[ProjectQueries.MEMORY_USAGE],
      'loadError',
    ]);
    const networkInUtilization = prometheusResults.getIn([
      queries[ProjectQueries.NETWORK_IN],
      'data',
    ]) as PrometheusResponse;
    const networkInError = prometheusResults.getIn([
      queries[ProjectQueries.NETWORK_IN],
      'loadError',
    ]);
    const networkOutUtilization = prometheusResults.getIn([
      queries[ProjectQueries.NETWORK_OUT],
      'data',
    ]) as PrometheusResponse;
    const networkOutError = prometheusResults.getIn([
      queries[ProjectQueries.NETWORK_OUT],
      'loadError',
    ]);

    const filesystemUtilization = prometheusResults.getIn([
      queries[ProjectQueries.FILESYSTEM_USAGE],
      'data',
    ]) as PrometheusResponse;
    const filesystemError = prometheusResults.getIn([
      queries[ProjectQueries.FILESYSTEM_USAGE],
      'loadError',
    ]);
    const podCount = prometheusResults.getIn([
      queries[ProjectQueries.POD_COUNT],
      'data',
    ]) as PrometheusResponse;
    const podCountError = prometheusResults.getIn([queries[ProjectQueries.POD_COUNT], 'loadError']);

    const cpuStats = getRangeVectorStats(cpuUtilization);
    const memoryStats = getRangeVectorStats(memoryUtilization);
    const podCountStats = getRangeVectorStats(podCount);
    const filesystemStats = getRangeVectorStats(filesystemUtilization);
    const networkInStats = getRangeVectorStats(networkInUtilization);
    const networkOutStats = getRangeVectorStats(networkOutUtilization);
    const networkStats = [
      { data: networkInStats, type: 'In' },
      { data: networkOutStats, type: 'Out' },
    ];
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
              isLoading={!projectName || !cpuUtilization}
              humanizeValue={humanizeCpuCores}
              query={queries[ProjectQueries.CPU_USAGE]}
              error={cpuError}
            />
            <UtilizationItem
              title="Memory"
              data={memoryStats}
              isLoading={!projectName || !memoryUtilization}
              humanizeValue={humanizeBinaryBytes}
              query={queries[ProjectQueries.MEMORY_USAGE]}
              error={memoryError}
            />
            <UtilizationItem
              title="Filesystem"
              data={filesystemStats}
              isLoading={!projectName || !filesystemUtilization}
              humanizeValue={humanizeBinaryBytes}
              byteDataType={ByteDataTypes.BinaryBytesWithoutB}
              query={queries[ProjectQueries.FILESYSTEM_USAGE]}
              error={filesystemError}
            />
            <UtilizationItem
              title="Network"
              multiLineMap={networkStats}
              isLoading={!projectName || !networkInUtilization || !networkOutUtilization}
              humanizeValue={humanizeDecimalBytesPerSec}
              query={linkableQueries[ProjectQueries.NETWORK]}
              error={networkInError || networkOutError}
            />
            <UtilizationItem
              title="Pod count"
              data={podCountStats}
              isLoading={!projectName || !podCount}
              humanizeValue={humanizeNumber}
              query={queries[ProjectQueries.POD_COUNT]}
              error={podCountError}
            />
          </UtilizationBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);
