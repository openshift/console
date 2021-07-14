import * as classNames from 'classnames';
import i18next from 'i18next';
import * as _ from 'lodash-es';
import { Alert as PFAlert, Button, Popover, Split, SplitItem } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useDispatch, useSelector } from 'react-redux';
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
import { useActivePerspective } from '@console/shared/src/hooks/useActivePerspective';
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
import { RootState } from '../../redux';
import { RowFunction, Table, TableData, TableRow } from '../factory';
import { FilterToolbar, RowFilter } from '../filter-toolbar';
import { confirmModal } from '../modals';
import { PrometheusLabels } from '../graphs';
import { AlertmanagerYAMLEditorWrapper } from './alert-manager-yaml-editor';
import { AlertmanagerConfigWrapper } from './alert-manager-config';
import MonitoringDashboardsPage from './dashboards';
import { QueryBrowserPage, ToggleGraph } from './metrics';
import { FormatSeriesTitle, QueryBrowser } from './query-browser';
import { CreateSilence, EditSilence } from './silence-form';
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
} from './types';
import {
  alertDescription,
  alertingRuleSource,
  AlertResource,
  alertSource,
  alertState,
  alertsToProps,
  alertURL,
  getAlertsAndRules,
  labelsToParams,
  RuleResource,
  rulesToProps,
  silenceParamToProps,
  SilenceResource,
  silenceState,
  silencesToProps,
} from './utils';
import { refreshNotificationPollers } from '../notification-drawer';
import { formatPrometheusDuration } from '../utils/datetime';
import { ActionsMenu } from '../utils/dropdown';
import { Firehose } from '../utils/firehose';
import { SectionHeading, ActionButtons, BreadCrumbs } from '../utils/headings';
import { Kebab } from '../utils/kebab';
import { getURLSearchParams } from '../utils/link';
import { ResourceLink } from '../utils/resource-link';
import { ResourceStatus } from '../utils/resource-status';
import { history } from '../utils/router';
import { LoadingInline, StatusBox } from '../utils/status-box';
import { Timestamp } from '../utils/timestamp';
import { getPrometheusURL, PrometheusEndpoint } from '../graphs/helpers';
import { breadcrumbsForGlobalConfig } from '../cluster-settings/global-config';

const ruleURL = (rule: Rule) => `${RuleResource.plural}/${_.get(rule, 'id')}`;

const pollers = {};
const pollerTimeouts = {};

const silenceAlert = (alert: Alert) => ({
  callback: () => history.replace(`${SilenceResource.plural}/~new?${labelsToParams(alert.labels)}`),
  label: i18next.t('public~Silence alert'),
});

const viewAlertRule = (alert: Alert) => ({
  label: i18next.t('public~View alerting rule'),
  href: ruleURL(alert.rule),
});

const editSilence = (silence: Silence) => ({
  label:
    silenceState(silence) === SilenceStates.Expired
      ? i18next.t('public~Recreate silence')
      : i18next.t('public~Edit silence'),
  href: `${SilenceResource.plural}/${silence.id}/edit`,
});

