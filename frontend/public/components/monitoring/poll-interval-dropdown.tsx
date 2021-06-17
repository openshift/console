import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { formatPrometheusDuration, parsePrometheusDuration } from '../utils/datetime';
import { useBoolean } from './hooks/useBoolean';

const OFF_KEY = 'OFF_KEY';

type Props = {
  interval: number;
  setInterval: (v: number) => void;
  id?: string;
};

const IntervalDropdown: React.FC<Props> = ({ id, interval, setInterval }) => {
  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);
  const { t } = useTranslation();

  const onChange = React.useCallback(
    (v: string) => setInterval(v === OFF_KEY ? null : parsePrometheusDuration(v)),
    [setInterval],
  );

  const intervalOptions = {
    [OFF_KEY]: t('public~Refresh off'),
    '15s': t('public~{{count}} second', { count: 15 }),
    '30s': t('public~{{count}} second', { count: 30 }),
    '1m': t('public~{{count}} minute', { count: 1 }),
    '5m': t('public~{{count}} minute', { count: 5 }),
    '15m': t('public~{{count}} minute', { count: 15 }),
    '30m': t('public~{{count}} minute', { count: 30 }),
    '1h': t('public~{{count}} hour', { count: 1 }),
    '2h': t('public~{{count}} hour', { count: 2 }),
    '1d': t('public~{{count}} day', { count: 1 }),
  };

  const selectedKey = interval === null ? OFF_KEY : formatPrometheusDuration(interval);

  return (
    <Dropdown
      dropdownItems={_.map(intervalOptions, (name, key) => (
        <DropdownItem component="button" key={key} onClick={() => onChange(key)}>
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={setClosed}
      toggle={
        <DropdownToggle
          className="monitoring-dashboards__dropdown-button"
          id={`${id}-dropdown`}
          onToggle={toggleIsOpen}
        >
          {intervalOptions[selectedKey]}
        </DropdownToggle>
      }
      className="monitoring-dashboards__variable-dropdown"
    />
  );
};

export default IntervalDropdown;
