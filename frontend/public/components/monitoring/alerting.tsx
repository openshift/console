import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Button, Popover } from '@patternfly/react-core';
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
  OutlinedBellIcon,
} from '@patternfly/react-icons';

import {
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import * as UIActions from '../../actions/ui';
import { coFetchJSON } from '../../co-fetch';
import {
  ContainerModel,
  DaemonSetModel,
  DeploymentModel,
  JobModel,
  NamespaceModel,
  NodeModel,
  PodModel,
  StatefulSetModel,
} from '../../models';
import { K8sKind } from '../../module/k8s';
import {
  alertDescription,
  alertingRuleIsActive,
  alertingRuleSource,
  alertSource,
  alertState,
  silenceState,
} from '../../reducers/monitoring';
import store, { RootState } from '../../redux';
import { RowFunction, Table, TableData, TableRow } from '../factory';
import { FilterToolbar, RowFilter } from '../filter-toolbar';
import { confirmModal } from '../modals';
import { PrometheusLabels } from '../graphs';
import { AlertmanagerYAMLEditorWrapper } from '../monitoring/alert-manager-yaml-editor';
import { AlertmanagerConfigWrapper } from '../monitoring/alert-manager-config';
import MonitoringDashboardsPage from '../monitoring/dashboards';
import { QueryBrowserPage, ToggleGraph } from '../monitoring/metrics';
import { QueryBrowser, QueryObj } from '../monitoring/query-browser';
import { CreateSilence, EditSilence } from '../monitoring/silence-form';
import {
  Alert,
  Alerts,
  AlertSeverity,
  AlertSource,
  AlertStates,
  ListPageProps,
  MonitoringResource,
  PrometheusAlert,
  Rule,
  Rules,
  Silence,
  Silences,
  SilenceStates,
} from '../monitoring/types';
import {
  AlertResource,
  alertsToProps,
  alertURL,
  getAlertsAndRules,
  labelsToParams,
  RuleResource,
  rulesToProps,
  silenceParamToProps,
  SilenceResource,
  silencesToProps,
} from '../monitoring/utils';
import { refreshNotificationPollers } from '../notification-drawer';
import { formatPrometheusDuration } from '../utils/datetime';
import { ActionsMenu } from '../utils/dropdown';
import { Firehose } from '../utils/firehose';
import { SectionHeading, ActionButtons, BreadCrumbs } from '../utils/headings';
import { Kebab } from '../utils/kebab';
import { ExternalLink, getURLSearchParams } from '../utils/link';
import { ResourceLink } from '../utils/resource-link';
import { ResourceStatus } from '../utils/resource-status';
import { history } from '../utils/router';
import { LoadingInline, StatusBox } from '../utils/status-box';
import { Timestamp } from '../utils/timestamp';

const ruleURL = (rule: Rule) => `${RuleResource.plural}/${_.get(rule, 'id')}`;

const pollers = {};
const pollerTimeouts = {};

const silenceAlert = (alert: Alert) => ({
  callback: () => history.replace(`${SilenceResource.plural}/~new?${labelsToParams(alert.labels)}`),
  label: 'Silence Alert',
});

const viewAlertRule = (alert: Alert) => ({
  label: 'View Alerting Rule',
  href: ruleURL(alert.rule),
});

const editSilence = (silence: Silence) => ({
  label: silenceState(silence) === SilenceStates.Expired ? 'Recreate Silence' : 'Edit Silence',
  href: `${SilenceResource.plural}/${silence.id}/edit`,
});

const cancelSilence = (silence: Silence) => ({
  label: 'Expire Silence',
  callback: () =>
    confirmModal({
      title: 'Expire Silence',
      message: 'Are you sure you want to expire this silence?',
      btnText: 'Expire Silence',
      executeFn: () =>
        coFetchJSON
          .delete(`${window.SERVER_FLAGS.alertManagerBaseURL}/api/v2/silence/${silence.id}`)
          .then(() => refreshNotificationPollers()),
    }),
});

const silenceMenuActions = (silence: Silence) =>
  silenceState(silence) === SilenceStates.Expired
    ? [editSilence(silence)]
    : [editSilence(silence), cancelSilence(silence)];

const SilenceKebab = ({ silence }) => <Kebab options={silenceMenuActions(silence)} />;

const SilenceActionsMenu = ({ silence }) => (
  <div className="co-actions" data-test-id="details-actions">
    <ActionsMenu actions={silenceMenuActions(silence)} />
  </div>
);

const MonitoringResourceIcon: React.FC<MonitoringResourceIconProps> = ({ className, resource }) => (
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

const alertStateIcons = {
  [AlertStates.Firing]: <BellIcon />,
  [AlertStates.Pending]: <OutlinedBellIcon />,
  [AlertStates.Silenced]: <BellSlashIcon className="text-muted" />,
};

const AlertStateIcon: React.FC<{ state: string }> = ({ state }) => alertStateIcons[state];

export const AlertState: React.FC<AlertStateProps> = ({ state }) => {
  const icon = alertStateIcons[state];
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

export const StateTimestamp = ({ text, timestamp }) => (
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

const SeverityIcon: React.FC<{ severity: string }> = ({ severity }) => {
  const Icon =
    {
      [AlertSeverity.Critical]: RedExclamationCircleIcon,
      [AlertSeverity.Info]: BlueInfoCircleIcon,
      [AlertSeverity.None]: BlueInfoCircleIcon,
      [AlertSeverity.Warning]: YellowExclamationTriangleIcon,
    }[severity] || YellowExclamationTriangleIcon;
  return <Icon />;
};

export const Severity: React.FC<{ severity: string }> = ({ severity }) =>
  _.isNil(severity) ? (
    <>-</>
  ) : (
    <>
      <SeverityIcon severity={severity} /> {_.startCase(severity)}
    </>
  );

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) =>
  _.isNil(severity) || severity === 'none' ? null : (
    <ResourceStatus>
      <Severity severity={severity} />
    </ResourceStatus>
  );

const SeverityCounts: React.FC<{ alerts: Alert[] }> = ({ alerts }) => {
  if (_.isEmpty(alerts)) {
    return <>-</>;
  }

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
          <SeverityIcon severity={s} /> {counts[s]}
        </span>
      ))}
    </>
  );
};

