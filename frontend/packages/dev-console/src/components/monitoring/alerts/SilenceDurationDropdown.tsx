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
  namespace: string;
};

const SILENCE_FOR = 'Silence for ';
const durations = [SILENCE_FOR, '30m', '1h', '2h', '6h', '12h', '1d', '2d', '1w'];
const durationItems = _.zipObject(durations, durations);
const { alertManagerBaseURL } = window.SERVER_FLAGS;

const SilenceDurationDropDown: React.FC<SilenceDurationDropDownProps> = ({ rule, namespace }) => {
  const createdBy = useSelector((state: RootState) => state.UI.get('user')?.metadata?.name);

  const matchers = [
    {
      isRegex: false,
      name: 'alertname',
      value: rule.name,
    },
    {
      isRegex: false,
      name: 'namespace',
      value: namespace,
    },
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

    coFetchJSON.post(`${alertManagerBaseURL}/api/v2/silences`, payload);
  };

  return (
    <Dropdown
      dropDownClassName="dropdown--full-width"
      items={durationItems}
      onChange={(v: string) => setDuration(v)}
      selectedKey={SILENCE_FOR}
    />
  );
};

export default SilenceDurationDropDown;
