import * as _ from 'lodash';
import { murmur3 } from 'murmurhash-js';
import {
  Alert,
  AlertStates,
  Rule,
  Silence,
  AlertSeverity,
  SilenceStates,
  PrometheusRulesResponse,
  PrometheusRule,
  AlertResource,
  PrometheusLabels,
} from '../types/monitoring';

export const alertState = (a: Alert): AlertStates => a?.state;
export const silenceState = (s: Silence) => s?.status?.state;

export const alertingRuleIsActive = (rule) => (rule.state === 'inactive' ? 'false' : 'true');

export const alertDescription = (alert: Alert) =>
  alert.annotations?.description || alert.annotations?.message || alert.labels?.alertname;

// Sort alerts and silences by their state (sort first by the state itself, then by the timestamp relevant to the state)
export const alertStateOrder = (alert: Alert) => [
  [AlertStates.Firing, AlertStates.Silenced, AlertStates.Pending].indexOf(alertState(alert)),
  alertState(alert) === AlertStates.Silenced
    ? _.max(_.map(alert.silencedBy, 'endsAt'))
    : _.get(alert, 'activeAt'),
];

export const silenceFiringAlertsOrder = (silence: Silence) => {
  const severityCounts = _.countBy(silence.firingAlerts, 'labels.severity');
  return [
    severityCounts[AlertSeverity.Critical],
    severityCounts[AlertSeverity.Warning],
    silence.firingAlerts.length,
  ];
};

export const silenceStateOrder = (silence: Silence) => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

// Determine if an Alert is silenced by a Silence (if all of the Silence's matchers match one of the Alert's labels)
export const isSilenced = (alert: Alert, silence: Silence) =>
  [AlertStates.Firing, AlertStates.Silenced].includes(alert.state) &&
  _.every(silence.matchers, (m) => {
    const alertValue = _.get(alert.labels, m.name);
    return (
      alertValue !== undefined &&
      (m.isRegex ? new RegExp(`^${m.value}$`).test(alertValue) : alertValue === m.value)
    );
  });

export const getAlertsAndRules = (
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

export const labelsToParams = (labels: PrometheusLabels) =>
  _.map(labels, (v, k) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
export const alertURL = (alert: Alert, ruleID: string) =>
  `${AlertResource.plural}/${ruleID}?${labelsToParams(alert.labels)}`;
