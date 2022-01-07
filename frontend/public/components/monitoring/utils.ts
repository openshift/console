import * as _ from 'lodash-es';
import { murmur3 } from 'murmurhash-js';

import { PrometheusLabels } from '../graphs';
import {
  Alert,
  AlertSeverity,
  AlertSource,
  AlertStates,
  MonitoringResource,
  PrometheusRule,
  PrometheusRulesResponse,
  Rule,
  Silence,
  SilenceStates,
  Target,
} from './types';

export const AlertResource: MonitoringResource = {
  kind: 'Alert',
  label: 'Alert',
  plural: '/monitoring/alerts',
  abbr: 'AL',
};

export const RuleResource: MonitoringResource = {
  kind: 'AlertRule',
  label: 'Alerting Rule',
  plural: '/monitoring/alertrules',
  abbr: 'AR',
};

export const SilenceResource: MonitoringResource = {
  kind: 'Silence',
  label: 'Silence',
  plural: '/monitoring/silences',
  abbr: 'SL',
};

export const labelsToParams = (labels: PrometheusLabels) =>
  _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');

export const alertURL = (alert: Alert, ruleID: string) =>
  `${AlertResource.plural}/${ruleID}?${labelsToParams(alert.labels)}`;

export const getAlertsAndRules = (
  data: PrometheusRulesResponse['data'],
): { alerts: Alert[]; rules: Rule[] } => {
  // Flatten the rules data to make it easier to work with, discard non-alerting rules since those
  // are the only ones we will be using and add a unique ID to each rule.
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

export const alertState = (a: Alert): AlertStates => a?.state;
export const silenceState = (s: Silence): SilenceStates => s?.status?.state;

export const alertingRuleHasAlertState = (rule: Rule, state: AlertStates) =>
  state === AlertStates.NotFiring ? rule.alerts.length === 0 : _.some(rule.alerts, { state });

export const alertingRuleSource = (rule: Rule): AlertSource =>
  rule.labels?.prometheus === 'openshift-monitoring/k8s' ? AlertSource.Platform : AlertSource.User;

export const alertSource = (alert: Alert): AlertSource => alertingRuleSource(alert.rule);

export const alertDescription = (alert: Alert | Rule): string =>
  alert.annotations?.description || alert.annotations?.message || alert.labels?.alertname;

// Determine if an Alert is silenced by a Silence (if all of the Silence's matchers match one of the
// Alert's labels)
export const isSilenced = (alert: Alert, silence: Silence): boolean =>
  [AlertStates.Firing, AlertStates.Silenced].includes(alert.state) &&
  _.every(silence.matchers, (m) => {
    const alertValue = _.get(alert.labels, m.name, '');
    return m.isRegex ? new RegExp(`^${m.value}$`).test(alertValue) : alertValue === m.value;
  });

type ListOrder = (number | string)[];

// Severity sort order is "critical" > "warning" > (anything else in A-Z order) > "none"
export const alertSeverityOrder = (alert: Alert | Rule): ListOrder => {
  const { severity } = alert.labels;
  const order: number =
    {
      [AlertSeverity.Critical]: 1,
      [AlertSeverity.Warning]: 2,
      [AlertSeverity.None]: 4,
    }[severity] ?? 3;
  return [order, severity];
};

// Sort alerts and silences by their state (sort first by the state itself, then by the timestamp
// relevant to the state)
export const alertStateOrder = (alert: Alert): ListOrder => [
  [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].indexOf(alertState(alert)),
  alertState(alert) === AlertStates.Silenced
    ? _.max(_.map(alert.silencedBy, 'endsAt'))
    : _.get(alert, 'activeAt'),
];

export const alertingRuleStateOrder = (rule: Rule): ListOrder => {
  const counts = _.countBy(rule.alerts, 'state');
  return [AlertStates.Firing, AlertStates.Pending, AlertStates.Silenced].map(
    (state) => Number.MAX_SAFE_INTEGER - (counts[state] ?? 0),
  );
};

export const silenceFiringAlertsOrder = (silence: Silence): ListOrder => {
  const counts = _.countBy(silence.firingAlerts, 'labels.severity');
  return [
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Critical] ?? 0),
    Number.MAX_SAFE_INTEGER - (counts[AlertSeverity.Warning] ?? 0),
    silence.firingAlerts.length,
  ];
};

export const silenceStateOrder = (silence: Silence): ListOrder => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

export const targetSource = (target: Target): AlertSource =>
  target.labels?.prometheus === 'openshift-monitoring/k8s'
    ? AlertSource.Platform
    : AlertSource.User;
