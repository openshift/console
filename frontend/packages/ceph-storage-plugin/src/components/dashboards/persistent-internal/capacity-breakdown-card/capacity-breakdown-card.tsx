import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectProps, Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import { humanizeBinaryBytes, FieldLevelHelp } from '@console/internal/components/utils';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';

import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { breakdownQueryMap } from '../../../../queries';
import { PODS, PROJECTS, STORAGE_CLASSES } from '../../../../constants';
import { BreakdownCardBody } from '../../common/capacity-breakdown/breakdown-body';
import { getStackChartStats, sortInstantVectorStats } from '../../common/capacity-breakdown/utils';
import { getSelectOptions } from '../../common/capacity-breakdown/breakdown-dropdown';
import './capacity-breakdown-card.scss';

const BreakdownCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const { t } = useTranslation();
  const [metricType, setMetricType] = React.useState(PROJECTS);
  const [isOpenBreakdownSelect, setBreakdownSelect] = React.useState(false);

  const { queries, model, metric } = breakdownQueryMap[metricType];
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
  const metricTotal: string = results?.[1]?.data?.result?.[0]?.value?.[1];
  const cephUsed: string = results?.[2]?.data?.result?.[0]?.value?.[1];

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
    <Card>
      <CardHeader className="ceph-capacity-breakdown-card__header">
        <CardTitle>
          {t('ceph-storage-plugin~Used Capacity Breakdown')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~This card shows the used capacity for different Kubernetes resources. The figures shown represent the Usable storage, meaning that data replication is not taken into consideration.',
            )}
          </FieldLevelHelp>
        </CardTitle>
        <Select
          className="ceph-capacity-breakdown-card-header__dropdown"
          autoFocus={false}
          onSelect={handleMetricsChange}
          onToggle={() => setBreakdownSelect(!isOpenBreakdownSelect)}
          isOpen={isOpenBreakdownSelect}
          selections={[metricType]}
          placeholderText={t('ceph-storage-plugin~{{metricType}}', { metricType })}
          aria-label={t('ceph-storage-plugin~Break By Dropdown')}
          isCheckboxSelectionBadgeHidden
        >
          {breakdownSelectItems}
        </Select>
      </CardHeader>
      <CardBody className="ceph-capacity-breakdown-card__body">
        <BreakdownCardBody
          isLoading={queriesDataLoaded}
          hasLoadError={queriesLoadError}
          metricTotal={metricTotal}
          top5MetricsStats={top5MetricsStats}
          capacityUsed={cephUsed}
          metricModel={model}
          humanize={humanize}
        />
      </CardBody>
    </Card>
  );
};

export default withDashboardResources(BreakdownCard);
