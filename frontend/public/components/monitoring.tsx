import * as classNames from 'classnames';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash-es';
import { murmur3 } from 'murmurhash-js';
import { Alert, Switch } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link, Redirect, Route, Switch as RouteSwitch } from 'react-router-dom';

import * as k8sActions from '../actions/k8s';
import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import { alertState, AlertStates, connectToURLs, MonitoringRoutes, silenceState, SilenceStates } from '../reducers/monitoring';
import store from '../redux';
import { ResourceRow, Table, TableData, TableRow, TextFilter } from './factory';
import { PROMETHEUS_BASE_PATH, QueryBrowser } from './graphs';
import { PrometheusEndpoint } from './graphs/helpers';
import { getPrometheusExpressionBrowserURL } from './graphs/prometheus-graph';
import { graphColors, Labels, PrometheusSeries } from './graphs/query-browser';
import { confirmModal } from './modals';
import { CheckBoxes } from './row-filter';
import { formatPrometheusDuration } from './utils/datetime';
import { withFallback } from './utils/error-boundary';
import { Tooltip } from './utils/tooltip';
import {
  ActionsMenu,
  ButtonBar,
  Dropdown,
  ExternalLink,
  getURLSearchParams,
  history,
  Kebab,
  LoadingInline,
  SectionHeading,
  StatusBox,
  Timestamp,
  useSafeFetch,
} from './utils';

const AlertResource = {
  kind: 'Alert',
  label: 'Alert',
  plural: '/monitoring/alerts',
  abbr: 'AL',
};

const AlertRuleResource = {
  kind: 'AlertRule',
  label: 'Alerting Rule',
  plural: '/monitoring/alertrules',
  abbr: 'AR',
};

const SilenceResource = {
  kind: 'Silence',
  label: 'Silence',
  plural: '/monitoring/silences',
  abbr: 'SL',
};

const labelsToParams = labels => _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

const buildNotFiringAlert = (rule: Rule): Alert => ({
  annotations: rule.annotations,
  labels: {alertname: rule.name, ...rule.labels},
  rule,
  state: AlertStates.NotFiring,
});

const alertURL = (alert, ruleID) => `${AlertResource.plural}/${ruleID}?${labelsToParams(alert.labels)}`;
const ruleURL = rule => `${AlertRuleResource.plural}/${_.get(rule, 'id')}`;

const alertDescription = alert => {
  const {annotations = {}, labels = {}} = alert;
  return annotations.description || annotations.message || labels.alertname;
};

const alertsToProps = ({UI}) => UI.getIn(['monitoring', 'alerts']) || {};
const silencesToProps = ({UI}) => UI.getIn(['monitoring', 'silences']) || {};

const pollers = {};
const pollerTimeouts = {};

// Force a poller to execute now instead of waiting for the next poll interval
const refreshPoller = key => {
  clearTimeout(pollerTimeouts[key]);
  _.invoke(pollers, key);
};

const silenceAlert = alert => ({
  label: 'Silence Alert',
  href: `${SilenceResource.plural}/~new?${labelsToParams(alert.labels)}`,
});

const viewAlertRule = alert => ({
  label: 'View Alerting Rule',
  href: ruleURL(alert.rule),
});

const editSilence = silence => ({
  label: silenceState(silence) === SilenceStates.Expired ? 'Recreate Silence' : 'Edit Silence',
  href: `${SilenceResource.plural}/${silence.id}/edit`,
});

const cancelSilence = (silence) => ({
  label: 'Expire Silence',
  callback: () => confirmModal({
    title: 'Expire Silence',
    message: 'Are you sure you want to expire this silence?',
    btnText: 'Expire Silence',
    executeFn: () => coFetchJSON.delete(`${window.SERVER_FLAGS.alertManagerBaseURL}/api/v1/silence/${silence.id}`)
      .then(() => refreshPoller('silences')),
  }),
});

const silenceMenuActions = (silence) => silenceState(silence) === SilenceStates.Expired
  ? [editSilence(silence)]
  : [editSilence(silence), cancelSilence(silence)];

const SilenceKebab = ({silence}) => <Kebab options={silenceMenuActions(silence)} />;

const SilenceActionsMenu = ({silence}) => <div className="co-actions" data-test-id="details-actions">
  <ActionsMenu actions={silenceMenuActions(silence)} />
</div>;

const MonitoringResourceIcon = props => {
  const {className, resource} = props;
  return <span className={classNames(`co-m-resource-icon co-m-resource-${resource.kind.toLowerCase()}`, className)} title={resource.label}>{resource.abbr}</span>;
};

const AlertState: React.SFC<AlertStateProps> = ({state}) => {
  if (state === AlertStates.NotFiring) {
    return <span className="text-muted">Not Firing</span>;
  }
  const klass = {
    [AlertStates.Firing]: 'fa fa-fw fa-bell alert-firing',
    [AlertStates.Silenced]: 'fa fa-fw fa-bell-slash text-muted',
    [AlertStates.Pending]: 'fa fa-fw fa-bell-o alert-pending',
  }[state];
  return klass ? <React.Fragment><i className={klass} aria-hidden="true"></i> {_.startCase(state)}</React.Fragment> : null;
};

const SilenceState = ({silence}) => {
  const state = silenceState(silence);
  const klass = {
    [SilenceStates.Active]: 'pficon pficon-ok fa-fw',
    [SilenceStates.Pending]: 'fa fa-fw fa-hourglass-half monitoring-state-icon--pending',
    [SilenceStates.Expired]: 'fa fa-fw fa-ban text-muted',
  }[state];
  return klass ? <React.Fragment><i className={klass} aria-hidden="true"></i> {_.startCase(state)}</React.Fragment> : null;
};

const StateTimestamp = ({text, timestamp}) => <div className="text-muted monitoring-timestamp">
  {text}&nbsp;<Timestamp timestamp={timestamp} />
</div>;

const AlertStateDescription = ({alert}) => {
  if (alert && !_.isEmpty(alert.silencedBy)) {
    return <StateTimestamp text="Ends" timestamp={_.max(_.map(alert.silencedBy, 'endsAt'))} />;
  }
  if (alert && alert.activeAt) {
    return <StateTimestamp text="Since" timestamp={alert.activeAt} />;
  }
  return null;
};

const Annotation = ({children, title}) => _.isNil(children)
  ? null
  : <React.Fragment><dt>{title}</dt><dd>{children}</dd></React.Fragment>;

const Label = ({k, v}) => <div className="co-m-label co-m-label--expand" key={k}>
  <span className="co-m-label__key">{k}</span>
  <span className="co-m-label__eq">=</span>
  <span className="co-m-label__value">{v}</span>
