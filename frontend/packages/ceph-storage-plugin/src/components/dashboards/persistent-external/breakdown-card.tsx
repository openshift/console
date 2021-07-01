import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectProps } from '@patternfly/react-core';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { breakdownIndependentQueryMap } from '../../../queries';
import { PROJECTS, STORAGE_CLASSES, PODS } from '../../../constants';
import { sortInstantVectorStats, getStackChartStats } from '../common/capacity-breakdown/utils';
import { BreakdownCardBody } from '../common/capacity-breakdown/breakdown-body';
import { getSelectOptions } from '../common/capacity-breakdown/breakdown-dropdown';
import '../persistent-internal/capacity-breakdown-card/capacity-breakdown-card.scss';

export const BreakdownCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const { t } = useTranslation();
  const [metricType, setMetricType] = React.useState(PROJECTS);
  const [isOpenBreakdownSelect, setBreakdownSelect] = React.useState(false);
  const { queries, model, metric } = breakdownIndependentQueryMap[metricType];
  const queryKeys = Object.keys(queries);

  React.useEffect(() => {
    queryKeys.forEach((q) => watchPrometheus(queries[q]));
    return () => queryKeys.forEach((key) => stopWatchPrometheusQuery(queries[key]));
  }, [watchPrometheus, stopWatchPrometheusQuery, metricType, queryKeys, queries]);

  const results = queryKeys.map((key) => prometheusResults.getIn([queries[key], 'data']));
  const queriesLoadError = queryKeys.some((q) =>
    prometheusResults.getIn([queries[q], 'loadError']),
  );

  const queriesDataLoaded = queryKeys.some((q) => !prometheusResults.getIn([queries[q], 'data']));

  const humanize = humanizeBinaryBytes;
  const top6MetricsData = getInstantVectorStats(results[0], metric);
  const top5SortedMetricsData = sortInstantVectorStats(top6MetricsData);
  const top5MetricsStats = getStackChartStats(top5SortedMetricsData, humanize);
  const metricTotal = results[1]?.data?.result[0]?.value[1];

  const handleMetricsChange: SelectProps['onSelect'] = (_e, breakdown) => {
    setMetricType(breakdown as string);
    setBreakdownSelect(!isOpenBreakdownSelect);
  };

  const dropdownOptions = [
    {
      name: t('ceph-storage-plugin~Projects'),
      id: PROJECTS,
    },
    {
      name: t('ceph-storage-plugin~Storage Classes'),
      id: STORAGE_CLASSES,
    },
    {
      name: t('ceph-storage-plugin~Pods'),
      id: PODS,
    },
  ];

  const breakdownSelectItems = getSelectOptions(dropdownOptions);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Capacity breakdown')}</DashboardCardTitle>
        <div className="ceph-capacity-breakdown-card__header">
          <Select
            className="ceph-capacity-breakdown-card-header__dropdown"
            autoFocus={false}
            onSelect={handleMetricsChange}
            onToggle={() => setBreakdownSelect(!isOpenBreakdownSelect)}
            isOpen={isOpenBreakdownSelect}
            selections={[t('ceph-storage-plugin~{{metricType}}', { metricType })]}
            placeholderText={t('ceph-storage-plugin~{{metricType}}', { metricType })}
            aria-label={t('ceph-storage-plugin~Break by dropdown')}
            isCheckboxSelectionBadgeHidden
          >
            {breakdownSelectItems}
          </Select>
        </div>
      </DashboardCardHeader>
      <DashboardCardBody className="ceph-capacity-breakdown-card__body">
        <BreakdownCardBody
          isLoading={queriesDataLoaded}
          hasLoadError={queriesLoadError}
          metricTotal={metricTotal}
          capacityUsed={metricTotal}
          top5MetricsStats={top5MetricsStats}
          metricModel={model}
          humanize={humanize}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(BreakdownCard);
