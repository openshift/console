import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import ConnectedMonitoringDashboardGraph from '../dashboard/MonitoringDashboardGraph';
import { topWorkloadMetricsQueries } from '../queries';

const WorkloadGraphs = ({ resource }) => {
  const { t } = useTranslation();
  const prometheusIsAvailable = usePrometheusGate();
  if (!prometheusIsAvailable) {
    return null;
  }

  const namespace = resource?.metadata?.namespace;
  const workloadName = resource?.metadata?.name;
  const workloadType = resource?.kind?.toLowerCase();

  return (
    <>
      {_.map(topWorkloadMetricsQueries(t), (q) => (
        <ConnectedMonitoringDashboardGraph
          key={q.title}
          title={q.title}
          namespace={namespace}
          graphType={q.chartType}
          query={q.query({ namespace, workloadName, workloadType })}
          humanize={q.humanize}
          byteDataType={q.byteDataType}
        />
      ))}
    </>
  );
};

export default WorkloadGraphs;
