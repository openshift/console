import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { murmur3 } from 'murmurhash-js';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link, Redirect, Route, Switch } from 'react-router-dom';

import { coFetchJSON } from '../co-fetch';
import k8sActions from '../module/k8s/k8s-actions';
import { AlertStates, connectToURLs, MonitoringRoutes, SilenceStates } from '../monitoring';
import store from '../redux';
import { UIActions } from '../ui/ui-actions';
import { monitoringRulesToProps, monitoringSilencesToProps } from '../ui/ui-reducers';
import { ColHead, List, ListHeader, ResourceRow, TextFilter } from './factory';
import { confirmModal } from './modals';
import { CheckBoxes } from './row-filter';
import { SafetyFirst } from './safety-first';
import { formatDuration } from './utils/datetime';
import { withFallback } from './utils/error-boundary';
import { Tooltip } from './utils/tooltip';
import {
  ActionsMenu,
  ButtonBar,
  Kebab,
  ExternalLink,
  getURLSearchParams,
  history,
  SectionHeading,
  StatusBox,
  Timestamp,
} from './utils';

const AlertResource = {
  kind: 'Alert',
  label: 'Alert',
  path: '/monitoring/alerts',
  abbr: 'AL',
};

const AlertRuleResource = {
  kind: 'AlertRule',
  label: 'Alert Rule',
  path: '/monitoring/alertrules',
  abbr: 'AR',
};

const SilenceResource = {
  kind: 'Silence',
  label: 'Silence',
  path: '/monitoring/silences',
  abbr: 'SL',
};

const labelsToParams = labels => _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

const alertURL = alert => `${AlertResource.path}/${_.get(alert.labels, 'alertname')}?${labelsToParams(alert.labels)}`;
const ruleURL = rule => `${AlertRuleResource.path}/${_.get(rule, 'id')}`;

export const alertState = a => _.get(a, 'state', AlertStates.NotFiring);

const alertDescription = alert => {
  const {annotations = {}, labels = {}} = alert;
  return annotations.description || annotations.message || labels.alertname;
};

export const silenceState = s => _.get(s, 'status.state');

const pollers = {};
const pollerTimeouts = {};

// Force a poller to execute now instead of waiting for the next poll interval
const refreshPoller = key => {
  clearTimeout(pollerTimeouts[key]);
  _.invoke(pollers, key);
};

const silenceAlert = alert => ({
  label: 'Silence Alert',
  href: `${SilenceResource.path}/new?${labelsToParams(alert.labels)}`,
});

const viewAlertRule = alert => ({
  label: 'View Alert Rule',
  href: ruleURL(alert.rule),
});

const editSilence = silence => ({
  label: 'Edit Silence',
  href: `${SilenceResource.path}/${silence.id}/edit`,
});

const cancelSilence = (silence) => ({
  label: 'Expire Silence',
  callback: () => confirmModal({
    title: 'Expire Silence',
    message: 'Are you sure you want to expire this silence?',
    btnText: 'Expire Silence',
    executeFn: () => coFetchJSON.delete(`${(window as any).SERVER_FLAGS.alertManagerBaseURL}/api/v1/silence/${silence.id}`)
      .then(() => refreshPoller('silences')),
  }),
});

const silenceMenuActions = (silence) => silenceState(silence) === SilenceStates.Expired
  ? [editSilence(silence)]
  : [editSilence(silence), cancelSilence(silence)];

const SilenceKebab = ({silence}) => <Kebab options={silenceMenuActions(silence)} />;

const SilenceActionsMenu = ({silence}) => <div className="co-actions">
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
    [AlertStates.Firing]: 'fa fa-bell alert-firing',
    [AlertStates.Silenced]: 'fa fa-bell-slash text-muted',
    [AlertStates.Pending]: 'fa fa-bell-o alert-pending',
  }[state];
  return klass ? <React.Fragment><i className={klass} aria-hidden="true"></i> {_.startCase(state)}</React.Fragment> : null;
};

