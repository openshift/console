import * as _ from 'lodash-es';

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
