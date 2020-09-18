import * as React from 'react';
import * as _ from 'lodash';
import { Select, SelectGroup, SelectOption, SelectProps } from '@patternfly/react-core';
import { FirehoseResource, humanizeBinaryBytes } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { SubscriptionModel, SubscriptionKind } from '@console/operator-lifecycle-manager/src';
import { BreakdownCardBody } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/breakdown-body';
import {
  CLUSTERWIDE,
  CLUSTERWIDE_TOOLTIP,
  Colors,
} from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/consts';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import { OCS_OPERATOR } from '@console/ceph-storage-plugin/src/constants';
import { getStackChartStats } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/utils';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { RGW_FLAG } from '@console/ceph-storage-plugin/src/features';
import { getGroupedSelectOptions } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/breakdown-dropdown';
import { ServiceType, CapacityBreakdown, Groups, secretResource } from '../../constants';
import { breakdownQueryMap } from '../../queries';
import { isFunctionThenApply, decodeRGWPrefix } from '../../utils';
import './capacity-breakdown-card.scss';

const subscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subscription',
  isList: true,
};

type DropdownItems = {
  group: string;
  items: {
    name: string;
    disabled: boolean;
  }[];
}[];

const ServiceItems = [
  {
    group: Groups.SERVICE,
    items: [ServiceType.ALL, ServiceType.MCG, ServiceType.RGW],
  },
];

const getDisableableSelectOptions = (dropdownItems: DropdownItems) => {
  return dropdownItems.map(({ group, items }) => (
    <SelectGroup key={group} label={group} className="co-filter-dropdown-group">
      {items.map(({ name, disabled }) => (
        <SelectOption key={name} value={name} disabled={disabled} />
      ))}
    </SelectGroup>
  ));
};

