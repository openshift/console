import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { ConsumersBody, ConsumersFilter, metricTypeMap } from '../../dashboard/top-consumers-card';
import {
  NODES,
  PODS,
} from '../../dashboard/top-consumers-card/strings';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { Dropdown, resourcePathFromModel } from '../../utils';
import { OverviewQuery, topConsumersQueries } from './queries';
import { getInstantVectorStats } from '../../graphs/utils';
import { BarChart } from '../../graphs/bar';
import { DataPoint } from '../../graphs';
import { MetricType } from '../../dashboard/top-consumers-card/metric-type';
import { PodModel, NodeModel } from '../../../models';
import { K8sKind, referenceForModel, K8sResourceKind } from '../../../module/k8s';
import { MonitoringRoutes, connectToURLs } from '../../../reducers/monitoring';
import { getPrometheusExpressionBrowserURL } from '../../graphs/prometheus-graph';
import { getName, getNamespace } from '@console/shared';

const topConsumersQueryMap: TopConsumersMap = {
  [PODS]: {
    model: PodModel,
    metric: 'pod_name',
    queries: {
      [MetricType.CPU]: topConsumersQueries[OverviewQuery.PODS_BY_CPU],
      [MetricType.MEMORY]: topConsumersQueries[OverviewQuery.PODS_BY_MEMORY],
      [MetricType.STORAGE]: topConsumersQueries[OverviewQuery.PODS_BY_STORAGE],
    },
  },
  [NODES]: {
    model: NodeModel,
    metric: 'node',
    queries: {
      [MetricType.CPU]: topConsumersQueries[OverviewQuery.NODES_BY_CPU],
      [MetricType.MEMORY]: topConsumersQueries[OverviewQuery.NODES_BY_MEMORY],
      [MetricType.STORAGE]: topConsumersQueries[OverviewQuery.NODES_BY_STORAGE],
      [MetricType.NETWORK]: topConsumersQueries[OverviewQuery.NODES_BY_NETWORK],
    },
  },
};

const getTopConsumersQueries = (): TopConsumersMap => {
  const topConsumers = {...topConsumersQueryMap};

  plugins.registry.getDashboardsOverviewTopConsumerItems().forEach(pluginItem => {
    if (!topConsumers[pluginItem.properties.name]) {
      topConsumers[pluginItem.properties.name] = {
        model: pluginItem.properties.model,
        metric: pluginItem.properties.metric,
        queries: pluginItem.properties.queries,
        mutator: pluginItem.properties.mutator,
      };
    }
  });
  return topConsumers;
};

const getResourceToWatch = (model: K8sKind) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  prop: 'consumers',
});

const BarLink: React.FC<BarLinkProps> = React.memo(({ model, title, namespace }) => (
  <Link to={resourcePathFromModel(model, title, namespace)}>{title}</Link>
));

const TopConsumersCard_ = connectToURLs(MonitoringRoutes.Prometheus)(({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
  urls,
}: TopConsumersCardProps) => {
  const [type, setType] = React.useState(PODS);
  const [sortOption, setSortOption] = React.useState(MetricType.CPU);

  React.useEffect(() => {
    const topConsumersMap = getTopConsumersQueries();
    const currentQuery = topConsumersMap[type].queries[sortOption];
    watchPrometheus(currentQuery);
    const k8sResource = getResourceToWatch(topConsumersMap[type].model);
    watchK8sResource(k8sResource);
    return () => {
      stopWatchPrometheusQuery(currentQuery);
      stopWatchK8sResource(k8sResource);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, watchK8sResource, stopWatchK8sResource, type, sortOption]);

  const topConsumersMap = getTopConsumersQueries();
  const topConsumersType = topConsumersMap[type];
  const metricTypeSort = metricTypeMap[sortOption];
  const currentQuery = topConsumersType.queries[sortOption];
  const topConsumersResult = prometheusResults.getIn([currentQuery, 'result']);

  const stats = getInstantVectorStats(topConsumersResult, topConsumersType.metric, metricTypeSort.humanize);
  const data = topConsumersType.mutator ? topConsumersType.mutator(stats) : stats;

  const top5Data = [];
  const consumersLoaded = _.get(resources, ['consumers', 'loaded']);
  const consumersLoadError = _.get(resources, ['consumers', 'loadError']);
  const consumersData = _.get(resources, ['consumers', 'data']) as K8sResourceKind[];
  if (consumersLoaded && !consumersLoadError) {
    for (const d of data) {
      const consumerExists = consumersData.some(consumer =>
        getName(consumer) === d.metric[topConsumersType.metric] &&
        (topConsumersType.model.namespaced ? getNamespace(consumer) === d.metric.namespace : true)
      );
      if (consumerExists) {
        top5Data.push(d);
      }
      if (top5Data.length === 5) {
        break;
      }
    }
  }

  const url = getPrometheusExpressionBrowserURL(urls, [`topk(20, ${currentQuery})`]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Top Consumers</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ConsumersFilter>
          <Dropdown
            buttonClassName="co-overview-consumers__dropdown"
            dropDownClassName="co-overview-consumers__dropdown"
            className="btn-group co-overview-consumers__dropdown co-overview-consumers__dropdown--right"
            items={_.mapValues(topConsumersMap, (v, key) => key)}
            onChange={(v: string) => {
              setType(v);
              if (!topConsumersMap[v].queries[sortOption]) {
                setSortOption(Object.keys(topConsumersMap[v].queries)[0] as MetricType);
              }
            }}
            selectedKey={type}
            title={type}
          />
          <Dropdown
            className="btn-group co-overview-consumers__dropdown co-overview-consumers__dropdown--left"
            buttonClassName="co-overview-consumers__dropdown"
            dropDownClassName="co-overview-consumers__dropdown"
            items={_.mapValues(topConsumersType.queries, (v, key) => key)}
            onChange={(v: MetricType) => setSortOption(v)}
            selectedKey={sortOption}
            title={sortOption}
          />
        </ConsumersFilter>
        <ConsumersBody>
          <BarChart
            data={top5Data}
            title={`${type} by ${metricTypeSort.description}`}
            loading={!consumersLoadError && !(topConsumersResult && consumersLoaded)}
            LabelComponent={({ title, metric }) => (
              <BarLink
                title={`${title}`}
                namespace={metric.namespace}
                model={topConsumersType.model}
              />
            )}
          />
          {url && <div className="co-overview-consumers__view-more">
            <a href={url} target="_blank" rel="noopener noreferrer">
              View more<ExternalLinkAltIcon className="co-overview-consumers__view-more-icon" />
            </a>
          </div>}
        </ConsumersBody>
      </DashboardCardBody>
    </DashboardCard>
  );
});

export const TopConsumersCard = withDashboardResources(TopConsumersCard_);

type TopConsumersCardProps = DashboardItemProps & {
  urls?: string[];
};

type BarLinkProps = {
  title: string;
  namespace?: string;
  model: K8sKind;
}

export type ConsumerMutator = (data: DataPoint[]) => DataPoint[];

type TopConsumersMap = {
  [key: string]: {
    model: K8sKind,
    metric: string,
    queries: { [key in MetricType]?: string },
    mutator?: ConsumerMutator,
  },
};
