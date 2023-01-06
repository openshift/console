import {
  Action,
  Alert,
  AlertSeverity,
  AlertStates,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  K8sKind,
  PrometheusAlert,
  PrometheusEndpoint,
  PrometheusLabels,
  RedExclamationCircleIcon,
  ResourceStatus,
  RowFilter,
  RowProps,
  Rule,
  Silence,
  SilenceStates,
  TableColumn,
  useActivePerspective,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk';
import { formatPrometheusDuration } from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Alert as PFAlert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  CodeBlock,
  CodeBlockCode,
  Dropdown,
  DropdownItem,
  DropdownPosition,
  DropdownToggle,
  Flex,
  FlexItem,
  KebabToggle,
  Label,
  Modal,
  ModalVariant,
  Popover,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import {
  BanIcon,
  BellIcon,
  BellSlashIcon,
  HourglassHalfIcon,
  OutlinedBellIcon,
} from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';
import classNames from 'classnames';
import i18next from 'i18next';
import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import { Link, Redirect, Route, Switch } from 'react-router-dom';

import { withFallback } from '@console/shared/src/components/error';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import {
  ActionServiceProvider,
  ListPageFilter,
  ResourceLink,
  Timestamp,
  useListPageFilter,
  VirtualizedTable,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';

import {
  alertingErrored,
  alertingLoaded,
  alertingLoading,
  alertingSetRules,
} from '../../actions/observe';
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
import { RootState } from '../../redux';
import { getPrometheusURL } from '../graphs/helpers';
import { refreshNotificationPollers } from '../notification-drawer';
import { SectionHeading } from '../utils/headings';
import { ExternalLink, getURLSearchParams, LinkifyExternal } from '../utils/link';
import { history } from '../utils/router';
import { LoadingInline, StatusBox } from '../utils/status-box';
import AlertmanagerPage from './alertmanager/alertmanager-page';
import MonitoringDashboardsPage from './dashboards';
import { useBoolean } from './hooks/useBoolean';
import KebabDropdown from './kebab-dropdown';
import { Labels } from './labels';
import { QueryBrowserPage, ToggleGraph } from './metrics';
import { FormatSeriesTitle, QueryBrowser } from './query-browser';
import { CreateSilence, EditSilence } from './silence-form';
import { TargetsUI } from './targets';
import { Alerts, AlertSource, MonitoringResource, Silences } from './types';
import {
  alertDescription,
  alertingRuleStateOrder,
  AlertResource,
  alertSeverityOrder,
  alertState,
  alertURL,
  fuzzyCaseInsensitive,
  getAlertsAndRules,
  labelsToParams,
  RuleResource,
  silenceMatcherEqualitySymbol,
  SilenceResource,
  silenceState,
} from './utils';

const ruleURL = (rule: Rule) => `${RuleResource.plural}/${_.get(rule, 'id')}`;

const alertingRuleSource = (rule: Rule): AlertSource =>
  rule.labels?.prometheus === 'openshift-monitoring/k8s' ? AlertSource.Platform : AlertSource.User;

const alertSource = (alert: Alert): AlertSource => alertingRuleSource(alert.rule);

const pollers = {};
const pollerTimeouts = {};

const silenceAlert = (alert: Alert) =>
  history.push(`${SilenceResource.plural}/~new?${labelsToParams(alert.labels)}`);

const viewAlertRule = (alert: Alert) => history.push(ruleURL(alert.rule));

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

const AlertStateIcon: React.FC<{ state: string }> = React.memo(({ state }) => {
  switch (state) {
    case AlertStates.Firing:
      return <BellIcon />;
    case AlertStates.Pending:
      return <OutlinedBellIcon />;
    case AlertStates.Silenced:
      return <BellSlashIcon className="text-muted" />;
    default:
      return null;
  }
});

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

export const AlertState: React.FC<AlertStateProps> = React.memo(({ state }) => {
  const icon = <AlertStateIcon state={state} />;

  return icon ? (
    <>
      {icon} {getAlertStateKey(state)}
    </>
  ) : null;
});

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

const SeverityIcon: React.FC<{ severity: string }> = React.memo(({ severity }) => {
  const Icon =
    {
      [AlertSeverity.Critical]: RedExclamationCircleIcon,
      [AlertSeverity.Info]: BlueInfoCircleIcon,
      [AlertSeverity.None]: BlueInfoCircleIcon,
      [AlertSeverity.Warning]: YellowExclamationTriangleIcon,
    }[severity] || YellowExclamationTriangleIcon;
  return <Icon />;
});

export const Severity: React.FC<{ severity: string }> = React.memo(({ severity }) => {
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
});

const SeverityBadge: React.FC<{ severity: string }> = React.memo(({ severity }) =>
  _.isNil(severity) || severity === 'none' ? null : (
    <ResourceStatus>
      <Severity severity={severity} />
    </ResourceStatus>
  ),
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

const PopoverField: React.FC<{ bodyContent: React.ReactNode; label: string }> = ({
  bodyContent,
  label,
}) => (
  <Popover headerContent={label} bodyContent={bodyContent}>
    <Button variant="plain" className="details-item__popover-button">
      {label}
    </Button>
  </Popover>
);

const AlertStateHelp: React.FC<{}> = () => {
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

const SeverityHelp: React.FC<{}> = () => {
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

const SourceHelp: React.FC<{}> = () => {
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

type ActionWithHref = Omit<Action, 'cta'> & { cta: { href: string; external?: boolean } };

const isActionWithHref = (action: Action): action is ActionWithHref => 'href' in action.cta;

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
  'pf-u-w-50 pf-u-w-33-on-sm', // Name
  'pf-m-hidden pf-m-visible-on-sm', // Firing alerts
  '', // State
  'pf-m-hidden pf-m-visible-on-sm', // Creator
  'dropdown-kebab-pf pf-c-table__action',
];

const SilenceMatchersList = ({ silence }) => (
  <div className={`co-text-${SilenceResource.kind.toLowerCase()}`}>
    {_.map(silence.matchers, ({ name, isEqual, isRegex, value }, i) => (
      <Label className="co-label" key={i}>
        <span className="co-label__key">{name}</span>
        <span className="co-label__eq">{silenceMatcherEqualitySymbol(isEqual, isRegex)}</span>
        <span className="co-label__value">{value}</span>
      </Label>
    ))}
  </div>
);

const SilenceTableRow: React.FC<RowProps<Silence>> = ({ obj }) => {
  const { createdBy, endsAt, firingAlerts, id, name, startsAt } = obj;
  const state = silenceState(obj);

  const { t } = useTranslation();

  return (
    <>
      <td className={tableSilenceClasses[0]}>
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
      </td>
      <td className={tableSilenceClasses[1]}>
        <SeverityCounts alerts={firingAlerts} />
      </td>
      <td className={classNames(tableSilenceClasses[2], 'co-break-word')}>
        <SilenceState silence={obj} />
        {state === SilenceStates.Pending && (
          <StateTimestamp text={t('public~Starts')} timestamp={startsAt} />
        )}
        {state === SilenceStates.Active && (
          <StateTimestamp text={t('public~Ends')} timestamp={endsAt} />
        )}
        {state === SilenceStates.Expired && (
          <StateTimestamp text={t('public~Expired')} timestamp={endsAt} />
        )}
      </td>
      <td className={tableSilenceClasses[3]}>{createdBy || '-'}</td>
      <td className={tableSilenceClasses[4]}>
        <SilenceDropdownKebab silence={obj} />
      </td>
    </>
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
            // `part` contains at least one instance of the resource name, so replace each instance
            // with the link to the resource. Since the link is a component, we can't simply do a
            // string substitution. Instead, create an array that contains each of the string parts
            // and the resource links in the correct order.
            const splitParts = part.split(labelValue);
            return _.flatMap(splitParts, (p) => [p, link]).slice(0, -1);
          }
          return [part];
        });
      }
    }
  });

  return (
    <div className="co-alert-manager">
      <p>
        <LinkifyExternal>{messageParts}</LinkifyExternal>
      </p>
    </div>
  );
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

