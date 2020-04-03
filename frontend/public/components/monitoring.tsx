import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { murmur3 } from 'murmurhash-js';
import { Alert, ActionGroup, Button, Tooltip } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import {
  BanIcon,
  BellIcon,
  BellSlashIcon,
  HourglassHalfIcon,
  MinusCircleIcon,
  OutlinedBellIcon,
  PlusCircleIcon,
} from '@patternfly/react-icons';

import { withFallback } from '@console/shared/src/components/error/error-boundary';
import * as k8sActions from '../actions/k8s';
import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import {
  alertingRuleIsActive,
  AlertSeverity,
  alertState,
  AlertStates,
  silenceState,
  SilenceStates,
} from '../reducers/monitoring';
import store, { RootState } from '../redux';
import { Table, TableData, TableRow, TextFilter, RowFunction } from './factory';
import { confirmModal } from './modals';
import MonitoringDashboardsPage from './monitoring/dashboards';
import { graphStateToProps, QueryBrowserPage, ToggleGraph } from './monitoring/metrics';
import { PrometheusLabels } from './graphs';
import { QueryBrowser, QueryObj } from './monitoring/query-browser';
import { CheckBoxes } from './row-filter';
import { formatPrometheusDuration } from './utils/datetime';
import { AlertmanagerYAMLEditorWrapper } from './monitoring/alert-manager-yaml-editor';
import { AlertmanagerConfigWrapper } from './monitoring/alert-manager-config';
import { refreshNotificationPollers } from './notification-drawer';
import {
  ActionsMenu,
  ButtonBar,
  ExternalLink,
  Firehose,
  getURLSearchParams,
  history,
  Kebab,
  LoadingInline,
  SectionHeading,
  StatusBox,
  Timestamp,
} from './utils';
import {
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';

const AlertResource = {
  kind: 'Alert',
  label: 'Alert',
  plural: '/monitoring/alerts',
  abbr: 'AL',
};

const RuleResource = {
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

const labelsToParams = (labels) =>
  _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

export const alertURL = (alert, ruleID) =>
  `${AlertResource.plural}/${ruleID}?${labelsToParams(alert.labels)}`;
const ruleURL = (rule) => `${RuleResource.plural}/${_.get(rule, 'id')}`;

const alertDescription = (alert) => {
  const { annotations = {}, labels = {} } = alert;
  return annotations.description || annotations.message || labels.alertname;
};

const alertsToProps = ({ UI }) => UI.getIn(['monitoring', 'alerts']) || {};

const rulesToProps = (state: RootState) => {
  const data = state.UI.getIn(['monitoring', 'rules']);
  const { loaded, loadError }: Alerts = alertsToProps(state);
  return { data, loaded, loadError };
};

const silencesToProps = ({ UI }) => UI.getIn(['monitoring', 'silences']) || {};

const pollers = {};
const pollerTimeouts = {};

const silenceAlert = (alert) => ({
  label: 'Silence Alert',
  href: `${SilenceResource.plural}/~new?${labelsToParams(alert.labels)}`,
});

const viewAlertRule = (alert) => ({
  label: 'View Alerting Rule',
  href: ruleURL(alert.rule),
});

const editSilence = (silence) => ({
  label: silenceState(silence) === SilenceStates.Expired ? 'Recreate Silence' : 'Edit Silence',
  href: `${SilenceResource.plural}/${silence.id}/edit`,
});

const cancelSilence = (silence) => ({
  label: 'Expire Silence',
  callback: () =>
    confirmModal({
      title: 'Expire Silence',
      message: 'Are you sure you want to expire this silence?',
      btnText: 'Expire Silence',
      executeFn: () =>
        coFetchJSON
          .delete(`${window.SERVER_FLAGS.alertManagerBaseURL}/api/v1/silence/${silence.id}`)
          .then(() => refreshNotificationPollers()),
    }),
});

const silenceMenuActions = (silence) =>
  silenceState(silence) === SilenceStates.Expired
    ? [editSilence(silence)]
    : [editSilence(silence), cancelSilence(silence)];

const SilenceKebab = ({ silence }) => <Kebab options={silenceMenuActions(silence)} />;

const SilenceActionsMenu = ({ silence }) => (
  <div className="co-actions" data-test-id="details-actions">
    <ActionsMenu actions={silenceMenuActions(silence)} />
  </div>
);

const MonitoringResourceIcon = (props) => {
  const { className, resource } = props;
  return (
    <span
      className={classNames(
        `co-m-resource-icon co-m-resource-${resource.kind.toLowerCase()}`,
        className,
      )}
      title={resource.label}
    >
      {resource.abbr}
    </span>
  );
};

const stateIcons = {
  [AlertStates.Firing]: <BellIcon />,
  [AlertStates.Silenced]: <BellSlashIcon className="text-muted" />,
  [AlertStates.Pending]: <OutlinedBellIcon />,
};

const AlertState: React.SFC<AlertStateProps> = ({ state }) => {
  const icon = stateIcons[state];
  return icon ? (
    <>
      {icon} {_.startCase(state)}
    </>
  ) : null;
};

const SilenceState = ({ silence }) => {
  const state = silenceState(silence);
  const icon = {
    [SilenceStates.Active]: <GreenCheckCircleIcon />,
    [SilenceStates.Pending]: <HourglassHalfIcon className="monitoring-state-icon--pending" />,
    [SilenceStates.Expired]: <BanIcon className="text-muted" data-test-id="ban-icon" />,
  }[state];
  return icon ? (
    <>
      {icon} {_.startCase(state)}
    </>
  ) : null;
};

const StateTimestamp = ({ text, timestamp }) => (
  <div className="text-muted monitoring-timestamp">
    {text}&nbsp;
    <Timestamp timestamp={timestamp} />
  </div>
);

const AlertStateDescription = ({ alert }) => {
  if (alert && !_.isEmpty(alert.silencedBy)) {
    return <StateTimestamp text="Ends" timestamp={_.max(_.map(alert.silencedBy, 'endsAt'))} />;
  }
  if (alert && alert.activeAt) {
    return <StateTimestamp text="Since" timestamp={alert.activeAt} />;
  }
  return null;
};

const severityIcons = {
  [AlertSeverity.Critical]: RedExclamationCircleIcon,
  [AlertSeverity.Info]: BlueInfoCircleIcon,
  [AlertSeverity.None]: BlueInfoCircleIcon,
  [AlertSeverity.Warning]: YellowExclamationTriangleIcon,
};

const getSeverityIcon = (severity: string) =>
  severityIcons[severity] || YellowExclamationTriangleIcon;

const SeverityIcon: React.FC<SeverityIconProps> = ({ label, severity }) => {
  const Icon = getSeverityIcon(severity);
  return (
    <>
      <Icon /> {label}
    </>
  );
};

const Severity: React.FC<{ severity?: string }> = ({ severity }) =>
  _.isNil(severity) ? <>-</> : <SeverityIcon label={_.startCase(severity)} severity={severity} />;

const SeverityCounts: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  const counts = _.countBy(alerts, (a) => {
    const { severity } = a.labels;
    return severity === AlertSeverity.Critical || severity === AlertSeverity.Warning
      ? severity
      : AlertSeverity.Info;
  });

  const severities = [AlertSeverity.Critical, AlertSeverity.Warning, AlertSeverity.Info].filter(
    (s) => counts[s] > 0,
  );

  return (
    <>
      {severities.map((s) => (
        <span className="monitoring-icon-wrap" key={s}>
          <SeverityIcon label={counts[s]} severity={s} />
        </span>
      ))}
    </>
  );
};

const StateCounts: React.FC<{ alerts: PrometheusAlert[] }> = ({ alerts }) => {
  const counts = _.countBy(alerts, 'state');
  const states = [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].filter(
    (s) => counts[s] > 0,
  );

  return (
    <>
      {states.map((s) => (
        <span className="monitoring-icon-wrap" key={s}>
          {stateIcons[s]} {counts[s]} {_.startCase(s)}
        </span>
      ))}
    </>
  );
};

const Annotation = ({ children, title }) =>
  _.isNil(children) ? null : (
    <>
      <dt>{title}</dt>
      <dd>{children}</dd>
    </>
  );

const Label = ({ k, v }) => (
  <div className="co-m-label co-m-label--expand" key={k}>
    <span className="co-m-label__key">{k}</span>
    <span className="co-m-label__eq">=</span>
    <span className="co-m-label__value">{v}</span>
  </div>
);

const queryBrowserURL = (query) => `/monitoring/query-browser?query0=${encodeURIComponent(query)}`;

const Graph_: React.FC<GraphProps> = ({
  filterLabels = undefined,
  hideGraphs,
  patchQuery,
  rule,
}) => {
  const { duration = 0, query = '' } = rule || {};

  // Set the query in Redux so that other components like the graph tooltip can access it
  React.useEffect(() => {
    patchQuery(0, { query });
  }, [patchQuery, query]);

  const queries = React.useMemo(() => [query], [query]);

  if (hideGraphs) {
    return null;
  }

  // 3 times the rule's duration, but not less than 30 minutes
  const timespan = Math.max(3 * duration, 30 * 60) * 1000;

  const GraphLink = () => (query ? <Link to={queryBrowserURL(query)}>View in Metrics</Link> : null);

  return (
    <QueryBrowser
      defaultTimespan={timespan}
      filterLabels={filterLabels}
      GraphLink={GraphLink}
      queries={queries}
    />
  );
};
const Graph = connect(graphStateToProps, { patchQuery: UIActions.queryBrowserPatchQuery })(Graph_);

const SilenceMatchersList = ({ silence }) => (
  <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
    {_.map(silence.matchers, ({ name, isRegex, value }, i) => (
      <Label key={i} k={name} v={isRegex ? `~${value}` : value} />
    ))}
  </div>
);

const alertStateToProps = (state: RootState, { match }): AlertsDetailsPageProps => {
  const { data, loaded, loadError }: Alerts = alertsToProps(state);
  const { loaded: silencesLoaded }: Silences = silencesToProps(state);
  const ruleID = _.get(match, 'params.ruleID');
  const labels = getURLSearchParams();
  const alerts = _.filter(data, (a) => a.rule.id === ruleID);
  const rule = _.get(alerts, '[0].rule');
  const alert = _.find(alerts, (a) => _.isEqual(a.labels, labels));
  return { alert, loaded, loadError, rule, silencesLoaded };
};

const AlertsDetailsPage = withFallback(
  connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
    const { alert, loaded, loadError, rule, silencesLoaded } = props;
    const { annotations = {}, labels = {}, silencedBy = [] } = alert || {};
    const { alertname, severity } = labels as any;
    const state = alertState(alert);

    return (
      <>
        <Helmet>
          <title>{`${alertname} · Details`}</title>
        </Helmet>
        <StatusBox data={alert} label={AlertResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail">
            <h1 className="co-m-pane__heading">
              <div className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={AlertResource}
                />
                {alertname}
              </div>
              {(state === AlertStates.Firing || state === AlertStates.Pending) && (
                <div className="co-actions" data-test-id="details-actions">
                  <ActionsMenu actions={[silenceAlert(alert)]} />
                </div>
              )}
            </h1>
          </div>
          <div className="co-m-pane__body">
            <ToggleGraph />
            <SectionHeading text="Alert Details" />
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-12">
                  <Graph filterLabels={labels} rule={rule} />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>Name</dt>
                    <dd>{alertname}</dd>
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
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>Severity</dt>
                    <dd>
                      <Severity severity={severity} />
                    </dd>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>State</dt>
                    <dd>
                      <AlertState state={state} />
                      <AlertStateDescription alert={alert} />
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  <dl className="co-m-pane__details">
                    <dt>Labels</dt>
                    <dd>
                      {_.isEmpty(labels) ? (
                        <div className="text-muted">No labels</div>
                      ) : (
                        <div className={`co-text-${AlertResource.kind.toLowerCase()}`}>
                          {_.map(labels, (v, k) => (
                            <Label key={k} k={k} v={v} />
                          ))}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  <dl className="co-m-pane__details">
                    <dt>Alerting Rule</dt>
                    <dd>
                      <div className="co-resource-item">
                        <MonitoringResourceIcon resource={RuleResource} />
                        <Link
                          to={ruleURL(rule)}
                          data-test-id="alert-detail-resource-link"
                          className="co-resource-item__resource-name"
                        >
                          {_.get(rule, 'name')}
                        </Link>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          {silencesLoaded && !_.isEmpty(silencedBy) && (
            <div className="co-m-pane__body">
              <div className="co-m-pane__body-group">
                <SectionHeading text="Silenced By" />
                <div className="row">
                  <div className="col-xs-12">
                    <div className="co-m-table-grid co-m-table-grid--bordered">
                      <div className="row co-m-table-grid__head">
                        <div className="col-sm-7 col-xs-8">Name</div>
                        <div className="col-sm-2 hidden-xs">Firing Alerts</div>
                        <div className="col-sm-3 col-xs-4">State</div>
                      </div>
                      <div className="co-m-table-grid__body">
                        {_.map(silencedBy, (s) => (
                          <SilenceRow key={s.id} obj={s} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </StatusBox>
      </>
    );
  }),
);

const ActiveAlerts = ({ alerts, ruleID }) => (
  <div className="co-m-table-grid co-m-table-grid--bordered">
    <div className="row co-m-table-grid__head">
      <div className="col-xs-6">Description</div>
      <div className="col-sm-2 hidden-xs">Active Since</div>
      <div className="col-sm-2 col-xs-3">State</div>
      <div className="col-sm-2 col-xs-3">Value</div>
    </div>
    <div className="co-m-table-grid__body">
      {_.sortBy(alerts, alertDescription).map((a, i) => (
        <div className="row co-resource-list__item" key={i}>
          <div className="col-xs-6">
            <Link className="co-resource-item" to={alertURL(a, ruleID)}>
              {alertDescription(a)}
            </Link>
          </div>
          <div className="col-sm-2 hidden-xs">
            <Timestamp timestamp={a.activeAt} />
          </div>
          <div className="col-sm-2 col-xs-3">
            <AlertState state={a.state} />
          </div>
          <div className="col-sm-2 col-xs-3 co-truncate">{a.value}</div>
          {a.state !== AlertStates.Silenced && (
            <div className="dropdown-kebab-pf">
              <Kebab options={[silenceAlert(a)]} />
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const ruleStateToProps = (state: RootState, { match }): AlertRulesDetailsPageProps => {
  const { data, loaded, loadError }: Rules = rulesToProps(state);
  const id = _.get(match, 'params.id');
  const rule = _.find(data, { id });
  return { loaded, loadError, rule };
};

const AlertRulesDetailsPage = withFallback(
  connect(ruleStateToProps)((props: AlertRulesDetailsPageProps) => {
    const { loaded, loadError, rule } = props;
    const { alerts = [], annotations = {}, duration = null, name = '', query = '' } = rule || {};

    return (
      <>
        <Helmet>
          <title>{`${name || RuleResource.label} · Details`}</title>
        </Helmet>
        <StatusBox data={rule} label={RuleResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail">
            <h1 className="co-m-pane__heading">
              <div className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={RuleResource}
                />
                {name}
              </div>
            </h1>
          </div>
          <div className="co-m-pane__body">
            <div className="monitoring-heading">
              <SectionHeading text="Alerting Rule Details" />
            </div>
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>Name</dt>
                    <dd>{name}</dd>
                    <dt>Severity</dt>
                    <dd>
                      <Severity severity={rule?.labels?.severity} />
                    </dd>
                    <Annotation title="Description">{annotations.description}</Annotation>
                    <Annotation title="Summary">{annotations.summary}</Annotation>
                    <Annotation title="Message">{annotations.message}</Annotation>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    {_.isInteger(duration) && (
                      <>
                        <dt>For</dt>
                        <dd>{formatPrometheusDuration(duration * 1000)}</dd>
                      </>
                    )}
                    <dt>Expression</dt>
                    <dd>
                      <Link to={queryBrowserURL(query)}>
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
              <ToggleGraph />
              <SectionHeading text="Active Alerts" />
              <div className="row">
                <div className="col-sm-12">
                  <Graph rule={rule} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  {_.isEmpty(alerts) ? (
                    <div className="text-center">None Found</div>
                  ) : (
                    <ActiveAlerts alerts={alerts} ruleID={rule.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </StatusBox>
      </>
    );
  }),
);

const SilencedAlertsList = ({ alerts }) =>
  _.isEmpty(alerts) ? (
    <div className="text-center">None Found</div>
  ) : (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-9">Name</div>
        <div className="col-xs-3">Severity</div>
      </div>
      <div className="co-m-table-grid__body">
        {_.sortBy(alerts, alertDescription).map((a, i) => (
          <div className="row co-resource-list__item" key={i}>
            <div className="col-xs-9">
              <Link className="co-resource-item" to={alertURL(a, a.rule.id)}>
                {a.labels.alertname}
              </Link>
              <div className="monitoring-description">{alertDescription(a)}</div>
            </div>
            <div className="col-xs-3">
              <Severity severity={a.labels.severity} />
            </div>
            <div className="dropdown-kebab-pf">
              <Kebab options={[viewAlertRule(a)]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

const silenceParamToProps = (state: RootState, { match }) => {
  const { data: silences, loaded, loadError }: Silences = silencesToProps(state);
  const { loaded: alertsLoaded }: Alerts = alertsToProps(state);
  const silence = _.find(silences, { id: _.get(match, 'params.id') });
  return { alertsLoaded, loaded, loadError, silence, silences };
};

const SilencesDetailsPage = withFallback(
  connect(silenceParamToProps)((props: SilencesDetailsPageProps) => {
    const { alertsLoaded, loaded, loadError, silence } = props;
    const {
      createdBy = '',
      comment = '',
      endsAt = '',
      firingAlerts = [],
      matchers = {},
      name = '',
      startsAt = '',
      updatedAt = '',
    } = silence || {};

    return (
      <>
        <Helmet>
          <title>{`${name || SilenceResource.label} · Details`}</title>
        </Helmet>
        <StatusBox
          data={silence}
          label={SilenceResource.label}
          loaded={loaded}
          loadError={loadError}
        >
          <div className="co-m-nav-title co-m-nav-title--detail">
            <h1 className="co-m-pane__heading">
              <div className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={SilenceResource}
                />
                {name}
              </div>
              <SilenceActionsMenu silence={silence} />
            </h1>
          </div>
          <div className="co-m-pane__body">
            <SectionHeading text="Silence Details" />
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    {name && (
                      <>
                        <dt>Name</dt>
                        <dd>{name}</dd>
                      </>
                    )}
                    <dt>Matchers</dt>
                    <dd>
                      {_.isEmpty(matchers) ? (
                        <div className="text-muted">No matchers</div>
                      ) : (
                        <SilenceMatchersList silence={silence} />
                      )}
                    </dd>
                    <dt>State</dt>
                    <dd>
                      <SilenceState silence={silence} />
                    </dd>
                    <dt>Last Updated At</dt>
                    <dd>
                      <Timestamp timestamp={updatedAt} />
                    </dd>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>Starts At</dt>
                    <dd>
                      <Timestamp timestamp={startsAt} />
                    </dd>
                    <dt>Ends At</dt>
                    <dd>
                      <Timestamp timestamp={endsAt} />
                    </dd>
                    <dt>Created By</dt>
                    <dd>{createdBy || '-'}</dd>
                    <dt>Comments</dt>
                    <dd>{comment || '-'}</dd>
                    <dt>Firing Alerts</dt>
                    <dd>
                      {alertsLoaded ? <SeverityCounts alerts={firingAlerts} /> : <LoadingInline />}
                    </dd>
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
      </>
    );
  }),
);

const tableAlertClasses = [
  classNames('col-sm-7', 'col-xs-8'),
  classNames('col-sm-2', 'hidden-xs'),
  classNames('col-sm-3', 'col-xs-4'),
  Kebab.columnClass,
];

const AlertTableRow: RowFunction<Alert> = ({ obj, index, key, style }) => {
  const { annotations = {}, labels } = obj;
  const state = alertState(obj);

  return (
    <TableRow id={obj.rule.id} index={index} trKey={key} style={style}>
      <TableData className={tableAlertClasses[0]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={AlertResource} />
          <Link
            to={alertURL(obj, obj.rule.id)}
            data-test-id="alert-resource-link"
            className="co-resource-item__resource-name"
          >
            {labels?.alertname}
          </Link>
        </div>
        <div className="monitoring-description">
          {annotations.description || annotations.message}
        </div>
      </TableData>
      <TableData className={tableAlertClasses[1]}>
        <Severity severity={labels?.severity} />
      </TableData>
      <TableData className={tableAlertClasses[2]}>
        <AlertState state={state} />
        <AlertStateDescription alert={obj} />
      </TableData>
      <TableData className={tableAlertClasses[3]}>
        <Kebab
          options={
            state === AlertStates.Firing || state === AlertStates.Pending
              ? [silenceAlert(obj), viewAlertRule(obj)]
              : [viewAlertRule(obj)]
          }
        />
      </TableData>
    </TableRow>
  );
};

const AlertTableHeader = () => [
  {
    title: 'Name',
    sortField: 'labels.alertname',
    transforms: [sortable],
    props: { className: tableAlertClasses[0] },
  },
  {
    title: 'Severity',
    sortField: 'labels.severity',
    transforms: [sortable],
    props: { className: tableAlertClasses[1] },
  },
  {
    title: 'State',
    sortFunc: 'alertStateOrder',
    transforms: [sortable],
    props: { className: tableAlertClasses[2] },
  },
  {
    title: '',
    props: { className: tableAlertClasses[3] },
  },
];

const HeaderAlertmanagerLink = ({ path }) =>
  _.isEmpty(window.SERVER_FLAGS.alertManagerPublicURL) ? null : (
    <span className="monitoring-header-link">
      <ExternalLink
        href={`${window.SERVER_FLAGS.alertManagerPublicURL}${path || ''}`}
        text="Alertmanager UI"
      />
    </span>
  );

const alertsRowFilter = {
  type: 'alert-state',
  selected: [AlertStates.Firing, AlertStates.Silenced, AlertStates.Pending],
  reducer: alertState,
  items: [
    { id: AlertStates.Firing, title: 'Firing' },
    { id: AlertStates.Silenced, title: 'Silenced' },
    { id: AlertStates.Pending, title: 'Pending' },
  ],
};

// Row filter settings are stored in "k8s"
const filtersToProps = ({ k8s }, { reduxID }) => {
  const filtersMap = k8s.getIn([reduxID, 'filters']);
  return { filters: filtersMap ? filtersMap.toJS() : null };
};

const MonitoringListPage = connect(filtersToProps)(
  class InnerMonitoringListPage extends React.Component<ListPageProps> {
    props: ListPageProps;
    defaultNameFilter: string;

    constructor(props) {
      super(props);
      this.applyTextFilter = this.applyTextFilter.bind(this);
    }

    applyTextFilter(e) {
      const v = e.target.value;
      const { nameFilterID, reduxID } = this.props;
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

    UNSAFE_componentWillMount() {
      const { nameFilterID, reduxID } = this.props;
      const params = new URLSearchParams(window.location.search);

      // Ensure the current name filter value matches the name filter GET param
      this.defaultNameFilter = params.get(nameFilterID);
      store.dispatch(k8sActions.filterList(reduxID, nameFilterID, this.defaultNameFilter));

      if (!params.get('sortBy')) {
        // Sort by rule name by default
        store.dispatch(UIActions.sortList(reduxID, 'name', undefined, false, 'asc', 'Name'));
      }
    }

    render() {
      const {
        CreateButton,
        data,
        filters,
        Header,
        kindPlural,
        loaded,
        loadError,
        reduxID,
        Row,
        rowFilter,
      } = this.props;

      return (
        <>
          <Helmet>
            <title>Alerting</title>
          </Helmet>
          <div className="co-m-pane__filter-bar">
            {CreateButton && (
              <div className="co-m-pane__filter-bar-group">
                <CreateButton />
              </div>
            )}
            <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
              <TextFilter
                defaultValue={this.defaultNameFilter}
                label={`${kindPlural} by name`}
                onChange={this.applyTextFilter}
              />
            </div>
          </div>
          <div className="co-m-pane__body">
            <CheckBoxes
              items={rowFilter.items}
              itemCount={_.size(data)}
              numbers={_.countBy(data, rowFilter.reducer)}
              reduxIDs={[reduxID]}
              selected={rowFilter.selected}
              type={rowFilter.type}
            />
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
        </>
      );
    }
  },
);

const AlertsPage_ = (props) => (
  <MonitoringListPage
    {...props}
    Header={AlertTableHeader}
    kindPlural="Alerts"
    nameFilterID="alert-name"
    reduxID="monitoringRules"
    Row={AlertTableRow}
    rowFilter={alertsRowFilter}
  />
);
const AlertsPage = withFallback(connect(alertsToProps)(AlertsPage_));

const rulesRowFilter = {
  type: 'alerting-rule-active',
  selected: ['true', 'false'],
  reducer: alertingRuleIsActive,
  items: [
    { id: 'true', title: 'Active' },
    { id: 'false', title: 'Inactive' },
  ],
};

const tableRuleClasses = [
  classNames('col-sm-6', 'col-xs-7'),
  classNames('col-sm-2', 'hidden-xs'),
  classNames('col-sm-4', 'col-xs-5'),
];

const RuleTableHeader = () => [
  {
    title: 'Name',
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableRuleClasses[0] },
  },
  {
    title: 'Severity',
    sortField: 'labels.severity',
    transforms: [sortable],
    props: { className: tableRuleClasses[1] },
  },
  {
    title: 'Alert State',
    sortFunc: 'alertStateOrder',
    transforms: [sortable],
    props: { className: tableRuleClasses[2] },
  },
];

const RuleTableRow: RowFunction<Rule> = ({ obj, index, key, style }) => (
  <TableRow id={obj.id} index={index} trKey={key} style={style}>
    <TableData className={tableRuleClasses[0]}>
      <div className="co-resource-item">
        <MonitoringResourceIcon resource={RuleResource} />
        <Link to={ruleURL(obj)} className="co-resource-item__resource-name">
          {obj.name}
        </Link>
      </div>
    </TableData>
    <TableData className={tableRuleClasses[1]}>
      <Severity severity={obj.labels?.severity} />
    </TableData>
    <TableData className={tableRuleClasses[2]}>
      {_.isEmpty(obj.alerts) ? 'Inactive' : <StateCounts alerts={obj.alerts} />}
    </TableData>
  </TableRow>
);

const RulesPage_ = (props) => (
  <MonitoringListPage
    {...props}
    Header={RuleTableHeader}
    kindPlural="Alerting Rules"
    nameFilterID="alerting-rule-name"
    Row={RuleTableRow}
    rowFilter={rulesRowFilter}
  />
);
const RulesPage = withFallback(connect(rulesToProps)(RulesPage_));

const tableSilenceClasses = [
  classNames('col-sm-7', 'col-xs-8'),
  classNames('col-sm-3', 'col-xs-4'),
  classNames('col-sm-2', 'hidden-xs'),
  Kebab.columnClass,
];

const SilenceTableHeader = () => [
  {
    title: 'Name',
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableSilenceClasses[0] },
  },
  {
    title: 'Firing Alerts',
    sortField: 'firingAlerts.length',
    transforms: [sortable],
    props: { className: tableSilenceClasses[1] },
  },
  {
    title: 'State',
    sortFunc: 'silenceStateOrder',
    transforms: [sortable],
    props: { className: tableSilenceClasses[2] },
  },
  {
    title: '',
    props: { className: tableSilenceClasses[3] },
  },
];

const SilenceRow = ({ obj }) => {
  const state = silenceState(obj);

  return (
    <div className="row co-resource-list__item">
      <div className="col-sm-7 col-xs-8">
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link
            className="co-resource-item__resource-name"
            data-test-id="silence-resource-link"
            title={obj.id}
            to={`${SilenceResource.plural}/${obj.id}`}
          >
            {obj.name}
          </Link>
        </div>
        <div className="monitoring-label-list">
          <SilenceMatchersList silence={obj} />
        </div>
      </div>
      <div className="col-sm-2 hidden-xs">
        <SeverityCounts alerts={obj.firingAlerts} />
      </div>
      <div className="col-sm-3 col-xs-4">
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && (
          <StateTimestamp text="Starts" timestamp={obj.startsAt} />
        )}
        {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={obj.endsAt} />}
        {state === SilenceStates.Expired && (
          <StateTimestamp text="Expired" timestamp={obj.endsAt} />
        )}
      </div>
      <div className="dropdown-kebab-pf">
        <SilenceKebab silence={obj} />
      </div>
    </div>
  );
};

const SilenceTableRow: RowFunction<Silence> = ({ obj, index, key, style }) => {
  const state = silenceState(obj);

  return (
    <TableRow id={obj.id} index={index} trKey={key} style={style}>
      <TableData className={tableSilenceClasses[0]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link
            className="co-resource-item__resource-name"
            data-test-id="silence-resource-link"
            title={obj.id}
            to={`${SilenceResource.plural}/${obj.id}`}
          >
            {obj.name}
          </Link>
        </div>
        <div className="monitoring-label-list">
          <SilenceMatchersList silence={obj} />
        </div>
      </TableData>
      <TableData className={tableSilenceClasses[1]}>
        <SeverityCounts alerts={obj.firingAlerts} />
      </TableData>
      <TableData className={classNames(tableSilenceClasses[2], 'co-break-word')}>
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && (
          <StateTimestamp text="Starts" timestamp={obj.startsAt} />
        )}
        {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={obj.endsAt} />}
        {state === SilenceStates.Expired && (
          <StateTimestamp text="Expired" timestamp={obj.endsAt} />
        )}
      </TableData>
      <TableData className={tableSilenceClasses[3]}>
        <SilenceKebab silence={obj} />
      </TableData>
    </TableRow>
  );
};

const silencesRowFilter = {
  type: 'silence-state',
  selected: [SilenceStates.Active, SilenceStates.Pending],
  reducer: silenceState,
  items: [
    { id: SilenceStates.Active, title: 'Active' },
    { id: SilenceStates.Pending, title: 'Pending' },
    { id: SilenceStates.Expired, title: 'Expired' },
  ],
};

const CreateButton = () => (
  <Link className="co-m-primary-action" to="/monitoring/silences/~new">
    <Button variant="primary">Create Silence</Button>
  </Link>
);

const SilencesPage_ = (props) => (
  <MonitoringListPage
    {...props}
    CreateButton={CreateButton}
    Header={SilenceTableHeader}
    kindPlural="Silences"
    nameFilterID="silence-name"
    reduxID="monitoringSilences"
    Row={SilenceTableRow}
    rowFilter={silencesRowFilter}
  />
);
const SilencesPage = withFallback(connect(silencesToProps)(SilencesPage_));

const pad = (i) => (i < 10 ? `0${i}` : i);
const formatDate = (d: Date): string =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;

const toISODate = (dateStr: string): string => {
  const timestamp = Date.parse(dateStr);
  return isNaN(timestamp) ? undefined : new Date(timestamp).toISOString();
};

const Text = (props) => <input {...props} type="text" className="pf-c-form-control" />;

const Datetime = (props) => {
  const pattern =
    '\\d{4}/(0?[1-9]|1[012])/(0?[1-9]|[12]\\d|3[01]) (0?\\d|1\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?';
  const tooltip = new RegExp(`^${pattern}$`).test(props.value)
    ? toISODate(props.value)
    : 'Invalid date / time';
  return (
    <div>
      <Tooltip
        content={[
          <span className="co-nowrap" key="co-timestamp">
            {tooltip}
          </span>,
        ]}
      >
        <Text {...props} pattern={pattern} placeholder="YYYY/MM/DD hh:mm:ss" />
      </Tooltip>
    </div>
  );
};

class SilenceForm_ extends React.Component<SilenceFormProps, SilenceFormState> {
  constructor(props) {
    super(props);

    const now = new Date();
    const startsAt = formatDate(now);
    const endsAt = formatDate(new Date(now.setHours(now.getHours() + 2)));
    const data = _.defaults(props.defaults, {
      startsAt,
      endsAt,
      matchers: [],
      createdBy: '',
      comment: '',
    });
    if (_.isEmpty(data.matchers)) {
      data.matchers.push({ name: '', value: '', isRegex: false });
    }
    this.state = { data, error: undefined, inProgress: false };
  }

  setField = (path: string, v: any): void => {
    const data = Object.assign({}, this.state.data);
    _.set(data, path, v);
    this.setState({ data });
  };

  onFieldChange = (path: string): ((e) => void) => {
    return (e) => this.setField(path, e.target.value);
  };

  onIsRegexChange = (e, i: number): void => {
    this.setField(`matchers[${i}].isRegex`, e.target.checked);
  };

  addMatcher = (): void => {
    this.setField(`matchers[${this.state.data.matchers.length}]`, {
      name: '',
      value: '',
      isRegex: false,
    });
  };

  removeMatcher = (i: number): void => {
    const data = Object.assign({}, this.state.data);
    data.matchers.splice(i, 1);
    this.setState({ data });
    if (!data.matchers.length) {
      // All matchers have been removed, so add back a single blank matcher
      this.addMatcher();
    }
  };

  onSubmit = (e): void => {
    e.preventDefault();

    const { alertManagerBaseURL } = window.SERVER_FLAGS;
    if (!alertManagerBaseURL) {
      this.setState({ error: 'Alertmanager URL not set' });
      return;
    }

    this.setState({ inProgress: true });

    const body = Object.assign({}, this.state.data);
    body.startsAt = toISODate(body.startsAt);
    body.endsAt = toISODate(body.endsAt);

    coFetchJSON
      .post(`${alertManagerBaseURL}/api/v1/silences`, body)
      .then(({ data }) => {
        this.setState({ error: undefined });
        refreshNotificationPollers();
        history.push(`${SilenceResource.plural}/${encodeURIComponent(_.get(data, 'silenceId'))}`);
      })
      .catch((err) =>
        this.setState({ error: _.get(err, 'json.error') || err.message || 'Error saving Silence' }),
      )
      .then(() => this.setState({ inProgress: false }));
  };

  render() {
    const { Info, saveButtonText, title } = this.props;
    const { data, error, inProgress } = this.state;

    return (
      <div className="co-m-pane__body co-m-pane__form">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <form className="co-m-pane__body-group silence-form" onSubmit={this.onSubmit}>
          <SectionHeading text={title} />
          <p className="co-m-pane__explanation">
            A silence is configured based on matchers (label selectors). No notification will be
            sent out for alerts that match all the values or regular expressions.
          </p>
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
          <div className="co-form-section__separator" />

          <div className="form-group">
            <label className="co-required">Matchers (label selectors)</label>
            <p className="co-help-text">
              Alerts affected by this silence. Matching alerts must satisfy all of the specified
              label constraints, though they may have additional labels as well.
            </p>
            <div className="row monitoring-grid-head text-secondary text-uppercase">
              <div className="col-xs-5">Name</div>
              <div className="col-xs-6">Value</div>
            </div>
            {_.map(data.matchers, (matcher, i) => (
              <div className="row form-group" key={i}>
                <div className="col-xs-10">
                  <div className="row">
                    <div className="col-xs-6 pairs-list__name-field">
                      <div className="form-group">
                        <Text
                          onChange={this.onFieldChange(`matchers[${i}].name`)}
                          placeholder="Name"
                          value={matcher.name}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xs-6 pairs-list__value-field">
                      <div className="form-group">
                        <Text
                          onChange={this.onFieldChange(`matchers[${i}].value`)}
                          placeholder="Value"
                          value={matcher.value}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-xs-12 col-sm-12">
                      <div className="form-group">
                        <label className="co-no-bold">
                          <input
                            type="checkbox"
                            onChange={(e) => this.onIsRegexChange(e, i)}
                            checked={matcher.isRegex}
                          />
                          &nbsp; Regular Expression
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-xs-2 pairs-list__action">
                  <Button
                    type="button"
                    onClick={() => this.removeMatcher(i)}
                    aria-label="Remove matcher"
                    variant="plain"
                  >
                    <MinusCircleIcon />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              className="pf-m-link--align-left"
              onClick={this.addMatcher}
              type="button"
              variant="link"
            >
              <PlusCircleIcon className="co-icon-space-r" />
              Add More
            </Button>
          </div>
          <div className="co-form-section__separator" />

          <div className="form-group">
            <label>Creator</label>
            <Text onChange={this.onFieldChange('createdBy')} value={data.createdBy} />
          </div>
          <div className="form-group">
            <label>Comment</label>
            <textarea
              className="pf-c-form-control"
              onChange={this.onFieldChange('comment')}
              value={data.comment}
            />
          </div>

          <ButtonBar errorMessage={error} inProgress={inProgress}>
            <ActionGroup className="pf-c-form">
              <Button type="submit" variant="primary">
                {saveButtonText || 'Save'}
              </Button>
              <Button onClick={history.goBack} variant="secondary">
                Cancel
              </Button>
            </ActionGroup>
          </ButtonBar>
        </form>
      </div>
    );
  }
}
const SilenceForm = withFallback(SilenceForm_);

const EditInfo = () => (
  <Alert isInline className="co-alert" variant="info" title="Overwriting current silence">
    When changes are saved, the currently existing silence will be expired and a new silence with
    the new configuration will take its place.
  </Alert>
);

const EditSilence = connect(silenceParamToProps)(({ loaded, loadError, silence }) => {
  const isExpired = silenceState(silence) === SilenceStates.Expired;
  const defaults = _.pick(silence, [
    'comment',
    'createdBy',
    'endsAt',
    'id',
    'matchers',
    'startsAt',
  ]);
  defaults.startsAt = isExpired ? undefined : formatDate(new Date(defaults.startsAt));
  defaults.endsAt = isExpired ? undefined : formatDate(new Date(defaults.endsAt));
  return (
    <StatusBox data={silence} label={SilenceResource.label} loaded={loaded} loadError={loadError}>
      <SilenceForm
        defaults={defaults}
        Info={isExpired ? null : EditInfo}
        title={isExpired ? 'Recreate Silence' : 'Edit Silence'}
      />
    </StatusBox>
  );
});

const CreateSilence_ = ({ createdBy }) => {
  const matchers = _.map(getURLSearchParams(), (value, name) => ({ name, value, isRegex: false }));
  return _.isEmpty(matchers) ? (
    <SilenceForm defaults={{ createdBy }} saveButtonText="Create" title="Create Silence" />
  ) : (
    <SilenceForm defaults={{ createdBy, matchers }} saveButtonText="Create" title="Silence Alert" />
  );
};
const createSilenceStateToProps = ({ UI }: RootState) => ({
  createdBy: UI.get('user')?.metadata?.name,
});
const CreateSilence = connect(createSilenceStateToProps)(CreateSilence_);

const AlertmanagerYAML = () => {
  return (
    <Firehose
      resources={[
        {
          kind: 'Secret',
          name: 'alertmanager-main',
          namespace: 'openshift-monitoring',
          isList: false,
          prop: 'obj',
        },
      ]}
    >
      <AlertmanagerYAMLEditorWrapper />
    </Firehose>
  );
};

const AlertmanagerConfig = () => {
  return (
    <Firehose
      resources={[
        {
          kind: 'Secret',
          name: 'alertmanager-main',
          namespace: 'openshift-monitoring',
          isList: false,
          prop: 'obj',
        },
      ]}
    >
      <AlertmanagerConfigWrapper />
    </Firehose>
  );
};

const Tab: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <li
    className={classNames('co-m-horizontal-nav__menu-item', {
      'co-m-horizontal-nav-item--active': active,
    })}
  >
    {children}
  </li>
);

const AlertingPage: React.SFC<AlertingPageProps> = ({ match }) => {
  const alertsPath = '/monitoring/alerts';
  const rulesPath = '/monitoring/alertrules';
  const silencesPath = '/monitoring/silences';
  const configPath = '/monitoring/alertmanagerconfig';
  const YAMLPath = '/monitoring/alertmanageryaml';

  const { url } = match;
  const isAlertmanager = url === configPath || url === YAMLPath;

  return (
    <>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name" data-test-id="resource-title">
              {isAlertmanager ? 'Alertmanager' : 'Alerting'}
            </span>
            <HeaderAlertmanagerLink path="/#/alerts" />
          </div>
        </h1>
      </div>
      <ul className="co-m-horizontal-nav__menu">
        {(url === alertsPath || url === rulesPath || url === silencesPath) && (
          <>
            <Tab active={url === alertsPath}>
              <Link to={alertsPath}>Alerts</Link>
            </Tab>
            <Tab active={url === silencesPath}>
              <Link to={silencesPath}>Silences</Link>
            </Tab>
            <Tab active={url === rulesPath}>
              <Link to={rulesPath}>Alerting Rules</Link>
            </Tab>
          </>
        )}
        {isAlertmanager && (
          <>
            <Tab active={url === configPath}>
              <Link to={configPath}>Details</Link>
            </Tab>
            <Tab active={url === YAMLPath}>
              <Link to={YAMLPath}>YAML</Link>
            </Tab>
          </>
        )}
      </ul>
      <Switch>
        <Route path={alertsPath} exact component={AlertsPage} />
        <Route path={rulesPath} exact component={RulesPage} />
        <Route path={silencesPath} exact component={SilencesPage} />
        <Route path={configPath} exact component={AlertmanagerConfig} />
        <Route path={YAMLPath} exact component={AlertmanagerYAML} />
      </Switch>
    </>
  );
};

const getAlertsAndRules = (
  data: PrometheusRulesResponse['data'],
): { alerts: Alert[]; rules: Rule[] } => {
  // Flatten the rules data to make it easier to work with, discard non-alerting rules since those are the only
  // ones we will be using and add a unique ID to each rule.
  const groups = _.get(data, 'groups') as PrometheusRulesResponse['data']['groups'];
  const rules = _.flatMap(groups, (g) => {
    const addID = (r: PrometheusRule): Rule => {
      const key = [
        g.file,
        g.name,
        r.name,
        r.duration,
        r.query,
        ..._.map(r.labels, (k, v) => `${k}=${v}`),
      ].join(',');
      return { ...r, id: String(murmur3(key, 'monitoring-salt')) };
    };

    return _.filter(g.rules, { type: 'alerting' }).map(addID);
  });

  // Add `rule` object to each alert
  const alerts = _.flatMap(rules, (rule) => rule.alerts.map((a) => ({ rule, ...a })));

  return { alerts, rules };
};

export const getAlerts = (data: PrometheusRulesResponse['data']) => getAlertsAndRules(data).alerts;

const PollerPages = () => {
  React.useEffect(() => {
    const { prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      const key = 'alerts';
      store.dispatch(UIActions.monitoringLoading(key));
      const poller = (): void => {
        coFetchJSON(`${prometheusBaseURL}/api/v1/rules`)
          .then(({ data }) => {
            const { alerts, rules } = getAlertsAndRules(data);
            store.dispatch(UIActions.monitoringLoaded(key, alerts));
            store.dispatch(UIActions.monitoringSetRules(rules));
          })
          .catch((e) => store.dispatch(UIActions.monitoringErrored(key, e)))
          .then(() => (pollerTimeouts[key] = setTimeout(poller, 15 * 1000)));
      };
      pollers[key] = poller;
      poller();
    } else {
      store.dispatch(UIActions.monitoringErrored('alerts', new Error('prometheusBaseURL not set')));
    }
    return () => _.each(pollerTimeouts, clearTimeout);
  }, []);

  return (
    <Switch>
      <Route
        path="/monitoring/(alertmanageryaml|alerts|alertrules|silences|alertmanagerconfig)"
        exact
        component={AlertingPage}
      />
      <Route path="/monitoring/alertrules/:id" exact component={AlertRulesDetailsPage} />
      <Route path="/monitoring/alerts/:ruleID" exact component={AlertsDetailsPage} />
      <Route path="/monitoring/silences/:id" exact component={SilencesDetailsPage} />
      <Route path="/monitoring/silences/:id/edit" exact component={EditSilence} />
    </Switch>
  );
};

export const MonitoringUI = () => (
  <Switch>
    <Redirect from="/monitoring" exact to="/monitoring/alerts" />
    <Route path="/monitoring/dashboards/:board?" exact component={MonitoringDashboardsPage} />
    <Route path="/monitoring/query-browser" exact component={QueryBrowserPage} />
    <Route path="/monitoring/silences/~new" exact component={CreateSilence} />
    <Route component={PollerPages} />
  </Switch>
);

type Silence = {
  comment: string;
  createdBy: string;
  endsAt: string;
  // eslint-disable-next-line no-use-before-define
  firingAlerts: Alert[];
  id?: string;
  matchers: { name: string; value: string; isRegex: boolean }[];
  name?: string;
  startsAt: string;
  status?: { state: SilenceStates };
  updatedAt?: string;
};

type Silences = {
  data: Silence[];
  loaded: boolean;
  loadError?: string;
};

type PrometheusAlert = {
  activeAt?: string;
  annotations: PrometheusLabels;
  labels: PrometheusLabels & {
    alertname: string;
  };
  state: AlertStates;
  value?: number;
};

export type Alert = PrometheusAlert & {
  rule: Rule;
  silencedBy?: Silence[];
};

type PrometheusRule = {
  alerts: PrometheusAlert[];
  annotations: PrometheusLabels;
  duration: number;
  labels: PrometheusLabels;
  name: string;
  query: string;
};

type Rule = PrometheusRule & {
  id: string;
};

type Rules = {
  data: Rule[];
  loaded: boolean;
  loadError?: string;
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
  urls: { key: string }[];
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
  filters: { [key: string]: any };
  Header: (...args) => any[];
  itemCount: number;
  kindPlural: string;
  loaded: boolean;
  loadError?: string;
  match: { path: string };
  nameFilterID: string;
  reduxID: string;
  Row: RowFunction;
  rowFilter: {
    type: string;
    selected: string[];
    reducer: (any) => string;
    items: { id: string; title: string }[];
  };
  showTitle?: boolean;
};

type AlertingPageProps = {
  match: any;
};

type SeverityIconProps = {
  label: number | string;
  severity: string;
};

type GraphProps = {
  filterLabels?: PrometheusLabels;
  hideGraphs: boolean;
  patchQuery: (index: number, patch: QueryObj) => any;
  rule: Rule;
};

type Group = {
  rules: PrometheusRule[];
  file: string;
  inverval: number;
  name: string;
};

export type PrometheusRulesResponse = {
  data: {
    groups: Group[];
  };
  status: string;
};