export const StateCounts: React.FC<{ alerts: PrometheusAlert[] }> = ({ alerts }) => {
  const counts = _.countBy(alerts, 'state');
  const states = [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].filter(
    (s) => counts[s] > 0,
  );

  return (
    <>
      {states.map((s) => (
        <div className="monitoring-icon-wrap" key={s}>
          <AlertStateIcon state={s} /> {counts[s]} {_.startCase(s)}
        </div>
      ))}
    </>
  );
};

const PopoverField: React.FC<{ body: React.ReactNode; label: string }> = ({ body, label }) => (
  <Popover headerContent={label} bodyContent={body}>
    <Button variant="plain" className="details-item__popover-button">
      {label}
    </Button>
  </Popover>
);

const alertStateHelp = (
  <dl className="co-inline">
    <dt>
      <AlertStateIcon state={AlertStates.Pending} /> <strong>Pending: </strong>
    </dt>
    <dd>
      The alert is active but is waiting for the duration that is specified in the alerting rule
      before it fires.
    </dd>
    <dt>
      <AlertStateIcon state={AlertStates.Firing} /> <strong>Firing: </strong>
    </dt>
    <dd>
      The alert is firing because the alert condition is true and the optional `for` duration has
      passed. The alert will continue to fire as long as the condition remains true.
    </dd>
    <dt>
      <AlertStateIcon state={AlertStates.Silenced} /> <strong>Silenced: </strong>
    </dt>
    <dt></dt>
    <dd>
      The alert is now silenced for a defined time period. Silences temporarily mute alerts based on
      a set of label selectors that you define. Notifications will not be sent for alerts that match
      all the listed values or regular expressions.
    </dd>
  </dl>
);