const SilencedByList: React.FC<{ silences: Silence[] }> = ({ silences }) => {
  const { t } = useTranslation();

  const columns = React.useMemo<TableColumn<Silence>[]>(
    () => [
      {
        id: 'name',
        props: { className: tableSilenceClasses[0] },
        title: t('public~Name'),
      },
      {
        id: 'firingAlerts',
        props: { className: tableSilenceClasses[1] },
        title: t('public~Firing alerts'),
      },
      {
        id: 'state',
        props: { className: tableSilenceClasses[2] },
        title: t('public~State'),
      },
      {
        id: 'createdBy',
        props: { className: tableSilenceClasses[3] },
        title: t('public~Creator'),
      },
      {
        id: 'actions',
        props: { className: tableSilenceClasses[4] },
        title: '',
      },
    ],
    [t],
  );

  return (
    <VirtualizedTable<Silence>
      aria-label={t('public~Silenced by')}
      columns={columns}
      data={silences}
      loaded={true}
      loadError={undefined}
      Row={SilenceTableRow}
      unfilteredData={silences}
    />
  );
};

const AlertsDetailsPage_: React.FC<{ match: any }> = ({ match }) => {
  const { t } = useTranslation();

  const isDevPerspective = _.has(match.params, 'ns');
  const namespace = match.params?.ns;

  const alerts: Alerts = useSelector(({ observe }: RootState) =>
    observe.get(isDevPerspective ? 'devAlerts' : 'alerts'),
  );

  const silencesLoaded = ({ observe }) => observe.get('silences')?.loaded;

  const ruleAlerts = _.filter(alerts?.data, (a) => a.rule.id === match?.params?.ruleID);
  const rule = ruleAlerts?.[0]?.rule;
  const alert = _.find(ruleAlerts, (a) => _.isEqual(a.labels, getURLSearchParams()));

  const state = alertState(alert);

  const labelsMemoKey = JSON.stringify(alert?.labels);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labels: PrometheusLabels = React.useMemo(() => alert?.labels, [labelsMemoKey]);

  // eslint-disable-next-line camelcase
  const runbookURL = alert?.annotations?.runbook_url;

  return (
    <>
      <Helmet>
        <title>{t('public~{{alertName}} details', { alertName: labels?.alertname })}</title>
      </Helmet>
      <StatusBox
        data={alert}
        label={AlertResource.label}
        loaded={alerts?.loaded}
        loadError={alerts?.loadError}
      >
        <div className="pf-c-page__main-breadcrumb">
          <Breadcrumb className="monitoring-breadcrumbs">
            <BreadcrumbItem>
              <Link
                className="pf-c-breadcrumb__link"
                to={namespace ? `/dev-monitoring/ns/${namespace}/alerts` : '/monitoring/alerts'}
              >
                {t('public~Alerts')}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('public~Alert details')}</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
          <h1 className="co-m-pane__heading">
            <div data-test="resource-title" className="co-resource-item">
              <MonitoringResourceIcon className="co-m-resource-icon--lg" resource={AlertResource} />
              {labels?.alertname}
              <SeverityBadge severity={labels?.severity} />
            </div>
            {state !== AlertStates.Silenced && (
              <div data-test-id="details-actions">
                <Button
                  className="co-action-buttons__btn"
                  onClick={() => silenceAlert(alert)}
                  variant="primary"
                >
                  {t('public~Silence alert')}
                </Button>
              </div>
            )}
          </h1>
          <HeaderAlertMessage alert={alert} rule={rule} />
        </div>
        <div className="co-m-pane__body">
          <Toolbar className="monitoring-alert-detail-toolbar">
            <ToolbarContent>
              <ToolbarItem variant="label">
                <SectionHeading text={t('public~Alert details')} />
              </ToolbarItem>
              <ToolbarGroup alignment={{ default: 'alignRight' }}>
                <ActionServiceProvider context={{ 'alert-detail-toolbar-actions': { alert } }}>
                  {({ actions, loaded }) =>
                    loaded
                      ? actions.filter(isActionWithHref).map((action) => (
                          <ToolbarItem key={action.id}>
                            <Link to={action.cta.href}>{action.label}</Link>
                          </ToolbarItem>
                        ))
                      : null
                  }
                </ActionServiceProvider>
                <ToolbarItem>
                  <ToggleGraph />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>

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
                    <PopoverField bodyContent={<SeverityHelp />} label={t('public~Severity')} />
                  </dt>
                  <dd>
                    <Severity severity={labels?.severity} />
                  </dd>
                  {alert?.annotations?.description && (
                    <>
                      <dt>{t('public~Description')}</dt>
                      <dd>
                        <AlertMessage
                          alertText={alert.annotations.description}
                          labels={labels}
                          template={rule?.annotations?.description}
                        />
                      </dd>
                    </>
                  )}
                  {alert?.annotations?.summary && (
                    <>
                      <dt>{t('public~Summary')}</dt>
                      <dd>{alert.annotations.summary}</dd>
                    </>
                  )}
                  {alert?.annotations?.message && (
                    <>
                      <dt>{t('public~Message')}</dt>
                      <dd>
                        <AlertMessage
                          alertText={alert.annotations.message}
                          labels={labels}
                          template={rule?.annotations?.message}
                        />
                      </dd>
                    </>
                  )}
                  {runbookURL && (
                    <>
                      <dt>{t('public~Runbook')}</dt>
                      <dd>
                        <ExternalLink href={runbookURL} text={runbookURL} />
                      </dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>
                    <PopoverField bodyContent={<SourceHelp />} label={t('public~Source')} />
                  </dt>
                  <dd>{alert && getSourceKey(_.startCase(alertSource(alert)))}</dd>
                  <dt>
                    <PopoverField bodyContent={<AlertStateHelp />} label={t('public~State')} />
                  </dt>
                  <dd>
                    <AlertState state={state} />
                    <AlertStateDescription alert={alert} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="co-m-pane__body-group">
            <div className="row">
              <div className="col-xs-12">
                <dl className="co-m-pane__details" data-test="label-list">
                  <dt>{t('public~Labels')}</dt>
                  <dd>
                    <Labels kind="alert" labels={labels} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="co-m-pane__body-group">
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
                  <SilencedByList silences={alert?.silencedBy} />
                </div>
              </div>
            </div>
          </div>
        )}
      </StatusBox>
    </>
  );
};
export const AlertsDetailsPage = withFallback(AlertsDetailsPage_);

