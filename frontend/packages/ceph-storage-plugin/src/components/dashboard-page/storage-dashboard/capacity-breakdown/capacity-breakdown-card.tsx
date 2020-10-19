import * as React from 'react';
import * as _ from 'lodash';
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
import { breakdownQueryMap } from '../../../../constants/queries';
import { PROJECTS } from '../../../../constants/index';
import { BreakdownCardBody } from '../breakdown-card/breakdown-body';
import { getStackChartStats, sortInstantVectorStats } from '../breakdown-card/utils';
import { getSelectOptions } from '../breakdown-card/breakdown-dropdown';
import './capacity-breakdown-card.scss';

const keys = Object.keys(breakdownQueryMap);
const breakdownSelectItems = getSelectOptions(keys);

const BreakdownCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
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
  const metricTotal = _.get(results[1], 'data.result[0].value[1]');
  const cephAvailable = _.get(results[2], 'data.result[0].value[1]');
  const cephUsed = _.get(results[3], 'data.result[0].value[1]');

  const handleMetricsChange: SelectProps['onSelect'] = (_e, breakdown) => {
    setMetricType(breakdown as string);
    setBreakdownSelect(!isOpenBreakdownSelect);
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity breakdown</DashboardCardTitle>
        <div className="ceph-capacity-breakdown-card__header">
          <Select
            className="ceph-capacity-breakdown-card-header__dropdown"
            autoFocus={false}
            onSelect={handleMetricsChange}
            onToggle={() => setBreakdownSelect(!isOpenBreakdownSelect)}
            isOpen={isOpenBreakdownSelect}
            selections={[metricType]}
            placeholderText={metricType}
            aria-label="Break By Dropdown"
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
          top5MetricsStats={top5MetricsStats}
          capacityAvailable={cephAvailable}
          capacityUsed={cephUsed}
          metricModel={model}
          humanize={humanize}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(BreakdownCard);