const severityHelp = (
  <dl className="co-inline">
    <dt>
      <SeverityIcon severity={AlertSeverity.Critical} /> <strong>Critical: </strong>
    </dt>
    <dd>
      The condition that triggered the alert could have a critical impact. The alert requires
      immediate attention when fired and is typically paged to an individual or to a critical
      response team.
    </dd>
    <dt>
      <SeverityIcon severity={AlertSeverity.Warning} /> <strong>Warning: </strong>
    </dt>
    <dd>
      The alert provides a warning notification about something that might require attention in
      order to prevent a problem from occurring. Warnings are typically routed to a ticketing system
      for non-immediate review.
    </dd>
    <dt>
      <SeverityIcon severity={AlertSeverity.Info} /> <strong>Info: </strong>
    </dt>
    <dd>The alert is provided for informational purposes only.</dd>
    <dt>
      <SeverityIcon severity={AlertSeverity.None} /> <strong>None: </strong>
    </dt>
    <dd>The alert has no defined severity.</dd>
    <dd>You can also create custom severity definitions for user workload alerts.</dd>
  </dl>
);

const sourceHelp = (
  <dl className="co-inline">
    <dt>
      <strong>Platform: </strong>
    </dt>
    <dd>
      Platform-level alerts relate only to OpenShift namespaces. OpenShift namespaces provide core
      OpenShift functionality.
    </dd>
    <dt>
      <strong>User: </strong>
    </dt>
    <dd>
      User workload alerts relate to user-defined namespaces. These alerts are user-created and are
      customizable. User workload monitoring can be enabled post-installation to provide
      observability into your own services.
    </dd>
  </dl>
);

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

const queryBrowserURL = (query: string, namespace: string) =>
  namespace
    ? `/dev-monitoring/ns/${namespace}/metrics?query0=${encodeURIComponent(query)}`
    : `/monitoring/query-browser?query0=${encodeURIComponent(query)}`;

const Graph_: React.FC<GraphProps> = ({
  deleteAll,
  filterLabels = undefined,
  patchQuery,
  rule,
  namespace,
}) => {
  const { duration = 0, query = '' } = rule || {};

  // Set the query in Redux so that other components like the graph tooltip can access it
  React.useEffect(() => {
    patchQuery(0, { query });
  }, [patchQuery, query]);

  // Clear queries on unmount
  React.useEffect(() => deleteAll, [deleteAll]);

  const queries = React.useMemo(() => [query], [query]);

  // 3 times the rule's duration, but not less than 30 minutes
  const timespan = Math.max(3 * duration, 30 * 60) * 1000;

  const GraphLink = () =>
    query ? <Link to={queryBrowserURL(query, namespace)}>View in Metrics</Link> : null;

  return (
    <QueryBrowser
      defaultTimespan={timespan}
      filterLabels={filterLabels}
      GraphLink={GraphLink}
      queries={queries}
    />
  );
};
const Graph = connect(null, {
  deleteAll: UIActions.queryBrowserDeleteAllQueries,
  patchQuery: UIActions.queryBrowserPatchQuery,
})(Graph_);

const tableSilenceClasses = [
  classNames('col-sm-5', 'col-xs-8'),
  classNames('col-md-2', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-3', 'col-sm-4'),
  classNames('col-md-2', 'hidden-sm'),
  Kebab.columnClass,
];

const silenceTableHeader = () => [
  {
    title: 'Name',
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableSilenceClasses[0] },
  },
  {
    title: 'Firing Alerts',
    sortFunc: 'silenceFiringAlertsOrder',
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
    title: 'Creator',
    sortField: 'createdBy',
    transforms: [sortable],
    props: { className: tableSilenceClasses[3] },
  },
  {
    title: '',
    props: { className: tableSilenceClasses[4] },
  },
];

const silenceTableHeaderNoSort = () =>
  silenceTableHeader().map((h) => _.pick(h, ['title', 'props']));

const SilenceMatchersList = ({ silence }) => (
  <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
    {_.map(silence.matchers, ({ name, isRegex, value }, i) => (
      <Label key={i} k={name} v={isRegex ? `~${value}` : value} />
    ))}
  </div>
);