const BreakdownCard: React.FC = () => {
  const [serviceType, setServiceType] = React.useState(ServiceType.MCG);
  const [metricType, setMetricType] = React.useState(
    CapacityBreakdown.defaultMetrics[ServiceType.MCG],
  );
  const [isOpenServiceSelect, setServiceSelect] = React.useState(false);
  const [isOpenBreakdownSelect, setBreakdownSelect] = React.useState(false);
  const isRGWSupported = useFlag(RGW_FLAG);
  const prevRGWVal = React.useRef(null);

  React.useEffect(() => {
    if (isRGWSupported !== prevRGWVal.current) {
      prevRGWVal.current = isRGWSupported;
      if (isRGWSupported) {
        setServiceType(ServiceType.ALL);
        setMetricType(CapacityBreakdown.defaultMetrics[ServiceType.ALL]);
      }
    }
  }, [isRGWSupported]);

  const [secretData, secretLoaded, secretLoadError] = useK8sWatchResource<K8sResourceKind>(
    secretResource,
  );
  const rgwPrefix = React.useMemo(
    () => (isRGWSupported && secretLoaded && !secretLoadError ? decodeRGWPrefix(secretData) : ''),
    [secretData, secretLoaded, secretLoadError, isRGWSupported],
  );

  const { queries, model, metric } = React.useMemo(() => {
    const { queries: q, model: mo, metric: me } =
      breakdownQueryMap[serviceType][metricType] ??
      breakdownQueryMap[serviceType][CapacityBreakdown.defaultMetrics[serviceType]];
    return { queries: isFunctionThenApply(q)(rgwPrefix), model: mo, metric: me };
  }, [serviceType, metricType, rgwPrefix]);
  const prometheusQueries = React.useMemo(() => Object.values(queries) as string[], [queries]);
  const parser = React.useMemo(
    () => (args: PrometheusResponse) => getInstantVectorStats(args, metric),
    [metric],
  );

  const [subscription, loaded, loadError] = useK8sWatchResource<SubscriptionKind>(
    subscriptionResource,
  );
  const [response, loading, queriesLoadError] = usePrometheusQueries<DataPoint[]>(
    prometheusQueries,
    parser,
  );

  const breakdownItems = React.useMemo(
    () => [
      {
        group: Groups.BREAKDOWN,
        items: [
          { name: CapacityBreakdown.Metrics.TOTAL, disabled: false },
          { name: CapacityBreakdown.Metrics.PROJECTS, disabled: serviceType !== ServiceType.MCG },
          { name: CapacityBreakdown.Metrics.BC, disabled: serviceType !== ServiceType.MCG },
        ],
      },
    ],
    [serviceType],
  );

  const serviceSelectItems = getGroupedSelectOptions(ServiceItems);
  const breakdownSelectItems = getDisableableSelectOptions(breakdownItems);

  const handleServiceChange = (_e: React.MouseEvent, service: ServiceType) => {
    setServiceType(service);
    setMetricType(CapacityBreakdown.defaultMetrics[service]);
    setServiceSelect(!isOpenServiceSelect);
  };

  const handleMetricsChange: SelectProps['onSelect'] = (_e, breakdown) => {
    setMetricType(breakdown as CapacityBreakdown.Metrics);
    setBreakdownSelect(!isOpenBreakdownSelect);
  };

  const padding =
    serviceType !== ServiceType.MCG ? { top: 0, bottom: 0, left: 0, right: 50 } : undefined;

  const ocsVersion =
    loaded && !loadError
      ? (() => {
          const operator = _.find(
            subscription,
            (item) => _.get(item, 'spec.name') === OCS_OPERATOR,
          );
          return _.get(operator, 'status.installedCSV');
        })()
      : '';

  // For charts whose datapoints are composed of multiple queries
  const flattenedResponse = response.reduce(
    (acc, curr, ind) => (ind < response?.length - 1 ? [...acc, ...curr] : acc),
    [],
  );
  const top5MetricsStats = getStackChartStats(
    flattenedResponse,
    humanizeBinaryBytes,
    CapacityBreakdown.serviceMetricMap?.[serviceType]?.[metricType],
  );
  const totalUsed = String(response?.[response?.length - 1]?.[0]?.y);

  const ind = top5MetricsStats.findIndex((v) => v.name === 'Others');
  if (ind !== -1) {
    top5MetricsStats[ind].name = CLUSTERWIDE;
    top5MetricsStats[ind].link = CLUSTERWIDE_TOOLTIP;
    top5MetricsStats[ind].color = Colors.OTHER;
  }

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity breakdown</DashboardCardTitle>
        <div className="nb-capacity-breakdown-card__header">
          {isRGWSupported && (
            <Select
              className="nb-capacity-breakdown-card-header__dropdown nb-capacity-breakdown-card-header__dropdown--margin"
              autoFocus={false}
              onSelect={handleServiceChange}
              onToggle={() => setServiceSelect(!isOpenServiceSelect)}
              isOpen={isOpenServiceSelect}
              selections={[serviceType]}
              isGrouped
              placeholderText={`Type: ${serviceType}`}
              aria-label="Service Type Dropdown"
              toggleAriaLabel="Service Type Dropdown Toggle"
              isCheckboxSelectionBadgeHidden
            >
              {serviceSelectItems}
            </Select>
          )}
          <Select
            className="nb-capacity-breakdown-card-header__dropdown"
            autoFocus={false}
            onSelect={handleMetricsChange}
            onToggle={() => setBreakdownSelect(!isOpenBreakdownSelect)}
            isOpen={isOpenBreakdownSelect}
            selections={[metricType]}
            isGrouped
            placeholderText={`By: ${serviceType}`}
            aria-label="Break By Dropdown"
            isCheckboxSelectionBadgeHidden
          >
            {breakdownSelectItems}
          </Select>
        </div>
      </DashboardCardHeader>
      <DashboardCardBody classname="nb-capacity-breakdown-card__body">
        <BreakdownCardBody
          isLoading={loading}
          hasLoadError={queriesLoadError}
          top5MetricsStats={top5MetricsStats}
          capacityUsed={totalUsed}
          metricTotal={totalUsed}
          metricModel={model}
          humanize={humanizeBinaryBytes}
          ocsVersion={ocsVersion}
          labelPadding={padding}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default BreakdownCard;
