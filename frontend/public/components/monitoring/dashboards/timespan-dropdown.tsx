import * as _ from 'lodash';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import {
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetTimespan,
} from '../../../actions/ui';
import { RootState } from '../../../redux';
import { getQueryArgument, removeQueryArgument, setQueryArgument } from '../../utils';
import { formatPrometheusDuration, parsePrometheusDuration } from '../../utils/datetime';
import { useBoolean } from '../hooks/useBoolean';
import customTimeRangeModal from './custom-time-range-modal';

const CUSTOM_TIME_RANGE_KEY = 'CUSTOM_TIME_RANGE_KEY';

const TimespanDropdown = () => {
  const { t } = useTranslation();

  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);

  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );
  const endTime = useSelector(({ UI }: RootState) => UI.getIn(['monitoringDashboards', 'endTime']));

  const timeSpanFromParams = getQueryArgument('timeRange');
  const endTimeFromParams = getQueryArgument('endTime');

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    (v: string) => {
      if (v === CUSTOM_TIME_RANGE_KEY) {
        customTimeRangeModal({});
      } else {
        setQueryArgument('timeRange', parsePrometheusDuration(v).toString());
        removeQueryArgument('endTime');
        dispatch(monitoringDashboardsSetTimespan(parsePrometheusDuration(v)));
        dispatch(monitoringDashboardsSetEndTime(null));
      }
    },
    [dispatch],
  );

  const items = {
    [CUSTOM_TIME_RANGE_KEY]: t('public~Custom time range'),
    '5m': t('public~Last {{count}} minute', { count: 5 }),
    '15m': t('public~Last {{count}} minute', { count: 15 }),
    '30m': t('public~Last {{count}} minute', { count: 30 }),
    '1h': t('public~Last {{count}} hour', { count: 1 }),
    '2h': t('public~Last {{count}} hour', { count: 2 }),
    '6h': t('public~Last {{count}} hour', { count: 6 }),
    '12h': t('public~Last {{count}} hour', { count: 12 }),
    '1d': t('public~Last {{count}} day', { count: 1 }),
    '2d': t('public~Last {{count}} day', { count: 2 }),
    '1w': t('public~Last {{count}} week', { count: 1 }),
    '2w': t('public~Last {{count}} week', { count: 2 }),
  };

  return (
    <div className="form-group monitoring-dashboards__dropdown-wrap">
      <label
        className="monitoring-dashboards__dropdown-title"
        htmlFor="monitoring-time-range-dropdown"
      >
        {t('public~Time range')}
      </label>
      <Dropdown
        className="monitoring-dashboards__variable-dropdown"
        dropdownItems={_.map(items, (name, key) => (
          <DropdownItem component="button" key={key} onClick={() => onChange(key)}>
            {name}
          </DropdownItem>
        ))}
        isOpen={isOpen}
        onSelect={setClosed}
        toggle={
          <DropdownToggle
            className="monitoring-dashboards__dropdown-button"
            id="monitoring-time-range-dropdown"
            onToggle={toggleIsOpen}
          >
            {
              items[
                endTime || endTimeFromParams
                  ? CUSTOM_TIME_RANGE_KEY
                  : formatPrometheusDuration(_.toNumber(timeSpanFromParams) || timespan)
              ]
            }
          </DropdownToggle>
        }
      />
    </div>
  );
};

export default TimespanDropdown;