const SilenceTableRow: RowFunction<Silence> = ({ index, key, obj, style }) => {
  const { createdBy, endsAt, firingAlerts, id, name, startsAt } = obj;
  const state = silenceState(obj);

  return (
    <TableRow id={id} index={index} trKey={key} style={style}>
      <TableData className={tableSilenceClasses[0]}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={SilenceResource} />
          <Link
            className="co-resource-item__resource-name"
            data-test-id="silence-resource-link"
            title={id}
            to={`${SilenceResource.plural}/${id}`}
          >
            {name}
          </Link>
        </div>
        <div className="monitoring-label-list">
          <SilenceMatchersList silence={obj} />
        </div>
      </TableData>
      <TableData className={tableSilenceClasses[1]}>
        <SeverityCounts alerts={firingAlerts} />
      </TableData>
      <TableData className={classNames(tableSilenceClasses[2], 'co-break-word')}>
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && <StateTimestamp text="Starts" timestamp={startsAt} />}
        {state === SilenceStates.Active && <StateTimestamp text="Ends" timestamp={endsAt} />}
        {state === SilenceStates.Expired && <StateTimestamp text="Expired" timestamp={endsAt} />}
      </TableData>
      <TableData className={tableSilenceClasses[3]}>{createdBy || '-'}</TableData>
      <TableData className={tableSilenceClasses[4]}>
        <SilenceKebab silence={obj} />
      </TableData>
    </TableRow>
  );
};

export const alertMessageResources: { [labelName: string]: K8sKind } = {
  container: ContainerModel,
  daemonset: DaemonSetModel,
  deployment: DeploymentModel,
  job: JobModel,
  namespace: NamespaceModel,
  node: NodeModel,
  pod: PodModel,
  statefulset: StatefulSetModel,
};

const matchCount = (haystack: string, regExpString: string) =>
  _.size(haystack.match(new RegExp(regExpString, 'g')));

const AlertMessage: React.FC<AlertMessageProps> = ({ alertText, labels, template }) => {
  if (_.isEmpty(alertText)) {
    return null;
  }

  let messageParts: React.ReactNode[] = [alertText];

  // Go through each recognized resource type and replace any resource names that exist in alertText
  // with a link to the resource's details page
  _.each(alertMessageResources, (model, label) => {
    const labelValue = labels[label];

    if (labelValue && !(model.namespaced && _.isEmpty(labels.namespace))) {
      const tagCount = matchCount(template, `\\{\\{ *\\$labels\\.${label} *\\}\\}`);
      const resourceNameCount = matchCount(alertText, _.escapeRegExp(labelValue));

      // Don't do the replacement unless the counts match. This avoids overwriting the wrong string
      // if labelValue happens to appear elsewhere in alertText
      if (tagCount > 0 && tagCount === resourceNameCount) {
        const link = (
          <ResourceLink
            className="co-resource-item--monitoring-alert"
            inline
            key={model.kind}
            kind={model.kind}
            name={labelValue}
            namespace={model.namespaced ? labels.namespace : undefined}
          />
        );
        messageParts = _.flatMap(messageParts, (part) => {
          if (_.isString(part) && part.indexOf(labelValue) !== -1) {
            const [before, after] = part.split(labelValue);
            return [before, link, after];
          }
          return [part];
        });
      }
    }
  });

  return <p>{messageParts}</p>;
};

const HeaderAlertMessage: React.FC<{ alert: Alert; rule: Rule }> = ({ alert, rule }) => {
  const annotation = alert.annotations.description ? 'description' : 'message';
  return (
    <AlertMessage
      alertText={alert.annotations[annotation]}
      labels={alert.labels}
      template={rule.annotations[annotation]}
    />
  );
};

const alertStateToProps = (state: RootState, { match }): AlertsDetailsPageProps => {
  const perspective = _.has(match.params, 'ns') ? 'dev' : 'admin';
  const namespace = match.params?.ns;
  const { data, loaded, loadError }: Alerts = alertsToProps(state, perspective);
  const { loaded: silencesLoaded }: Silences = silencesToProps(state);
  const ruleID = match?.params?.ruleID;
  const labels = getURLSearchParams();
  const alerts = _.filter(data, (a) => a.rule.id === ruleID);
  const rule = alerts?.[0]?.rule;
  const alert = _.find(alerts, (a) => _.isEqual(a.labels, labels));
  return {
    alert,
    loaded,
    loadError,
    namespace,
    rule,
    silencesLoaded,
  };
};