const SilenceState = ({silence}) => {
  const state = silenceState(silence);
  const klass = {
    [SilenceStates.Active]: 'fa fa-check-circle-o silence-active',
    [SilenceStates.Pending]: 'fa fa-hourglass-half silence-pending',
    [SilenceStates.Expired]: 'fa fa-ban text-muted',
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

const SilenceMatchersList = ({silence}) => <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
  {_.map(silence.matchers, ({name, isRegex, value}) => <Label key={name} k={name} v={isRegex ? `~${value}` : value} />)}
</div>;

const alertStateToProps = (state): AlertsDetailsPageProps => {
  const {data, loaded, loadError}: Rules = monitoringRulesToProps(state);
  const labels = getURLSearchParams();
  const alert = _.find(data, {labels});
  return {alert, loaded, loadError};
};

const AlertsDetailsPage = withFallback(connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
  const {alert, loaded, loadError} = props;
  const {annotations = {}, labels = {}, rule = null, silencedBy = []} = alert || {};
  const {alertname, severity} = labels as any;
  const state = alertState(alert);

  return <React.Fragment>
    <Helmet>
      <title>{`${alertname || AlertResource.label} · Details`}</title>
    </Helmet>
    <StatusBox data={alert} label={AlertResource.label} loaded={loaded} loadError={loadError}>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertResource} />{alertname}</div>
          {(state === AlertStates.Firing || state === AlertStates.Pending) && <div className="co-actions">
            <ActionsMenu actions={[silenceAlert(alert)]} />
          </div>}
        </h1>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Alert Overview" />
        <div className="co-m-pane__body-group">
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
                <dt>Alert Rule</dt>
                <dd>
                  <div className="co-resource-link">
                    <MonitoringResourceIcon resource={AlertRuleResource} />
                    <Link to={ruleURL(rule)} className="co-resource-link__resource-name">{alertname}</Link>
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
      {!_.isEmpty(silencedBy) && <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Silenced By" />
          <div className="row">
            <div className="col-xs-12">
              <div className="co-m-table-grid co-m-table-grid--bordered">
                <SilenceHeader />
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

const ViewInPrometheusLink_ = ({rule, urls}) => {
  const baseUrl = urls[MonitoringRoutes.Prometheus];
  const query = _.get(rule, 'query');
  if (!baseUrl || !query) {
    return null;
  }
  const href = `${baseUrl}/graph?g0.expr=${encodeURIComponent(query)}&g0.tab=0`;
  return <ExternalLink href={href} text="View in Prometheus UI" />;
};
const ViewInPrometheusLink = connectToURLs(MonitoringRoutes.Prometheus)(ViewInPrometheusLink_);

const ActiveAlerts = ({alerts}) => <div className="co-m-table-grid co-m-table-grid--bordered">
  <div className="row co-m-table-grid__head">
    <div className="col-xs-6">Description</div>
    <div className="col-sm-2 hidden-xs">Active Since</div>
    <div className="col-sm-2 col-xs-3">State</div>
    <div className="col-sm-2 col-xs-3">Value</div>
  </div>
  <div className="co-m-table-grid__body">
    {_.sortBy(alerts, alertDescription).map((a, i) => <ResourceRow key={i} obj={a}>
      <div className="col-xs-6">
        <Link className="co-resource-link" to={alertURL(a)}>{alertDescription(a)}</Link>
      </div>
      <div className="col-sm-2 hidden-xs"><Timestamp timestamp={a.activeAt} /></div>
      <div className="col-sm-2 col-xs-3"><AlertState state={a.state} /></div>
      <div className="col-sm-2 col-xs-3 co-break-word">{a.value}</div>
      <div className="co-kebab-wrapper"><Kebab options={[silenceAlert(a)]} /></div>
    </ResourceRow>)}
  </div>
</div>;

const ruleStateToProps = (state, {match}): AlertRulesDetailsPageProps => {
  const {data, loaded, loadError}: Rules = monitoringRulesToProps(state);
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
          <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertRuleResource} />{name}</div>
        </h1>
      </div>
      <div className="co-m-pane__body">
        <div className="monitoring-heading">
          <SectionHeading text="Alert Rule Overview" />
          <ViewInPrometheusLink rule={rule} />
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
                  <dd>{formatDuration(duration * 1000)}</dd>
                </React.Fragment>}
                <dt>Expression</dt>
                <dd><pre className="monitoring-query">{query}</pre></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Active Alerts" />
          <div className="row">
            <div className="col-xs-12">
              {_.isEmpty(alerts) ? <div className="text-center">None Found</div> : <ActiveAlerts alerts={alerts} />}
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
          <Link className="co-resource-link" to={alertURL(a)}>{a.labels.alertname}</Link>
          <div className="monitoring-description">{alertDescription(a)}</div>
        </div>
        <div className="col-xs-3">{a.labels.severity}</div>
        <div className="co-kebab-wrapper">
          <Kebab options={[viewAlertRule(a)]} />
        </div>
      </div>)}
    </div>
  </div>;

