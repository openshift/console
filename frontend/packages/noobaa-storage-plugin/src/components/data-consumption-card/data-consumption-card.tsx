import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { RGW_FLAG } from '@console/ceph-storage-plugin/src/features';
import { useFlag } from '@console/shared/src/hooks/flag';
import { Breakdown, Metrics, ServiceType } from '../../constants';
import { DataConsumptionDropdown } from './data-consumption-card-dropdown';
import { DATA_CONSUMPTION_QUERIES } from '../../queries';
import DataConsumptionGraph from './data-consumption-graph';
import PerformanceGraph from './performance-graph';
import './data-consumption-card.scss';

const timeSpan = {
  [ServiceType.RGW]: 60 * 60 * 1000,
  [ServiceType.MCG]: null,
};

const DataConsumptionCard: React.FC = () => {
  const [breakdownBy, setBreakdownBy] = React.useState(Breakdown.PROVIDERS);
  const [metric, setMetric] = React.useState(Metrics.IOPS);
  const [serviceType, setServiceType] = React.useState(ServiceType.MCG);
  const RGW = useFlag(RGW_FLAG);

  const queries: string[] = React.useMemo(() => {
    return serviceType === ServiceType.MCG
      ? Object.values(
          DATA_CONSUMPTION_QUERIES[ServiceType.MCG][breakdownBy][metric] ??
            DATA_CONSUMPTION_QUERIES[ServiceType.MCG][breakdownBy][Metrics.IOPS],
        )
      : Object.values(
          DATA_CONSUMPTION_QUERIES[ServiceType.RGW][metric] ??
            DATA_CONSUMPTION_QUERIES[ServiceType.MCG][Metrics.BANDWIDTH],
        );
  }, [breakdownBy, metric, serviceType]);

  const parser = React.useMemo(
    () =>
      // Todo (bipuladh): Fix data consumption utils to work with getInstantVectorStats
      serviceType === ServiceType.MCG ? null : getRangeVectorStats,
    [serviceType],
  );

  const [data, loading, loadError] = usePrometheusQueries<PrometheusResponse | DataPoint<Date>[]>(
    queries,
    parser,
    null,
    timeSpan[serviceType],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Performance</DashboardCardTitle>
        <DataConsumptionDropdown
          selectedService={serviceType}
          setSelectedService={setServiceType}
          selectedBreakdown={breakdownBy}
          setSelectedBreakdown={setBreakdownBy}
          selectedMetric={metric}
          setSelectedMetric={setMetric}
          isRgwSupported={RGW}
        />
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--top-margin">
        {serviceType === ServiceType.MCG ? (
          <DataConsumptionGraph
            prometheusResponse={data as PrometheusResponse[]}
            loading={loading}
            loadError={loadError}
            breakdownBy={breakdownBy}
            metric={metric}
          />
        ) : (
          <PerformanceGraph
            loading={loading}
            loadError={loadError}
            dataPoints={data as DataPoint[][][]}
            metricType={metric}
          />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default DataConsumptionCard;
