import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { murmur3 } from 'murmurhash-js';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import { coFetchJSON } from '../co-fetch';
import k8sActions from '../module/k8s/k8s-actions';
import { MonitoringRoutes, connectToURLs } from '../monitoring';
import store from '../redux';
import { UIActions } from '../ui/ui-actions';
import { monitoringRulesToProps } from '../ui/ui-reducers';
import { ColHead, List, ListHeader, ResourceRow, TextFilter } from './factory';
import { CheckBoxes } from './row-filter';
import { SafetyFirst } from './safety-first';
import { Silence } from './silence';
import { formatDuration } from './utils/datetime';
import {
  ActionsMenu,
  BreadCrumbs,
  Cog,
  ExternalLink,
  getURLSearchParams,
  history,
  PageHeading,
  SectionHeading,
  StatusBox,
  Timestamp,
  withFallback,
} from './utils';
import {
  AlertResource,
  AlertRuleResource,
  alertState,
  SilenceResource
} from '../module/monitoring';

const labelsToParams = labels => _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

const alertURL = (name, labels) => `${AlertResource.path}/${name}?${labelsToParams(labels)}`;
const ruleURL = rule => `${AlertRuleResource.path}/${_.get(rule, 'id')}`;

const silenceAction = alert => ({
  label: 'Silence Alert',
  href: `${SilenceResource.path}/new?${labelsToParams(alert.labels)}`,
});

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

