import * as _ from 'lodash-es';
import {
  GreenCheckCircleIcon,
  PrometheusEndpoint,
  RedExclamationCircleIcon,
  RowFilter,
} from '@console/dynamic-plugin-sdk';
import { Alert } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { Link, Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';

import {
  NamespaceModel,
  ServiceModel,
  ServiceMonitorModel,
  PodModel,
  PodMonitorModel,
} from '../../models';
import { K8sResourceKind, LabelSelector, referenceForModel } from '../../module/k8s';
import { RootState } from '../../redux';
import { RowFunctionArgs, Table, TableData } from '../factory';
import { FilterToolbar } from '../filter-toolbar';
import { PROMETHEUS_BASE_PATH } from '../graphs';
import { BreadCrumbs, PageHeading, SectionHeading } from '../utils/headings';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { usePoll } from '../utils/poll-hook';
import { ResourceLink } from '../utils/resource-link';
import { useSafeFetch } from '../utils/safe-fetch-hook';
import { LoadingInline, StatusBox } from '../utils/status-box';
import { Timestamp } from '../utils/timestamp';
import { Labels } from './labels';
import { AlertSource, PrometheusAPIError, Target } from './types';
import { targetSource } from './utils';

enum MonitorType {
  ServiceMonitor = 'serviceMonitor',
  PodMonitor = 'podMonitor',
}

const ServiceMonitorsWatchContext = React.createContext([]);
const ServicesWatchContext = React.createContext([]);

const PodMonitorsWatchContext = React.createContext([]);
const PodsWatchContext = React.createContext([]);

const PodMonitor: React.FC<{ target: Target }> = ({ target }) => {
  const [podMonitors, podMonitorsLoaded] = React.useContext(PodMonitorsWatchContext);
  const [pods, podsLoaded] = React.useContext(PodsWatchContext);

  if (!podsLoaded || !podMonitorsLoaded) {
    return <LoadingInline />;
  }

  // First find the pod that corresponds to the target
  const pod = _.find(
    pods,
    ({ metadata }) =>
      metadata.name === target?.labels?.pod && metadata.namespace === target?.labels?.namespace,
  );

  // Now find the pod monitor that corresponds to the pod
  const podMonitor = _.find(
    podMonitors,
    ({ metadata, spec }) =>
      pod &&
      target.scrapePool.includes(`/${metadata.namespace}/${metadata.name}/`) &&
      ((spec.selector.matchLabels === undefined && spec.selector.matchExpressions === undefined) ||
        new LabelSelector(spec.selector).matchesLabels(pod.metadata.labels ?? {})) &&
      (spec.namespaceSelector?.matchNames === undefined ||
        _.includes(spec.namespaceSelector?.matchNames, pod.metadata.namespace)),
  );

  if (!podMonitor) {
    return <>-</>;
  }

  return (
    <ResourceLink
      kind={referenceForModel(PodMonitorModel)}
      name={podMonitor.metadata.name}
      namespace={podMonitor.metadata.namespace}
    />
  );
};

const ServiceMonitor: React.FC<{ target: Target }> = ({ target }) => {
  const [monitors, monitorsLoaded] = React.useContext(ServiceMonitorsWatchContext);
  const [services, servicesLoaded] = React.useContext(ServicesWatchContext);

  if (!servicesLoaded || !monitorsLoaded) {
    return <LoadingInline />;
  }

  // First find the service that corresponds to the target
  const service = _.find(
    services,
    ({ metadata }) =>
      metadata.name === target?.labels?.service && metadata.namespace === target?.labels?.namespace,
  );

  // Now find the service monitor that corresponds to the service
  const monitor = _.find(
    monitors,
    ({ metadata, spec }) =>
      service &&
      target.scrapePool.includes(`/${metadata.namespace}/${metadata.name}/`) &&
      ((spec.selector.matchLabels === undefined && spec.selector.matchExpressions === undefined) ||
        new LabelSelector(spec.selector).matchesLabels(service.metadata.labels ?? {})) &&
      (spec.namespaceSelector?.matchNames === undefined ||
        _.includes(spec.namespaceSelector?.matchNames, service.metadata.namespace)),
  );

  if (!monitor) {
    return <>-</>;
  }

  return (
    <ResourceLink
      kind={referenceForModel(ServiceMonitorModel)}
      name={monitor.metadata.name}
      namespace={monitor.metadata.namespace}
    />
  );
};

const Health: React.FC<{ health: string }> = React.memo(({ health }) => {
  const { t } = useTranslation();

  return health === 'up' ? (
    <>
      <GreenCheckCircleIcon /> {t('public~Up')}
    </>
  ) : (
    <>
      <RedExclamationCircleIcon /> {t('public~Down')}
    </>
  );
});

type DetailsProps = RouteComponentProps<{ scrapeUrl?: string }> & {
  loaded: boolean;
  loadError: string;
  targets: Target[];
};

const Details = withRouter<DetailsProps>(({ loaded, loadError, match, targets }) => {
  const { t } = useTranslation();

  const scrapeUrl = atob(match?.params?.scrapeUrl ?? '');
  const target: Target = scrapeUrl ? _.find(targets, { scrapeUrl }) : undefined;

  const isServiceMonitor: boolean = target.scrapePool.includes(MonitorType.ServiceMonitor);
  const isPodMonitor: boolean = target.scrapePool.includes(MonitorType.PodMonitor);

  return (
    <>
      <Helmet>
        <title>{t('public~Target details')}</title>
      </Helmet>
      <div className="pf-c-page__main-breadcrumb">
        <BreadCrumbs
          breadcrumbs={[
            { name: t('public~Targets'), path: '/monitoring/targets' },
            { name: t('public~Target details'), path: undefined },
          ]}
        />
      </div>
      <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
        <h1 className="co-m-pane__heading">
          <div className="co-resource-item">{scrapeUrl}</div>
        </h1>
      </div>
      <StatusBox data={target} label="target" loaded={loaded} loadError={loadError}>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Target details')} />
          <div className="co-m-pane__body-group">
            <div className="row">
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>{t('public~Endpoint')}</dt>
                  <dd>{scrapeUrl}</dd>
                  <dt>{t('public~Namespace')}</dt>
                  <dd>
                    <ResourceLink kind="Namespace" name={target?.labels?.namespace} />
                  </dd>
                  <dt>{t('public~Labels')}</dt>
                  <dd>
                    <Labels kind="metricstarget" labels={target?.labels} />
                  </dd>
                  <dt>{t('public~Last scrape')}</dt>
                  <dd>
                    <Timestamp timestamp={target?.lastScrape} />
                  </dd>
                  {target?.lastError && (
                    <Alert className="co-alert" title={t('public~Scrape failed')} variant="danger">
                      {target?.lastError}
                    </Alert>
                  )}
                </dl>
              </div>
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>{t('public~Status')}</dt>
                  <dd>
                    <Health health={target?.health} />
                  </dd>
                  <dt>{t('public~Monitor')}</dt>
                  {isServiceMonitor && (
                    <dd>
                      <ServiceMonitor target={target} />
                    </dd>
                  )}
                  {isPodMonitor && (
                    <dd>
                      <PodMonitor target={target} />
                    </dd>
                  )}
                  {!isServiceMonitor && !isPodMonitor && (
                    <dd>
                      <>-</>
                    </dd>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </StatusBox>
    </>
  );
});

const tableClasses = [
  'pf-u-w-25-on-md', // Endpoint
  'pf-u-w-16-on-md', // Monitor
  '', // Status
  'pf-u-w-16-on-md', // Namespace
  'pf-m-hidden pf-m-visible-on-md', // Last Scrape
  'pf-m-hidden pf-m-visible-on-md', // Scrape Duration
];

const Row: React.FC<RowFunctionArgs<Target>> = ({ obj }) => {
  const { health, labels, lastScrape, lastScrapeDuration, scrapeUrl } = obj;

  const isServiceMonitor: boolean = obj.scrapePool.includes(MonitorType.ServiceMonitor);
  const isPodMonitor: boolean = obj.scrapePool.includes(MonitorType.PodMonitor);

  return (
    <>
      <TableData className={tableClasses[0]}>
        <Link to={`./targets/${btoa(scrapeUrl)}`}>{scrapeUrl}</Link>
      </TableData>
      <TableData className={tableClasses[1]}>
        {isServiceMonitor && <ServiceMonitor target={obj} />}
        {isPodMonitor && <PodMonitor target={obj} />}
        {!isServiceMonitor && !isPodMonitor && <>-</>}
      </TableData>
      <TableData className={tableClasses[2]}>
        <Health health={health} />
      </TableData>
      <TableData className={tableClasses[3]}>
        {labels?.namespace && (
          <ResourceLink inline kind={NamespaceModel.kind} name={labels?.namespace} />
        )}
      </TableData>
      <TableData className={tableClasses[4]}>
        <Timestamp timestamp={lastScrape} />
      </TableData>
      <TableData className={tableClasses[5]}>
        {lastScrapeDuration ? `${(1000 * lastScrapeDuration).toFixed(1)} ms` : '-'}
      </TableData>
    </>
  );
};

type ListProps = {
  loaded: boolean;
  loadError: string;
  targets: Target[];
};

const REDUX_ID = 'monitoringTargets';

const getRowProps = (target: Target) => ({ id: target.scrapeUrl, title: target.lastError });

const List: React.FC<ListProps> = ({ loaded, loadError, targets }) => {
  const { t } = useTranslation();

  const filters = useSelector(({ k8s }: RootState) => k8s.getIn([REDUX_ID, 'filters']));

  const Header = () => [
    {
      title: t('public~Endpoint'),
      sortField: 'scrapeUrl',
      transforms: [sortable],
      props: { className: tableClasses[0] },
    },
    {
      title: t('public~Monitor'),
      props: { className: tableClasses[1] },
    },
    {
      title: t('public~Status'),
      sortField: 'health',
      transforms: [sortable],
      props: { className: tableClasses[2] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'labels.namespace',
      transforms: [sortable],
      props: { className: tableClasses[3] },
    },
    {
      title: t('public~Last Scrape'),
      sortField: 'lastScrape',
      transforms: [sortable],
      props: { className: tableClasses[4] },
    },
    {
      title: t('public~Scrape Duration'),
      sortFunc: 'targetScrapeDuration',
      transforms: [sortable],
      props: { className: tableClasses[5] },
    },
  ];

  const rowFilters: RowFilter[] = [
    {
      filter: (filter, target: Target) =>
        filter.selected?.includes(target.health) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Status'),
      items: [
        { id: 'up', title: t('public~Up') },
        { id: 'down', title: t('public~Down') },
      ],
      reducer: (target: Target) => target?.health,
      type: 'observe-target-health',
    },
    {
      filter: (filter, target: Target) =>
        filter.selected?.includes(targetSource(target)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Source'),
      items: [
        { id: AlertSource.Platform, title: t('public~Platform') },
        { id: AlertSource.User, title: t('public~User') },
      ],
      reducer: targetSource,
      type: 'observe-target-source',
    },
  ];

  const title = t('public~Metrics targets');

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      <div className="co-m-pane__body">
        {loadError && (
          <Alert
            className="co-alert"
            title={t('public~Error loading latest targets data')}
            variant="danger"
          >
            {loadError}
          </Alert>
        )}
        <FilterToolbar
          data={targets}
          labelFilter="observe-target-labels"
          labelPath="labels"
          nameFilterPlaceholder={t('public~Search by endpoint or namespace...')}
          nameFilterTitle={t('public~Text')}
          reduxIDs={[REDUX_ID]}
          rowFilters={rowFilters}
          textFilter="observe-target-text"
        />
        <div className="row">
          <div className="col-xs-12">
            <Table
              aria-label="metrics targets"
              data={targets}
              defaultSortField="scrapeUrl"
              filters={filters?.toJS()}
              getRowProps={getRowProps}
              Header={Header}
              loaded={loaded}
              loadError={loadError}
              reduxID={REDUX_ID}
              Row={Row}
              rowFilters={rowFilters}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const POLL_INTERVAL = 15 * 1000;

export const TargetsUI: React.FC<{}> = () => {
  const [error, setError] = React.useState<PrometheusAPIError>();
  const [loaded, setLoaded] = React.useState(false);
  const [targets, setTargets] = React.useState<Target[]>();

  const servicesWatch = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: ServiceModel.kind,
  });

  const monitorsWatch = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ServiceMonitorModel),
  });

  const podsWatch = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: PodModel.kind,
  });

  const podMonitorsWatch = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(PodMonitorModel),
  });

  const safeFetch = React.useCallback(useSafeFetch(), []);

  const tick = () =>
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.TARGETS}?state=active`)
      .then((response) => {
        setError(undefined);
        setLoaded(true);
        setTargets(response?.data?.activeTargets);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err);
          setLoaded(true);
        }
      });

  usePoll(tick, POLL_INTERVAL);

  const loadError = error?.json?.error || error?.message;

  return (
    <ServiceMonitorsWatchContext.Provider value={monitorsWatch}>
      <ServicesWatchContext.Provider value={servicesWatch}>
        <PodMonitorsWatchContext.Provider value={podMonitorsWatch}>
          <PodsWatchContext.Provider value={podsWatch}>
            <Switch>
              <Route path="/monitoring/targets" exact>
                <List loaded={loaded} loadError={loadError} targets={targets} />
              </Route>
              <Route path="/monitoring/targets/:scrapeUrl?" exact>
                <Details loaded={loaded} loadError={loadError} targets={targets} />
              </Route>
            </Switch>
          </PodsWatchContext.Provider>
        </PodMonitorsWatchContext.Provider>
      </ServicesWatchContext.Provider>
    </ServiceMonitorsWatchContext.Provider>
  );
};
