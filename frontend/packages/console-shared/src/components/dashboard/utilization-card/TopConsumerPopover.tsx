import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DataPoint, PrometheusResponse } from '@console/internal/components/graphs';
import { Humanize, resourcePathFromModel } from '@console/internal/components/utils';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { PodModel, NodeModel, ProjectModel } from '@console/internal/models';
import { K8sKind, referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import './top-consumer-popover.scss';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { getName, getNamespace } from '../../..';

const dropdownKeys = ['By Pods', 'By Node', 'By Projects'];
const models = [PodModel, NodeModel, ProjectModel];
const dropdownItems = {
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

const PopoverBodyInternal: React.FC<DashboardItemProps & PopoverBodyProps> = React.memo((props) => {
  const [selectedFilter, setSelectedFilter] = React.useState(dropdownKeys[0]);
  const { title, humanize, query } = props;
  const {
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    watchK8sResource,
    stopWatchK8sResource,
    resources,
  } = props;

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

  const monitoringParams = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set('query0', selectedQuery);
    return params;
  }, [selectedQuery]);

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
          <Link to={`/monitoring/query-browser?${monitoringParams.toString()}`}>View more</Link>
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
});

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

type PopoverBodyProps = {
  title?: string;
  topConsumers?: DataPoint[][];
  error?: boolean;
  humanize: Humanize;
  query?: string[];
};

export type ConsumerPopoverProps = {
  current: string;
  title: string;
  humanize: Humanize;
  query: string[];
};