// Renders Prometheus template text and highlights any {{ ... }} tags that it contains
const PrometheusTemplate = ({ text }) => (
  <>
    {text?.split(/(\{\{[^{}]*\}\})/)?.map((part: string, i: number) =>
      part.match(/^\{\{[^{}]*\}\}$/) ? (
        <code className="co-code prometheus-template-tag" key={i}>
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
                <KebabDropdown
                  dropdownItems={[
                    <DropdownItem component="button" key="silence" onClick={() => silenceAlert(a)}>
                      {t('public~Silence alert')}
                    </DropdownItem>,
                  ]}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AlertRulesDetailsPage_: React.FC<{ match: any }> = ({ match }) => {
  const { t } = useTranslation();

  const isDevPerspective = _.has(match.params, 'ns');
  const namespace = match.params?.ns;

  const rules: Rule[] = useSelector(({ observe }: RootState) =>
    observe.get(isDevPerspective ? 'devRules' : 'rules'),
  );
  const rule = _.find(rules, { id: _.get(match, 'params.id') });

  const { loaded, loadError }: Alerts = useSelector(
    ({ observe }: RootState) => observe.get(isDevPerspective ? 'devAlerts' : 'alerts') || {},
  );

  const formatSeriesTitle = (alertLabels) => {
    const nameLabel = alertLabels.__name__ ?? '';
    const otherLabels = _.omit(alertLabels, '__name__');
    return `${nameLabel}{${_.map(otherLabels, (v, k) => `${k}="${v}"`).join(',')}}`;
  };

  // eslint-disable-next-line camelcase
  const runbookURL = rule?.annotations?.runbook_url;

  return (
    <>
      <Helmet>
        <title>{t('public~{{name}} details', { name: rule?.name || RuleResource.label })}</title>
      </Helmet>
      <StatusBox data={rule} label={RuleResource.label} loaded={loaded} loadError={loadError}>
        <div className="pf-c-page__main-breadcrumb">
          <Breadcrumb className="monitoring-breadcrumbs">
            <BreadcrumbItem>
              <Link
                className="pf-c-breadcrumb__link"
                to={namespace ? `/dev-monitoring/ns/${namespace}/alerts` : '/monitoring/alertrules'}
              >
                {namespace ? t('public~Alerts') : t('public~Alerting rules')}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('public~Alerting rule details')}</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
          <h1 className="co-m-pane__heading">
            <div data-test="resource-title" className="co-resource-item">
              <MonitoringResourceIcon className="co-m-resource-icon--lg" resource={RuleResource} />
              {rule?.name}
              <SeverityBadge severity={rule?.labels?.severity} />
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
                  <dd>{rule?.name}</dd>
                  <dt>
                    <PopoverField bodyContent={<SeverityHelp />} label={t('public~Severity')} />
                  </dt>
                  <dd>
                    <Severity severity={rule?.labels?.severity} />
                  </dd>
                  {rule?.annotations?.description && (
                    <>
                      <dt>{t('public~Description')}</dt>
                      <dd>
                        <PrometheusTemplate text={rule.annotations.description} />
                      </dd>
                    </>
                  )}
                  {rule?.annotations?.summary && (
                    <>
                      <dt>{t('public~Summary')}</dt>
                      <dd>{rule.annotations.summary}</dd>
                    </>
                  )}
                  {rule?.annotations?.message && (
                    <>
                      <dt>{t('public~Message')}</dt>
                      <dd>
                        <PrometheusTemplate text={rule.annotations.message} />
                      </dd>
                    </>
                  )}
                  {runbookURL && (
                    <>
                      <dt>{t('public~Runbook')}</dt>
                      <dd>
                        <ExternalLink href={runbookURL} text={runbookURL} />
                      </dd>
                    </>
                  )}
                </dl>
              </div>
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>
                    <PopoverField bodyContent={<SourceHelp />} label={t('public~Source')} />
                  </dt>
                  <dd>{rule && getSourceKey(_.startCase(alertingRuleSource(rule)))}</dd>
                  {_.isInteger(rule?.duration) && (
                    <>
                      <dt>{t('public~For')}</dt>
                      <dd>
                        {rule.duration === 0 ? '-' : formatPrometheusDuration(rule.duration * 1000)}
                      </dd>
                    </>
                  )}
                  <dt>{t('public~Expression')}</dt>
                  <dd>
                    <Link to={queryBrowserURL(rule?.query, namespace)}>
                      <CodeBlock>
                        <CodeBlockCode>{rule?.query}</CodeBlockCode>
                      </CodeBlock>
                    </Link>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="co-m-pane__body-group">
            <div className="row">
              <div className="col-xs-12">
                <dl className="co-m-pane__details">
                  <dt>{t('public~Labels')}</dt>
                  <dd>
                    <Labels kind="alertrule" labels={rule?.labels} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="co-m-pane__body">
          <div className="co-m-pane__body-group">
            <Toolbar className="monitoring-alert-detail-toolbar">
              <ToolbarContent>
                <ToolbarItem variant="label">
                  <SectionHeading text={t('public~Active alerts')} />
                </ToolbarItem>
                <ToolbarGroup alignment={{ default: 'alignRight' }}>
                  <ToolbarItem>
                    <ToggleGraph />
                  </ToolbarItem>
                </ToolbarGroup>
              </ToolbarContent>
            </Toolbar>
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
                {_.isEmpty(rule?.alerts) ? (
                  <div className="pf-u-text-align-center">{t('public~None found')}</div>
                ) : (
                  <ActiveAlerts alerts={rule.alerts} ruleID={rule?.id} namespace={namespace} />
                )}
              </div>
            </div>
          </div>
        </div>
      </StatusBox>
    </>
  );
};
export const AlertRulesDetailsPage = withFallback(AlertRulesDetailsPage_);

type ExpireSilenceModalProps = {
  isOpen: boolean;
  setClosed: () => void;
  silenceId: string;
};

const ExpireSilenceModal: React.FC<ExpireSilenceModalProps> = ({
  isOpen,
  setClosed,
  silenceId,
}) => {
  const { t } = useTranslation();

  const [isInProgress, , setInProgress, setNotInProgress] = useBoolean(false);
  const [errorMessage, setErrorMessage] = React.useState();

  const expireSilence = () => {
    setInProgress();
    consoleFetchJSON
      .delete(`${window.SERVER_FLAGS.alertManagerBaseURL}/api/v2/silence/${silenceId}`)
      .then(() => {
        refreshNotificationPollers();
        setClosed();
      })
      .catch((err) => {
        setErrorMessage(_.get(err, 'json.error') || err.message || 'Error saving silence');
        setNotInProgress();
      })
      .then(setNotInProgress);
  };

  return (
    <Modal
      isOpen={isOpen}
      position="top"
      showClose={false}
      title={t('public~Expire silence')}
      variant={ModalVariant.small}
    >
      <Flex direction={{ default: 'column' }}>
        <FlexItem>{t('public~Are you sure you want to expire this silence?')}</FlexItem>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            {errorMessage && (
              <PFAlert
                className="co-alert co-alert--scrollable"
                isInline
                title={t('public~An error occurred')}
                variant="danger"
              >
                <div className="co-pre-line">{errorMessage}</div>
              </PFAlert>
            )}
          </FlexItem>
          <Flex>
            <FlexItem>{isInProgress && <LoadingInline />}</FlexItem>
            <FlexItem align={{ default: 'alignRight' }}>
              <Button variant="secondary" onClick={setClosed}>
                {t('public~Cancel')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="primary" onClick={expireSilence}>
                {t('public~Expire silence')}
              </Button>
            </FlexItem>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
};

const SilenceDropdown: React.FC<SilenceDropdownProps> = ({
  className,
  isPlain,
  silence,
  Toggle,
}) => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen, , setClosed] = useBoolean(false);
  const [isModalOpen, , setModalOpen, setModalClosed] = useBoolean(false);

  const editSilence = () => {
    history.push(`${SilenceResource.plural}/${silence.id}/edit`);
  };

  const dropdownItems =
    silenceState(silence) === SilenceStates.Expired
      ? [
          <DropdownItem key="edit-silence" component="button" onClick={editSilence}>
            {t('public~Recreate silence')}
          </DropdownItem>,
        ]
      : [
          <DropdownItem key="edit-silence" component="button" onClick={editSilence}>
            {t('public~Edit silence')}
          </DropdownItem>,
          <DropdownItem key="cancel-silence" component="button" onClick={setModalOpen}>
            {t('public~Expire silence')}
          </DropdownItem>,
        ];

  return (
    <>
      <Dropdown
        className={className}
        data-test="silence-actions"
        dropdownItems={dropdownItems}
        isOpen={isOpen}
        isPlain={isPlain}
        onSelect={setClosed}
        position={DropdownPosition.right}
        toggle={<Toggle onToggle={setIsOpen} />}
      />
      <ExpireSilenceModal isOpen={isModalOpen} setClosed={setModalClosed} silenceId={silence.id} />
    </>
  );
};

const SilenceDropdownKebab: React.FC<{ silence: Silence }> = ({ silence }) => (
  <SilenceDropdown isPlain silence={silence} Toggle={KebabToggle} />
);

const ActionsToggle: React.FC<{ onToggle: OnToggle }> = ({ onToggle, ...props }) => (
  <DropdownToggle data-test="silence-actions-toggle" onToggle={onToggle} {...props}>
    Actions
  </DropdownToggle>
);

const SilenceDropdownActions: React.FC<{ silence: Silence }> = ({ silence }) => (
  <SilenceDropdown className="co-actions-menu" silence={silence} Toggle={ActionsToggle} />
);

const SilencedAlertsList = ({ alerts }) => {
  const { t } = useTranslation();

  return _.isEmpty(alerts) ? (
    <div className="pf-u-text-align-center">{t('public~None found')}</div>
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
              <KebabDropdown
                dropdownItems={[
                  <DropdownItem key="view-rule" onClick={() => viewAlertRule(a)}>
                    {t('public~View alerting rule')}
                  </DropdownItem>,
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SilencesDetailsPage_: React.FC<{ match: any }> = ({ match }) => {
  const { t } = useTranslation();
  const [namespace] = useActiveNamespace();
  const [perspective] = useActivePerspective();

  const alertsLoaded = useSelector(
    ({ observe }: RootState) => observe.get(perspective === 'dev' ? 'devAlerts' : 'alerts')?.loaded,
  );

  const silences: Silences = useSelector(({ observe }: RootState) => observe.get('silences'));
  const silence = _.find(silences?.data, { id: _.get(match, 'params.id') });

  return (
    <>
      <Helmet>
        <title>
          {t('public~{{name}} details', { name: silence?.name || SilenceResource.label })}
        </title>
      </Helmet>
      <StatusBox
        data={silence}
        label={SilenceResource.label}
        loaded={silences?.loaded}
        loadError={silences?.loadError}
      >
        <div className="pf-c-page__main-breadcrumb">
          <Breadcrumb className="monitoring-breadcrumbs">
            <BreadcrumbItem>
              <Link
                className="pf-c-breadcrumb__link"
                to={
                  perspective === 'dev'
                    ? `/dev-monitoring/ns/${namespace}/alerts`
                    : '/monitoring/silences'
                }
              >
                {perspective === 'dev' ? t('public~Alerts') : t('public~Silences')}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('public~Silence details')}</BreadcrumbItem>
          </Breadcrumb>
        </div>
        <div className="co-m-nav-title co-m-nav-title--detail co-m-nav-title--breadcrumbs">
          <h1 className="co-m-pane__heading">
            <div data-test="resource-title" className="co-resource-item">
              <MonitoringResourceIcon
                className="co-m-resource-icon--lg"
                resource={SilenceResource}
              />
              {silence?.name}
            </div>
            <div className="co-actions" data-test-id="details-actions">
              {silence && <SilenceDropdownActions silence={silence} />}
            </div>
          </h1>
        </div>
        <div className="co-m-pane__body">
          <SectionHeading text={t('public~Silence details')} />
          <div className="co-m-pane__body-group">
            <div className="row">
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  {silence?.name && (
                    <>
                      <dt>{t('public~Name')}</dt>
                      <dd>{silence?.name}</dd>
                    </>
                  )}
                  <dt>{t('public~Matchers')}</dt>
                  <dd data-test="label-list">
                    {_.isEmpty(silence?.matchers) ? (
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
                    <Timestamp timestamp={silence?.updatedAt} />
                  </dd>
                </dl>
              </div>
              <div className="col-sm-6">
                <dl className="co-m-pane__details">
                  <dt>{t('public~Starts at')}</dt>
                  <dd>
                    <Timestamp timestamp={silence?.startsAt} />
                  </dd>
                  <dt>{t('public~Ends at')}</dt>
                  <dd>
                    <Timestamp timestamp={silence?.endsAt} />
                  </dd>
                  <dt>{t('public~Created by')}</dt>
                  <dd>{silence?.createdBy || '-'}</dd>
                  <dt>{t('public~Comment')}</dt>
                  <dd>{silence?.comment || '-'}</dd>
                  <dt>{t('public~Firing alerts')}</dt>
                  <dd>
                    {alertsLoaded ? (
                      <SeverityCounts alerts={silence?.firingAlerts} />
                    ) : (
                      <LoadingInline />
                    )}
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
                {alertsLoaded ? (
                  <SilencedAlertsList alerts={silence?.firingAlerts} />
                ) : (
                  <LoadingInline />
                )}
              </div>
            </div>
          </div>
        </div>
      </StatusBox>
    </>
  );
};
const SilencesDetailsPage = withFallback(SilencesDetailsPage_);

const tableAlertClasses = [
  'pf-u-w-50 pf-u-w-33-on-sm', // Name
  'pf-m-hidden pf-m-visible-on-sm', // Severity
  '', // State
  'pf-m-hidden pf-m-visible-on-sm', // Source
  'dropdown-kebab-pf pf-c-table__action',
];

const AlertTableRow: React.FC<RowProps<Alert>> = ({ obj }) => {
  const { t } = useTranslation();

  const { annotations = {}, labels } = obj;
  const description = annotations.description || annotations.message;
  const state = alertState(obj);

  const title: string = obj.annotations?.description || obj.annotations?.message;

  const dropdownItems = [
    <DropdownItem key="view-rule" onClick={() => viewAlertRule(obj)}>
      {t('public~View alerting rule')}
    </DropdownItem>,
  ];
  if (state !== AlertStates.Silenced) {
    dropdownItems.unshift(
      <DropdownItem key="silence-alert" onClick={() => silenceAlert(obj)}>
        {t('public~Silence alert')}
      </DropdownItem>,
    );
  }

  return (
    <>
      <td className={tableAlertClasses[0]} title={title}>
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
      </td>
      <td className={tableAlertClasses[1]} title={title}>
        <Severity severity={labels?.severity} />
      </td>
      <td className={tableAlertClasses[2]} title={title}>
        <AlertState state={state} />
        <AlertStateDescription alert={obj} />
      </td>
      <td className={tableAlertClasses[3]} title={title}>
        {alertSource(obj) === AlertSource.User ? t('public~User') : t('public~Platform')}
      </td>
      <td className={tableAlertClasses[4]} title={title}>
        <KebabDropdown dropdownItems={dropdownItems} />
      </td>
    </>
  );
};

export const severityRowFilter = (): RowFilter => ({
  filter: (filter, alert: Alert) =>
    filter.selected?.includes(alert.labels?.severity) || _.isEmpty(filter.selected),
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

const SilencesNotLoadedWarning: React.FC<{ silencesLoadError: any }> = ({ silencesLoadError }) => {
  const { t } = useTranslation();
  return (
    <PFAlert
      className="co-alert"
      isInline
      title={t(
        'public~Error loading silences from Alertmanager. Some of the alerts below may actually be silenced.',
      )}
      variant="warning"
    >
      {silencesLoadError.json?.error || silencesLoadError.message}
    </PFAlert>
  );
};

// Sort alerts by their state (sort first by the state itself, then by the timestamp relevant to
// the state)
const alertStateOrder = (alert: Alert) => [
  [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].indexOf(alertState(alert)),
  alertState(alert) === AlertStates.Silenced
    ? _.max(_.map(alert.silencedBy, 'endsAt'))
    : _.get(alert, 'activeAt'),
];

const AlertsPage_: React.FC<Alerts> = () => {
  const { t } = useTranslation();

  const { data, loaded = false, loadError }: Alerts = useSelector(
    ({ observe }: RootState) => observe.get('alerts') || {},
  );
  const silencesLoadError = useSelector(
    ({ observe }: RootState) => observe.get('silences')?.loadError,
  );

  const nameFilter: RowFilter = {
    filter: (filter, alert: Alert) =>
      fuzzyCaseInsensitive(filter.selected?.[0], alert.labels?.alertname),
    items: [],
    type: 'name',
  } as RowFilter;

  const rowFilters: RowFilter[] = [
    {
      defaultSelected: [AlertStates.Firing],
      filter: (filter, alert: Alert) =>
        filter.selected?.includes(alertState(alert)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Alert State'),
      items: [
        { id: AlertStates.Firing, title: t('public~Firing') },
        { id: AlertStates.Pending, title: t('public~Pending') },
        { id: AlertStates.Silenced, title: t('public~Silenced') },
      ],
      reducer: alertState,
      type: 'alert-state',
    },
    severityRowFilter(),
    {
      defaultSelected: [AlertSource.Platform],
      filter: (filter, alert: Alert) =>
        filter.selected?.includes(alertSource(alert)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Source'),
      items: [
        { id: AlertSource.Platform, title: t('public~Platform') },
        { id: AlertSource.User, title: t('public~User') },
      ],
      reducer: alertSource,
      type: 'alert-source',
    },
  ];

  const allFilters: RowFilter[] = [nameFilter, ...rowFilters];
  const [staticData, filteredData, onFilterChange] = useListPageFilter(data, allFilters);

  const columns = React.useMemo<TableColumn<Alert>[]>(
    () => [
      {
        id: 'name',
        props: { className: tableAlertClasses[0] },
        sort: 'labels.alertname',
        title: t('public~Name'),
        transforms: [sortable],
      },
      {
        id: 'severity',
        props: { className: tableAlertClasses[1] },
        sort: (alerts: Alert[], direction: 'asc' | 'desc') =>
          _.orderBy(alerts, alertSeverityOrder, [direction]) as Alert[],
        title: t('public~Severity'),
        transforms: [sortable],
      },
      {
        id: 'state',
        props: { className: tableAlertClasses[2] },
        sort: (alerts: Alert[], direction: 'asc' | 'desc') =>
          _.orderBy(alerts, alertStateOrder, [direction]),
        title: t('public~State'),
        transforms: [sortable],
      },
      {
        id: 'source',
        props: { className: tableAlertClasses[3] },
        sort: (alerts: Alert[], direction: 'asc' | 'desc') =>
          _.orderBy(alerts, alertSource, [direction]),
        title: t('public~Source'),
        transforms: [sortable],
      },
      {
        id: 'actions',
        props: { className: tableAlertClasses[4] },
        title: '',
      },
    ],
    [t],
  );

  return (
    <>
      <Helmet>
        <title>Alerting</title>
      </Helmet>
      <div className="co-m-pane__body">
        <ListPageFilter
          data={staticData}
          labelFilter="alerts"
          labelPath="labels"
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={rowFilters}
        />
        {silencesLoadError && <SilencesNotLoadedWarning silencesLoadError={silencesLoadError} />}
        <div className="row">
          <div className="col-xs-12">
            <VirtualizedTable<Alert>
              aria-label={t('public~Alerts')}
              columns={columns}
              data={filteredData ?? []}
              loaded={loaded}
              loadError={loadError}
              Row={AlertTableRow}
              unfilteredData={data}
            />
          </div>
        </div>
      </div>
    </>
  );
};
const AlertsPage = withFallback(AlertsPage_);

const ruleHasAlertState = (rule: Rule, state: AlertStates): boolean =>
  state === AlertStates.NotFiring ? _.isEmpty(rule.alerts) : _.some(rule.alerts, { state });

const ruleAlertStateFilter = (filter, rule: Rule) =>
  (filter.selected?.includes(AlertStates.NotFiring) && _.isEmpty(rule.alerts)) ||
  _.some(rule.alerts, (a) => filter.selected?.includes(a.state)) ||
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
  'pf-u-w-50 pf-u-w-33-on-sm', // Name
  'pf-m-hidden pf-m-visible-on-sm', // Severity
  '', // Alert state
  'pf-m-hidden pf-m-visible-on-sm', // Source
];

const RuleTableRow: React.FC<RowProps<Rule>> = ({ obj }) => {
  const { t } = useTranslation();

  const title: string = obj.annotations?.description || obj.annotations?.message;

  return (
    <>
      <td className={tableRuleClasses[0]} title={title}>
        <div className="co-resource-item">
          <MonitoringResourceIcon resource={RuleResource} />
          <Link to={ruleURL(obj)} className="co-resource-item__resource-name">
            {obj.name}
          </Link>
        </div>
      </td>
      <td className={tableRuleClasses[1]} title={title}>
        <Severity severity={obj.labels?.severity} />
      </td>
      <td className={tableRuleClasses[2]} title={title}>
        {_.isEmpty(obj.alerts) ? '-' : <StateCounts alerts={obj.alerts} />}
      </td>
      <td className={tableRuleClasses[3]} title={title}>
        {alertingRuleSource(obj) === AlertSource.User ? t('public~User') : t('public~Platform')}
      </td>
    </>
  );
};

const RulesPage_: React.FC<{}> = () => {
  const { t } = useTranslation();

  const data: Rule[] = useSelector(({ observe }: RootState) => observe.get('rules'));
  const { loaded = false, loadError }: Alerts = useSelector(
    ({ observe }: RootState) => observe.get('alerts') || {},
  );
  const silencesLoadError = useSelector(
    ({ observe }: RootState) => observe.get('silences')?.loadError,
  );

  const nameFilter: RowFilter = {
    filter: (filter, rule: Rule) => fuzzyCaseInsensitive(filter.selected?.[0], rule.name),
    items: [],
    type: 'name',
  } as RowFilter;

  const rowFilters: RowFilter[] = [
    alertStateFilter(),
    severityRowFilter(),
    {
      defaultSelected: [AlertSource.Platform],
      filter: (filter, rule: Rule) =>
        filter.selected?.includes(alertingRuleSource(rule)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Source'),
      items: [
        { id: AlertSource.Platform, title: t('public~Platform') },
        { id: AlertSource.User, title: t('public~User') },
      ],
      reducer: alertingRuleSource,
      type: 'alerting-rule-source',
    },
  ];

  const allFilters: RowFilter[] = [nameFilter, ...rowFilters];
  const [staticData, filteredData, onFilterChange] = useListPageFilter(data, allFilters);

  const columns = React.useMemo<TableColumn<Rule>[]>(
    () => [
      {
        id: 'name',
        props: { className: tableRuleClasses[0] },
        sort: 'name',
        title: t('public~Name'),
        transforms: [sortable],
      },
      {
        id: 'severity',
        props: { className: tableRuleClasses[1] },
        sort: (rules: Rule[], direction: 'asc' | 'desc') =>
          _.orderBy(rules, alertSeverityOrder, [direction]) as Rule[],
        title: t('public~Severity'),
        transforms: [sortable],
      },
      {
        id: 'state',
        props: { className: tableRuleClasses[2] },
        sort: (rules: Rule[], direction: 'asc' | 'desc') =>
          _.orderBy(rules, alertingRuleStateOrder, [direction]),
        title: t('public~Alert state'),
        transforms: [sortable],
      },
      {
        id: 'source',
        props: { className: tableRuleClasses[3] },
        sort: (rules: Rule[], direction: 'asc' | 'desc') =>
          _.orderBy(rules, alertingRuleSource, [direction]),
        title: t('public~Source'),
        transforms: [sortable],
      },
    ],
    [t],
  );

  return (
    <>
      <Helmet>
        <title>Alerting</title>
      </Helmet>
      <div className="co-m-pane__body">
        <ListPageFilter
          data={staticData}
          labelFilter="alerts"
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={rowFilters}
        />
        {silencesLoadError && <SilencesNotLoadedWarning silencesLoadError={silencesLoadError} />}
        <div className="row">
          <div className="col-xs-12">
            <VirtualizedTable<Rule>
              aria-label={t('public~Alerting rules')}
              columns={columns}
              data={filteredData ?? []}
              loaded={loaded}
              loadError={loadError}
              Row={RuleTableRow}
              unfilteredData={data}
            />
          </div>
        </div>
      </div>
    </>
  );
};
const RulesPage = withFallback(RulesPage_);

const CreateButton: React.FC<{}> = React.memo(() => {
  const { t } = useTranslation();

  return (
    <Link className="co-m-primary-action" to="/monitoring/silences/~new">
      <Button variant="primary" data-test="create-silence-btn">
        {t('public~Create silence')}
      </Button>
    </Link>
  );
});

const silenceFiringAlertsOrder = (silence: Silence) => {
  const counts = _.countBy(silence.firingAlerts, 'labels.severity');
  return [
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Critical] ?? 0),
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Warning] ?? 0),
    silence.firingAlerts.length,
  ];
};

const silenceStateOrder = (silence: Silence) => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

const SilencesPage_: React.FC<Silences> = () => {
  const { t } = useTranslation();

  const { data, loaded = false, loadError }: Silences = useSelector(
    ({ observe }: RootState) => observe.get('silences') || {},
  );

  const nameFilter: RowFilter = {
    filter: (filter, silence: Silence) => fuzzyCaseInsensitive(filter.selected?.[0], silence.name),
    items: [],
    type: 'name',
  } as RowFilter;

  const rowFilters: RowFilter[] = [
    {
      defaultSelected: [SilenceStates.Active, SilenceStates.Pending],
      filter: (filter, silence: Silence) =>
        filter.selected?.includes(silenceState(silence)) || _.isEmpty(filter.selected),
      filterGroupName: t('public~Silence State'),
      items: [
        { id: SilenceStates.Active, title: t('public~Active') },
        { id: SilenceStates.Pending, title: t('public~Pending') },
        { id: SilenceStates.Expired, title: t('public~Expired') },
      ],
      reducer: silenceState,
      type: 'silence-state',
    },
  ];

  const allFilters: RowFilter[] = [nameFilter, ...rowFilters];
  const [staticData, filteredData, onFilterChange] = useListPageFilter(data, allFilters);

  const columns = React.useMemo<TableColumn<Silence>[]>(
    () => [
      {
        id: 'name',
        props: { className: tableSilenceClasses[0] },
        sort: 'name',
        title: t('public~Name'),
        transforms: [sortable],
      },
      {
        id: 'firingAlerts',
        props: { className: tableSilenceClasses[1] },
        sort: (silences: Silence[], direction: 'asc' | 'desc') =>
          _.orderBy(silences, silenceFiringAlertsOrder, [direction]),
        title: t('public~Firing alerts'),
        transforms: [sortable],
      },
      {
        id: 'state',
        props: { className: tableSilenceClasses[2] },
        sort: (silences: Silence[], direction: 'asc' | 'desc') =>
          _.orderBy(silences, silenceStateOrder, [direction]),
        title: t('public~State'),
        transforms: [sortable],
      },
      {
        id: 'createdBy',
        props: { className: tableSilenceClasses[3] },
        sort: 'createdBy',
        title: t('public~Creator'),
        transforms: [sortable],
      },
      {
        id: 'actions',
        props: { className: tableSilenceClasses[4] },
        title: '',
      },
    ],
    [t],
  );

  return (
    <>
      <Helmet>
        <title>Alerting</title>
      </Helmet>
      <div className="co-m-pane__body">
        <div className="co-m-pane__createLink--no-title">
          <CreateButton />
        </div>
        <ListPageFilter
          data={staticData}
          hideLabelFilter
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={rowFilters}
        />
        {loadError && (
          <PFAlert
            className="co-alert"
            isInline
            title={t(
              'public~Error loading silences from Alertmanager. Alertmanager may be unavailable.',
            )}
            variant="danger"
          >
            {typeof loadError === 'string' ? loadError : loadError.message}
          </PFAlert>
        )}
        <div className="row">
          <div className="col-xs-12">
            <VirtualizedTable<Silence>
              aria-label={t('public~Silences')}
              columns={columns}
              data={filteredData ?? []}
              loaded={loaded}
              loadError={loadError}
              Row={SilenceTableRow}
              unfilteredData={data}
            />
          </div>
        </div>
      </div>
    </>
  );
};
const SilencesPage = withFallback(SilencesPage_);

const Tab: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <li
    className={classNames('co-m-horizontal-nav__menu-item', {
      'co-m-horizontal-nav-item--active': active,
    })}
  >
    {children}
  </li>
);

const AlertingPage: React.FC<{ match: { url: string } }> = ({ match }) => {
  const { t } = useTranslation();

  const alertsPath = '/monitoring/alerts';
  const rulesPath = '/monitoring/alertrules';
  const silencesPath = '/monitoring/silences';

  const { url } = match;

  return (
    <>
      <div className="co-m-nav-title co-m-nav-title--detail">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <span className="co-resource-item__resource-name" data-test-id="resource-title">
              {t('public~Alerting')}
            </span>
          </div>
        </h1>
      </div>
      <ul className="co-m-horizontal-nav__menu">
        <Tab active={url === alertsPath}>
          <Link to={alertsPath}>{t('public~Alerts')}</Link>
        </Tab>
        <Tab active={url === silencesPath}>
          <Link to={silencesPath}>{t('public~Silences')}</Link>
        </Tab>
        <Tab active={url === rulesPath}>
          <Link to={rulesPath}>{t('public~Alerting rules')}</Link>
        </Tab>
      </ul>
      <Switch>
        <Route path={alertsPath} exact component={AlertsPage} />
        <Route path={rulesPath} exact component={RulesPage} />
        <Route path={silencesPath} exact component={SilencesPage} />
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
      dispatch(alertingLoading(alertsKey));
      const url = getPrometheusURL({ endpoint: PrometheusEndpoint.RULES });
      const poller = (): void => {
        consoleFetchJSON(url)
          .then(({ data }) => {
            const { alerts, rules } = getAlertsAndRules(data);
            dispatch(alertingLoaded(alertsKey, alerts));
            dispatch(alertingSetRules(rulesKey, rules));
          })
          .catch((e) => dispatch(alertingErrored(alertsKey, e)))
          .then(() => (pollerTimeouts[alertsKey] = setTimeout(poller, 15 * 1000)));
      };
      pollers[alertsKey] = poller;
      poller();
    } else {
      dispatch(alertingErrored('alerts', new Error('prometheusBaseURL not set')));
    }
    return () => _.each(pollerTimeouts, clearTimeout);
  }, [dispatch]);

  return (
    <Switch>
      <Route path="/monitoring/(alerts|alertrules|silences)" exact component={AlertingPage} />
      <Route path="/monitoring/alertrules/:id" exact component={AlertRulesDetailsPage} />
      <Route path="/monitoring/alerts/:ruleID" exact component={AlertsDetailsPage} />
      <Route path="/monitoring/silences/:id" exact component={SilencesDetailsPage} />
      <Route path="/monitoring/silences/:id/edit" exact component={EditSilence} />
    </Switch>
  );
};

// Handles links that have the Prometheus UI's URL format (expected for links in alerts sent by
// Alertmanager). The Prometheus UI specifies the PromQL query with the GET param `g0.expr`, so we
// use that if it exists. Otherwise, just go to the query browser page with no query.
const PrometheusUIRedirect = () => {
  const params = getURLSearchParams();
  return <Redirect to={`/monitoring/query-browser?query0=${params['g0.expr'] || ''}`} />;
};

export const MonitoringUI = () => (
  <Switch>
    {/* This redirect also handles the `/monitoring/#/alerts?...` link URLs generated by
    Alertmanager (because the `#` is considered the end of the URL) */}
    <Redirect from="/monitoring" exact to="/monitoring/alerts" />
    <Route path="/monitoring/alertmanagerconfig" exact component={AlertmanagerPage} />
    <Route path="/monitoring/alertmanageryaml" exact component={AlertmanagerPage} />
    <Route path="/monitoring/dashboards/:board?" exact component={MonitoringDashboardsPage} />
    <Route path="/monitoring/graph" exact component={PrometheusUIRedirect} />
    <Route path="/monitoring/query-browser" exact component={QueryBrowserPage} />
    <Route path="/monitoring/silences/~new" exact component={CreateSilence} />
    <Route path="/monitoring/targets" component={TargetsUI} />
    <Route component={PollerPages} />
  </Switch>
);

type AlertStateProps = {
  state: AlertStates;
};

type AlertMessageProps = {
  alertText: string;
  labels: PrometheusLabels;
  template: string;
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

type OnToggle = (value: boolean, e: MouseEvent) => void;

type SilenceDropdownProps = {
  className?: string;
  isPlain?: boolean;
  silence: Silence;
  Toggle: React.FC<{ onToggle: OnToggle }>;
};