</div>;

const graphStateToProps = ({UI}) => ({hideGraphs: !!UI.getIn(['monitoring', 'hideGraphs'])});

const ToggleGraph_ = ({hideGraphs, toggle}) => {
  const iconClass = `fa fa-${hideGraphs ? 'line-chart' : 'compress'}`;
  return <button type="button" className="btn btn-link" onClick={toggle}>
    {hideGraphs ? 'Show' : 'Hide'} Graph <i className={iconClass} aria-hidden="true" />
  </button>;
};
const ToggleGraph = connect(graphStateToProps, {toggle: UIActions.monitoringToggleGraphs})(ToggleGraph_);

const Graph_ = ({hideGraphs, filterLabels = undefined, rule}) => {
  if (hideGraphs) {
    return null;
  }
  const {duration = 0, query = ''} = rule || {};

  // 3 times the rule's duration, but not less than 30 minutes
  const timespan = Math.max(3 * duration, 30 * 60) * 1000;

  const GraphLink = () => query
    ? <Link to={`/monitoring/query-browser?query=${encodeURIComponent(query)}`}>View in Metrics</Link>
    : null;

  return <QueryBrowser
    defaultTimespan={timespan}
    filterLabels={filterLabels}
    GraphLink={GraphLink}
    queries={[query]}
  />;
};
const Graph = connect(graphStateToProps)(Graph_);

const SilenceMatchersList = ({silence}) => <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
  {_.map(silence.matchers, ({name, isRegex, value}, i) => <Label key={i} k={name} v={isRegex ? `~${value}` : value} />)}
</div>;

const alertStateToProps = (state, {match}): AlertsDetailsPageProps => {
  const {data, loaded, loadError}: Alerts = alertsToProps(state);
  const {loaded: silencesLoaded}: Silences = silencesToProps(state);
  const ruleID = _.get(match, 'params.ruleID');
  const labels = getURLSearchParams();
  const alerts = _.filter(data, a => a.rule.id === ruleID);
  const rule = _.get(alerts, '[0].rule');
  let alert = _.find(alerts, a => _.isEqual(a.labels, labels));
  if (rule && !alert) {
    // No Alert with the exact label set was found, so display a "fake" Alert based on the Rule
    alert = buildNotFiringAlert(rule);
    alert.labels = labels as any;
  }
  return {alert, loaded, loadError, rule, silencesLoaded};
};

const AlertsDetailsPage = withFallback(connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
  const {alert, loaded, loadError, rule, silencesLoaded} = props;
  const {annotations = {}, labels = {}, silencedBy = []} = alert || {};
  const {alertname, severity} = labels as any;
  const state = alertState(alert);

  return <React.Fragment>
    <Helmet>
      <title>{`${alertname} · Details`}</title>
    </Helmet>
    <StatusBox data={alert} label={AlertResource.label} loaded={loaded} loadError={loadError}>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-resource-item"><MonitoringResourceIcon className="co-m-resource-icon--lg" resource={AlertResource} />{alertname}</div>
          {(state === AlertStates.Firing || state === AlertStates.Pending) && <div className="co-actions" data-test-id="details-actions">
            <ActionsMenu actions={[silenceAlert(alert)]} />
          </div>}
        </h1>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Alert Overview">
          {state !== AlertStates.NotFiring && <ToggleGraph />}
        </SectionHeading>
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-12">
              {state !== AlertStates.NotFiring && <Graph filterLabels={labels} rule={rule} />}
            </div>
          </div>
          <div className="row">
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Name</dt>
                <dd>{alertname}</dd>
                <dt>Labels</dt>
                <dd>{_.isEmpty(labels)
                  ? <div className="text-muted">No labels</div>
                  : <div className={`co-text-${AlertResource.kind.toLowerCase()}`}>
                    {_.map(labels, (v, k) => <Label key={k} k={k} v={v} />)}
                  </div>
                }</dd>
                {severity && <React.Fragment>
                  <dt>Severity</dt>
                  <dd>{_.startCase(severity)}</dd>
                </React.Fragment>}
                <dt>State</dt>
                <dd>
                  <AlertState state={state} />
                  <AlertStateDescription alert={alert} />
                </dd>
                <dt>Alerting Rule</dt>
                <dd>
                  <div className="co-resource-item">
                    <MonitoringResourceIcon resource={AlertRuleResource} />
                    <Link to={ruleURL(rule)} data-test-id="alert-detail-resource-link" className="co-resource-item__resource-name">{_.get(rule, 'name')}</Link>
                  </div>
                </dd>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <Annotation title="Description">{annotations.description}</Annotation>
                <Annotation title="Summary">{annotations.summary}</Annotation>
                <Annotation title="Message">{annotations.message}</Annotation>
              </dl>
            </div>
          </div>
        </div>
      </div>
      {silencesLoaded && !_.isEmpty(silencedBy) && <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Silenced By" />
          <div className="row">
            <div className="col-xs-12">
              <div className="co-m-table-grid co-m-table-grid--bordered">
                <div className="row co-m-table-grid__head">
                  <div className="col-sm-7 col-xs-8">Name</div>
                  <div className="col-sm-3 col-xs-4">State</div>
                  <div className="col-sm-2 hidden-xs">Firing Alerts</div>
                </div>
                <div className="co-m-table-grid__body">
                  {_.map(silencedBy, s => <SilenceRow key={s.id} obj={s} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>}
    </StatusBox>
  </React.Fragment>;
}));

const ActiveAlerts = ({alerts, ruleID}) => <div className="co-m-table-grid co-m-table-grid--bordered">
  <div className="row co-m-table-grid__head">
    <div className="col-xs-6">Description</div>
    <div className="col-sm-2 hidden-xs">Active Since</div>
    <div className="col-sm-2 col-xs-3">State</div>
    <div className="col-sm-2 col-xs-3">Value</div>
  </div>
  <div className="co-m-table-grid__body">
    {_.sortBy(alerts, alertDescription).map((a, i) => <ResourceRow key={i} obj={a}>
      <div className="col-xs-6">
        <Link className="co-resource-item" to={alertURL(a, ruleID)}>{alertDescription(a)}</Link>
      </div>
      <div className="col-sm-2 hidden-xs"><Timestamp timestamp={a.activeAt} /></div>
      <div className="col-sm-2 col-xs-3"><AlertState state={a.state} /></div>
      <div className="col-sm-2 col-xs-3 co-truncate">{a.value}</div>
      {a.state !== AlertStates.Silenced && <div className="dropdown-kebab-pf"><Kebab options={[silenceAlert(a)]} /></div>}
    </ResourceRow>)}
  </div>
