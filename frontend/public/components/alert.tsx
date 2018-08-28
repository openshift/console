import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../co-fetch';
import k8sActions from '../module/k8s/k8s-actions';
import store from '../redux';
import { UIActions } from '../ui/ui-actions';
import { monitoringRulesToProps } from '../ui/ui-reducers';
import { CheckBoxes } from './row-filter';
import { SafetyFirst } from './safety-first';
import { Silence } from './silence';
import { formatDuration } from './utils/datetime';
import { MonitoringRoutes, connectToURLs } from '../monitoring';
import { ColHead, List, ListHeader, ResourceRow, TextFilter } from './factory';
import {
  BreadCrumbs,
  ExternalLink,
  history,
  PageHeading,
  SectionHeading,
  StatusBox,
  Timestamp,
  withFallback
} from './utils';
import {
  AlertResource,
  AlertRuleResource,
  alertRuleState,
  SilenceResource
} from '../module/monitoring';

const detailsURL = (resource, name, labels) => `${resource.path}/${name}?${_.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`;

export const MonitoringResourceIcon = props => {
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

class MonitoringPageWrapper extends SafetyFirst<AlertsPageWrapperProps, null> {
  componentDidMount () {
    super.componentDidMount();

    const poll = (url: string, key: string, dataHandler: (data: any[]) => any[]): void => {
      store.dispatch(UIActions.monitoringLoading(key));
      const poller = (): void => {
        coFetchJSON(url)
          .then(({data}) => dataHandler(data))
          .then(data => store.dispatch(UIActions.monitoringLoaded(key, data)))
          .catch(e => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => setTimeout(() => {
            if (this.isMounted_) {
              poller();
            }
          }, 15 * 1000));
      };
      poller();
    };

    const {alertManagerBaseURL, prometheusBaseURL} = (window as any).SERVER_FLAGS;

    if (!prometheusBaseURL) {
      store.dispatch(UIActions.monitoringErrored('rules', new Error('prometheusBaseURL not set')));
      return;
    }

    poll(`${prometheusBaseURL}/api/v1/rules`, 'rules', data => {
      // Flatten the rules data to make it easier to work with and also discard non-alerting rules since those are
      // the only ones we will be using
      const allRules = _.flatMap(_.get(data, 'groups'), 'rules');
      return _.filter(allRules, {type: 'alerting'});
    });

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
          s.name = s.matchers.map(m => `${m.name}=${m.value}`).join(', ');
        }
      });
      return data;
    });
  }

  render () {
    const {Page, ...pageProps} = this.props;
    return <Page {...pageProps} />;
  }
}
export const connectMonitoringPage = Page => withFallback(props => <MonitoringPageWrapper {...props} Page={Page} />);

const alertStateToProps = (state, {match}): AlertsDetailsPageProps => {
  const {data: rules, loaded, loadError}: Rules = monitoringRulesToProps(state);
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
        <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertResource} />{name}</div>
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
                    <MonitoringResourceIcon resource={AlertRuleResource} />
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
export const AlertsDetailsPage = connectMonitoringPage(AlertsDetailsPage_);

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

const ruleStateToProps = (state, {match}): AlertRulesDetailsPageProps => {
  const {data: rules, loaded, loadError}: Rules = monitoringRulesToProps(state);
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
        <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertRuleResource} />{name}</div>
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
export const AlertRulesDetailsPage = connectMonitoringPage(AlertRulesDetailsPage_);

const AlertRow = ({obj}) => {
  const {alerts, annotations, labels, name} = obj;
  const activeAt = _.min(_.map(alerts, 'activeAt'));

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link-wrapper">
        <span className="co-resource-link">
          <MonitoringResourceIcon resource={AlertResource} />
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

const AlertsPageDescription_ = ({urls}) => <p className="co-help-text">OpenShift ships with a pre-configured and self-updating monitoring stack powered by <ExternalLink href={urls[MonitoringRoutes.Prometheus]} text="Prometheus" /></p>;
const AlertsPageDescription = connectToURLs(MonitoringRoutes.Prometheus)(AlertsPageDescription_);

const alertsRowFilter = {
  type: 'alert-rule-state',
  selected: ['firing', 'pending'],
  reducer: alertRuleState,
  items: [
    {id: 'firing', title: 'Firing'},
    {id: 'pending', title: 'Pending'},
    {id: 'inactive', title: 'Inactive'},
  ],
};

// Row filter settings are stored in "k8s"
export const filtersToProps = ({k8s}, {reduxID}) => {
  const filtersMap = k8s.getIn([reduxID, 'filters']);
  return {filters: filtersMap ? filtersMap.toJS() : null};
};

export const MonitoringListPage = connect(filtersToProps)(class InnerMonitoringListPage extends React.Component<ListPageProps> {
  /* eslint-disable no-undef */
  props: ListPageProps;
  defaultNameFilter: string;
  /* eslint-enable no-undef */

  constructor (props) {
    super(props);
    this.applyTextFilter = this.applyTextFilter.bind(this);
  }

  applyTextFilter (e) {
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

  componentWillMount () {
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

  render () {
    const {CreateButton, data, filters, Header, loaded, loadError, match, PageDescription, reduxID, Row, rowFilter, textFilterLabel} = this.props;

    return <React.Fragment>
      <Helmet>
        <title>Monitoring Alerts</title>
      </Helmet>
      <PageHeading title="Monitoring Alerts" />
      <ul className="co-m-horizontal-nav__menu">
        <li className={classNames('co-m-horizontal-nav__menu-item', {'co-m-horizontal-nav-item--active': match.path === AlertResource.path})}>
          <Link to={AlertResource.path}>Alerts</Link>
        </li>
        <li className={classNames('co-m-horizontal-nav__menu-item', {'co-m-horizontal-nav-item--active': match.path === SilenceResource.path})}>
          <Link to={SilenceResource.path}>Silences</Link>
        </li>
        <li className="co-m-horizontal-nav__menu-item co-m-horizontal-nav__menu-item--divider"></li>
      </ul>
      <div className="co-m-pane__filter-bar co-m-pane__filter-bar--with-help-text">
        {PageDescription && <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--help-text">
          <PageDescription />
        </div>}
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter defaultValue={this.defaultNameFilter} label={textFilterLabel} onChange={this.applyTextFilter} />
        </div>
      </div>
      {CreateButton && <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <CreateButton />
        </div>
      </div>}
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
  nameFilterID="alert-rule-name"
  PageDescription={AlertsPageDescription}
  reduxID="monitoringRules"
  Row={AlertRow}
  rowFilter={alertsRowFilter}
  textFilterLabel="Alerts by name"
/>;
export const AlertsPage = connectMonitoringPage(connect(monitoringRulesToProps)(AlertsPage_));

/* eslint-disable no-undef, no-unused-vars */
type Alert = {
  activeAt: string;
  annotations: any;
  labels: {[key: string]: string};
  state: string;
  value: number,
};
type Rule = {
  alerts: Alert[];
  annotations: any;
  duration: number;
  labels: {[key: string]: string};
  query: string;
};
type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string;
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
export type ListPageProps = {
  CreateButton: React.ComponentType<any>;
  data: Rule[] | Silence[];
  filters: {[key: string]: any};
  Header: React.ComponentType<any>;
  loaded: boolean;
  loadError?: string;
  match: {path: string};
  nameFilterID: string;
  PageDescription: React.ComponentType<any>;
  reduxID: string;
  Row: React.ComponentType<any>;
  rowFilter: {type: string, selected: string[], reducer: (any) => string, items: {id: string, title: string}[]};
  textFilterLabel: string;
};
