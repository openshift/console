import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DataPoint, PrometheusResponse } from '@console/internal/components/graphs';
import { ExternalLink, Humanize, resourcePathFromModel } from '@console/internal/components/utils';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { PodModel, NodeModel, ProjectModel } from '@console/internal/models';
import { K8sKind, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { connectToURLs, MonitoringRoutes } from '@console/internal/reducers/monitoring';
import { getPrometheusExpressionBrowserURL } from '@console/internal/components/graphs/prometheus-graph';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import './top-consumer-popover.scss';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { getName, getNamespace } from '../../..';

const dropdownKeysDefault = ['By Pods', 'By Node', 'By Projects'];
const modelsDefault = [PodModel, NodeModel, ProjectModel];
const dropdownItemsDefault = {
  'By Pods': 'By Pods',
  'By Node': 'By Node',
  'By Projects': 'By Projects',
};
const prometheusInstanceTypes = ['pod', 'instance', 'namespace'];

const ConsumerPopover: React.FC<ConsumerPopoverProps> = React.memo((props) => {
  const { current, title, humanize, query } = props;
  return (
    <DashboardCardPopupLink popupTitle={`${title} breakdown`} linkTitle={current}>
      <PopoverBody humanize={humanize} query={query} {...props} />
    </DashboardCardPopupLink>
  );
});

export default ConsumerPopover;

const getResourceToWatch = (model: K8sKind) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  prop: 'consumers',
});

const PopoverBodyInternal = connectToURLs(MonitoringRoutes.Prometheus)(
  React.memo((props: React.PropsWithChildren<DashboardItemProps & PopoverBodyProps>) => {
    const { title, humanize, query, urls } = props;
    const {
      watchPrometheus,
      stopWatchPrometheusQuery,
      prometheusResults,
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      models = modelsDefault,
      dropdownKeys = dropdownKeysDefault,
      dropdownItems = dropdownItemsDefault,
    } = props;

    const [selectedFilter, setSelectedFilter] = React.useState(dropdownKeys[0]);
    const popoverTitle = title ? `Top ${title} consumers` : `Top consumers`;

    React.useEffect(() => {
      const selectedIndex = dropdownKeys.indexOf(selectedFilter);
      const k8sResource = getResourceToWatch(models[selectedIndex]);
      watchPrometheus(query[selectedIndex]);
      watchK8sResource(k8sResource);
      return () => {
        stopWatchPrometheusQuery(query[selectedIndex]);
        stopWatchK8sResource(k8sResource);
      };
    }, [
      dropdownKeys,
      models,
      query,
      selectedFilter,
      stopWatchK8sResource,
      stopWatchPrometheusQuery,
      watchK8sResource,
      watchPrometheus,
    ]);

    const selectedIndex = dropdownKeys.indexOf(selectedFilter);

    const metricType = prometheusInstanceTypes[selectedIndex];
    const model = models[selectedIndex];
    const selectedQuery = query[selectedIndex];

    let top5Data = [];
    const consumerData = _.get(resources, ['consumers', 'data']) as K8sResourceKind[];
    const consumerLoaded = _.get(resources, ['consumers', 'loaded']);
    const consumersLoadError = _.get(resources, ['consumers', 'loadError']);

    const error = prometheusResults.getIn([selectedQuery, 'loadError']);
    const data = prometheusResults.getIn([selectedQuery, 'data']) as PrometheusResponse;
    const bodyData = getInstantVectorStats(data, metricType);

    if (consumerLoaded && !consumersLoadError) {
      for (const d of bodyData) {
        const consumerExists = consumerData.some(
          (consumer) =>
            getName(consumer) === d.metric[metricType] &&
            (model.namespaced ? getNamespace(consumer) === d.metric.namespace : true),
        );
        if (consumerExists) {
          top5Data.push(d);
        }
        if (top5Data.length === 5) {
          break;
        }
      }
    }

    top5Data = top5Data.map((elem) => Object.assign({}, elem, { y: humanize(elem.y).string }));
    const link = getPrometheusExpressionBrowserURL(urls, selectedQuery);

    return (
      <div className="pf-c-popover__body co-utilization-card-popover__body">
        <h4 className="co-utilizaiton-card-popover__title">{popoverTitle}</h4>
        <Dropdown
          className="co-utilization-card-popover__dropdown"
          id="consumer-select"
          name="selectConsumerType"
          aria-label="Select consumer type"
          items={dropdownItems}
          onChange={setSelectedFilter}
          selectedKey={selectedFilter}
        />
        {consumerLoaded && !error && top5Data.length > 0 ? (
          <>
            <ul
              className="co-utilization-card-popover__consumer-list"
              aria-label={`Top consumer by ${model.labelPlural}`}
            >
              <ConsumerItems
                items={top5Data}
                model={models[selectedIndex]}
                query={query[selectedIndex]}
              />
            </ul>
            <ExternalLink
              href={link}
              text="View more"
              aria-label={`View more consumers by ${model.labelPlural}`}
            />
          </>
        ) : (
          <ul className="co-utilization-card-popover__consumer-list">
            <li className="skeleton-activity" />
            <li className="skeleton-activity" />
            <li className="skeleton-activity" />
            <li className="skeleton-activity" />
            <li className="skeleton-activity" />
          </ul>
        )}
      </div>
    );
  }),
);

const PopoverBody = withDashboardResources(PopoverBodyInternal);

const ConsumerItems: React.FC<ConsumerItemsProps> = React.memo(({ items, model }) => {
  return items ? (
    <>
      {items.map((item) => {
        const title = String(item.x);
        return (
          <>
            <li
              key={title}
              className="pf-l-flex pf-m-justify-content-space-between co-utilization-card-popover__consumer-list__item"
              aria-labelledby="list-item1"
            >
              <Link
                className="co-utilization-card-popover__consumer-list__name"
                to={resourcePathFromModel(model, title, item.metric.namespace)}
              >
                {title}
              </Link>
              <small className="co-utilization-card-popover__consumer-list__value">{item.y}</small>
            </li>
          </>
        );
      })}
    </>
  ) : null;
});

type ConsumerItemsProps = {
  items?: DataPoint[];
  model?: K8sKind;
  query?: string;
};

type PopoverDropdownProps = {
  dropdownKeys?: string[];
  models?: K8sKind[];
  dropdownItems?: object;
};

type PopoverBodyProps = PopoverDropdownProps & {
  title?: string;
  topConsumers?: DataPoint[][];
  error?: boolean;
  humanize: Humanize;
  query?: string[];
  urls?: string[];
};

export type ConsumerPopoverProps = PopoverDropdownProps & {
  current: string;
  title: string;
  humanize: Humanize;
  query: string[];
};
