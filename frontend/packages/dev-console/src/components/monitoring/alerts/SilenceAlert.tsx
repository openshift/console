import * as React from 'react';
import { Switch } from '@patternfly/react-core';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { Rule, RuleStates } from '@console/dynamic-plugin-sdk';
import { alertingSetRules } from '@console/internal/actions/observe';
import { coFetchJSON } from '@console/internal/co-fetch';
import {
  ALERTMANAGER_TENANCY_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
} from '@console/internal/components/graphs';
import { StateTimestamp } from '@console/internal/components/monitoring/alerting';
import {
  alertingRuleStateOrder,
  getAlertsAndRules,
} from '@console/internal/components/monitoring/utils';
import SilenceDurationDropDown from './SilenceDurationDropdown';

type SilenceAlertProps = {
  rule: Rule;
  namespace: string;
};

const SilenceUntil = ({ rule }) => {
  if (!_.isEmpty(rule.silencedBy)) {
    return (
      <div onClick={(e) => e.preventDefault()} role="presentation">
        <StateTimestamp text="Until" timestamp={_.max(_.map(rule.silencedBy, 'endsAt'))} />
      </div>
    );
  }
  return null;
};

const SilenceAlert: React.FC<SilenceAlertProps> = ({ rule, namespace }) => {
  const [isChecked, setIsChecked] = React.useState(true);
  const [isInprogress, setIsInprogress] = React.useState(false);
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (rule.state === RuleStates.Silenced) {
      setIsChecked(false);
    }
  }, [rule]);

  const handleChange = (checked: boolean) => {
    setIsChecked(checked);
    if (checked) {
      _.each(rule.silencedBy, (silence) => {
        coFetchJSON
          .delete(
            `${ALERTMANAGER_TENANCY_BASE_PATH}/api/v2/silence/${silence.id}?namespace=${namespace}`,
          )
          .then(() => {
            // eslint-disable-next-line promise/no-nesting
            return coFetchJSON(
              `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/rules?namespace=${namespace}`,
            ).then((response) => {
              const thanosAlertsAndRules = getAlertsAndRules(response?.data);
              const sortThanosRules = _.sortBy(thanosAlertsAndRules.rules, alertingRuleStateOrder);
              dispatch(alertingSetRules('devRules', sortThanosRules, 'dev'));
              setIsChecked(true);
            });
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Could not expire silence:', err);
            setIsChecked(false);
          });
      });
    }
  };

  return (
    <Switch
      aria-label="Silence switch"
      className="odc-silence-alert"
      label={null}
      labelOff={
        rule.state === RuleStates.Silenced && !isChecked ? (
          <SilenceUntil rule={rule} />
        ) : (
          <SilenceDurationDropDown
            silenceInProgress={(progress) => setIsInprogress(progress)}
            rule={rule}
            namespace={namespace}
          />
        )
      }
      isDisabled={isInprogress}
      isChecked={isChecked}
      onChange={handleChange}
    />
  );
};

export default SilenceAlert;