class MonitoringPageWrapper extends SafetyFirst<AlertsPageWrapperProps, null> {
  componentDidMount () {
    super.componentDidMount();

    const poll = (url: string, key: string, dataHandler: (data: any[]) => any): void => {
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
      // Flatten the rules data to make it easier to work with, discard non-alerting rules since those are the only ones
      // we will be using and add a unique ID to each rule.
      const groups = _.get(data, 'groups');
      const rules = _.flatMap(groups, g => {
        const addID = r => {
          const key = [g.file, g.name, r.name, r.duration, r.query, ..._.map(r.labels, (k, v) => `${k}=${v}`)].join(',');
          r.id = String(murmur3(key, 'monitoring-salt'));
          return r;
        };

        return _.filter(g.rules, {type: 'alerting'}).map(addID);
      });

      return {
        asRules: rules,
        asAlerts: _.flatMap(rules, rule => {
          // Give the alerts a name field matching their rule
          return _.isEmpty(rule.alerts) ? rule : rule.alerts.map(a => ({name: rule.name, rule, ...a}));
        }),
      };
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
  const {data, loaded, loadError}: Rules = monitoringRulesToProps(state);
  const name = _.get(match, 'params.name');
  const labels = getURLSearchParams();
  const alert = _.find(data && data.asAlerts, {labels});
  const rule = _.get(alert, 'rule') || _.find(data && data.asRules, {labels, name});
  return {alert, loaded, loadError, name, rule};
};

const AlertsDetailsPage_ = connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
  const {alert, loaded, loadError, name, rule} = props;
  const severity = _.get(alert, 'labels.severity');
  const activeAt = _.get(alert, 'activeAt');
  const annotations = _.get(alert, 'annotations', {});

  return <React.Fragment>
    <Helmet>
      <title>{`${name} · Details`}</title>
    </Helmet>
    <div className="co-m-nav-title co-m-nav-title--detail">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name"><MonitoringResourceIcon className="co-m-resource-icon--lg pull-left" resource={AlertResource} />{name}</div>
        {alertState(alert) !== 'inactive' && <div className="co-actions">
          <ActionsMenu actions={[silenceAction(alert)]} />
        </div>}
      </h1>
    </div>
    <StatusBox data={alert} loaded={loaded} loadError={loadError}>
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
                  <State state={alertState(alert)} />
                  {activeAt && <div className="text-muted monitoring-timestamp">Active since&nbsp;<Timestamp timestamp={activeAt} /></div>}
                </dd>
                <dt>Alert Rule</dt>
                <dd>
                  <div className="co-resource-link">
                    <MonitoringResourceIcon resource={AlertRuleResource} />
                    <Link to={ruleURL(rule)} className="co-resource-link__resource-name">{name}</Link>
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
    <div className="col-sm-2 hidden-xs">Active Since</div>
    <div className="col-sm-2 col-xs-3">State</div>
    <div className="col-sm-2 col-xs-3">Value</div>
  </div>
  <div className="co-m-table-grid__body">
    {alerts.map((a, i) => {
      const name = a.labels.alertname;
      const description = _.get(a, 'annotations.description') || _.get(a, 'annotations.message') || name;
      return <ResourceRow key={i} obj={a}>
        <div className="col-xs-6 co-resource-link-wrapper">
          <Cog options={[silenceAction(a)]} />
          <Link className="co-resource-link" to={alertURL(name, a.labels)}>{description}</Link>
        </div>
        <div className="col-sm-2 hidden-xs"><Timestamp timestamp={a.activeAt} /></div>
        <div className="col-sm-2 col-xs-3"><State state={a.state} /></div>
        <div className="col-sm-2 col-xs-3 co-break-word">{a.value}</div>
      </ResourceRow>;
    })}
  </div>
</div>;

const ruleStateToProps = (state, {match}): AlertRulesDetailsPageProps => {
  const {data, loaded, loadError}: Rules = monitoringRulesToProps(state);
  const id = _.get(match, 'params.id');
  const rule = _.find(_.get(data, 'asRules'), {id});
  return {loaded, loadError, rule};
};

const AlertRulesDetailsPage_ = connect(ruleStateToProps)((props: AlertRulesDetailsPageProps) => {
  const {loaded, loadError, rule} = props;
  const {alerts = [], annotations = {}, duration = null, labels = {}, name = '', query = ''} = rule || {};
  const severity = _.get(labels, 'severity');
  const breadcrumbs = [
    {name, path: alertURL(name, labels)},
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
                <dd><pre className="monitoring-query">{query}</pre></dd>
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
  const {activeAt, annotations, labels, name} = obj;

  return <ResourceRow obj={obj}>
    <div className="col-xs-7">
      <div className="co-resource-link-wrapper">
        {alertState(obj) !== 'inactive' && <Cog options={[silenceAction(obj)]} />}
        <span className="co-resource-link">
          <MonitoringResourceIcon resource={AlertResource} />
          <Link to={alertURL(name, labels)} className="co-resource-link__resource-name">{name}</Link>
        </span>
      </div>
      <div className="monitoring-description">{_.get(annotations, 'description') || _.get(annotations, 'message')}</div>
    </div>
    <div className="col-xs-3">
      <State state={alertState(obj)} />
      {activeAt && <div className="text-muted monitoring-timestamp">since&nbsp;<Timestamp timestamp={activeAt} /></div>}
    </div>
    <div className="col-xs-2">{_.startCase(_.get(labels, 'severity', '-'))}</div>
  </ResourceRow>;
};

const AlertHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-7" sortField="name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortFunc="alertState">State</ColHead>
  <ColHead {...props} className="col-xs-2" sortField="labels.severity">Severity</ColHead>
</ListHeader>;

const AlertsPageDescription_ = ({urls}) => <p className="co-help-text">OpenShift ships with a pre-configured and self-updating monitoring stack powered by <ExternalLink href={urls[MonitoringRoutes.Prometheus]} text="Prometheus" /></p>;
const AlertsPageDescription = connectToURLs(MonitoringRoutes.Prometheus)(AlertsPageDescription_);

const alertsRowFilter = {
  type: 'alert-rule-state',
  selected: ['firing', 'pending'],
  reducer: alertState,
  items: [
    {id: 'firing', title: 'Firing'},
    {id: 'pending', title: 'Pending'},
    {id: 'inactive', title: 'Inactive'},
  ],
};

// Row filter settings are stored in "k8s"
const filtersToProps = ({k8s}, {reduxID}) => {
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
  data={props.data && props.data.asAlerts}
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
  rule?: any;
  state: string;
  value: number,
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
  data: {asRules: Rule[], asAlerts: Alert[]},
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
