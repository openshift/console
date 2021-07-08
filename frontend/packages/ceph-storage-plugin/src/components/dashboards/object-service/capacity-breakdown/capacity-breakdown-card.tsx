import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { Select, SelectGroup, SelectOption, SelectProps } from '@patternfly/react-core';
import {
  FieldLevelHelp,
  FirehoseResource,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { SubscriptionModel, SubscriptionKind } from '@console/operator-lifecycle-manager/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import { OCS_OPERATOR } from '@console/ceph-storage-plugin/src/constants';
import { PrometheusResponse, DataPoint } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { useFlag } from '@console/shared/src/hooks/flag';
import { getStackChartStats } from '../../common/capacity-breakdown/utils';
import { Colors } from '../../common/capacity-breakdown/consts';
import { BreakdownCardBody } from '../../common/capacity-breakdown/breakdown-body';
import { RGW_FLAG } from '../../../../features';
import { getGroupedSelectOptions } from '../../common/capacity-breakdown/breakdown-dropdown';
import { ServiceType, CapacityBreakdown } from '../../../../constants';
import { secretResource } from '../../../../resources';
import { breakdownQueryMap } from '../../../../queries/object-storage-queries';
import { isFunctionThenApply, decodeRGWPrefix } from '../../../../utils';
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
    id: string;
    disabled: boolean;
  }[];
}[];

const getDisableableSelectOptions = (dropdownItems: DropdownItems) => {
  return dropdownItems.map(({ group, items }) => (
    <SelectGroup key={group} label={group} className="co-filter-dropdown-group">
      {items.map(({ name, id, disabled }) => (
        <SelectOption key={id} value={id} disabled={disabled}>
          {name}
        </SelectOption>
      ))}
    </SelectGroup>
  ));
};

const BreakdownCard: React.FC = () => {
  const { t } = useTranslation();
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
        group: t('ceph-storage-plugin~Break by'),
        items: [
          {
            id: CapacityBreakdown.Metrics.TOTAL,
            name: t('ceph-storage-plugin~Total'),
            disabled: false,
          },
          {
            id: CapacityBreakdown.Metrics.PROJECTS,
            name: t('ceph-storage-plugin~Projects'),
            disabled: serviceType !== ServiceType.MCG,
          },
          {
            id: CapacityBreakdown.Metrics.BC,
            name: t('ceph-storage-plugin~BucketClasses'),
            disabled: serviceType !== ServiceType.MCG,
          },
        ],
      },
    ],
    [serviceType, t],
  );

  const ServiceItems = [
    {
      group: t('ceph-storage-plugin~Service type'),
      items: [
        { name: t('ceph-storage-plugin~All'), id: ServiceType.ALL },
        { name: ServiceType.MCG, id: ServiceType.MCG },
        { name: ServiceType.RGW, id: ServiceType.RGW },
      ],
    },
  ];

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
    top5MetricsStats[ind].name = t('ceph-storage-plugin~Cluster-wide');
    top5MetricsStats[ind].link = t(
      'ceph-storage-plugin~Any NON Object bucket claims that were created via an S3 client or via the NooBaa UI system.',
    );
    top5MetricsStats[ind].color = Colors.OTHER;
  }

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          {t('ceph-storage-plugin~Capacity breakdown')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~This card shows used capacity for different resources. The available capacity is based on cloud services therefore it cannot be shown.',
            )}
          </FieldLevelHelp>
        </DashboardCardTitle>
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
              placeholderText={t('ceph-storage-plugin~Type: {{serviceType}}', {
                serviceType,
              })}
              aria-label={t('ceph-storage-plugin~Service Type Dropdown')}
              toggleAriaLabel={t('ceph-storage-plugin~Service Type Dropdown Toggle')}
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
            placeholderText={t('ceph-storage-plugin~By: {{serviceType}}', {
              serviceType,
            })}
            aria-label={t('ceph-storage-plugin~Break By Dropdown')}
            isCheckboxSelectionBadgeHidden
          >
            {breakdownSelectItems}
          </Select>
        </div>
      </DashboardCardHeader>
      <DashboardCardBody className="nb-capacity-breakdown-card__body">
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
