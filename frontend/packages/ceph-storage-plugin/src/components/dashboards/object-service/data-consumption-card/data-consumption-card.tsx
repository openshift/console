import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import { getName } from '@console/dynamic-plugin-sdk/src/shared/selectors/common';
import { usePrometheusQueries } from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/utilization-card/prometheus-hook';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { useFlag } from '@console/dynamic-plugin-sdk/src/shared/hooks/flag';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { DataConsumptionDropdown } from './data-consumption-card-dropdown';
import DataConsumptionGraph from './data-consumption-graph';
import PerformanceGraph from './performance-graph';
import { DATA_CONSUMPTION_QUERIES } from '../../../../queries/object-storage-queries';
import {
  CEPH_STORAGE_NAMESPACE,
  OCS_OPERATOR,
  Breakdown,
  Metrics,
  ServiceType,
} from '../../../../constants';
import { RGW_FLAG } from '../../../../features';
import './data-consumption-card.scss';

const timeSpan = {
  [ServiceType.RGW]: 60 * 60 * 1000,
  [ServiceType.MCG]: null,
};

const csvResource = {
  isList: true,
  namespace: CEPH_STORAGE_NAMESPACE,
  kind: referenceForModel(ClusterServiceVersionModel),
};

const DataConsumptionCard: React.FC = () => {
  const { t } = useTranslation();
  const [breakdownBy, setBreakdownBy] = React.useState(Breakdown.PROVIDERS);
  const [metric, setMetric] = React.useState(Metrics.IOPS);
  const [serviceType, setServiceType] = React.useState(ServiceType.MCG);
  const RGW = useFlag(RGW_FLAG);
  const [csvList, csvLoaded, csvLoadError] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    csvResource,
  );
  const isOCS45 =
    csvLoaded &&
    !csvLoadError &&
    csvList?.find((obj) => _.startsWith(getName(obj), `${OCS_OPERATOR}.v4.5`));

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
        <DashboardCardTitle>
          {t('ceph-storage-plugin~Performance')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~Shows an overview of the data consumption per provider or account collected from the day of the entity creation.',
            )}
          </FieldLevelHelp>
        </DashboardCardTitle>
        <DataConsumptionDropdown
          selectedService={serviceType}
          setSelectedService={setServiceType}
          selectedBreakdown={breakdownBy}
          setSelectedBreakdown={setBreakdownBy}
          selectedMetric={metric}
          setSelectedMetric={setMetric}
          isRgwSupported={RGW && !isOCS45}
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