export const AlertsDetailsPage = withFallback(
  connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
    const { alert, loaded, loadError, namespace, rule, silencesLoaded } = props;
    const { annotations = {}, labels = {}, silencedBy = [] } = alert || {};
    const { alertname, severity } = labels as any;
    const state = alertState(alert);

    return (
      <>
        <Helmet>
          <title>{`${alertname} · Details`}</title>
        </Helmet>
        <StatusBox data={alert} label={AlertResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: 'Alerts',
                  path: namespace ? `/dev-monitoring/ns/${namespace}/alerts` : '/monitoring/alerts',
                },
                { name: 'Alert Details', path: undefined },
              ]}
            />
            <h1 className="co-m-pane__heading">
              <div data-test="resource-title" className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={AlertResource}
                />
                {alertname}
                <SeverityBadge severity={severity} />
              </div>
              {state !== AlertStates.Silenced && (
                <div className="co-actions" data-test-id="details-actions">
                  <ActionButtons actionButtons={[silenceAlert(alert)]} />
                </div>
              )}
            </h1>
            <HeaderAlertMessage alert={alert} rule={rule} />
          </div>
          <div className="co-m-pane__body">
            <ToggleGraph />
            <SectionHeading text="Alert Details" />
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-12">
                  <Graph filterLabels={labels} namespace={namespace} rule={rule} />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>Name</dt>
                    <dd>{alertname}</dd>
                    <dt>
                      <PopoverField label="Severity" body={severityHelp} />
                    </dt>
                    <dd>
                      <Severity severity={severity} />
                    </dd>
                    {annotations.description && (
                      <Annotation title="Description">
                        <AlertMessage
                          alertText={annotations.description}
                          labels={labels}
                          template={rule?.annotations.description}
                        />
                      </Annotation>
                    )}
                    <Annotation title="Summary">{annotations.summary}</Annotation>
                    {annotations.message && (
                      <Annotation title="Message">
                        <AlertMessage
                          alertText={annotations.message}
                          labels={labels}
                          template={rule?.annotations.message}
                        />
                      </Annotation>
                    )}
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>
                      <PopoverField label="Source" body={sourceHelp} />
                    </dt>
                    <dd>{alert && _.startCase(alertSource(alert))}</dd>
                    <dt>
                      <PopoverField label="State" body={alertStateHelp} />
                    </dt>
                    <dd>
                      <AlertState state={state} />
                      <AlertStateDescription alert={alert} />
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  <dl className="co-m-pane__details" data-test="label-list">
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
                          to={
                            namespace
                              ? `/dev-monitoring/ns/${namespace}/rules/${rule?.id}`
                              : ruleURL(rule)
                          }
                          data-test="alert-rules-detail-resource-link"
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
                    <Table
                      aria-label="Silenced By"
                      data={silencedBy}
                      Header={silenceTableHeaderNoSort}
                      loaded={true}
                      Row={SilenceTableRow}
                    />
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

const ActiveAlerts = ({ alerts, ruleID, namespace }) => (
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
            <Link
              className="co-resource-item"
              data-test="active-alerts"
              to={
                namespace
                  ? `/dev-monitoring/ns/${namespace}/alerts/${ruleID}?${labelsToParams(a.labels)}`
                  : alertURL(a, ruleID)
              }
            >
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
  const perspective = _.has(match.params, 'ns') ? 'dev' : 'admin';
  const namespace = match.params?.ns;
  const { data, loaded, loadError }: Rules = rulesToProps(state, perspective);
  const id = _.get(match, 'params.id');
  const rule = _.find(data, { id });
  return { loaded, loadError, namespace, rule };
};

