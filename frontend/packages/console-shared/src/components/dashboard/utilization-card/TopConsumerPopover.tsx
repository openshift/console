import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { DataPoint } from '@console/internal/components/graphs';
import { Humanize, resourcePathFromModel } from '@console/internal/components/utils';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { K8sKind, referenceForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { featureReducerName } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { PopoverPosition } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FLAGS } from '@console/shared/src/constants';
import { getName, getNamespace } from '../../..';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';

import './top-consumer-popover.scss';

const ConsumerPopover: React.FC<ConsumerPopoverProps> = React.memo(
  ({ current, title, humanize, consumers, namespace, position }) => {
    const [isOpen, setOpen] = React.useState(false);
    return (
      <DashboardCardPopupLink
        popupTitle={`${title} breakdown`}
        linkTitle={current}
        onHide={React.useCallback(() => setOpen(false), [])}
        onShow={React.useCallback(() => setOpen(true), [])}
        position={position}
      >
        <PopoverBody
          humanize={humanize}
          consumers={consumers}
          namespace={namespace}
          isOpen={isOpen}
        />
      </DashboardCardPopupLink>
    );
  },
);

export default ConsumerPopover;

const getResourceToWatch = (model: K8sKind, namespace: string) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  namespace,
});

const PopoverBodyInternal: React.FC<DashboardItemProps &
  PopoverBodyProps &
  PopoverReduxProps> = React.memo((props) => {
  const {
    humanize,
    consumers,
    namespace,
    watchPrometheus,
    stopWatchPrometheusQuery,
    prometheusResults,
    isOpen,
    canAccessMonitoring,
    activePerspective,
  } = props;
  const [currentConsumer, setCurrentConsumer] = React.useState(consumers[0]);
  const { query, model, metric } = currentConsumer;
  const k8sResource = React.useMemo(() => (isOpen ? getResourceToWatch(model, namespace) : null), [
    isOpen,
    model,
    namespace,
  ]);
  const [consumerData, consumerLoaded, consumersLoadError] = useK8sWatchResource<
    K8sResourceCommon[]
  >(k8sResource);
  React.useEffect(() => {
    if (!isOpen) {
      return () => {};
    }
    watchPrometheus(query, namespace);
    return () => {
      stopWatchPrometheusQuery(query);
    };
  }, [query, stopWatchPrometheusQuery, watchPrometheus, namespace, isOpen]);

  let top5Data = [];

  const [data, error] = getPrometheusQueryResponse(prometheusResults, query);
  const bodyData = getInstantVectorStats(data, metric);

  if (consumerLoaded && !consumersLoadError) {
    for (const d of bodyData) {
      const consumerExists = consumerData.some(
        (consumer) =>
          getName(consumer) === d.metric[metric] &&
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
    params.set('query0', currentConsumer.query);
    return params;
  }, [currentConsumer.query]);

  const dropdownItems = React.useMemo(
    () =>
      consumers.reduce((items, current) => {
        items[referenceForModel(current.model)] = `By ${current.model.labelPlural}`;
        return items;
      }, {}),
    [consumers],
  );

  const onDropdownChange = React.useCallback(
    (key) => setCurrentConsumer(consumers.find((c) => referenceForModel(c.model) === key)),
    [consumers],
  );

  const monitoringURL =
    canAccessMonitoring && activePerspective === 'admin'
      ? `/monitoring/query-browser?${monitoringParams.toString()}`
      : `/dev-monitoring/ns/${namespace}/metrics?${monitoringParams.toString()}`;

  let body: React.ReactNode;
  if (error || consumersLoadError) {
    body = <div className="text-secondary">Not available</div>;
  } else if (!consumerLoaded || !data) {
    body = (
      <ul className="co-utilization-card-popover__consumer-list">
        <li className="skeleton-consumer" />
        <li className="skeleton-consumer" />
        <li className="skeleton-consumer" />
        <li className="skeleton-consumer" />
        <li className="skeleton-consumer" />
      </ul>
    );
  } else {
    body = (
      <>
        <ul
          className="co-utilization-card-popover__consumer-list"
          aria-label={`Top consumer by ${model.labelPlural}`}
        >
          <ConsumerItems items={top5Data} model={model} />
        </ul>
        <Link to={monitoringURL}>View more</Link>
      </>
    );
  }

  return (
    <div className="co-utilization-card-popover__body">
      <h4 className="co-utilization-card-popover__title">
        {consumers.length === 1
          ? `Top ${currentConsumer.model.label.toLowerCase()} consumers`
          : 'Top consumers'}
      </h4>
      {consumers.length > 1 && (
        <Dropdown
          className="co-utilization-card-popover__dropdown"
          id="consumer-select"
          name="selectConsumerType"
          aria-label="Select consumer type"
          items={dropdownItems}
          onChange={onDropdownChange}
          selectedKey={referenceForModel(model)}
        />
      )}
      {body}
    </div>
  );
});

const mapStateToProps = (state: RootState) => ({
  activePerspective: getActivePerspective(state),
  canAccessMonitoring:
    !!state[featureReducerName].get(FLAGS.CAN_GET_NS) && !!window.SERVER_FLAGS.prometheusBaseURL,
});

const PopoverBody = connect(mapStateToProps)(withDashboardResources(PopoverBodyInternal));

const ConsumerItems: React.FC<ConsumerItemsProps> = React.memo(({ items, model }) => {
  return items ? (
    <>
      {items.map((item) => {
        const title = String(item.x);
        return (
          <li key={title} className="co-utilization-card-popover__consumer-item">
            <div className="co-utilization-card-popover__consumer-link">
              <Link
                className="co-utilization-card-popover__consumer-name"
                to={resourcePathFromModel(model, title, item.metric.namespace)}
              >
                {title}
              </Link>
              <small className="co-utilization-card-popover__consumer-value">{item.y}</small>
            </div>
          </li>
        );
      })}
    </>
  ) : null;
});

type ConsumerItemsProps = {
  items?: DataPoint[];
  model?: K8sKind;
};

type PopoverReduxProps = {
  activePerspective: string;
  canAccessMonitoring: boolean;
};

type PopoverBodyProps = {
  topConsumers?: DataPoint[][];
  error?: boolean;
  humanize: Humanize;
  consumers: { model: K8sKind; query: string; metric: string }[];
  namespace?: string;
  isOpen: boolean;
};

export type ConsumerPopoverProps = {
  current: string;
  title: string;
  humanize: Humanize;
  consumers: { model: K8sKind; query: string; metric: string }[];
  namespace?: string;
  position?: PopoverPosition;
};
