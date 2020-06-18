import * as React from 'react';
import * as _ from 'lodash';
import { Switch } from '@patternfly/react-core';
import { Rule } from '@console/internal/components/monitoring/types';
import { RuleStates } from '@console/internal/reducers/monitoring';
import { StateTimestamp } from '@console/internal/components/monitoring/alerting';
import SilenceDurationDropDown from './SilenceDurationDropdown';
import './SilenceAlert.scss';

type SilenceAlertProps = {
  rule: Rule;
  namespace: string;
};

const SilenceUntil = ({ rule }) => {
  if (alert && !_.isEmpty(rule.silencedBy)) {
    return <StateTimestamp text="Until" timestamp={_.max(_.map(rule.silencedBy, 'endsAt'))} />;
  }
  return null;
};

const SilenceAlert: React.FC<SilenceAlertProps> = ({ rule, namespace }) => {
  const [isChecked, setIsChecked] = React.useState(true);
  React.useEffect(
    () => (rule.state === RuleStates.Silenced ? setIsChecked(false) : setIsChecked(true)),
    [rule],
  );

  const handleChange = (checked: boolean) => {
    setIsChecked(checked);
  };

  return (
    <Switch
      aria-label="Silence switch"
      className="odc-silence-alert"
      label="On"
      labelOff={
        rule.state === RuleStates.Silenced ? (
          <SilenceUntil rule={rule} />
        ) : (
          <SilenceDurationDropDown rule={rule} namespace={namespace} />
        )
      }
      isChecked={isChecked}
      onChange={handleChange}
    />
  );
};

export default SilenceAlert;