export const AlertRulesDetailsPage = withFallback(
  connect(ruleStateToProps)((props: AlertRulesDetailsPageProps) => {
    const { loaded, loadError, namespace, rule } = props;
    const { alerts = [], annotations, duration, labels, name = '', query = '' } = rule || {};
    const severity = labels?.severity;
    return (
      <>
        <Helmet>
          <title>{`${name || RuleResource.label} · Details`}</title>
        </Helmet>
        <StatusBox data={rule} label={RuleResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: namespace ? 'Alerts' : 'Alerting Rules',
                  path: namespace
                    ? `/dev-monitoring/ns/${namespace}/alerts`
                    : '/monitoring/alertrules',
                },
                { name: 'Alerting Rule Details', path: undefined },
              ]}
            />
            <h1 className="co-m-pane__heading">
              <div data-test="resource-title" className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={RuleResource}
                />
                {name}
                <SeverityBadge severity={severity} />
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
                    <dt>
                      <PopoverField label="Severity" body={severityHelp} />
                    </dt>
                    <dd>
                      <Severity severity={severity} />
                    </dd>
                    <Annotation title="Description">{annotations?.description}</Annotation>
                    <Annotation title="Summary">{annotations?.summary}</Annotation>
                    <Annotation title="Message">{annotations?.message}</Annotation>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>
                      <PopoverField label="Source" body={sourceHelp} />
                    </dt>
                    <dd>{rule && _.startCase(alertingRuleSource(rule))}</dd>
                    {_.isInteger(duration) && (
                      <>
                        <dt>For</dt>
                        <dd>{duration === 0 ? '-' : formatPrometheusDuration(duration * 1000)}</dd>
                      </>
                    )}
                    <dt>Expression</dt>
                    <dd>
                      <Link to={queryBrowserURL(query, namespace)}>
                        <pre className="co-pre-wrap monitoring-query">{query}</pre>
                      </Link>
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
                        <div className={`co-text-${RuleResource.kind.toLowerCase()}`}>
                          {_.map(labels, (v, k) => (
                            <Label key={k} k={k} v={v} />
                          ))}
                        </div>
                      )}
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
                  <Graph namespace={namespace} rule={rule} />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  {_.isEmpty(alerts) ? (
                    <div className="text-center">None Found</div>
                  ) : (
                    <ActiveAlerts alerts={alerts} ruleID={rule.id} namespace={namespace} />
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
              <Link
                className="co-resource-item"
                data-test="firing-alerts"
                to={alertURL(a, a.rule.id)}
              >
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

const SilencesDetailsPage = withFallback(
  connect(silenceParamToProps)((props: SilencesDetailsPageProps) => {
    const { alertsLoaded, loaded, loadError, namespace, silence } = props;
    const {
      comment = '',
      createdBy = '',
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
          <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: 'Silences',
                  path: namespace
                    ? `/dev-monitoring/ns/${namespace}/silences`
                    : '/monitoring/silences',
                },
                { name: 'Silence Details', path: undefined },
              ]}
            />
            <h1 className="co-m-pane__heading">
              <div data-test="resource-title" className="co-resource-item">
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
                    <dd data-test="label-list">
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
  classNames('col-sm-6', 'col-xs-8'),
  classNames('col-sm-2', 'hidden-xs'),
  classNames('col-sm-2', 'col-xs-3'),
  classNames('col-sm-2', 'col-xs-3'),
  Kebab.columnClass,
];

const AlertTableRow: RowFunction<Alert> = ({ index, key, obj, style }) => {
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
        {alertSource(obj) === AlertSource.User ? 'User' : 'Platform'}
      </TableData>
      <TableData className={tableAlertClasses[4]}>
        <Kebab
          options={
            state === AlertStates.Silenced
              ? [viewAlertRule(obj)]
              : [silenceAlert(obj), viewAlertRule(obj)]
          }
        />
      </TableData>
    </TableRow>
  );
};

const alertTableHeader = () => [
  {
    title: 'Name',
    sortField: 'labels.alertname',
    transforms: [sortable],
    props: { className: tableAlertClasses[0] },
  },
  {
    title: 'Severity',
    sortFunc: 'alertSeverityOrder',
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
    title: 'Source',
    sortFunc: 'alertSource',
    transforms: [sortable],
    props: { className: tableAlertClasses[3] },
  },
  {
    title: '',
    props: { className: tableAlertClasses[4] },
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

export const severityRowFilter: RowFilter = {
  filterGroupName: 'Severity',
  items: [
    { id: AlertSeverity.Critical, title: 'Critical' },
    { id: AlertSeverity.Warning, title: 'Warning' },
    { id: AlertSeverity.Info, title: 'Info' },
    { id: AlertSeverity.None, title: 'None' },
  ],
  reducer: ({ labels }: Alert | Rule) => labels?.severity,
  type: 'alert-severity',
};

export const alertsRowFilters: RowFilter[] = [
  {
    defaultSelected: [AlertStates.Firing],
    filterGroupName: 'Alert State',
    items: [
      { id: AlertStates.Firing, title: 'Firing' },
      { id: AlertStates.Pending, title: 'Pending' },
      { id: AlertStates.Silenced, title: 'Silenced' },
    ],
    reducer: alertState,
    type: 'alert-state',
  },
  severityRowFilter,
  {
    defaultSelected: [AlertSource.Platform],
    filterGroupName: 'Source',
    items: [
      { id: AlertSource.Platform, title: 'Platform' },
      { id: AlertSource.User, title: 'User' },
    ],
    reducer: alertSource,
    type: 'alert-source',
  },
];

// Row filter settings are stored in "k8s"
const filtersToProps = ({ k8s }, { reduxID }) => {
  const filtersMap = k8s.getIn([reduxID, 'filters']);
  return { filters: filtersMap ? filtersMap.toJS() : null };
};

const MonitoringListPage_: React.FC<ListPageProps> = ({
  CreateButton,
  data,
  filters,
  Header,
  hideLabelFilter,
  kindPlural,
  labelFilter,
  labelPath,
  loaded,
  loadError,
  nameFilterID,
  reduxID,
  Row,
  rowFilters,
}) => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('sortBy')) {
      // Sort by rule name by default
      store.dispatch(UIActions.sortList(reduxID, 'name', undefined, 'asc', 'Name'));
    }
  }, [reduxID]);

  return (
    <>
      <Helmet>
        <title>Alerting</title>
      </Helmet>
      <div className="co-m-pane__body">
        {CreateButton && (
          <div className="co-m-pane__createLink--no-title">
            <CreateButton />
          </div>
        )}
        <FilterToolbar
          data={data}
          hideLabelFilter={hideLabelFilter}
          labelFilter={labelFilter}
          labelPath={labelPath}
          reduxIDs={[reduxID]}
          rowFilters={rowFilters}
          textFilter={nameFilterID}
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
};

