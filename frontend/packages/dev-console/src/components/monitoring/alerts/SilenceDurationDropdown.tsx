import * as React from 'react';
import * as _ from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { Dropdown } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { parsePrometheusDuration } from '@console/internal/components/utils/datetime';
import { coFetchJSON } from '@console/internal/co-fetch';
import { Rule } from '@console/internal/components/monitoring/types';

type SilenceDurationDropDownProps = {
  rule: Rule;
};

const durations = {
  silenceFor: 'Silence for',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

const { alertManagerBaseURL } = window.SERVER_FLAGS;

const SilenceDurationDropDown: React.FC<SilenceDurationDropDownProps> = ({ rule }) => {
  const createdBy = useSelector((state: RootState) => state.UI.get('user')?.metadata?.name);
  const ruleMatchers = _.map(rule?.labels, (value, key) => ({ isRegex: false, name: key, value }));

  const matchers = [
    {
      isRegex: false,
      name: 'alertname',
      value: rule.name,
    },
    ...ruleMatchers,
  ];

  const setDuration = (duration: string) => {
    if (duration !== 'silenceFor') {
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + parsePrometheusDuration(duration));

      const payload = {
        createdBy,
        endsAt: endsAt.toISOString(),
        startsAt: startsAt.toISOString(),
        matchers,
        comment: '',
      };

      coFetchJSON.post(`${alertManagerBaseURL}/api/v2/silences`, payload);
    }
  };

  return (
    <Dropdown
      dropDownClassName="dropdown--full-width"
      items={durations}
      onChange={(v: string) => setDuration(v)}
      selectedKey={'silenceFor'}
    />
  );
};

export default SilenceDurationDropDown;