const silenceParamToProps = (state, {match}) => {
  const {data: silences, loaded, loadError}: Silences = monitoringSilencesToProps(state);
  const silence = _.find(silences, {id: _.get(match, 'params.id')});
  return {loaded, loadError, silence};
};

const SilencesDetailsPage = withFallback(connect(silenceParamToProps)((props: SilencesDetailsPageProps) => {
  const {loaded, loadError, silence} = props;
  const {createdBy = '', comment = '', endsAt = '', matchers = {}, name = '', silencedAlerts = [], startsAt = '', updatedAt = ''} = silence || {};

  return <React.Fragment>
    <Helmet>
      <title>{`${name || SilenceResource.label} · Details`}</title>
    </Helmet>
    <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={SilenceResource} />{name}</div>
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
                <dt>Silenced Alerts</dt>
                <dd>{silencedAlerts.length}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="co-m-pane__body-group">
          <SectionHeading text="Silenced Alerts" />
          <div className="row">
            <div className="col-xs-12">
              <SilencedAlertsList alerts={silencedAlerts} />
            </div>
          </div>
        </div>
      </div>
    </StatusBox>
  </React.Fragment>;
}));

const AlertRow = ({obj}) => {
  const {annotations = {}, labels = {}} = obj;
  const state = alertState(obj);

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link">
        <MonitoringResourceIcon resource={AlertResource} />
        <Link to={alertURL(obj)} className="co-resource-link__resource-name">{labels.alertname}</Link>
      </div>
      <div className="monitoring-description">{annotations.description || annotations.message}</div>
    </div>
    <div className="col-xs-3">
      <AlertState state={state} />
      <AlertStateDescription alert={obj} />
    </div>
    <div className="col-xs-2">{_.startCase(_.get(labels, 'severity', '-'))}</div>
    <div className="co-kebab-wrapper">
      <Kebab options={state === AlertStates.Firing || state === AlertStates.Pending ? [silenceAlert(obj), viewAlertRule(obj)] : [viewAlertRule(obj)]} />
    </div>
  </ResourceRow>;
};

const AlertHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-7" sortField="labels.alertname">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortFunc="alertStateOrder">State</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="labels.severity">Severity</ColHead>
</ListHeader>;

const AlertsPageDescription = () => <p className="co-help-text">
  Alerts help notify you when certain conditions in your environment are met. <ExternalLink href="https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/" text="Learn more about how alerts are configured." />
</p>;

const HeaderAlertmanagerLink_ = ({path, urls}) => _.isEmpty(urls[MonitoringRoutes.AlertManager])
  ? null
  : <span className="monitoring-header-link">
    <ExternalLink href={`${urls[MonitoringRoutes.AlertManager]}${path || ''}`} text="Alertmanager UI" />
  </span>;
const HeaderAlertmanagerLink = connectToURLs(MonitoringRoutes.AlertManager)(HeaderAlertmanagerLink_);

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
  /* eslint-disable no-undef */
  props: ListPageProps;
  defaultNameFilter: string;
  /* eslint-enable no-undef */

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
          <div className="co-m-pane__name">
            {kindPlural}
            <HeaderAlertmanagerLink path={alertmanagerLinkPath} />
          </div>
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
            numbers={_.countBy(data, rowFilter.reducer)}
            reduxIDs={[reduxID]}
            selected={rowFilter.selected}
            type={rowFilter.type}
          />
        </div>
        <div className="row">
          <div className="col-xs-12">
            <List
              data={data}
              filters={filters}
              Header={Header}
              loaded={loaded}
              loadError={loadError}
              reduxID={reduxID}
              Row={Row}
            />
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
});

const AlertsPage_ = props => <MonitoringListPage
  {...props}
  Header={AlertHeader}
  kindPlural="Alerts"
  nameFilterID="alert-name"
  PageDescription={AlertsPageDescription}
  reduxID="monitoringRules"
  Row={AlertRow}
  rowFilter={alertsRowFilter}
/>;
const AlertsPage = withFallback(connect(monitoringRulesToProps)(AlertsPage_));

const SilenceHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-7" sortField="name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortFunc="silenceStateOrder">State</ColHead>
  <ColHead {...props} className="col-xs-2" sortFunc="numSilencedAlerts">Silenced Alerts</ColHead>
