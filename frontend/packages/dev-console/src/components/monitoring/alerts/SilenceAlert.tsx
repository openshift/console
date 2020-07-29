import * as React from 'react';
import * as _ from 'lodash';
import { Switch } from '@patternfly/react-core';
import { Rule, RuleStates } from '@console/internal/components/monitoring/types';
import { StateTimestamp } from '@console/internal/components/monitoring/alerting';
import { coFetchJSON } from '@console/internal/co-fetch';
import SilenceDurationDropDown from './SilenceDurationDropdown';

type SilenceAlertProps = {
  rule: Rule;
};

const { alertManagerBaseURL } = window.SERVER_FLAGS;

const SilenceUntil = ({ rule }) => {
  if (!_.isEmpty(rule.silencedBy)) {
    return <StateTimestamp text="Until" timestamp={_.max(_.map(rule.silencedBy, 'endsAt'))} />;
  }
  return null;
};

const SilenceAlert: React.FC<SilenceAlertProps> = ({ rule }) => {
  const [isChecked, setIsChecked] = React.useState(rule.state !== RuleStates.Silenced);
  const [ruleState] = React.useState(rule);
  React.useEffect(() => setIsChecked(ruleState.state !== RuleStates.Silenced), [ruleState]);

  const handleChange = (checked: boolean) => {
    if (checked) {
      _.each(rule.silencedBy, (silence) => {
        coFetchJSON.delete(`${alertManagerBaseURL}/api/v2/silence/${silence.id}`);
      });
    }
    setIsChecked(checked);
  };

  return (
    <Switch
      aria-label="Silence switch"
      className="odc-silence-alert"
      label={null}
      labelOff={
        rule.state === RuleStates.Silenced ? (
          <SilenceUntil rule={rule} />
        ) : (
          <SilenceDurationDropDown rule={rule} />
        )
      }
      isChecked={isChecked}
      onChange={handleChange}
    />
  );
};

export default SilenceAlert;