const cancelSilence = (silence: Silence) => ({
  label: i18next.t('public~Expire silence'),
  callback: () =>
    confirmModal({
      title: i18next.t('public~Expire silence'),
      message: i18next.t('public~Are you sure you want to expire this silence?'),
      btnText: i18next.t('public~Expire silence'),
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

const getAlertStateKey = (state) => {
  switch (state) {
    case AlertStates.Firing:
      return i18next.t('public~Firing');
    case AlertStates.Pending:
      return i18next.t('public~Pending');
    case AlertStates.Silenced:
      return i18next.t('public~Silenced');
    default:
      return i18next.t('public~Not Firing');
  }
};

export const AlertState: React.FC<AlertStateProps> = ({ state }) => {
  const icon = alertStateIcons[state];

  return icon ? (
    <>
      {icon} {getAlertStateKey(state)}
    </>
  ) : null;
};

const SilenceState = ({ silence }) => {
  const { t } = useTranslation();

  const state = silenceState(silence);
  const icon = {
    [SilenceStates.Active]: <GreenCheckCircleIcon />,
    [SilenceStates.Pending]: <HourglassHalfIcon className="monitoring-state-icon--pending" />,
    [SilenceStates.Expired]: <BanIcon className="text-muted" data-test-id="ban-icon" />,
  }[state];

  const getStateKey = (stateData) => {
    switch (stateData) {
      case SilenceStates.Active:
        return t('public~Active');
      case SilenceStates.Pending:
        return t('public~Pending');
      default:
        return t('public~Expired');
    }
  };

  return icon ? (
    <>
      {icon} {getStateKey(state)}
    </>
  ) : null;
};

export const StateTimestamp = ({ text, timestamp }) => (
  <div className="text-muted monitoring-timestamp">
    {text}&nbsp;
    <Timestamp timestamp={timestamp} />
  </div>
);

const AlertStateDescription: React.FC<{ alert }> = ({ alert }) => {
  const { t } = useTranslation();
  if (alert && !_.isEmpty(alert.silencedBy)) {
    return (
      <StateTimestamp
        text={t('public~Ends')}
        timestamp={_.max(_.map(alert.silencedBy, 'endsAt'))}
      />
    );
  }
  if (alert && alert.activeAt) {
    return <StateTimestamp text={t('public~Since')} timestamp={alert.activeAt} />;
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

export const Severity: React.FC<{ severity: string }> = ({ severity }) => {
  const { t } = useTranslation();

  const getSeverityKey = (severityData: string) => {
    switch (severityData) {
      case AlertSeverity.Critical:
        return t('public~Critical');
      case AlertSeverity.Info:
        return t('public~Info');
      case AlertSeverity.Warning:
        return t('public~Warning');
      case AlertSeverity.None:
        return t('public~None');
      default:
        return severityData;
    }
  };

  return _.isNil(severity) ? (
    <>-</>
  ) : (
    <>
      <SeverityIcon severity={severity} /> {getSeverityKey(severity)}
    </>
  );
};

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
          <AlertStateIcon state={s} /> {counts[s]} {getAlertStateKey(s)}
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

const AlertStateHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <dl className="co-inline">
      <dt>
        <AlertStateIcon state={AlertStates.Pending} /> <strong>{t('public~Pending: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~The alert is active but is waiting for the duration that is specified in the alerting rule before it fires.',
        )}
      </dd>
      <dt>
        <AlertStateIcon state={AlertStates.Firing} /> <strong>{t('public~Firing: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~The alert is firing because the alert condition is true and the optional `for` duration has passed. The alert will continue to fire as long as the condition remains true.',
        )}
      </dd>
      <dt>
        <AlertStateIcon state={AlertStates.Silenced} /> <strong>{t('public~Silenced: ')}</strong>
      </dt>
      <dt></dt>
      <dd>
        {t(
          'public~The alert is now silenced for a defined time period. Silences temporarily mute alerts based on a set of label selectors that you define. Notifications will not be sent for alerts that match all the listed values or regular expressions.',
        )}
      </dd>
    </dl>
  );
};

const SeverityHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <dl className="co-inline">
      <dt>
        <SeverityIcon severity={AlertSeverity.Critical} /> <strong>{t('public~Critical: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~The condition that triggered the alert could have a critical impact. The alert requires immediate attention when fired and is typically paged to an individual or to a critical response team.',
        )}
      </dd>
      <dt>
        <SeverityIcon severity={AlertSeverity.Warning} /> <strong>{t('public~Warning: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~The alert provides a warning notification about something that might require attention in order to prevent a problem from occurring. Warnings are typically routed to a ticketing system for non-immediate review.',
        )}
      </dd>
      <dt>
        <SeverityIcon severity={AlertSeverity.Info} /> <strong>{t('public~Info: ')}</strong>
      </dt>
      <dd>{t('public~The alert is provided for informational purposes only.')}</dd>
      <dt>
        <SeverityIcon severity={AlertSeverity.None} /> <strong>{t('public~None: ')}</strong>
      </dt>
      <dd>{t('public~The alert has no defined severity.')}</dd>
      <dd>
        {t('public~You can also create custom severity definitions for user workload alerts.')}
      </dd>
    </dl>
  );
};

const SourceHelp: React.FC = () => {
  const { t } = useTranslation();
  return (
    <dl className="co-inline">
      <dt>
        <strong>{t('public~Platform: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~Platform-level alerts relate only to OpenShift namespaces. OpenShift namespaces provide core OpenShift functionality.',
        )}
      </dd>
      <dt>
        <strong>{t('public~User: ')}</strong>
      </dt>
      <dd>
        {t(
          'public~User workload alerts relate to user-defined namespaces. These alerts are user-created and are customizable. User workload monitoring can be enabled post-installation to provide observability into your own services.',
        )}
      </dd>
    </dl>
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

const queryBrowserURL = (query: string, namespace: string) =>
  namespace
    ? `/dev-monitoring/ns/${namespace}/metrics?query0=${encodeURIComponent(query)}`
    : `/monitoring/query-browser?query0=${encodeURIComponent(query)}`;

const Graph: React.FC<GraphProps> = ({
  filterLabels = undefined,
  formatSeriesTitle,
  namespace,
  query,
  ruleDuration,
}) => {
  const { t } = useTranslation();

  // 3 times the rule's duration, but not less than 30 minutes
  const timespan = Math.max(3 * ruleDuration, 30 * 60) * 1000;

  const GraphLink = () =>
    query ? (
      <Link aria-label={t('public~View in Metrics')} to={queryBrowserURL(query, namespace)}>
        {t('public~View in Metrics')}
      </Link>
    ) : null;

  return (
    <QueryBrowser
      namespace={namespace}
      defaultTimespan={timespan}
      filterLabels={filterLabels}
      formatSeriesTitle={formatSeriesTitle}
      GraphLink={GraphLink}
      pollInterval={Math.round(timespan / 120)}
      queries={[query]}
    />
  );
};

const tableSilenceClasses = [
  'pf-u-w-50 pf-u-w-33-on-sm',
  'pf-m-hidden pf-m-visible-on-sm pf-m-hidden-on-md pf-m-visible-on-lg',
  '',
  'pf-m-hidden pf-m-visible-on-sm',
  Kebab.columnClass,
];

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
        {state === SilenceStates.Pending && (
          <StateTimestamp text={i18next.t('public~Starts')} timestamp={startsAt} />
        )}
        {state === SilenceStates.Active && (
          <StateTimestamp text={i18next.t('public~Ends')} timestamp={endsAt} />
        )}
        {state === SilenceStates.Expired && (
          <StateTimestamp text={i18next.t('public~Expired')} timestamp={endsAt} />
        )}
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

const getSilenceTableHeader = (t) => [
  {
    title: t('public~Name'),
    sortField: 'name',
    transforms: [sortable],
    props: { className: tableSilenceClasses[0] },
  },
  {
    title: t('public~Firing alerts'),
    sortFunc: 'silenceFiringAlertsOrder',
    transforms: [sortable],
    props: { className: tableSilenceClasses[1] },
  },
  {
    title: t('public~State'),
    sortFunc: 'silenceStateOrder',
    transforms: [sortable],
    props: { className: tableSilenceClasses[2] },
  },
  {
    title: t('public~Creator'),
    sortField: 'createdBy',
    transforms: [sortable],
    props: { className: tableSilenceClasses[3] },
  },
  {
    title: '',
    props: { className: tableSilenceClasses[4] },
  },
];

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

const getSourceKey = (source) => {
  switch (source) {
    case 'Platform':
      return i18next.t('public~Platform');
    case 'User':
      return i18next.t('public~User');
    default:
      return source;
  }
};

export const AlertsDetailsPage = withFallback(
  connect(alertStateToProps)((props: AlertsDetailsPageProps) => {
    const { alert, loaded, loadError, namespace, rule, silencesLoaded } = props;
    const state = alertState(alert);

    const { t } = useTranslation();

    const silencesTableHeader = () =>
      getSilenceTableHeader(t).map((h) => _.pick(h, ['title', 'props']));

    const labelsMemoKey = JSON.stringify(alert?.labels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const labels: PrometheusLabels = React.useMemo(() => alert?.labels, [labelsMemoKey]);

    return (
      <>
        <Helmet>
          <title>{t('public~{{alertName}} details', { alertName: labels?.alertname })}</title>
        </Helmet>
        <StatusBox data={alert} label={AlertResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: t('public~Alerts'),
                  path: namespace ? `/dev-monitoring/ns/${namespace}/alerts` : '/monitoring/alerts',
                },
                { name: t('public~Alert details'), path: undefined },
              ]}
            />
            <h1 className="co-m-pane__heading">
              <div data-test="resource-title" className="co-resource-item">
                <MonitoringResourceIcon
                  className="co-m-resource-icon--lg"
                  resource={AlertResource}
                />
                {labels?.alertname}
                <SeverityBadge severity={labels?.severity} />
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
            <SectionHeading text={t('public~Alert details')} />
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-12">
                  <Graph
                    filterLabels={labels}
                    namespace={namespace}
                    query={rule?.query}
                    ruleDuration={rule?.duration}
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>{t('public~Name')}</dt>
                    <dd>{labels?.alertname}</dd>
                    <dt>
                      <PopoverField label={t('public~Severity')} body={SeverityHelp} />
                    </dt>
                    <dd>
                      <Severity severity={labels?.severity} />
                    </dd>
                    {alert?.annotations?.description && (
                      <Annotation title={t('public~Description')}>
                        <AlertMessage
                          alertText={alert.annotations.description}
                          labels={labels}
                          template={rule?.annotations.description}
                        />
                      </Annotation>
                    )}
                    <Annotation title={t('public~Summary')}>
                      {alert?.annotations?.summary}
                    </Annotation>
                    {alert?.annotations?.message && (
                      <Annotation title={t('public~Message')}>
                        <AlertMessage
                          alertText={alert.annotations.message}
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
                      <PopoverField label={t('public~Source')} body={SourceHelp} />
                    </dt>
                    <dd>{alert && getSourceKey(_.startCase(alertSource(alert)))}</dd>
                    <dt>
                      <PopoverField label={t('public~State')} body={AlertStateHelp} />
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
                    <dt>{t('public~Labels')}</dt>
                    <dd>
                      {_.isEmpty(labels) ? (
                        <div className="text-muted">{t('public~No labels')}</div>
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
                    <dt>{t('public~Alerting rule')}</dt>
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
          {silencesLoaded && !_.isEmpty(alert?.silencedBy) && (
            <div className="co-m-pane__body">
              <div className="co-m-pane__body-group">
                <SectionHeading text={t('public~Silenced by')} />
                <div className="row">
                  <div className="col-xs-12">
                    <Table
                      aria-label={t('public~Silenced by')}
                      data={alert?.silencedBy}
                      Header={silencesTableHeader}
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

// Renders Prometheus template text and highlights any {{ ... }} tags that it contains
const PrometheusTemplate = ({ text }) => (
  <>
    {text?.split(/(\{\{[^{}]*\}\})/)?.map((part: string, i: number) =>
      part.match(/^\{\{[^{}]*\}\}$/) ? (
        <code className="prometheus-template-tag" key={i}>
          {part}
        </code>
      ) : (
        part
      ),
    )}
  </>
);

const ActiveAlerts: React.FC<{ alerts; ruleID: string; namespace: string }> = (props) => {
  const { t } = useTranslation();
  const { alerts, ruleID, namespace } = props;

  return (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-6">{t('public~Description')}</div>
        <div className="col-sm-2 hidden-xs">{t('public~Active since')}</div>
        <div className="col-sm-2 col-xs-3">{t('public~State')}</div>
        <div className="col-sm-2 col-xs-3">{t('public~Value')}</div>
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
};

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

    const { t } = useTranslation();

    const formatSeriesTitle = (alertLabels) => {
      const nameLabel = alertLabels.__name__ ?? '';
      const otherLabels = _.omit(alertLabels, '__name__');
      return `${nameLabel}{${_.map(otherLabels, (v, k) => `${k}="${v}"`).join(',')}}`;
    };

    return (
      <>
        <Helmet>
          <title>{t('public~{{name}} details', { name: name || RuleResource.label })}</title>
        </Helmet>
        <StatusBox data={rule} label={RuleResource.label} loaded={loaded} loadError={loadError}>
          <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
            <BreadCrumbs
              breadcrumbs={[
                {
                  name: namespace ? t('public~Alerts') : t('public~Alerting rules'),
                  path: namespace
                    ? `/dev-monitoring/ns/${namespace}/alerts`
                    : '/monitoring/alertrules',
                },
                { name: t('public~Alerting rule details'), path: undefined },
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
              <SectionHeading text={t('public~Alerting rule details')} />
            </div>
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>{t('public~Name')}</dt>
                    <dd>{name}</dd>
                    <dt>
                      <PopoverField label={t('public~Severity')} body={SeverityHelp} />
                    </dt>
                    <dd>
                      <Severity severity={severity} />
                    </dd>
                    <Annotation title={t('public~Description')}>
                      <PrometheusTemplate text={annotations?.description} />
                    </Annotation>
                    <Annotation title={t('public~Summary')}>{annotations?.summary}</Annotation>
                    <Annotation title={t('public~Message')}>
                      <PrometheusTemplate text={annotations?.message} />
                    </Annotation>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>
                      <PopoverField label={t('public~Source')} body={SourceHelp} />
                    </dt>
                    <dd>{rule && getSourceKey(_.startCase(alertingRuleSource(rule)))}</dd>
                    {_.isInteger(duration) && (
                      <>
                        <dt>{t('public~For')}</dt>
                        <dd>{duration === 0 ? '-' : formatPrometheusDuration(duration * 1000)}</dd>
                      </>
                    )}
                    <dt>{t('public~Expression')}</dt>
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
                    <dt>{t('public~Labels')}</dt>
                    <dd>
                      {_.isEmpty(labels) ? (
                        <div className="text-muted">{t('public~No labels')}</div>
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
              <SectionHeading text={t('public~Active alerts')} />
              <div className="row">
                <div className="col-sm-12">
                  <Graph
                    formatSeriesTitle={formatSeriesTitle}
                    namespace={namespace}
                    query={rule?.query}
                    ruleDuration={rule?.duration}
                    showLegend
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-xs-12">
                  {_.isEmpty(alerts) ? (
                    <div className="text-center">{t('public~None found')}</div>
                  ) : (
                    <ActiveAlerts alerts={alerts} ruleID={rule?.id} namespace={namespace} />
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

const SilencedAlertsList = ({ alerts }) => {
  const { t } = useTranslation();

  return _.isEmpty(alerts) ? (
    <div className="text-center">{t('public~None found')}</div>
  ) : (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-9">{t('public~Name')}</div>
        <div className="col-xs-3">{t('public~Severity')}</div>
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
};

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
    const { t } = useTranslation();
    const [activePerspective] = useActivePerspective();

    return (
      <>
        <Helmet>
          <title>{t('public~{{name}} details', { name: name || SilenceResource.label })}</title>
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
                  name: activePerspective === 'dev' ? t('public~Alerts') : t('public~Silences'),
                  path:
                    activePerspective === 'dev'
                      ? `/dev-monitoring/ns/${namespace}/alerts`
                      : '/monitoring/silences',
                },
                { name: t('public~Silence details'), path: undefined },
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
              <div className="co-actions" data-test-id="details-actions">
                {silence && <ActionsMenu actions={silenceMenuActions(silence)} />}
              </div>
            </h1>
          </div>
          <div className="co-m-pane__body">
            <SectionHeading text={t('public~Silence details')} />
            <div className="co-m-pane__body-group">
              <div className="row">
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    {name && (
                      <>
                        <dt>{t('public~Name')}</dt>
                        <dd>{name}</dd>
                      </>
                    )}
                    <dt>{t('public~Matchers')}</dt>
                    <dd data-test="label-list">
                      {_.isEmpty(matchers) ? (
                        <div className="text-muted">{t('public~No matchers')}</div>
                      ) : (
                        <SilenceMatchersList silence={silence} />
                      )}
                    </dd>
                    <dt>{t('public~State')}</dt>
                    <dd>
                      <SilenceState silence={silence} />
                    </dd>
                    <dt>{t('public~Last updated at')}</dt>
                    <dd>
                      <Timestamp timestamp={updatedAt} />
                    </dd>
                  </dl>
                </div>
                <div className="col-sm-6">
                  <dl className="co-m-pane__details">
                    <dt>{t('public~Starts at')}</dt>
                    <dd>
                      <Timestamp timestamp={startsAt} />
                    </dd>
                    <dt>{t('public~Ends at')}</dt>
                    <dd>
                      <Timestamp timestamp={endsAt} />
                    </dd>
                    <dt>{t('public~Created by')}</dt>
                    <dd>{createdBy || '-'}</dd>
                    <dt>{t('public~Comment')}</dt>
                    <dd>{comment || '-'}</dd>
                    <dt>{t('public~Firing alerts')}</dt>
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
              <SectionHeading text={t('public~Firing alerts')} />
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
  'pf-u-w-50 pf-u-w-33-on-sm',
  'pf-m-hidden pf-m-visible-on-sm',
  '',
  'pf-m-hidden pf-m-visible-on-sm',
  Kebab.columnClass,
];

const AlertTableRow: RowFunction<Alert> = ({ index, key, obj, style }) => {
  const { annotations = {}, labels } = obj;
  const description = annotations.description || annotations.message;
  const state = alertState(obj);

  return (
    <TableRow id={obj.rule.id} index={index} title={description} trKey={key} style={style}>
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
        <div className="monitoring-description">{description}</div>
      </TableData>
      <TableData className={tableAlertClasses[1]}>
        <Severity severity={labels?.severity} />
      </TableData>
      <TableData className={tableAlertClasses[2]}>
        <AlertState state={state} />
        <AlertStateDescription alert={obj} />
      </TableData>
      <TableData className={tableAlertClasses[3]}>
        {alertSource(obj) === AlertSource.User
          ? i18next.t('public~User')
          : i18next.t('public~Platform')}
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

export const severityRowFilter = (): RowFilter => ({
  filterGroupName: i18next.t('public~Severity'),
  items: [
    { id: AlertSeverity.Critical, title: i18next.t('public~Critical') },
    { id: AlertSeverity.Warning, title: i18next.t('public~Warning') },
    { id: AlertSeverity.Info, title: i18next.t('public~Info') },
    { id: AlertSeverity.None, title: i18next.t('public~None') },
  ],
  reducer: ({ labels }: Alert | Rule) => labels?.severity,
  type: 'alert-severity',
});

const alertsRowFilters = (): RowFilter[] => [
  {
    defaultSelected: [AlertStates.Firing],
    filterGroupName: i18next.t('public~Alert State'),
    items: [
      { id: AlertStates.Firing, title: i18next.t('public~Firing') },
      { id: AlertStates.Pending, title: i18next.t('public~Pending') },
      { id: AlertStates.Silenced, title: i18next.t('public~Silenced') },
    ],
    reducer: alertState,
    type: 'alert-state',
  },
  severityRowFilter(),
  {
    defaultSelected: [AlertSource.Platform],
    filterGroupName: i18next.t('public~Source'),
    items: [
      { id: AlertSource.Platform, title: i18next.t('public~Platform') },
      { id: AlertSource.User, title: i18next.t('public~User') },
    ],
    reducer: alertSource,
    type: 'alert-source',
  },
];

const MonitoringListPage: React.FC<ListPageProps> = ({
  CreateButton,
  data,
  defaultSortField,
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
  const { t } = useTranslation();

  const filters = useSelector(({ k8s }: RootState) => k8s.getIn([reduxID, 'filters']));

  const silencesLoadError = useSelector(
    ({ UI }: RootState) => UI.getIn(['monitoring', 'silences'])?.loadError,
  );

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
        {silencesLoadError && !loadError && (
          <PFAlert
            className="co-alert"
            isInline
            title={t(
              'public~Error loading silences from Alertmanager. Some of the alerts below may actually be silenced.',
            )}
            variant="warning"
          >
            {silencesLoadError.toString()}
          </PFAlert>
        )}
        <div className="row">
          <div className="col-xs-12">
            <Table
              aria-label={kindPlural}
              data={data}
              defaultSortField={defaultSortField}
              filters={filters?.toJS()}
              Header={Header}
              loaded={loaded}
              loadError={loadError}
              reduxID={reduxID}
              Row={Row}
              rowFilters={rowFilters}
              virtualize
            />
          </div>
        </div>
      </div>
    </>
  );
};

const AlertsPage_: React.FC<Alerts> = ({ data, loaded, loadError }) => {
  const { t } = useTranslation();

  const Header = () => [
    {
      title: t('public~Name'),
      sortField: 'labels.alertname',
      transforms: [sortable],
      props: { className: tableAlertClasses[0] },
    },
    {
      title: t('public~Severity'),
      sortFunc: 'alertSeverityOrder',
      transforms: [sortable],
      props: { className: tableAlertClasses[1] },
    },
    {
      title: t('public~State'),
      sortFunc: 'alertStateOrder',
      transforms: [sortable],
      props: { className: tableAlertClasses[2] },
    },
    {
      title: t('public~Source'),
      sortFunc: 'alertSource',
      transforms: [sortable],
      props: { className: tableAlertClasses[3] },
    },
    {
      title: '',
      props: { className: tableAlertClasses[4] },
    },
  ];

  return (
    <MonitoringListPage
      data={data}
      defaultSortField="labels.alertname"
      Header={Header}
      kindPlural={t('public~Alerts')}
      labelFilter="alerts"
      labelPath="labels"
      loaded={loaded}
      loadError={loadError}
      nameFilterID="resource-list-text"
      reduxID="monitoringAlerts"
      Row={AlertTableRow}
      rowFilters={alertsRowFilters()}
    />
  );
};
const AlertsPage = withFallback(connect(alertsToProps)(AlertsPage_));

const ruleHasAlertState = (rule: Rule, state: AlertStates): boolean =>
  state === AlertStates.NotFiring ? _.isEmpty(rule.alerts) : _.some(rule.alerts, { state });

const ruleAlertStateFilter = (filter, rule: Rule) =>
  (filter.selected.has(AlertStates.NotFiring) && _.isEmpty(rule.alerts)) ||
  _.some(rule.alerts, (a) => filter.selected.has(a.state)) ||
  _.isEmpty(filter.selected);

export const alertStateFilter = (): RowFilter => ({
  filter: ruleAlertStateFilter,
  filterGroupName: i18next.t('public~Alert State'),
  isMatch: ruleHasAlertState,
  items: [
    { id: AlertStates.Firing, title: i18next.t('public~Firing') },
    { id: AlertStates.Pending, title: i18next.t('public~Pending') },
    { id: AlertStates.Silenced, title: i18next.t('public~Silenced') },
    { id: AlertStates.NotFiring, title: i18next.t('public~Not Firing') },
  ],
  type: 'alerting-rule-has-alert-state',
});

const tableRuleClasses = [
  'pf-u-w-50 pf-u-w-33-on-sm',
  'pf-m-hidden pf-m-visible-on-sm',
  '',
  'pf-m-hidden pf-m-visible-on-sm',
];

const RuleTableRow: RowFunction<Rule> = ({ index, key, obj, style }) => (
  <TableRow
    id={obj.id}
    index={index}
    style={style}
    title={obj.annotations?.description || obj.annotations?.message}
    trKey={key}
  >
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
      {alertingRuleSource(obj) === AlertSource.User
        ? i18next.t('public~User')
        : i18next.t('public~Platform')}
    </TableData>
  </TableRow>
);

const RulesPage_: React.FC<Rules> = ({ data, loaded, loadError }) => {
  const { t } = useTranslation();

  const Header = () => [
    {
      title: t('public~Name'),
      sortField: 'name',
      transforms: [sortable],
      props: { className: tableRuleClasses[0] },
    },
    {
      title: t('public~Severity'),
      sortFunc: 'alertSeverityOrder',
      transforms: [sortable],
      props: { className: tableRuleClasses[1] },
    },
    {
      title: t('public~Alert state'),
      sortFunc: 'alertingRuleStateOrder',
      transforms: [sortable],
      props: { className: tableRuleClasses[2] },
    },
    {
      title: t('public~Source'),
      sortFunc: 'alertingRuleSource',
      transforms: [sortable],
      props: { className: tableRuleClasses[3] },
    },
  ];

  const rulesRowFilters: RowFilter[] = [
    alertStateFilter(),
    severityRowFilter(),
    {
      defaultSelected: [AlertSource.Platform],
      filterGroupName: t('public~Source'),
      items: [
        { id: AlertSource.Platform, title: t('public~Platform') },
        { id: AlertSource.User, title: t('public~User') },
      ],
      reducer: alertingRuleSource,
      type: 'alerting-rule-source',
    },
  ];

  return (
    <MonitoringListPage
      data={data}
      defaultSortField="name"
      Header={Header}
      kindPlural={t('public~Alerting rules')}
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
};
const RulesPage = withFallback(connect(rulesToProps)(RulesPage_));

const CreateButton: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Link className="co-m-primary-action" to="/monitoring/silences/~new">
      <Button variant="primary" data-test="create-silence-btn">
        {t('public~Create silence')}
      </Button>
    </Link>
  );
};

const SilencesPage_: React.FC<Silences> = ({ data, loaded, loadError }) => {
  const { t } = useTranslation();

  const Header = () => getSilenceTableHeader(t);

  const silencesRowFilters: RowFilter[] = [
    {
      defaultSelected: [SilenceStates.Active, SilenceStates.Pending],
      type: 'silence-state',
      filterGroupName: t('public~Silence State'),
      reducer: silenceState,
      items: [
        { id: SilenceStates.Active, title: t('public~Active') },
        { id: SilenceStates.Pending, title: t('public~Pending') },
        { id: SilenceStates.Expired, title: t('public~Expired') },
      ],
    },
  ];

  return (
    <MonitoringListPage
      CreateButton={CreateButton}
      data={data}
      defaultSortField="name"
      Header={Header}
      hideLabelFilter
      kindPlural={t('public~Silences')}
      loaded={loaded}
      loadError={loadError}
      nameFilterID="silence-name"
      reduxID="monitoringSilences"
      Row={SilenceTableRow}
      rowFilters={silencesRowFilters}
    />
  );
};
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
  const { t } = useTranslation();

  const alertsPath = '/monitoring/alerts';
  const rulesPath = '/monitoring/alertrules';
  const silencesPath = '/monitoring/silences';
  const configPath = '/monitoring/alertmanagerconfig';
  const YAMLPath = '/monitoring/alertmanageryaml';

  const { url } = match;
  const isAlertmanager = url === configPath || url === YAMLPath;

  return (
    <>
      <div
        className={classNames('co-m-nav-title', 'co-m-nav-title--detail', {
          'co-m-nav-title--breadcrumbs': isAlertmanager,
        })}
      >
        {isAlertmanager && (
          <Split style={{ alignItems: 'baseline' }}>
            <SplitItem isFilled>
              <BreadCrumbs
                breadcrumbs={breadcrumbsForGlobalConfig(
                  'Alertmanager',
                  '/monitoring/alertmanagerconfig',
                )}
              />
            </SplitItem>
          </Split>
        )}
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name" data-test-id="resource-title">
              {isAlertmanager ? t('public~Alertmanager') : t('public~Alerting')}
            </span>
          </div>
        </h1>
      </div>
      <ul className="co-m-horizontal-nav__menu">
        {(url === alertsPath || url === rulesPath || url === silencesPath) && (
          <>
            <Tab active={url === alertsPath}>
              <Link to={alertsPath}>{t('public~Alerts')}</Link>
            </Tab>
            <Tab active={url === silencesPath}>
              <Link to={silencesPath}>{t('public~Silences')}</Link>
            </Tab>
            <Tab active={url === rulesPath}>
              <Link to={rulesPath}>{t('public~Alerting rules')}</Link>
            </Tab>
          </>
        )}
        {isAlertmanager && (
          <>
            <Tab active={url === configPath}>
              <Link to={configPath}>{t('public~Details')}</Link>
            </Tab>
            <Tab active={url === YAMLPath}>
              <Link to={YAMLPath}>{t('public~YAML')}</Link>
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
  const dispatch = useDispatch();

  React.useEffect(() => {
    const { prometheusBaseURL } = window.SERVER_FLAGS;

    if (prometheusBaseURL) {
      const alertsKey = 'alerts';
      const rulesKey = 'rules';
      dispatch(UIActions.monitoringLoading(alertsKey));
      const url = getPrometheusURL({ endpoint: PrometheusEndpoint.RULES });
      const poller = (): void => {
        coFetchJSON(url)
          .then(({ data }) => {
            const { alerts, rules } = getAlertsAndRules(data);
            dispatch(UIActions.monitoringLoaded(alertsKey, alerts));
            dispatch(UIActions.monitoringSetRules(rulesKey, rules));
          })
          .catch((e) => dispatch(UIActions.monitoringErrored(alertsKey, e)))
          .then(() => (pollerTimeouts[alertsKey] = setTimeout(poller, 15 * 1000)));
      };
      pollers[alertsKey] = poller;
      poller();
    } else {
      dispatch(UIActions.monitoringErrored('alerts', new Error('prometheusBaseURL not set')));
    }
    return () => _.each(pollerTimeouts, clearTimeout);
  }, [dispatch]);

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
  filterLabels?: PrometheusLabels;
  formatSeriesTitle?: FormatSeriesTitle;
  namespace?: string;
  query: string;
  ruleDuration: number;
  showLegend?: boolean;
};

type MonitoringResourceIconProps = {
  className?: string;
  resource: MonitoringResource;
};
