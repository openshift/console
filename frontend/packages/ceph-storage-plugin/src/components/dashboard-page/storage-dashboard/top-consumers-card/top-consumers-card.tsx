import * as React from 'react';
import * as _ from 'lodash';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { BY_REQUESTED, BY_USED, PODS, PROJECTS, STORAGE_CLASSES, VMS } from '../../../../constants';
import { TOP_CONSUMER_QUERIES, StorageDashboardQuery } from '../../../../constants/queries';
import { TopConsumersBody } from './top-consumers-card-body';
import './top-consumers-card.scss';

const TopConsumerResourceValue = {
  [PROJECTS]: 'PROJECTS_',
  [STORAGE_CLASSES]: 'STORAGE_CLASSES_',
  [PODS]: 'PODS_',
  [VMS]: 'VMS_',
};
const TopConsumerSortByValue = {
  [BY_USED]: 'BY_USED',
  [BY_REQUESTED]: 'BY_REQUESTED',
};

const TopConsumerResourceValueMapping = {
  Projects: 'namespace',
  'Storage Classes': 'storageclass',
  Pods: 'pod',
};

const metricTypes = _.keys(TopConsumerResourceValue);
const sortByTypes = _.keys(TopConsumerSortByValue);

const metricTypesOptions = _.zipObject(metricTypes, metricTypes);
const sortByOptions = _.zipObject(sortByTypes, sortByTypes);

const TopConsumerCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [metricType, setMetricType] = React.useState(metricTypes[0]);
  const [sortBy, setSortBy] = React.useState(sortByTypes[0]);
  React.useEffect(() => {
    const query =
      TOP_CONSUMER_QUERIES[
        StorageDashboardQuery[TopConsumerResourceValue[metricType] + TopConsumerSortByValue[sortBy]]
      ];
    watchPrometheus(query);
    return () => stopWatchPrometheusQuery(query);
  }, [watchPrometheus, stopWatchPrometheusQuery, metricType, sortBy]);

  const topConsumerstats = prometheusResults.getIn([
    TOP_CONSUMER_QUERIES[
      StorageDashboardQuery[TopConsumerResourceValue[metricType] + TopConsumerSortByValue[sortBy]]
    ],
    'result',
  ]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Top Consumers</DashboardCardTitle>
        <div className="ceph-top-consumer-card__dropdown">
          <Dropdown
            className="btn-group ceph-top-consumer-card__dropdown--right"
            id="metric-type"
            items={metricTypesOptions}
            onChange={setMetricType}
            selectedKey={metricType}
            title={metricType}
          />
          <Dropdown
            className="btn-group ceph-top-consumer-card__dropdown--left"
            id="sort-by"
            items={sortByOptions}
            onChange={setSortBy}
            selectedKey={sortBy}
            title={sortBy}
          />
        </div>
      </DashboardCardHeader>
      <DashboardCardBody>
        <TopConsumersBody
          topConsumerStats={topConsumerstats}
          metricType={TopConsumerResourceValueMapping[metricType]}
          sortByOption={sortBy}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(TopConsumerCard);
