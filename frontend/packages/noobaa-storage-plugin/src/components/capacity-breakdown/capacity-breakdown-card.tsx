import * as React from 'react';
import * as _ from 'lodash';
import {
  Dropdown,
  FirehoseResource,
  FirehoseResult,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { SubscriptionModel } from '@console/operator-lifecycle-manager/src';
import { HeaderPrometheusViewLink } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/breakdown-header';
import { BreakdownCardBody } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/breakdown-body';
import { getStackChartStats } from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/utils';
import { getOCSVersion } from '@console/ceph-storage-plugin/src/selectors';
import {
  CLUSTERWIDE,
  CLUSTERWIDE_TOOLTIP,
  Colors,
} from '@console/ceph-storage-plugin/src/components/dashboard-page/storage-dashboard/breakdown-card/consts';
import { PROJECTS } from '../../constants';
import { breakdownQueryMap, CAPACITY_BREAKDOWN_QUERIES } from '../../queries';
import './capacity-breakdown-card.scss';
import { NooBaaBucketClassModel } from '../../models';

const SubscriptionResource: FirehoseResource = {
  kind: referenceForModel(SubscriptionModel),
  namespaced: false,
  prop: 'subscription',
  isList: true,
};

const keys = Object.keys(breakdownQueryMap);
const dropdownOptions = _.zipObject(keys, keys);

const BreakdownCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  resources,
}) => {
  const [metricType, setMetricType] = React.useState(PROJECTS);
  const { queries, model, metric } = breakdownQueryMap[metricType];
  React.useEffect(() => {
    if (model.kind === NooBaaBucketClassModel.kind) {
      watchK8sResource(SubscriptionResource);
      return () => {
        stopWatchK8sResource(SubscriptionResource);
      };
    }
    return () => {};
  }, [watchK8sResource, stopWatchK8sResource, model]);

  const queryKeys = Object.keys(queries);

  React.useEffect(() => {
    queryKeys.forEach((q) => watchPrometheus(queries[q]));
    return () => {
      queryKeys.forEach((q) => stopWatchPrometheusQuery(queries[q]));
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, metricType, queryKeys, queries]);

  const subscription = _.get(resources, 'subscription') as FirehoseResult;
  const ocsVersion = getOCSVersion(subscription);

  const results = queryKeys.map((key) => prometheusResults.getIn([queries[key], 'data']));
  const queriesLoadError = queryKeys.some((q) =>
    prometheusResults.getIn([queries[q], 'loadError']),
  );

  const queriesDataLoaded = queryKeys.some((q) => !prometheusResults.getIn([queries[q], 'data']));

  const humanize = humanizeBinaryBytes;
  const top5MetricsData = getInstantVectorStats(results[0], metric);
  const top5MetricsStats = getStackChartStats(top5MetricsData, humanize);
  const objectUsed = _.get(results[1], 'data.result[0].value[1]');
  const link = `topk(20, (${CAPACITY_BREAKDOWN_QUERIES[queryKeys[0]]}))`;

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
          <HeaderPrometheusViewLink link={link} />
          <Dropdown
            items={dropdownOptions}
            onChange={setMetricType}
            selectedKey={metricType}
            title={metricType}
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardBody classname="nb-capacity-breakdown-card__body">
        <BreakdownCardBody
          isLoading={queriesDataLoaded}
          hasLoadError={queriesLoadError}
          top5MetricsStats={top5MetricsStats}
          capacityUsed={objectUsed}
          metricTotal={objectUsed}
          metricModel={model}
          humanize={humanize}
          ocsVersion={ocsVersion}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(BreakdownCard);