</ListHeader>;

const SilenceRow = ({obj}) => {
  const state = silenceState(obj);

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link">
        <MonitoringResourceIcon resource={SilenceResource} />
        <Link className="co-resource-link__resource-name" title={obj.id} to={`${SilenceResource.path}/${obj.id}`}>{obj.name}</Link>
      </div>
      <div className="monitoring-label-list">
        <SilenceMatchersList silence={obj} />
      </div>
    </div>
    <div className="col-xs-3">
      <SilenceState silence={obj} />
      {state === SilenceStates.Pending && <StateTimestamp text="Starts" timestamp={obj.startsAt} />}
      {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={obj.endsAt} />}
      {state === SilenceStates.Expired && <StateTimestamp text="Expired" timestamp={obj.endsAt} />}
    </div>
    <div className="col-xs-2">{obj.silencedAlerts.length}</div>
    <div className="co-kebab-wrapper">
      <SilenceKebab silence={obj} />
    </div>
  </ResourceRow>;
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

const CreateButton = () => <Link className="co-m-primary-action" to="/monitoring/silences/new">
  <button className="btn btn-primary">Create Silence</button>
</Link>;

const SilencesPage_ = props => <MonitoringListPage
  {...props}
  alertmanagerLinkPath="/#/silences"
  CreateButton={CreateButton}
  Header={SilenceHeader}
  kindPlural="Silences"
  nameFilterID="silence-name"
  PageDescription={SilencesPageDescription}
  reduxID="monitoringSilences"
  Row={SilenceRow}
  rowFilter={silencesRowFilter}
/>;
const SilencesPage = withFallback(connect(monitoringSilencesToProps)(SilencesPage_));

const pad = i => i < 10 ? `0${i}` : i;
const formatDate = (d: Date): string => `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const toISODate = (dateStr: string): string => {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? undefined : (new Date(timestamp)).toISOString();
};

const Text = props => <input {...props} type="text" className="form-control form-control--silence-text" />;

const Datetime = props => <div>
  <Tooltip content={[<span className="co-nowrap" key="co-timestamp">{toISODate(props.value)}</span>]}>
    <Text
      {...props}
      pattern="\d{4}/(0[1-9]|1[012])/(0[1-9]|[12][0-9]|3[01]) ([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?"
      placeholder="YYYY/MM/DD hh:mm:ss"
    />
  </Tooltip>
</div>;

class SilenceForm_ extends SafetyFirst<SilenceFormProps, SilenceFormState> {
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

  /* eslint-disable no-undef */
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

    const {alertManagerBaseURL} = (window as any).SERVER_FLAGS;
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
        history.push(`${SilenceResource.path}/${encodeURIComponent(_.get(data, 'silenceId'))}`);
      })
      .catch(err => this.setState({error: err.json.error}))
      .then(() => this.setState({inProgress: false}));
  }
  /* eslint-enable no-undef */

  render() {
    const {data, error, inProgress} = this.state;

    return <div className="co-m-pane__body">
      <Helmet>
        <title>{this.props.title}</title>
      </Helmet>
      <form className="co-m-pane__body-group silence-form" onSubmit={this.onSubmit}>
        <SectionHeading text={this.props.title} />
        <p className="co-m-pane__explanation">A silence is configured based on matchers (label selectors). No notification will be sent out for alerts that match all the values or regular expressions.</p>
        <hr />

        <div className="form-group">
          <label>Start</label>
          <Datetime onChange={this.onFieldChange('startsAt')} value={data.startsAt} required />
        </div>
        <div className="form-group">
          <label>End</label>
          <Datetime onChange={this.onFieldChange('endsAt')} value={data.endsAt} required />
        </div>
        <hr />

        <div className="form-group">
          <label>Matchers</label> (label selectors)
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
        <hr />

        <div className="form-group">
          <label>Creator</label>
          <Text onChange={this.onFieldChange('createdBy')} value={data.createdBy} />
        </div>
        <div className="form-group">
          <label>Comment</label>
          <textarea className="form-control" onChange={this.onFieldChange('comment')} value={data.comment} />
        </div>
        <hr />

        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <button type="submit" className="btn btn-primary" id="yaml-create">{this.props.saveButtonText || 'Save'}</button>
          <Link to={data.id ? `${SilenceResource.path}/${data.id}` : SilenceResource.path} className="btn btn-default">Cancel</Link>
        </ButtonBar>
      </form>
    </div>;
  }
}
const SilenceForm = withFallback(SilenceForm_);

const EditSilence = connect(silenceParamToProps)(({loaded, loadError, silence}) => {
  const defaults = _.pick(silence, ['comment', 'createdBy', 'endsAt', 'id', 'matchers', 'startsAt']);
  defaults.startsAt = formatDate(new Date(defaults.startsAt));
  defaults.endsAt = formatDate(new Date(defaults.endsAt));
  return <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
    <SilenceForm defaults={defaults} title="Edit Silence" />
  </StatusBox>;
});

const CreateSilence = () => {
  const matchers = _.map(getURLSearchParams(), (value, name) => ({name, value, isRegex: false}));
  return _.isEmpty(matchers)
    ? <SilenceForm saveButtonText="Create" title="Create Silence" />
    : <SilenceForm defaults={{matchers}} saveButtonText="Create" title="Silence Alert" />;
};

export class MonitoringUI extends React.Component<null, null> {
  componentDidMount() {
    const poll = (url: string, key: string, dataHandler: (data: any[]) => any): void => {
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

    const {prometheusBaseURL} = (window as any).SERVER_FLAGS;
    if (prometheusBaseURL) {
      poll(`${prometheusBaseURL}/api/v1/rules`, 'rules', data => {
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
          ? {
            annotations: rule.annotations,
            id: rule.id,
            labels: {alertname: rule.name, ...rule.labels},
            rule,
          }
          : rule.alerts.map(a => ({rule, ...a}))
        );
      });
    } else {
      store.dispatch(UIActions.monitoringErrored('rules', new Error('prometheusBaseURL not set')));
    }

    const {alertManagerBaseURL} = (window as any).SERVER_FLAGS;
    if (!alertManagerBaseURL) {
      const e = new Error('alertManagerBaseURL not set');
      store.dispatch(UIActions.monitoringErrored('alerts', e));
      store.dispatch(UIActions.monitoringErrored('silences', e));
      return;
    }

    poll(`${alertManagerBaseURL}/api/v1/alerts`, 'alerts', data => data);

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
  }

  componentWillUnmount() {
    _.each(pollerTimeouts, t => clearTimeout(t));
  }

  render() {
    return <Switch>
      <Redirect from="/monitoring" exact to="/monitoring/alerts" />
      <Route path="/monitoring/alerts" exact component={AlertsPage} />
      <Route path="/monitoring/alerts/:name" exact component={AlertsDetailsPage} />
      <Route path="/monitoring/alertrules/:id" exact component={AlertRulesDetailsPage} />
      <Route path="/monitoring/silences" exact component={SilencesPage} />
      <Route path="/monitoring/silences/new" exact component={CreateSilence} />
      <Route path="/monitoring/silences/:id" exact component={SilencesDetailsPage} />
      <Route path="/monitoring/silences/:id/edit" exact component={EditSilence} />
    </Switch>;
  }
}

/* eslint-disable no-undef, no-unused-vars */
type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  id?: string;
  matchers: {name: string, value: string, isRegex: boolean}[];
  name?: string;
  startsAt: string;
  status?: {state: SilenceStates};
  // eslint-disable-next-line no-use-before-define
  silencedAlerts: Alert[];
  updatedAt?: string;
};
type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};
type Alert = {
  activeAt: string;
  annotations: any;
  labels: {[key: string]: string};
  rule?: any;
  silencedBy: Silence[];
  state: AlertStates;
  value: number;
};
type Rule = {
  alerts: Alert[];
  annotations: any;
  duration: number;
  id: string;
  labels: {[key: string]: string};
  name: string;
  query: string;
};
type Rules = {
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
};
export type AlertRulesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  rule: Rule;
};
export type SilencesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  silence: Silence;
};
export type SilenceFormProps = {
  defaults?: any;
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
  CreateButton: React.ComponentType<any>;
  data: Rule[] | Silence[];
  filters: {[key: string]: any};
  Header: React.ComponentType<any>;
  kindPlural: string;
  loaded: boolean;
  loadError?: string;
  match: {path: string};
  nameFilterID: string;
  PageDescription: React.ComponentType<any>;
  reduxID: string;
  Row: React.ComponentType<any>;
  rowFilter: {type: string, selected: string[], reducer: (any) => string, items: {id: string, title: string}[]};
};
