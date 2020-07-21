import * as React from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
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
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { PopoverPosition } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FLAGS } from '@console/shared/src/constants';
import { getName, getNamespace } from '../../..';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status';
import Status from '../status-card/StatusPopup';
import { LIMIT_STATE } from './UtilizationItem';

import './top-consumer-popover.scss';

const ConsumerPopover: React.FC<ConsumerPopoverProps> = React.memo(
  ({ current, title, humanize, consumers, namespace, position, description, children }) => {
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
          description={description}
        >
          {children}
        </PopoverBody>
      </DashboardCardPopupLink>
    );
  },
);

export default ConsumerPopover;

const getLimitIcon = (state: LIMIT_STATE): React.ReactNode => {
  switch (state) {
    case LIMIT_STATE.ERROR:
      return <RedExclamationCircleIcon />;
    case LIMIT_STATE.WARN:
      return <YellowExclamationTriangleIcon />;
    default:
      return null;
  }
};

const getResourceToWatch = (model: K8sKind, namespace: string, fieldSelector: string) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  fieldSelector,
  namespace,
});

export const LimitsBody: React.FC<LimitsBodyProps> = ({
  limitState,
  requestedState,
  total,
  limit,
  current,
  available,
  requested,
}) =>
  ((!!limitState && limitState !== LIMIT_STATE.OK) ||
    (!!requestedState && requestedState !== LIMIT_STATE.OK)) && (
    <ul className="co-utilization-card-popover__consumer-list">
      <Status value={total}>Total capacity</Status>
      <Status value={limit} icon={getLimitIcon(limitState)}>
        Total limit
      </Status>
      <Status value={current}>Current utilization</Status>
      <Status value={available}>Current available capacity</Status>
      <Status value={requested} icon={getLimitIcon(requestedState)}>
        Total requested
      </Status>
    </ul>
  );

export const PopoverBody = withDashboardResources<DashboardItemProps & PopoverBodyProps>(
  React.memo(
    ({
      humanize,
      consumers,
      namespace,
      watchPrometheus,
      stopWatchPrometheusQuery,
      prometheusResults,
      isOpen,
      description,
      children,
    }) => {
      const [currentConsumer, setCurrentConsumer] = React.useState(consumers[0]);
      const activePerspective = useSelector<RootState, string>(({ UI }) =>
        UI.get('activePerspective'),
      );
      const canAccessMonitoring = useSelector<RootState, boolean>(
        (state) =>
          !!state[featureReducerName].get(FLAGS.CAN_GET_NS) &&
          !!window.SERVER_FLAGS.prometheusBaseURL,
      );
      const { query, model, metric, fieldSelector } = currentConsumer;
      const k8sResource = React.useMemo(
        () => (isOpen ? getResourceToWatch(model, namespace, fieldSelector) : null),
        [fieldSelector, isOpen, model, namespace],
      );
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

      const top5Data = [];

      const [data, error] = getPrometheusQueryResponse(prometheusResults, query);
      const bodyData = getInstantVectorStats(data, metric);

      if (k8sResource && consumerLoaded && !consumersLoadError) {
        for (const d of bodyData) {
          const consumerExists = consumerData.some(
            (consumer) =>
              getName(consumer) === d.metric[metric] &&
              (model.namespaced ? getNamespace(consumer) === d.metric.namespace : true),
          );
          if (consumerExists) {
            top5Data.push({ ...d, y: humanize(d.y).string });
          }
          if (top5Data.length === 5) {
            break;
          }
        }
      }

      const monitoringParams = React.useMemo(() => {
        const params = new URLSearchParams();
        params.set('query0', currentConsumer.query);
        return params;
      }, [currentConsumer.query]);

      const dropdownItems = React.useMemo(
        () =>
          consumers.reduce((items, curr) => {
            items[referenceForModel(curr.model)] = `By ${curr.model.label}`;
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
              aria-label={`Top consumer by ${model.label}`}
            >
              {top5Data &&
                top5Data.map((item) => {
                  const title = String(item.x);
                  return (
                    <ListItem key={title} value={item.y}>
                      <Link
                        className="co-utilization-card-popover__consumer-name"
                        to={resourcePathFromModel(model, title, item.metric.namespace)}
                      >
                        {title}
                      </Link>
                    </ListItem>
                  );
                })}
            </ul>
            <Link to={monitoringURL}>View more</Link>
          </>
        );
      }

      return (
        <div className="co-utilization-card-popover__body">
          {description && (
            <div className="co-utilization-card-popover__description">{description}</div>
          )}
          {children}
          <div className="co-utilization-card-popover__title">
            {consumers.length === 1
              ? `Top ${currentConsumer.model.label.toLowerCase()} consumers`
              : 'Top consumers'}
          </div>
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
    },
  ),
);

const ListItem: React.FC<ListItemProps> = ({ children, value }) => (
  <li className="co-utilization-card-popover__consumer-item">
    {children}
    <div className="co-utilization-card-popover__consumer-value">{value}</div>
  </li>
);

type ListItemProps = {
  value: React.ReactText;
};

type LimitsBodyProps = {
  limitState?: LIMIT_STATE;
  requestedState?: LIMIT_STATE;
  limit?: string;
  requested?: string;
  available?: string;
  total?: string;
  current: string;
};

type PopoverProps = {
  humanize: Humanize;
  consumers: { model: K8sKind; query: string; metric: string; fieldSelector?: string }[];
  namespace?: string;
  description?: React.ReactText;
};

type PopoverBodyProps = PopoverProps & {
  topConsumers?: DataPoint[][];
  error?: boolean;
  isOpen: boolean;
};

export type ConsumerPopoverProps = PopoverProps & {
  position?: PopoverPosition;
  title: string;
  current: string;
};
