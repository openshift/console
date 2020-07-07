import * as React from 'react';

import { Dropdown } from '../utils/dropdown';
import { formatPrometheusDuration, parsePrometheusDuration } from '../utils/datetime';

const OFF_KEY = 'OFF_KEY';
const intervalOptions = {
  [OFF_KEY]: 'Refresh Off',
  '15s': '15 seconds',
  '30s': '30 seconds',
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '30m': '30 minutes',
  '1h': '1 hour',
  '2h': '2 hours',
  '1d': '1 day',
};

type Props = {
  interval: number;
  setInterval: (v: number) => never;
};

const IntervalDropdown: React.FC<Props> = ({ interval, setInterval }) => {
  const onChange = React.useCallback(
    (v: string) => setInterval(v === OFF_KEY ? null : parsePrometheusDuration(v)),
    [setInterval],
  );

  return (
    <Dropdown
      items={intervalOptions}
      onChange={onChange}
      selectedKey={interval === null ? OFF_KEY : formatPrometheusDuration(interval)}
    />
  );
};

export default IntervalDropdown;
