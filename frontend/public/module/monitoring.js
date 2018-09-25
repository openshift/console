import * as _ from 'lodash-es';

export const AlertResource = {
  kind: 'Alert',
  label: 'Alert',
  path: '/monitoring/alerts',
  abbr: 'AL',
};

export const AlertRuleResource = {
  kind: 'AlertRule',
  label: 'Alert Rule',
  path: '/monitoring/alertrules',
  abbr: 'AR',
};

export const SilenceResource = {
  kind: 'Silence',
  label: 'Silence',
  path: '/monitoring/silences',
  abbr: 'SL',
};

// Return "firing" if the rule has a firing alert
// Return "pending" if the rule has no firing alerts, but has a pending alert
// Otherwise return "inactive"
export const alertRuleState = rule => {
  const states = _.map(_.get(rule, 'alerts'), 'state');
  if (_.includes(states, 'firing')) {
    return 'firing';
  } else if (_.includes(states, 'pending')) {
    return 'pending';
  }
  return 'inactive';
};

export const silenceState = s => _.get(s, 'status.state');
