/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC, ReactNode, ReactText } from 'react';
import { memo, useState, useCallback, useMemo } from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { LIMIT_STATE, Humanize } from '@console/dynamic-plugin-sdk';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { DataPoint } from '@console/internal/components/graphs';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { K8sKind, referenceForModel, K8sResourceCommon } from '@console/internal/module/k8s';
import { getName, getNamespace } from '../../..';
import { useDashboardResources } from '../../../hooks/useDashboardResources';
import { RedExclamationCircleIcon, YellowExclamationTriangleIcon } from '../../status';
import Status from '../status-card/StatusPopup';

import './top-consumer-popover.scss';

const ConsumerPopover: FC<ConsumerPopoverProps> = memo(
  ({
    current,
    title,
    humanize,
    consumers,
    namespace,
    position = PopoverPosition.top,
    description,
    children,
  }) => {
    const { t } = useTranslation();
    const [isOpen, setOpen] = useState(false);
    const onShow = useCallback(() => setOpen(true), []);
    const onHide = useCallback(() => setOpen(false), []);
    if (!current) {
      return null;
    }
    return (
      <Popover
        position={position}
        headerContent={t('console-shared~{{title}} breakdown', { title })}
        bodyContent={
          <PopoverBody
            humanize={humanize}
            consumers={consumers}
            namespace={namespace}
            isOpen={isOpen}
            description={description}
          >
            {children}
          </PopoverBody>
        }
        enableFlip
        onShow={onShow}
        onHide={onHide}
        maxWidth="21rem"
      >
        <Button variant="link" isInline>
          {current}
        </Button>
      </Popover>
    );
  },
);

export default ConsumerPopover;

const getLimitIcon = (state: LIMIT_STATE): ReactNode => {
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

export const LimitsBody: FC<LimitsBodyProps> = ({
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

export const PopoverBody: FC<PopoverBodyProps> = memo(
  ({ humanize, consumers, namespace, isOpen, description, children }) => {
    const { t } = useTranslation();
    const [currentConsumer, setCurrentConsumer] = useState(consumers[0]);
    const { query, model, metric, fieldSelector } = currentConsumer;
    const k8sResource = useMemo(
      () => (isOpen ? getResourceToWatch(model, namespace, fieldSelector) : null),
      [fieldSelector, isOpen, model, namespace],
    );
    const [consumerData, consumerLoaded, consumersLoadError] = useK8sWatchResource<
      K8sResourceCommon[]
    >(k8sResource);

    const prometheusQueries = useMemo(() => (isOpen ? [{ query, namespace }] : []), [
      query,
      namespace,
      isOpen,
    ]);

    const { prometheusResults } = useDashboardResources({
      prometheusQueries,
    });

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

    const monitoringParams = useMemo(() => {
      const params = new URLSearchParams();
      params.set('query0', currentConsumer.query);
      if (namespace) {
        params.set('namespace', namespace);
      }
      return params;
    }, [currentConsumer.query, namespace]);

    const dropdownItems = useMemo(
      () =>
        consumers.reduce((items, curr) => {
          items[referenceForModel(curr.model)] = t('console-shared~By {{label}}', {
            label: curr.model.labelKey ? t(curr.model.labelKey) : curr.model.label,
          });
          return items;
        }, {}),
      [consumers, t],
    );

    const onDropdownChange = useCallback(
      (key) => setCurrentConsumer(consumers.find((c) => referenceForModel(c.model) === key)),
      [consumers],
    );

    const monitoringURL = `/monitoring/query-browser?${monitoringParams.toString()}`;

    let body: ReactNode;
    if (error || consumersLoadError) {
      body = <div className="pf-v6-u-text-color-subtle">{t('console-shared~Not available')}</div>;
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
          <ConsoleSelect
            id="consumer-select"
            renderInline // needed for popover to not close on selection
            isFullWidth
            buttonClassName="pf-v6-u-my-sm"
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
);

const ListItem: FC<ListItemProps> = ({ children, value }) => (
  <li className="co-utilization-card-popover__consumer-item">
    {children}
    <div className="co-utilization-card-popover__consumer-value">{value}</div>
  </li>
);

type ListItemProps = {
  value: ReactText;
  children?: ReactNode;
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
  children?: ReactNode;
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
  children?: ReactNode;
};