</div>;

const ruleStateToProps = (state, {match}): AlertRulesDetailsPageProps => {
  const {data, loaded, loadError}: Alerts = alertsToProps(state);
  const id = _.get(match, 'params.id');
  const alert = _.find(data, a => a.rule.id === id);
  return {loaded, loadError, rule: _.get(alert, 'rule')};
};

const AlertRulesDetailsPage = withFallback(connect(ruleStateToProps)((props: AlertRulesDetailsPageProps) => {
  const {loaded, loadError, rule} = props;
  const {alerts = [], annotations = {}, duration = null, labels = {}, name = '', query = ''} = rule || {};
  const {severity} = labels as any;

  return <React.Fragment>
    <Helmet>
      <title>{`${name || AlertRuleResource.label} · Details`}</title>
    </Helmet>
    <StatusBox data={rule} label={AlertRuleResource.label} loaded={loaded} loadError={loadError}>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-resource-item"><MonitoringResourceIcon className="co-m-resource-icon--lg" resource={AlertRuleResource} />{name}</div>
        </h1>
      </div>
      <div className="co-m-pane__body">
        <div className="monitoring-heading">
          <SectionHeading text="Alerting Rule Overview" />
        </div>
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Name</dt>
                <dd>{name}</dd>
                {severity && <React.Fragment>
                  <dt>Severity</dt>
                  <dd>{_.startCase(severity)}</dd>
                </React.Fragment>}
                <Annotation title="Description">{annotations.description}</Annotation>
                <Annotation title="Summary">{annotations.summary}</Annotation>
                <Annotation title="Message">{annotations.message}</Annotation>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                {_.isInteger(duration) && <React.Fragment>
                  <dt>For</dt>
                  <dd>{formatPrometheusDuration(duration * 1000)}</dd>
                </React.Fragment>}
                <dt>Expression</dt>
                <dd>
                  <Link to={`/monitoring/query-browser?query=${encodeURIComponent(query)}`}>
                    <pre className="co-pre-wrap monitoring-query">{query}</pre>
                  </Link>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Active Alerts">
            <ToggleGraph />
          </SectionHeading>
          <div className="row">
            <div className="col-sm-12">
              <Graph rule={rule} />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              {_.isEmpty(alerts) ? <div className="text-center">None Found</div> : <ActiveAlerts alerts={alerts} ruleID={rule.id} />}
            </div>
          </div>
        </div>
      </div>
    </StatusBox>
  </React.Fragment>;
}));

const SilencedAlertsList = ({alerts}) => _.isEmpty(alerts)
  ? <div className="text-center">None Found</div>
  : <div className="co-m-table-grid co-m-table-grid--bordered">
    <div className="row co-m-table-grid__head">
      <div className="col-xs-9">Name</div>
      <div className="col-xs-3">Severity</div>
    </div>
    <div className="co-m-table-grid__body">
      {_.sortBy(alerts, alertDescription).map((a, i) => <div className="row co-resource-list__item" key={i}>
        <div className="col-xs-9">
          <Link className="co-resource-item" to={alertURL(a, a.rule.id)}>{a.labels.alertname}</Link>
          <div className="monitoring-description">{alertDescription(a)}</div>
        </div>
        <div className="col-xs-3">{a.labels.severity || '-'}</div>
        <div className="dropdown-kebab-pf">
          <Kebab options={[viewAlertRule(a)]} />
        </div>
      </div>)}
    </div>
  </div>;

const silenceParamToProps = (state, {match}) => {
  const {data: silences, loaded, loadError}: Silences = silencesToProps(state);
  const {loaded: alertsLoaded}: Alerts = alertsToProps(state);
  const silence = _.find(silences, {id: _.get(match, 'params.id')});
  return {alertsLoaded, loaded, loadError, silence};
};

const SilencesDetailsPage = withFallback(connect(silenceParamToProps)((props: SilencesDetailsPageProps) => {
  const {alertsLoaded, loaded, loadError, silence} = props;
  const {createdBy = '', comment = '', endsAt = '', firingAlerts = [], matchers = {}, name = '', startsAt = '', updatedAt = ''} = silence || {};

  return <React.Fragment>
    <Helmet>
      <title>{`${name || SilenceResource.label} · Details`}</title>
    </Helmet>
    <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-resource-item"><MonitoringResourceIcon className="co-m-resource-icon--lg" resource={SilenceResource} />{name}</div>
          <SilenceActionsMenu silence={silence} />
        </h1>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Silence Overview" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                {name && <React.Fragment>
                  <dt>Name</dt>
                  <dd>{name}</dd>
                </React.Fragment>}
                <dt>Matchers</dt>
                <dd>{_.isEmpty(matchers)
                  ? <div className="text-muted">No matchers</div>
                  : <SilenceMatchersList silence={silence} />
                }</dd>
                <dt>State</dt>
                <dd><SilenceState silence={silence} /></dd>
                <dt>Last Updated At</dt>
                <dd><Timestamp timestamp={updatedAt} /></dd>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>Starts At</dt>
                <dd><Timestamp timestamp={startsAt} /></dd>
                <dt>Ends At</dt>
                <dd><Timestamp timestamp={endsAt} /></dd>
                <dt>Created By</dt>
                <dd>{createdBy || '-'}</dd>
                <dt>Comments</dt>
                <dd>{comment || '-'}</dd>
                <dt>Firing Alerts</dt>
                <dd>{alertsLoaded ? firingAlerts.length : <LoadingInline />}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Firing Alerts" />
          <div className="row">
            <div className="col-xs-12">
              {alertsLoaded ? <SilencedAlertsList alerts={firingAlerts} /> : <LoadingInline />}
            </div>
          </div>
        </div>
      </div>
    </StatusBox>
  </React.Fragment>;
}));

const tableAlertClasses = [
  classNames('col-sm-7', 'col-xs-8'),
  classNames('col-sm-3', 'col-xs-4'),
  classNames('col-sm-2', 'hidden-xs'),
  Kebab.columnClass,
];

