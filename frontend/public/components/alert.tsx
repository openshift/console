import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../co-fetch';
import { alertRuleState } from '../module/monitoring';
import k8sActions from '../module/k8s/k8s-actions';
import { MonitoringRoutes, connectToURLs } from '../monitoring';
import store from '../redux';
import { UIActions } from '../ui/ui-actions';
import { ColHead, List, ListHeader, ResourceRow, TextFilter } from './factory';
import { CheckBoxes } from './row-filter';
import { SafetyFirst } from './safety-first';
import { BreadCrumbs, history, NavTitle, SectionHeading, StatusBox, Timestamp, withFallback } from './utils';
import { formatDuration } from './utils/datetime';

const AlertResource = {
  kind: 'Alert',
  label: 'Alert',
  path: '/monitoring/alerts',
  abbr: 'AL',
};

const AlertRuleResource = {
  kind: 'AlertRule',
  label: 'Alert Rule',
  path: '/monitoring/alerts/rules',
  abbr: 'AR',
};

const reduxID = 'monitoringRules';

const detailsURL = (resource, name, labels) => `${resource.path}/${name}?${_.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;

const ExternalLink = ({href, text}) => <a className="co-external-link" href={href} target="_blank" rel="noopener noreferrer">{text}</a>;

const ResourceIcon = props => {
  const {className, resource} = props;
  return <span className={classNames(`co-m-resource-icon co-m-resource-${resource.kind.toLowerCase()}`, className)} title={resource.label}>{resource.abbr}</span>;
};

const stateToIconClassName = {
  firing: 'fa fa-bell alert-firing',
  pending: 'fa fa-exclamation-triangle alert-pending',
};

const State: React.SFC<StateProps> = ({state}) => {
  if (state === 'inactive') {
    return <span className="text-muted">{_.startCase(state)}</span>;
  }
  const klass = stateToIconClassName[state];
  return klass ? <React.Fragment><i className={klass} aria-hidden="true"></i> {_.startCase(state)}</React.Fragment> : null;
};

const Annotation = ({children, title}) => _.isNil(children)
  ? null
  : <React.Fragment><dt>{title}</dt><dd>{children}</dd></React.Fragment>;

const getURLSearchParams = () => {
  const labels = {};
  const params: any = new URLSearchParams(window.location.search);
  for (let [k, v] of params.entries()) {
    labels[k] = v;
  }
  return labels;
};

class AlertsPageWrapper extends SafetyFirst<AlertsPageWrapperProps, null> {
  componentDidMount () {
    super.componentDidMount();

    const {prometheusBaseURL} = (window as any).SERVER_FLAGS;
    if (!prometheusBaseURL) {
      store.dispatch(UIActions.monitoringRulesErrored(new Error('prometheusBaseURL not set')));
      return;
    }

    store.dispatch(UIActions.monitoringRulesLoading());
    const poller = () => {
      coFetchJSON(`${prometheusBaseURL}/api/v1/rules`)
        .then(response => {
          // Flatten the rules data to make it easier to work with and also discard non-alerting rules since those are
          // the only ones we will be using
          const allRules = _.flatMap(response.data.groups, 'rules');
          const alertingRules = _.filter(allRules, {type: 'alerting'});
          store.dispatch(UIActions.monitoringRulesLoaded(alertingRules));
        })
        .catch(e => store.dispatch(UIActions.monitoringRulesErrored(e)))
        .then(() => setTimeout(() => {
          if (this.isMounted_) {
            poller();
          }
        }, 15 * 1000));
    };
    poller();
  }

  render () {
    const {Page, ...pageProps} = this.props;
    return <Page {...pageProps} />;
  }
}
const connectPage = Page => withFallback(props => <AlertsPageWrapper {...props} Page={Page} />);

const alertStateToProps = ({UI}, {match}): AlertsDetailsPageProps => {
  const {loaded, loadError, rules}: ReduxData = UI.get(reduxID) || {};
  const name = _.get(match, 'params.name');
  const labels = getURLSearchParams();

  for (let rule of _.filter(rules, {name})) {
    const alert = _.find(_.get(rule, 'alerts'), {labels});
    if (alert) {
      return {alert, loaded, loadError, name, rule};
    }
  }
  return {alert: null, loaded, loadError, name, rule: _.find(rules, {name, labels})};
};

const AlertsDetailsPage_ = connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
  const {alert, loaded, loadError, name, rule} = props;
  const severity = _.get(rule, 'labels.severity');
  const activeAt = _.get(alert, 'activeAt');
  const annotations = _.get(alert || rule, 'annotations', {});

  return <React.Fragment>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name"><ResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertResource} />{name}</div>
      </h1>
    </div>
    <StatusBox data={rule} loaded={loaded} loadError={loadError}>
      <div className="co-m-pane__body">
        <SectionHeading text="Alert Overview" />
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
                <dt>State</dt>
                <dd>
                  <State state={alertRuleState(rule)} />
                  {activeAt && <div className="text-muted monitoring-timestamp">Active since&nbsp;<Timestamp timestamp={activeAt} /></div>}
                </dd>
                <dt>Alert Rule</dt>
                <dd>
                  <div className="co-resource-link">
                    <ResourceIcon resource={AlertRuleResource} />
                    <Link to={detailsURL(AlertRuleResource, name, _.get(rule, 'labels'))} className="co-resource-link__resource-name">{name}</Link>
                  </div>
                </dd>
              </dl>
            </div>
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <Annotation title="Description">{annotations.description}</Annotation>
                <Annotation title="Summary">{annotations.summary}</Annotation>
                <Annotation title="Message">{annotations.message}</Annotation>
                {annotations.runbook_url && <React.Fragment>
                  <dt>Runbook</dt>
                  <dd><ExternalLink href={annotations.runbook_url} text={annotations.runbook_url} /></dd>
                </React.Fragment>}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </StatusBox>
  </React.Fragment>;
});
export const AlertsDetailsPage = connectPage(AlertsDetailsPage_);

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
    <div className="col-xs-2">Active Since</div>
    <div className="col-xs-2">State</div>
    <div className="col-xs-2">Value</div>
  </div>
  <div className="co-m-table-grid__body">
    {alerts.map((a, i) => {
      const name = a.labels.alertname;
      const description = _.get(a, 'annotations.description') || _.get(a, 'annotations.message') || name;
      return <ResourceRow key={i} obj={a}>
        <div className="col-xs-6 co-resource-link-wrapper">
          <Link className="co-resource-link" to={detailsURL(AlertResource, name, a.labels)}>{description}</Link>
        </div>
        <div className="col-xs-2"><Timestamp timestamp={a.activeAt} /></div>
        <div className="col-xs-2"><State state={a.state} /></div>
        <div className="col-xs-2">{a.value}</div>
      </ResourceRow>;
    })}
  </div>
</div>;

const ruleStateToProps = ({UI}, {match}): AlertRulesDetailsPageProps => {
  const {loaded, loadError, rules}: ReduxData = UI.get(reduxID) || {};
  const name = _.get(match, 'params.name');
  const rule = _.find(rules, {name, labels: getURLSearchParams()});
  return {loaded, loadError, name, rule};
};

const AlertRulesDetailsPage_ = connect(ruleStateToProps)((props: AlertRulesDetailsPageProps) => {
  const {loaded, loadError, name, rule} = props;
  const annotations = _.get(rule, 'annotations', {});
  const labels = _.get(rule, 'labels');
  const severity = _.get(labels, 'severity');
  const alerts = _.get(rule, 'alerts');
  const duration = _.get(rule, 'duration');
  const breadcrumbs = [
    {name, path: detailsURL(AlertResource, name, labels)},
    {name: `${AlertRuleResource.label} Details`, path: null},
  ];

  return <React.Fragment>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name"><ResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertRuleResource} />{name}</div>
      </h1>
    </div>
    <StatusBox data={rule} loaded={loaded} loadError={loadError}>
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
                <dd><pre className="monitoring-query">{_.get(rule, 'query')}</pre></dd>
                {annotations.runbook_url && <React.Fragment>
                  <dt>Runbook</dt>
                  <dd><ExternalLink href={annotations.runbook_url} text={annotations.runbook_url} /></dd>
                </React.Fragment>}
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
});
export const AlertRulesDetailsPage = connectPage(AlertRulesDetailsPage_);

const Row = ({obj}) => {
  const {alerts, annotations, labels, name} = obj;
  const activeAt = _.min(_.map(alerts, 'activeAt'));

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link-wrapper">
        <span className="co-resource-link">
          <ResourceIcon resource={AlertResource} />
          <Link to={detailsURL(AlertResource, name, labels)} className="co-resource-link__resource-name">{name}</Link>
        </span>
      </div>
      <div className="monitoring-description">{_.get(annotations, 'description') || _.get(annotations, 'message')}</div>
    </div>
    <div className="col-xs-3">
      <State state={alertRuleState(obj)} />
      {activeAt && <div className="text-muted monitoring-timestamp">since&nbsp;<Timestamp timestamp={activeAt} /></div>}
    </div>
    <div className="col-xs-2">{_.startCase(_.get(labels, 'severity', '-'))}</div>
  </ResourceRow>;
};

const AlertHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-7" sortField="name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortFunc="alertRuleState">State</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="labels.severity">Severity</ColHead>
</ListHeader>;

const AlertsPageDescription_ = ({urls}) => <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--help-text">
  <p className="co-help-text">OpenShift ships with a pre-configured and self-updating monitoring stack powered by <ExternalLink href={urls[MonitoringRoutes.Prometheus]} text="Prometheus" /></p>
</div>;
const AlertsPageDescription = connectToURLs(MonitoringRoutes.Prometheus)(AlertsPageDescription_);

const rowFilter = {
  type: 'alert-rule-state',
  selected: ['firing', 'pending'],
  reducer: alertRuleState,
  items: [
    {id: 'firing', title: 'Firing'},
    {id: 'pending', title: 'Pending'},
    {id: 'inactive', title: 'Inactive'},
  ],
};

const nameFilterID = 'alert-rule-name';

// Row filter settings are stored in "k8s"
const listStateToProps = ({k8s, UI}): AlertsPageProps => {
  const {loaded, loadError, rules}: ReduxData = UI.get(reduxID) || {};
  const filtersMap = k8s.getIn([reduxID, 'filters']);
  return {filters: filtersMap ? filtersMap.toJS() : null, loaded, loadError, rules};
};

const AlertsPage_ = connect(listStateToProps)(class InnerAlertsPage_ extends React.Component<AlertsPageProps> {
  /* eslint-disable no-undef */
  props: AlertsPageProps;
  defaultNameFilter: string;
  /* eslint-enable no-undef */

  constructor (props) {
    super(props);
    this.applyTextFilter = this.applyTextFilter.bind(this);
  }

  applyTextFilter (e) {
    const v = e.target.value;
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

  componentWillMount () {
    const params = new URLSearchParams(window.location.search);

    // Ensure the current name filter value matches the name filter GET param
    this.defaultNameFilter = params.get(nameFilterID);
    store.dispatch(k8sActions.filterList(reduxID, nameFilterID, this.defaultNameFilter));

    if (!params.get('sortBy')) {
      // Sort by rule name by default
      store.dispatch(UIActions.sortList(reduxID, 'name', undefined, 'asc', 'Name'));
    }
  }

  render () {
    const {filters, loaded, loadError, rules} = this.props;

    return <React.Fragment>
      <Helmet>
        <title>Monitoring Alerts</title>
      </Helmet>
      <NavTitle title="Monitoring Alerts" />
      <div className="co-m-pane__filter-bar co-m-pane__filter-bar--with-help-text">
        <div className="co-m-pane__filter-bar-group">
          <AlertsPageDescription />
        </div>
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter defaultValue={this.defaultNameFilter} label="Alerts by name" onChange={this.applyTextFilter} />
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <CheckBoxes
            items={rowFilter.items}
            numbers={_.countBy(rules, rowFilter.reducer)}
            reduxIDs={[reduxID]}
            selected={rowFilter.selected}
            type={rowFilter.type}
          />
        </div>
        <div className="row">
          <div className="col-xs-12">
            <List
              Header={AlertHeader}
              Row={Row}
              data={rules}
              filters={filters}
              loadError={loadError}
              loaded={loaded}
              reduxID={reduxID}
            />
          </div>
        </div>
      </div>
    </React.Fragment>;
  }
});
export const AlertsPage = connectPage(AlertsPage_);

/* eslint-disable no-undef, no-unused-vars */
type Alert = {
  activeAt: string;
  annotations: any;
  labels: {[key: string]: string};
  state: string;
  value: any,
};
type Rule = {
  alerts: Array<Alert>;
  annotations: any;
  duration: number;
  labels: {[key: string]: string};
  query: string;
};
type ReduxData = {
  loaded: boolean;
  loadError?: string;
  rules: Array<Rule>;
};
type StateProps = {
  state: string;
};
type AlertsPageWrapperProps = {
  Page: React.ComponentType<any>;
};
export type AlertsDetailsPageProps = {
  alert: Alert;
  loaded: boolean;
  loadError?: string;
  name: string;
  rule: Rule;
};
export type AlertRulesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  name: string;
  rule: Rule;
};
export type AlertsPageProps = {
  filters: {[key: string]: any};
  loaded: boolean;
  loadError?: string;
  rules: Array<Rule>;
};
