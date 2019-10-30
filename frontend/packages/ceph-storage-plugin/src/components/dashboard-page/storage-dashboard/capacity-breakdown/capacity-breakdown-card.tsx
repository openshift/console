import * as React from 'react';
import * as _ from 'lodash';
import { Dropdown, humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { breakdownQueryMap, CAPACITY_BREAKDOWN_QUERIES } from '../../../../constants/queries';
import { PROJECTS } from '../../../../constants/index';
import { BreakdownCardBody } from '../breakdown-card/breakdown-body';
import HeaderPrometheusViewLink from '../breakdown-card/breakdown-header';
import { getStackChartStats } from '../breakdown-card/utils';
import './capacity-breakdown-card.scss';

const keys = Object.keys(breakdownQueryMap);
const dropdownOptions = _.zipObject(keys, keys);

const BreakdownCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [metricType, setMetricType] = React.useState(PROJECTS);
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
  const queriesDataLoaded = results.some((q) => q);
  const queriesLoaded = queriesDataLoaded || queriesLoadError;
  const humanize = humanizeBinaryBytesWithoutB;
  const top5MetricsData = getInstantVectorStats(results[0], metric);
  const top5MetricsStats = getStackChartStats(top5MetricsData, humanize);
  const metricTotal = _.get(results[1], 'data.result[0].value[1]');
  const cephTotal = _.get(results[2], 'data.result[0].value[1]');
  const cephUsed = _.get(results[3], 'data.result[0].value[1]');
  const link = [`topk(20, (${CAPACITY_BREAKDOWN_QUERIES[queryKeys[0]]}))`];

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Capacity breakdown</DashboardCardTitle>
        <div className="ceph-capacity-breakdown-card__header">
          <HeaderPrometheusViewLink link={link} />
          <Dropdown
            items={dropdownOptions}
            onChange={setMetricType}
            selectedKey={metricType}
            title={metricType}
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardBody classname="ceph-capacity-breakdown-card__body">
        <BreakdownCardBody
          isLoading={!queriesLoaded}
          metricTotal={metricTotal}
          top5MetricsStats={top5MetricsStats}
          cephTotal={cephTotal}
          cephUsed={cephUsed}
          metricModel={model}
          humanize={humanize}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(BreakdownCard);
