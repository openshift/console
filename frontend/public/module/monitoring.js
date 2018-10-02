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

// Return "inactive" if no state is found
export const alertState = a => _.get(a, 'state', 'inactive');

export const silenceState = s => _.get(s, 'status.state');