const MonitoringListPage = connect(filtersToProps)(MonitoringListPage_);

const AlertsPage_: React.FC<Alerts> = ({ data, loaded, loadError }) => (
  <MonitoringListPage
    data={data}
    Header={alertTableHeader}
    kindPlural="Alerts"
    labelFilter="alerts"
    labelPath="labels"
    loaded={loaded}
    loadError={loadError}
    nameFilterID="resource-list-text"
    reduxID="monitoringAlerts"
    Row={AlertTableRow}
    rowFilters={alertsRowFilters}
  />
);
const AlertsPage = withFallback(connect(alertsToProps)(AlertsPage_));

const rulesRowFilters: RowFilter[] = [
  {
    filterGroupName: 'Rule State',
    items: [
      { id: 'true', title: 'Active' },
      { id: 'false', title: 'Inactive' },
    ],
    reducer: alertingRuleIsActive,
    type: 'alerting-rule-active',
  },
  severityRowFilter,
  {
    defaultSelected: [AlertSource.Platform],
    filterGroupName: 'Source',
    items: [
      { id: AlertSource.Platform, title: 'Platform' },
      { id: AlertSource.User, title: 'User' },
    ],
    reducer: alertingRuleSource,
    type: 'alerting-rule-source',
  },
];

const tableRuleClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-2', 'hidden-xs'),
  classNames('col-sm-3', 'col-xs-4'),
  classNames('col-sm-2', 'col-xs-2'),
];

const ruleTableHeader = () => [
  {
    title: 'Name',
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableRuleClasses[0] },
  },
  {
    title: 'Severity',
    sortFunc: 'alertSeverityOrder',
    transforms: [sortable],
    props: { className: tableRuleClasses[1] },
  },
  {
    title: 'Alert State',
    sortFunc: 'alertingRuleStateOrder',
    transforms: [sortable],
    props: { className: tableRuleClasses[2] },
  },
  {
    title: 'Source',
    sortFunc: 'alertingRuleSource',
    transforms: [sortable],
    props: { className: tableRuleClasses[3] },
  },
];

