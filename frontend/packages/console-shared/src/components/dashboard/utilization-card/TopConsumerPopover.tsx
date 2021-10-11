import * as React from 'react';
import { PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { DataPoint } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { Humanize, resourcePathFromModel } from '@console/internal/components/utils';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sKind, referenceForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import { featureReducerName } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { FLAGS } from '@console/shared/src/constants';
import { getName, getNamespace } from '../../..';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status';
import { DashboardCardPopupLink } from '../dashboard-card/DashboardCardLink';
import Status from '../status-card/StatusPopup';
import { LIMIT_STATE } from './UtilizationItem';

import './top-consumer-popover.scss';

const ConsumerPopover: React.FC<ConsumerPopoverProps> = React.memo(
  ({ current, title, humanize, consumers, namespace, position, description, children }) => {
    const { t } = useTranslation();
    const [isOpen, setOpen] = React.useState(false);
    return (
      <DashboardCardPopupLink
        popupTitle={t('console-shared~{{title}} breakdown', { title })}
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
}) => {
  const { t } = useTranslation();
  return (
    ((!!limitState && limitState !== LIMIT_STATE.OK) ||
      (!!requestedState && requestedState !== LIMIT_STATE.OK)) && (
      <ul className="co-utilization-card-popover__consumer-list">
        <Status value={total}>{t('console-shared~Total capacity')}</Status>
        <Status value={limit} icon={getLimitIcon(limitState)}>
          {t('console-shared~Total limit')}
        </Status>
        <Status value={current}>{t('console-shared~Current utilization')}</Status>
        <Status value={available}>{t('console-shared~Current available capacity')}</Status>
        <Status value={requested} icon={getLimitIcon(requestedState)}>
          {t('console-shared~Total requested')}
        </Status>
      </ul>
    )
  );
};

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
      const { t } = useTranslation();
      const [currentConsumer, setCurrentConsumer] = React.useState(consumers[0]);
      const activePerspective = useActivePerspective()[0];
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
            items[referenceForModel(curr.model)] = t('console-shared~By {{label}}', {
              label: curr.model.labelKey ? t(curr.model.labelKey) : curr.model.label,
            });
            return items;
          }, {}),
        [consumers, t],
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
        body = <div className="text-secondary">{t('console-shared~Not available')}</div>;
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
              aria-label={t('console-shared~Top consumer by {{label}}', { label: model.label })}
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
            <Link to={monitoringURL}>{t('console-shared~View more')}</Link>
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
              ? t('console-shared~Top {{label}} consumers', {
                  label: currentConsumer.model.label.toLowerCase(),
                })
              : t('console-shared~Top consumers')}
          </div>
          {consumers.length > 1 && (
            <Dropdown
              className="co-utilization-card-popover__dropdown"
              id="consumer-select"
              name="selectConsumerType"
              aria-label={t('console-shared~Select consumer type')}
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
  description?: string;
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