const AlertTableRow: React.FC<AlertTableRowProps> = ({obj, index, key, style}) => {
  const {annotations = {}, labels} = obj;
  const state = alertState(obj);
  return (
    <TableRow id={obj.rule.id} index={index} trKey={key} style={style}>
      <TableData className={tableAlertClasses[0]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={AlertResource} />
          <Link to={alertURL(obj, obj.rule.id)} data-test-id="alert-resource-link" className="co-resource-item__resource-name">{labels && labels.alertname}</Link>
        </div>
        <div className="monitoring-description">{annotations.description || annotations.message}</div>
      </TableData>
      <TableData className={tableAlertClasses[1]}>
        <AlertState state={state} />
        <AlertStateDescription alert={obj} />
      </TableData>
      <TableData className={classNames(tableAlertClasses[2], 'co-truncate')}>
        {_.startCase(_.get(labels, 'severity')) || '-'}
      </TableData>
      <TableData className={tableAlertClasses[3]}>
        <Kebab options={state === AlertStates.Firing || state === AlertStates.Pending ? [silenceAlert(obj), viewAlertRule(obj)] : [viewAlertRule(obj)]} />
      </TableData>
    </TableRow>
  );
};
AlertTableRow.displayName = 'AlertTableRow';
type AlertTableRowProps = {
  obj: Alert;
  index: number;
  key?: string;
  style: object;
};

const AlertTableHeader = () => [
  {
    title: 'Name', sortField: 'labels.alertname', transforms: [sortable],
    props: { className: tableAlertClasses[0] },
  },
  {
    title: 'State', sortFunc: 'alertStateOrder', transforms: [sortable],
    props: { className: tableAlertClasses[1] },
  },
  {
    title: 'Severity', sortField: 'labels.severity', transforms: [sortable],
    props: { className: tableAlertClasses[2] },
  },
  {
    title: '',
    props: { className: tableAlertClasses[3] },
  },
];
AlertTableHeader.displayName = 'AlertTableHeader';

const AlertsPageDescription = () => <p className="co-help-text">
  Alerts help notify you when certain conditions in your environment are met. <ExternalLink href="https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/" text="Learn more about how alerts are configured." />
</p>;

const HeaderAlertmanagerLink_ = ({path, urls}) => _.isEmpty(urls[MonitoringRoutes.AlertManager])
  ? null
  : <span className="monitoring-header-link">
    <ExternalLink href={`${urls[MonitoringRoutes.AlertManager]}${path || ''}`} text="Alertmanager UI" />
  </span>;
const HeaderAlertmanagerLink = connectToURLs(MonitoringRoutes.AlertManager)(HeaderAlertmanagerLink_);

const HeaderPrometheusLink_ = ({queries, urls}) => {
  const url = getPrometheusExpressionBrowserURL(urls, queries);
  return _.isEmpty(url)
    ? null
    : <span className="monitoring-header-link">
      <ExternalLink href={url} text="Prometheus UI" />
    </span>;
};
const HeaderPrometheusLink = connectToURLs(MonitoringRoutes.Prometheus)(HeaderPrometheusLink_);

const alertsRowFilter = {
  type: 'alert-state',
  selected: [AlertStates.Firing, AlertStates.Silenced, AlertStates.Pending],
  reducer: alertState,
  items: [
    {id: AlertStates.Firing, title: 'Firing'},
    {id: AlertStates.Silenced, title: 'Silenced'},
    {id: AlertStates.Pending, title: 'Pending'},
    {id: AlertStates.NotFiring, title: 'Not Firing'},
  ],
};

// Row filter settings are stored in "k8s"
const filtersToProps = ({k8s}, {reduxID}) => {
  const filtersMap = k8s.getIn([reduxID, 'filters']);
  return {filters: filtersMap ? filtersMap.toJS() : null};
};

const MonitoringListPage = connect(filtersToProps)(class InnerMonitoringListPage extends React.Component<ListPageProps> {
  props: ListPageProps;
  defaultNameFilter: string;

  constructor(props) {
    super(props);
    this.applyTextFilter = this.applyTextFilter.bind(this);
  }

  applyTextFilter(e) {
    const v = e.target.value;
    const {nameFilterID, reduxID} = this.props;
    store.dispatch(k8sActions.filterList(reduxID, nameFilterID, v));

    const params = new URLSearchParams(window.location.search);
    if (v) {
      params.set(nameFilterID, v);
    } else {
      params.delete(nameFilterID);
    }
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }

  componentWillMount() {
    const {nameFilterID, reduxID} = this.props;
    const params = new URLSearchParams(window.location.search);

    // Ensure the current name filter value matches the name filter GET param
    this.defaultNameFilter = params.get(nameFilterID);
    store.dispatch(k8sActions.filterList(reduxID, nameFilterID, this.defaultNameFilter));

    if (!params.get('sortBy')) {
      // Sort by rule name by default
      store.dispatch(UIActions.sortList(reduxID, 'name', undefined, 'asc', 'Name'));
    }
  }

  render() {
    const {alertmanagerLinkPath, CreateButton, data, filters, Header, kindPlural, loaded, loadError, PageDescription, reduxID, Row, rowFilter} = this.props;

    return <React.Fragment>
      <Helmet>
        <title>{kindPlural}</title>
      </Helmet>
      <div className="co-m-nav-title">
        <h1 className="co-m-pane__heading">
          <span>{kindPlural}<HeaderAlertmanagerLink path={alertmanagerLinkPath} /></span>
        </h1>
        <PageDescription />
      </div>
      <div className="co-m-pane__filter-bar">
        {CreateButton && <div className="co-m-pane__filter-bar-group">
          <CreateButton />
        </div>}
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter defaultValue={this.defaultNameFilter} label={`${kindPlural} by name`} onChange={this.applyTextFilter} />
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <CheckBoxes
            items={rowFilter.items}
            itemCount={_.size(data)}
            numbers={_.countBy(data, rowFilter.reducer)}
            reduxIDs={[reduxID]}
            selected={rowFilter.selected}
            type={rowFilter.type}
          />
        </div>
        <div className="row">
          <div className="col-xs-12">
            <Table
              aria-label={kindPlural}
              data={data}
              filters={filters}
              Header={Header}
              loaded={loaded}
              loadError={loadError}
              reduxID={reduxID}
              Row={Row}
              virtualize
            />
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
});

const AlertsPage_ = props => <MonitoringListPage
  {...props}
  Header={AlertTableHeader}
  kindPlural="Alerts"
  nameFilterID="alert-name"
  PageDescription={AlertsPageDescription}
  reduxID="monitoringRules"
  Row={AlertTableRow}
  rowFilter={alertsRowFilter}
/>;
const AlertsPage = withFallback(connect(alertsToProps)(AlertsPage_));

const tableSilenceClasses = [
  classNames('col-sm-7', 'col-xs-8'),
  classNames('col-sm-3', 'col-xs-4'),
  classNames('col-sm-2', 'hidden-xs'),
  Kebab.columnClass,
];

const SilenceTableHeader = () => [
  {
    title: 'Name', sortField: 'name', transforms: [sortable],
    props: { className: tableSilenceClasses[0] },
  },
  {
    title: 'State', sortFunc: 'silenceStateOrder', transforms: [sortable],
    props: { className: tableSilenceClasses[1] },
  },
  {
    title: 'Firing Alerts', sortField: 'firingAlerts.length', transforms: [sortable],
    props: { className: tableSilenceClasses[2] },
  },
  {
    title: '',
    props: { className: tableSilenceClasses[3] },
  },
];
SilenceTableHeader.displayName = 'SilenceTableHeader';

const SilenceRow = ({obj}) => {
  const state = silenceState(obj);

  return <ResourceRow obj={obj}>
    <div className="col-sm-7 col-xs-8">
      <div className="co-resource-item">
        <MonitoringResourceIcon resource={SilenceResource} />
        <Link className="co-resource-item__resource-name" data-test-id="silence-resource-link" title={obj.id} to={`${SilenceResource.plural}/${obj.id}`}>{obj.name}</Link>
      </div>
      <div className="monitoring-label-list">
        <SilenceMatchersList silence={obj} />
      </div>
    </div>
    <div className="col-sm-3 col-xs-4">
      <SilenceState silence={obj} />
      {state === SilenceStates.Pending && <StateTimestamp text="Starts" timestamp={obj.startsAt} />}
      {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={obj.endsAt} />}
      {state === SilenceStates.Expired && <StateTimestamp text="Expired" timestamp={obj.endsAt} />}
    </div>
    <div className="col-sm-2 hidden-xs">{obj.firingAlerts.length}</div>
    <div className="dropdown-kebab-pf">
      <SilenceKebab silence={obj} />
    </div>
  </ResourceRow>;
};

const SilenceTableRow: React.FC<SilenceTableRowProps> = ({obj, index, key, style}) => {
  const state = silenceState(obj);
  return (
    <TableRow id={obj.id} index={index} trKey={key} style={style}>
      <TableData className={tableSilenceClasses[0]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link className="co-resource-item__resource-name" data-test-id="silence-resource-link" title={obj.id} to={`${SilenceResource.plural}/${obj.id}`}>{obj.name}</Link>
        </div>
        <div className="monitoring-label-list">
          <SilenceMatchersList silence={obj} />
        </div>
      </TableData>
      <TableData className={classNames(tableSilenceClasses[1], 'co-break-word')}>
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && <StateTimestamp text="Starts" timestamp={obj.startsAt} />}
        {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={obj.endsAt} />}
        {state === SilenceStates.Expired && <StateTimestamp text="Expired" timestamp={obj.endsAt} />}
      </TableData>
      <TableData className={tableSilenceClasses[2]}>
        {obj.firingAlerts.length}
      </TableData>
      <TableData className={tableSilenceClasses[3]}>
        <SilenceKebab silence={obj} />
      </TableData>
    </TableRow>
  );
};
SilenceTableRow.displayName = 'SilenceTableRow';
export type SilenceTableRowProps = {
  obj: Silence;
  index: number;
  key?: string;
  style: object;
};

const SilencesPageDescription = () => <p className="co-help-text">
  Silences temporarily mute alerts based on a set of conditions that you define. Notifications are not sent for alerts that meet the given conditions.
</p>;

const silencesRowFilter = {
  type: 'silence-state',
  selected: [SilenceStates.Active, SilenceStates.Pending],
  reducer: silenceState,
  items: [
    {id: SilenceStates.Active, title: 'Active'},
    {id: SilenceStates.Pending, title: 'Pending'},
    {id: SilenceStates.Expired, title: 'Expired'},
  ],
};

const CreateButton = () => <Link className="co-m-primary-action" to="/monitoring/silences/~new">
  <button className="btn btn-primary">Create Silence</button>
</Link>;

const SilencesPage_ = props => <MonitoringListPage
  {...props}
  alertmanagerLinkPath="/#/silences"
  CreateButton={CreateButton}
  Header={SilenceTableHeader}
  kindPlural="Silences"
  nameFilterID="silence-name"
  PageDescription={SilencesPageDescription}
  reduxID="monitoringSilences"
  Row={SilenceTableRow}
  rowFilter={silencesRowFilter}
/>;
const SilencesPage = withFallback(connect(silencesToProps)(SilencesPage_));

const pad = i => i < 10 ? `0${i}` : i;
const formatDate = (d: Date): string => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const toISODate = (dateStr: string): string => {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? undefined : (new Date(timestamp)).toISOString();
};

const Text = props => <input {...props} type="text" className="form-control form-control--silence-text" />;

const Datetime = props => {
  const pattern = '\\d{4}/(0?[1-9]|1[012])/(0?[1-9]|[12]\\d|3[01]) (0?\\d|1\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?';
  const tooltip = (new RegExp(`^${pattern}$`)).test(props.value) ? toISODate(props.value) : 'Invalid date / time';
  return <div>
    <Tooltip content={[<span className="co-nowrap" key="co-timestamp">{tooltip}</span>]}>
      <Text {...props} pattern={pattern} placeholder="YYYY/MM/DD hh:mm:ss" />
    </Tooltip>
  </div>;
};

class SilenceForm_ extends React.Component<SilenceFormProps, SilenceFormState> {
  constructor(props) {
    super(props);

    const now = new Date();
    const startsAt = formatDate(now);
    const endsAt = formatDate(new Date(now.setHours(now.getHours() + 2)));
    const data = _.defaults(props.defaults, {startsAt, endsAt, matchers: [], createdBy: '', comment: ''});
    this.state = {data, error: undefined, inProgress: false};

    if (_.isEmpty(data.matchers)) {
      this.addMatcher();
    }
  }

  setField = (path: string, v: any): void => {
    const data = Object.assign({}, this.state.data);
    _.set(data, path, v);
    this.setState({data});
  }

  onFieldChange = (path: string): ((e) => void) => {
    return e => this.setField(path, e.target.value);
  }

  onIsRegexChange = (e, i: number): void => {
    this.setField(`matchers[${i}].isRegex`, e.target.checked);
  }

  addMatcher = (): void => {
    this.setField(`matchers[${this.state.data.matchers.length}]`, {name: '', value: '', isRegex: false});
  }

  removeMatcher = (i: number): void => {
    const data = Object.assign({}, this.state.data);
    data.matchers.splice(i, 1);
    this.setState({data});
    if (!data.matchers.length) {
      // All matchers have been removed, so add back a single blank matcher
      this.addMatcher();
    }
  }

  onSubmit = (e): void => {
    e.preventDefault();

    const {alertManagerBaseURL} = window.SERVER_FLAGS;
    if (!alertManagerBaseURL) {
      this.setState({error: 'Alertmanager URL not set'});
      return;
    }

    this.setState({inProgress: true});

    const body = Object.assign({}, this.state.data);
    body.startsAt = toISODate(body.startsAt);
    body.endsAt = toISODate(body.endsAt);

    coFetchJSON.post(`${alertManagerBaseURL}/api/v1/silences`, body)
      .then(({data}) => {
        this.setState({error: undefined});
        refreshPoller('silences');
        history.push(`${SilenceResource.plural}/${encodeURIComponent(_.get(data, 'silenceId'))}`);
      })
      .catch(err => this.setState({error: _.get(err, 'json.error') || err.message || 'Error saving Silence'}))
      .then(() => this.setState({inProgress: false}));
  }

  render() {
    const {Info, saveButtonText, title} = this.props;
    const {data, error, inProgress} = this.state;

    return <div className="co-m-pane__body">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <form className="co-m-pane__body-group silence-form co-m-pane__form" onSubmit={this.onSubmit}>
        <SectionHeading text={title} />
        <p className="co-m-pane__explanation">A silence is configured based on matchers (label selectors). No notification will be sent out for alerts that match all the values or regular expressions.</p>
        <hr />
        {Info && <Info />}

        <div className="form-group">
          <label className="co-required">Start</label>
          <Datetime onChange={this.onFieldChange('startsAt')} value={data.startsAt} required />
        </div>
        <div className="form-group">
          <label className="co-required">End</label>
          <Datetime onChange={this.onFieldChange('endsAt')} value={data.endsAt} required />
        </div>
        <div className="co-form-section__separator"></div>

        <div className="form-group">
          <label className="co-required">Matchers</label> (label selectors)
          <p className="co-help-text">Alerts affected by this silence. Matching alerts must satisfy all of the specified label constraints, though they may have additional labels as well.</p>
          <div className="row monitoring-grid-head text-secondary text-uppercase">
            <div className="col-xs-4">Name</div>
            <div className="col-xs-4">Value</div>
          </div>
          {_.map(data.matchers, (matcher, i) => <div className="row form-group" key={i}>
            <div className="col-xs-4">
              <Text onChange={this.onFieldChange(`matchers[${i}].name`)} placeholder="Name" value={matcher.name} required />
            </div>
            <div className="col-xs-4">
              <Text onChange={this.onFieldChange(`matchers[${i}].value`)} placeholder="Value" value={matcher.value} required />
            </div>
            <div className="col-xs-3">
              <label className="co-no-bold">
                <input type="checkbox" onChange={e => this.onIsRegexChange(e, i)} checked={matcher.isRegex} />&nbsp; Regular Expression
              </label>
            </div>
            <div className="col-xs-1">
              <button type="button" className="btn btn-link" onClick={() => this.removeMatcher(i)} aria-label="Remove matcher">
                <i className="fa fa-minus-circle" aria-hidden="true" />
              </button>
            </div>
          </div>)}
          <button type="button" className="btn btn-link btn--silence-add-more" onClick={this.addMatcher}>
            <i className="fa fa-plus-circle" aria-hidden="true" /> Add More
          </button>
        </div>
        <div className="co-form-section__separator"></div>

        <div className="form-group">
          <label>Creator</label>
          <Text onChange={this.onFieldChange('createdBy')} value={data.createdBy} />
        </div>
        <div className="form-group">
          <label>Comment</label>
          <textarea className="form-control" onChange={this.onFieldChange('comment')} value={data.comment} />
        </div>

        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <button type="submit" className="btn btn-primary">{saveButtonText || 'Save'}</button>
          <Link to={data.id ? `${SilenceResource.plural}/${data.id}` : SilenceResource.plural} className="btn btn-default">Cancel</Link>
        </ButtonBar>
      </form>
    </div>;
  }
}
const SilenceForm = withFallback(SilenceForm_);

const EditInfo = () => <Alert isInline className="co-alert" variant="info" title="Overwriting current silence">When changes are saved, the currently existing silence will be expired and a new silence with the new configuration will take its place.</Alert>;

const EditSilence = connect(silenceParamToProps)(({loaded, loadError, silence}) => {
  const isExpired = silenceState(silence) === SilenceStates.Expired;
  const defaults = _.pick(silence, ['comment', 'createdBy', 'endsAt', 'id', 'matchers', 'startsAt']);
  defaults.startsAt = isExpired ? undefined : formatDate(new Date(defaults.startsAt));
  defaults.endsAt = isExpired ? undefined : formatDate(new Date(defaults.endsAt));
  return <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
    <SilenceForm defaults={defaults} Info={isExpired ? null : EditInfo} title={isExpired ? 'Recreate Silence' : 'Edit Silence'} />
  </StatusBox>;
});

const CreateSilence = () => {
  const matchers = _.map(getURLSearchParams(), (value, name) => ({name, value, isRegex: false}));
  return _.isEmpty(matchers)
    ? <SilenceForm saveButtonText="Create" title="Create Silence" />
    : <SilenceForm defaults={{matchers}} saveButtonText="Create" title="Silence Alert" />;
};

const MetricsDropdown = ({onChange}) => {
  const [items, setItems] = React.useState({});
  const [isError, setIsError] = React.useState(false);

  const safeFetch = React.useCallback(useSafeFetch(), []);

  React.useEffect(() => {
    safeFetch(`${PROMETHEUS_BASE_PATH}/${PrometheusEndpoint.LABEL}/__name__/values`)
      .then(({data}) => setItems(_.zipObject(data, data)))
      .catch(() => setIsError(true));
  }, [safeFetch]);

  let title: React.ReactNode = 'Insert Metric at Cursor';
  if (isError) {
    title = 'Failed to load metrics list';
  } else if (_.isEmpty(items)) {
    title = <LoadingInline />;
  }

  return <Dropdown
    autocompleteFilter={fuzzy}
    buttonClassName="btn-default query-browser__metrics-dropdown"
    id="metrics-dropdown"
    items={items}
    menuClassName="query-browser__metrics-dropdown-menu"
    onChange={onChange}
    title={title}
  />;
};

const SeriesIcon = ({colorIndex, isDisabled, onClick}) => <div
  className={classNames('query-browser-metric__color', {'query-browser-metric__color--disabled': isDisabled})}
  onClick={onClick}
  style={isDisabled ? undefined : {backgroundColor: graphColors[colorIndex % graphColors.length]}}
></div>;

const Query: React.FC<QueryProps> = ({colorOffset, onBlur, onDelete, onSubmit, onUpdate, query}) => {
  const {allSeries, disabledSeries, enabled, expanded, text} = query;

  const toggleEnabled = () => onUpdate({enabled: !enabled, expanded: !enabled, query: enabled ? '' : text});

  const toggleAllSeries = () => onUpdate({disabledSeries: _.isEmpty(disabledSeries) ? _.map(allSeries, 'labels') : []});

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Enter+Shift inserts newlines, Enter alone runs the query
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const kebabOptions = [
    {label: `${enabled ? 'Disable' : 'Enable'} query`, callback: toggleEnabled},
    {label: `${_.isEmpty(disabledSeries) ? 'Hide' : 'Show'} all series`, callback: toggleAllSeries},
    {label: 'Delete query', callback: onDelete},
  ];

  return <div className="group">
    <div className="group__title">
      <button
        className="btn btn-link query-browser__table-toggle-btn"
        onClick={() => onUpdate({expanded: !expanded})}
        title={`${expanded ? 'Hide' : 'Show'} Table`}
      >
        <i aria-hidden="true" className={`fa fa-angle-${expanded ? 'down' : 'right'} query-browser__table-toggle-icon`} />
      </button>
      <textarea
        autoFocus={true}
        className="form-control query-browser__query"
        onBlur={onBlur}
        onChange={e => onUpdate({text: e.target.value})}
        onKeyDown={onKeyDown}
        placeholder="Expression (press Shift+Enter for newlines)"
        value={text}
      />
      <div className="query-browser__query-switch">
        <Switch aria-label={`${enabled ? 'Disable' : 'Enable'} query`} isChecked={enabled} onChange={toggleEnabled} />
      </div>
      <div className="dropdown-kebab-pf query-browser__kebab">
        <Kebab options={kebabOptions} />
      </div>
    </div>
    {expanded && <div className="group__body group__body--query-browser">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-9 query-browser-metric__wrapper">
            <div className="query-browser-metric__color"></div>
            Series
          </div>
          <div className="col-xs-3">Value</div>
        </div>
        <div className="co-m-table-grid__body">
          {_.map(allSeries, ({labels, value}, i) => <div className="row" key={i}>
            <div className="col-xs-9 query-browser-metric__wrapper">
              <SeriesIcon
                colorIndex={colorOffset + i}
                isDisabled={_.some(disabledSeries, s => _.isEqual(s, labels))}
                onClick={() => onUpdate({disabledSeries: _.xorWith(disabledSeries, [labels], _.isEqual)})}
              />
              <div className="query-browser-metric__labels">
                {_.isEmpty(labels)
                  ? <span className="text-muted">{'{}'}</span>
                  : _.map(labels, (v, k) => `${k}="${v}"`).join(',')}
              </div>
            </div>
            <div className="col-xs-3">{value}</div>
          </div>)}
        </div>
      </div>
    </div>}
  </div>;
};

const QueryBrowserPage = withFallback(() => {
  const [focusedQuery, setFocusedQuery] = React.useState();
  const [restoreSelection, setRestoreSelection] = React.useState();

  const defaultQuery = getURLSearchParams().query || '';

  // `text` is the current string in the text input and `query` is the value displayed in the graph
  const [queries, setQueries] = React.useState([{
    disabledSeries: [],
    enabled: true,
    expanded: true,
    query: defaultQuery,
    text: defaultQuery,
  }]);

  const defaultQueryObj = {disabledSeries: [], enabled: true, expanded: true, query: '', text: ''};

  const updateQuery = (i: number, patch: PrometheusQuery) => {
    setQueries(_.map(queries, (q, j) => i === j ? Object.assign({}, q, patch) : q));
  };

  const addQuery = () => setQueries([...queries, defaultQueryObj]);

  const deleteAllQueries = () => setQueries([defaultQueryObj]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueries(queries.map(q => q.enabled ? Object.assign({}, q, {query: q.text}) : q));
  };

  const isAllExpanded = _.every(queries, 'expanded');
  const toggleAllExpanded = () => setQueries(_.map(queries, q => Object.assign({}, q, {expanded: !isAllExpanded})));

  const actionsMenuActions = [
    {label: 'Add query', callback: addQuery},
    {label: `${isAllExpanded ? 'Collapse' : 'Expand'} all query tables`, callback: toggleAllExpanded},
    {label: 'Delete all queries', callback: deleteAllQueries},
  ];

  const onDataUpdate = (allQueries: PrometheusSeries[][]) => {
    const newQueries = _.map(allQueries, (querySeries, i) => {
      const allSeries = _.map(querySeries, s => ({
        labels: _.omit(s.metric, '__name__'),
        value: parseFloat(_.last(s.values)[1]),
      }));
      return Object.assign({}, queries[i], {allSeries});
    });
    setQueries(newQueries);
  };

  const onMetricChange = (metric: string) => {
    if (focusedQuery) {
      // Replace the currently selected text with the metric
      const {index, selection, target} = focusedQuery;
      const oldText = _.get(queries, [index, 'text']);
      const text = oldText.substring(0, selection.start) + metric + oldText.substring(selection.end);
      updateQuery(index, {text});
      target.focus();

      // Restore the cursor position / currently selected text
      setRestoreSelection([selection.start, selection.start + metric.length]);
    } else {
      // No focused query, so add the metric to the end of the first query input
      updateQuery(0, {text: _.get(queries, [0, 'text']) + metric});
    }
  };

  React.useEffect(() => {
    if (focusedQuery && restoreSelection) {
      focusedQuery.target.setSelectionRange(...restoreSelection);
    }
  }, [focusedQuery, restoreSelection]);

  let colorOffset = 0;

  return <React.Fragment>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">
        <span>Metrics<HeaderPrometheusLink queries={_.map(queries, 'query')} /></span>
        <div className="co-actions">
          <ActionsMenu actions={actionsMenuActions} />
        </div>
      </h1>
    </div>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12 text-right">
          <ToggleGraph />
        </div>
      </div>
      <div className="row">
        <div className="col-xs-12">
          <QueryBrowser
            defaultTimespan={30 * 60 * 1000}
            disabledSeries={_.map(queries, 'disabledSeries')}
            onDataUpdate={onDataUpdate}
            queries={_.map(queries, 'query')}
          />
          <form onSubmit={onSubmit}>
            <div className="query-browser__all-queries-controls">
              <MetricsDropdown onChange={onMetricChange} />
              <div>
                <button type="button" className="btn" onClick={addQuery}>Add Query</button>
                <button type="submit" className="btn btn-primary">Run Queries</button>
              </div>
            </div>
            {_.map(queries, (q, i) => {
              const deleteQuery = () => setQueries(queries.length <= 1
                ? [defaultQueryObj]
                : queries.filter((v, k) => k !== i));

              const onBlur = e => {
                if (_.get(e, 'relatedTarget.id') === 'metrics-dropdown') {
                  // Focus has shifted from a query input to the metrics dropdown, so store the cursor position so we
                  // know where to insert the metric when it is selected
                  setFocusedQuery({
                    index: i,
                    selection: {
                      start: e.target.selectionStart,
                      end: e.target.selectionEnd,
                    },
                    target: e.target,
                  });
                } else {
                  // Focus is shifting to somewhere other than the metrics dropdown, so don't track the cursor position
                  setFocusedQuery(undefined);
                }
              };

              colorOffset += _.get(queries, [i - 1, 'allSeries', 'length'], 0);

              return <Query
                colorOffset={colorOffset}
                key={i}
                onBlur={onBlur}
                onDelete={deleteQuery}
                onSubmit={onSubmit}
                onUpdate={patch => updateQuery(i, patch)}
                query={q}
              />;
            })}
          </form>
        </div>
      </div>
    </div>
  </React.Fragment>;
});

export class MonitoringUI extends React.Component<null, null> {
  componentDidMount() {
    const poll = (url: string, key: 'alerts' | 'silences', dataHandler: (data: any[]) => any): void => {
      store.dispatch(UIActions.monitoringLoading(key));
      const poller = (): void => {
        coFetchJSON(url)
          .then(({data}) => dataHandler(data))
          .then(data => store.dispatch(UIActions.monitoringLoaded(key, data)))
          .catch(e => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => pollerTimeouts[key] = setTimeout(poller, 15 * 1000));
      };
      pollers[key] = poller;
      poller();
    };

    const {alertManagerBaseURL, prometheusBaseURL} = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      poll(`${prometheusBaseURL}/api/v1/rules`, 'alerts', data => {
        // Flatten the rules data to make it easier to work with, discard non-alerting rules since those are the only
        // ones we will be using and add a unique ID to each rule.
        const groups = _.get(data, 'groups');
        const rules = _.flatMap(groups, g => {
          const addID = r => {
            const key = [g.file, g.name, r.name, r.duration, r.query, ..._.map(r.labels, (k, v) => `${k}=${v}`)].join(',');
            r.id = String(murmur3(key, 'monitoring-salt'));
            return r;
          };

          return _.filter(g.rules, {type: 'alerting'}).map(addID);
        });

        // If a rule is has no active alerts, create a "fake" alert
        return _.flatMap(rules, rule => _.isEmpty(rule.alerts)
          ? buildNotFiringAlert(rule)
          : rule.alerts.map(a => ({rule, ...a}))
        );
      });
    } else {
      store.dispatch(UIActions.monitoringErrored('alerts', new Error('prometheusBaseURL not set')));
    }

    if (alertManagerBaseURL) {
      poll(`${alertManagerBaseURL}/api/v1/silences`, 'silences', data => {
        // Set a name field on the Silence to make things easier
        _.each(data, s => {
          s.name = _.get(_.find(s.matchers, {name: 'alertname'}), 'value');
          if (!s.name) {
            // No alertname, so fall back to displaying the other matchers
            s.name = s.matchers.map(m => `${m.name}${m.isRegex ? '=~' : '='}${m.value}`).join(', ');
          }
        });
        return data;
      });
    } else {
      store.dispatch(UIActions.monitoringErrored('silences', new Error('alertManagerBaseURL not set')));
    }
  }

  componentWillUnmount() {
    _.each(pollerTimeouts, t => clearTimeout(t));
  }

  render() {
    return <RouteSwitch>
      <Redirect from="/monitoring" exact to="/monitoring/alerts" />
      <Route path="/monitoring/alerts" exact component={AlertsPage} />
      <Route path="/monitoring/alerts/:ruleID" exact component={AlertsDetailsPage} />
      <Route path="/monitoring/alertrules/:id" exact component={AlertRulesDetailsPage} />
      <Route path="/monitoring/silences" exact component={SilencesPage} />
      <Route path="/monitoring/silences/~new" exact component={CreateSilence} />
      <Route path="/monitoring/silences/:id" exact component={SilencesDetailsPage} />
      <Route path="/monitoring/silences/:id/edit" exact component={EditSilence} />
      <Route path="/monitoring/query-browser" exact component={QueryBrowserPage} />
    </RouteSwitch>;
  }
}

type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  // eslint-disable-next-line no-use-before-define
  firingAlerts: Alert[];
  id?: string;
  matchers: {name: string, value: string, isRegex: boolean}[];
  name?: string;
  startsAt: string;
  status?: {state: SilenceStates};
  updatedAt?: string;
};
type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};
type Alert = {
  activeAt?: string;
  annotations: any;
  labels: {
    alertname: string,
    [key: string]: string,
  };
  rule: any;
  silencedBy?: Silence[];
  state: AlertStates;
  value?: number;
};
type Rule = {
  alerts: Alert[];
  annotations: any;
  duration: number;
  id: string;
  labels: Labels;
  name: string;
  query: string;
};
type Alerts = {
  data: Alert[];
  loaded: boolean;
  loadError?: string;
};
type AlertStateProps = {
  state: AlertStates;
};
export type AlertsDetailsPageProps = {
  alert: Alert;
  loaded: boolean;
  loadError?: string;
  rule: Rule;
  silencesLoaded: boolean;
};
export type AlertRulesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  rule: Rule;
};
export type SilencesDetailsPageProps = {
  alertsLoaded: boolean;
  loaded: boolean;
  loadError?: string;
  silence: Silence;
};
export type SilenceFormProps = {
  defaults?: any;
  Info: React.ComponentType<{}>;
  saveButtonText?: string;
  title: string;
  urls: {key: string}[];
};
export type SilenceFormState = {
  data: Silence;
  error: string;
  inProgress: boolean;
};
export type ListPageProps = {
  alertmanagerLinkPath: string;
  CreateButton: React.ComponentType<{}>;
  data: Rule[] | Silence[];
  filters: {[key: string]: any};
  // Header: React.ComponentType<any>;
  Header: (...args) => any[];
  itemCount: number;
  kindPlural: string;
  loaded: boolean;
  loadError?: string;
  match: {path: string};
  nameFilterID: string;
  PageDescription: React.ComponentType<{}>;
  reduxID: string;
  Row: React.ComponentType<any>;
  rowFilter: {type: string, selected: string[], reducer: (any) => string, items: {id: string, title: string}[]};
};
type PrometheusQuery = {
  allSeries?: {labels: Labels, value: number}[];
  disabledSeries?: Labels[];
  enabled?: boolean;
  expanded?: boolean;
  query?: string;
  text?: string;
};
type QueryProps = {
  colorOffset: number;
  onBlur: (e: React.FocusEvent) => void;
  onDelete: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onUpdate: (patch: PrometheusQuery) => void;
  query: PrometheusQuery;
};