const RuleTableRow: RowFunction<Rule> = ({ index, key, obj, style }) => (
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
      {_.isEmpty(obj.alerts) ? '-' : <StateCounts alerts={obj.alerts} />}
    </TableData>
    <TableData className={tableRuleClasses[3]}>
      {alertingRuleSource(obj) === AlertSource.User ? 'User' : 'Platform'}
    </TableData>
  </TableRow>
);

const RulesPage_: React.FC<Rules> = ({ data, loaded, loadError }) => (
  <MonitoringListPage
    data={data}
    Header={ruleTableHeader}
    kindPlural="Alerting Rules"
    labelFilter="alerts"
    labelPath="labels"
    loaded={loaded}
    loadError={loadError}
    nameFilterID="alerting-rule-name"
    reduxID="monitoringRules"
    Row={RuleTableRow}
    rowFilters={rulesRowFilters}
  />
);
const RulesPage = withFallback(connect(rulesToProps)(RulesPage_));

const silencesRowFilters: RowFilter[] = [
  {
    defaultSelected: [SilenceStates.Active, SilenceStates.Pending],
    type: 'silence-state',
    filterGroupName: 'Silence State',
    reducer: silenceState,
    items: [
      { id: SilenceStates.Active, title: 'Active' },
      { id: SilenceStates.Pending, title: 'Pending' },
      { id: SilenceStates.Expired, title: 'Expired' },
    ],
  },
];

const CreateButton = () => (
  <Link className="co-m-primary-action" to="/monitoring/silences/~new">
    <Button variant="primary">Create Silence</Button>
  </Link>
);

const SilencesPage_: React.FC<Silences> = ({ data, loaded, loadError }) => (
  <MonitoringListPage
    CreateButton={CreateButton}
    data={data}
    Header={silenceTableHeader}
    hideLabelFilter
    kindPlural="Silences"
    loaded={loaded}
    loadError={loadError}
    nameFilterID="silence-name"
    reduxID="monitoringSilences"
    Row={SilenceTableRow}
    rowFilters={silencesRowFilters}
  />
);
const SilencesPage = withFallback(connect(silencesToProps)(SilencesPage_));

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

const AlertingPage: React.FC<AlertingPageProps> = ({ match }) => {
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

const PollerPages = () => {
  React.useEffect(() => {
    const { prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      const alertsKey = 'alerts';
      const rulesKey = 'rules';
      store.dispatch(UIActions.monitoringLoading(alertsKey));
      const poller = (): void => {
        coFetchJSON(`${prometheusBaseURL}/api/v1/rules`)
          .then(({ data }) => {
            const { alerts, rules } = getAlertsAndRules(data);
            store.dispatch(UIActions.monitoringLoaded(alertsKey, alerts));
            store.dispatch(UIActions.monitoringSetRules(rulesKey, rules));
          })
          .catch((e) => store.dispatch(UIActions.monitoringErrored(alertsKey, e)))
          .then(() => (pollerTimeouts[alertsKey] = setTimeout(poller, 15 * 1000)));
      };
      pollers[alertsKey] = poller;
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

type AlertStateProps = {
  state: AlertStates;
};

type AlertsDetailsPageProps = {
  alert: Alert;
  loaded: boolean;
  loadError?: string;
  namespace: string;
  rule: Rule;
  silencesLoaded: boolean;
};

type AlertMessageProps = {
  alertText: string;
  labels: PrometheusLabels;
  template: string;
};

type AlertRulesDetailsPageProps = {
  loaded: boolean;
  loadError?: string;
  namespace: string;
  rule: Rule;
};

type SilencesDetailsPageProps = {
  alertsLoaded: boolean;
  loaded: boolean;
  loadError?: string;
  namespace: string;
  silence: Silence;
};

type AlertingPageProps = {
  match: any;
};

type GraphProps = {
  deleteAll: () => never;
  filterLabels?: PrometheusLabels;
  namespace?: string;
  patchQuery: (index: number, patch: QueryObj) => any;
  rule: Rule;
};

type MonitoringResourceIconProps = {
  className?: string;
  resource: MonitoringResource;
};
