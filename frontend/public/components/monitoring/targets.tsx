import * as _ from 'lodash-es';
import { Alert } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { Link, Route, RouteComponentProps, Switch, withRouter } from 'react-router-dom';

import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { GreenCheckCircleIcon, RedExclamationCircleIcon } from '@console/shared';

import { NamespaceModel, ServiceModel, ServiceMonitorModel } from '../../models';
import { K8sResourceKind, LabelSelector, referenceForModel } from '../../module/k8s';
import { RootState } from '../../redux';
import { RowFunctionArgs, Table, TableData } from '../factory';
import { FilterToolbar, RowFilter } from '../filter-toolbar';
import { PROMETHEUS_BASE_PATH } from '../graphs';
import { SectionHeading, BreadCrumbs } from '../utils/headings';
import { useK8sWatchResource } from '../utils/k8s-watch-hook';
import { usePoll } from '../utils/poll-hook';
import { ResourceLink } from '../utils/resource-link';
import { useSafeFetch } from '../utils/safe-fetch-hook';
import { LoadingInline, StatusBox } from '../utils/status-box';
import { Timestamp } from '../utils/timestamp';
import { Labels } from './labels';
import { AlertSource, PrometheusAPIError, Target } from './types';
import { targetSource } from './utils';

const MonitorsWatchContext = React.createContext([]);
const ServicesWatchContext = React.createContext([]);

const ServiceMonitor: React.FC<{ target: Target }> = ({ target }) => {
  const [monitors, monitorsLoaded] = React.useContext(MonitorsWatchContext);
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
    ({ spec }) =>
      service &&
      (spec.selector.matchLabels === undefined ||
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

  return (
    <>
      <Helmet>
        <title>{t('public~Target details')}</title>
      </Helmet>
      <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            { name: t('public~Targets'), path: '/monitoring/targets' },
            { name: t('public~Target details'), path: undefined },
          ]}
        />
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
                  <dd>
                    <ServiceMonitor target={target} />
                  </dd>
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

  return (
    <>
      <TableData className={tableClasses[0]}>
        <Link to={`./targets/${btoa(scrapeUrl)}`}>{scrapeUrl}</Link>
      </TableData>
      <TableData className={tableClasses[1]}>
        <ServiceMonitor target={obj} />
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
      filterGroupName: t('public~Status'),
      items: [
        { id: 'up', title: t('public~Up') },
        { id: 'down', title: t('public~Down') },
      ],
      reducer: (target: Target) => target?.health,
      type: 'observe-target-health',
    },
    {
      filterGroupName: t('public~Source'),
      items: [
        { id: AlertSource.Platform, title: t('public~Platform') },
        { id: AlertSource.User, title: t('public~User') },
      ],
      reducer: (target: Target) => targetSource(target),
      type: 'observe-target-source',
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('public~Metrics targets')}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading">{t('public~Metrics Targets')}</h1>
      </div>
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
    <MonitorsWatchContext.Provider value={monitorsWatch}>
      <ServicesWatchContext.Provider value={servicesWatch}>
        <Switch>
          <Route path="/monitoring/targets" exact>
            <List loaded={loaded} loadError={loadError} targets={targets} />
          </Route>
          <Route path="/monitoring/targets/:scrapeUrl?" exact>
            <Details loaded={loaded} loadError={loadError} targets={targets} />
          </Route>
        </Switch>
      </ServicesWatchContext.Provider>
    </MonitorsWatchContext.Provider>
  );
};
