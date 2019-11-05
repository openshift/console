import * as React from 'react';
import * as _ from 'lodash-es';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
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
import { Dropdown } from '../../utils/dropdown';
import {
  humanizeCpuCores,
  humanizeNumber,
  humanizeBinaryBytes,
  Humanize,
  humanizeSeconds,
  secondsToNanoSeconds,
} from '../../utils';
import { getRangeVectorStats } from '../../graphs/utils';
import { PrometheusResponse } from '../../graphs';
import { ProjectDashboardContext } from './project-dashboard-context';
import { getName } from '@console/shared';
import { getUtilizationQueries, ProjectQueries, getTopConsumerQueries } from './queries';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { PodModel } from '../../../models';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const humanizeFromSeconds: Humanize = (value) => humanizeSeconds(secondsToNanoSeconds(value));

export const UtilizationCard = withDashboardResources(
  ({ watchPrometheus, stopWatchPrometheusQuery, prometheusResults }: DashboardItemProps) => {
    const [duration, setDuration] = React.useState(metricDurations[0]);
    const { obj } = React.useContext(ProjectDashboardContext);
    const projectName = getName(obj);
    const queries = React.useMemo(
      () => getUtilizationQueries(projectName, UTILIZATION_QUERY_HOUR_MAP[duration]),
      [projectName, duration],
    );
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
    const podCount = prometheusResults.getIn([
      queries[ProjectQueries.POD_COUNT],
      'data',
    ]) as PrometheusResponse;
    const podCountError = prometheusResults.getIn([queries[ProjectQueries.POD_COUNT], 'loadError']);

    const cpuStats = getRangeVectorStats(cpuUtilization);
    const memoryStats = getRangeVectorStats(memoryUtilization);
    const podCountStats = getRangeVectorStats(podCount);

    const cpuPopover = React.useCallback(
      ({ current }) => (
        <ConsumerPopover
          title="CPU"
          current={current}
          consumers={[
            {
              query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_CPU],
              model: PodModel,
              metric: 'pod',
            },
          ]}
          humanize={humanizeFromSeconds}
          namespace={projectName}
        />
      ),
      [projectName],
    );

    const memPopover = React.useCallback(
      ({ current }) => (
        <ConsumerPopover
          title="Memory"
          current={current}
          consumers={[
            {
              query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_MEMORY],
              model: PodModel,
              metric: 'pod',
            },
          ]}
          humanize={humanizeBinaryBytes}
          namespace={projectName}
        />
      ),
      [projectName],
    );

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
            isLoading={!projectName || !cpuUtilization}
            humanizeValue={humanizeCpuCores}
            query={queries[ProjectQueries.CPU_USAGE]}
            error={cpuError}
            TopConsumerPopover={cpuPopover}
          />
          <UtilizationItem
            title="Memory"
            data={memoryStats}
            isLoading={!projectName || !memoryUtilization}
            humanizeValue={humanizeBinaryBytes}
            query={queries[ProjectQueries.MEMORY_USAGE]}
            error={memoryError}
            TopConsumerPopover={memPopover}
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
      </DashboardCard>
    );
  },
);
