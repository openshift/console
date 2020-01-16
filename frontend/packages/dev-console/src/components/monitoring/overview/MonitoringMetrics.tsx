import * as React from 'react';
import * as _ from 'lodash';
import { requirePrometheus } from '@console/internal/components/graphs';
import { workloadMetricQueries } from './queries';
import MonitoringDashboardGraph from '../dashboard/MonitoringDashboardGraph';

const WorkloadGraphs = requirePrometheus(({ resource }) => {
  const ns = resource?.metadata?.namespace;
  const workloadName = resource?.metadata?.name;
  const workloadType = resource?.kind?.toLowerCase();
  return (
    <>
      {_.map(workloadMetricQueries, (q) => (
        <MonitoringDashboardGraph
          key={q.title}
          title={q.title}
          namespace={ns}
          graphType={q.chartType}
          query={q.query({ ns, workloadName, workloadType })}
          humanize={q.humanize}
          byteDataType={q.byteDataType}
        />
      ))}
    </>
  );
});

export default WorkloadGraphs;
