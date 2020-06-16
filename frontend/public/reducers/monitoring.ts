import * as _ from 'lodash-es';

export const enum AlertSeverity {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}

export const enum AlertStates {
  Firing = 'firing',
  Pending = 'pending',
  Silenced = 'silenced',
}

export const enum SilenceStates {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
}

export const alertState = (a) => a?.state;
export const silenceState = (s) => s?.status?.state;

export const alertingRuleIsActive = (rule) => (rule.state === 'inactive' ? 'false' : 'true');

export const alertDescription = (alert) =>
  alert.annotations?.description || alert.annotations?.message || alert.labels?.alertname;

// Sort alerts and silences by their state (sort first by the state itself, then by the timestamp relevant to the state)
export const alertStateOrder = (alert) => [
  [AlertStates.Firing, AlertStates.Silenced, AlertStates.Pending].indexOf(alertState(alert)),
  alertState(alert) === AlertStates.Silenced
    ? _.max(_.map(alert.silencedBy, 'endsAt'))
    : _.get(alert, 'activeAt'),
];

export const silenceFiringAlertsOrder = (silence) => {
  const severityCounts = _.countBy(silence.firingAlerts, 'labels.severity');
  return [
    severityCounts[AlertSeverity.Critical],
    severityCounts[AlertSeverity.Warning],
    silence.firingAlerts.length,
  ];
};

export const silenceStateOrder = (silence) => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

// Determine if an Alert is silenced by a Silence (if all of the Silence's matchers match one of the Alert's labels)
export const isSilenced = (alert, silence) =>
  [AlertStates.Firing, AlertStates.Silenced].includes(alert.state) &&
  _.every(silence.matchers, (m) => {
    const alertValue = _.get(alert.labels, m.name);
    return (
      alertValue !== undefined &&
      (m.isRegex ? new RegExp(`^${m.value}$`).test(alertValue) : alertValue === m.value)
    );
  });
