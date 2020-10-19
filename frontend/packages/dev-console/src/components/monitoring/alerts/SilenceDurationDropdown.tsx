import * as React from 'react';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import { Dropdown, LoadingInline } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import { coFetchJSON } from '@console/internal/co-fetch';
import {
  AlertStates,
  Rule,
  RuleStates,
  SilenceStates,
} from '@console/internal/components/monitoring/types';
import { ALERT_MANAGER_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { monitoringSetRules } from '@console/internal/actions/ui';
import { isSilenced } from '@console/internal/reducers/monitoring';
import { refreshNotificationPollers } from '@console/internal/components/notification-drawer';
import './SilenceDurationDropdown.scss';

type SilenceDurationDropDownProps = {
  rule: Rule;
  silenceInProgress?: (progress: boolean) => void;
};

const durations = {
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

const SilenceDurationDropDown: React.FC<SilenceDurationDropDownProps> = ({
  rule,
  silenceInProgress,
}) => {
  const [silencing, setSilencing] = React.useState(false);
  const createdBy = useSelector((state: RootState) => state.UI.get('user')?.metadata?.name);
  const rules = useSelector((state: RootState) => state.UI.getIn(['monitoring', 'devRules']));
  const ruleMatchers = _.map(rule?.labels, (value, key) => ({ isRegex: false, name: key, value }));
  const dispatch = useDispatch();

  const matchers = [
    {
      isRegex: false,
      name: 'alertname',
      value: rule.name,
    },
    ...ruleMatchers,
  ];

  const setDuration = (duration: string) => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + parsePrometheusDuration(duration));

    const payload = {
      createdBy,
      endsAt: endsAt.toISOString(),
      startsAt: startsAt.toISOString(),
      matchers,
      comment: '',
    };
    setSilencing(true);
    silenceInProgress && silenceInProgress(true);
    coFetchJSON
      .post(`${ALERT_MANAGER_TENANCY_BASE_PATH}/api/v2/silences`, payload)
      .then(() => {
        // eslint-disable-next-line promise/no-nesting
        return coFetchJSON(`${ALERT_MANAGER_TENANCY_BASE_PATH}/api/v2/silences`).then(
          (silences) => {
            refreshNotificationPollers();
            rule.silencedBy = _.filter(
              silences,
              (s) => s.status.state === SilenceStates.Active && _.some(rule.alerts, isSilenced),
            );
            if (!_.isEmpty(rule.silencedBy)) {
              _.each(rule.alerts, (a) => (a.state = AlertStates.Silenced));
              rule.state = RuleStates.Silenced;
            }
            const ruleIndex = rules.findIndex((r) => r.id === rule.id);
            const updatedRules = _.cloneDeep(rules);
            updatedRules.splice(ruleIndex, 1, rule);
            dispatch(monitoringSetRules('devRules', updatedRules, 'dev'));
            setSilencing(false);
            silenceInProgress && silenceInProgress(false);
          },
        );
      })
      .catch((err) => {
        setSilencing(false);
        silenceInProgress && silenceInProgress(false);
        // eslint-disable-next-line no-console
        console.warn('Could not set silence:', err);
      });
  };

  return (
    <>
      <Dropdown
        dropDownClassName="dropdown--full-width"
        className="odc-silence-duration-dropdown"
        items={durations}
        onChange={(v: string) => setDuration(v)}
        title="Silence for"
      />
      {silencing && <LoadingInline />}
    </>
  );
};

export default SilenceDurationDropDown;
