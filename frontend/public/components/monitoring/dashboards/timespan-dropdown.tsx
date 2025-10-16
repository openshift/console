import * as _ from 'lodash';
import {
  formatPrometheusDuration,
  parsePrometheusDuration,
} from '@openshift-console/plugin-shared/src/datetime/prometheus';
import {
  Dropdown as DropdownDeprecated,
  DropdownToggle as DropdownToggleDeprecated,
  DropdownItem as DropdownItemDeprecated,
} from '@patternfly/react-core/deprecated';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import { dashboardsSetEndTime, dashboardsSetTimespan } from '../../../actions/observe';
import { RootState } from '../../../redux';
import { getQueryArgument, removeQueryArgument, setQueryArgument } from '../../utils';
import { useBoolean } from '../hooks/useBoolean';
import CustomTimeRangeModal from './custom-time-range-modal';

const CUSTOM_TIME_RANGE_KEY = 'CUSTOM_TIME_RANGE_KEY';

const TimespanDropdown: React.FC = () => {
  const { t } = useTranslation();

  const [isOpen, toggleIsOpen, , setClosed] = useBoolean(false);
  const [isModalOpen, , setModalOpen, setModalClosed] = useBoolean(false);

  const timespan = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', 'dev', 'timespan']),
  );
  const endTime = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', 'dev', 'endTime']),
  );

  const timeSpanFromParams = getQueryArgument('timeRange');
  const endTimeFromParams = getQueryArgument('endTime');

  const dispatch = useDispatch();
  const onChange = React.useCallback(
    (v: string) => {
      if (v === CUSTOM_TIME_RANGE_KEY) {
        setModalOpen();
      } else {
        setQueryArgument('timeRange', parsePrometheusDuration(v).toString());
        removeQueryArgument('endTime');
        dispatch(dashboardsSetTimespan(parsePrometheusDuration(v), 'dev'));
        dispatch(dashboardsSetEndTime(null, 'dev'));
      }
    },
    [dispatch, setModalOpen],
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
    <>
      <CustomTimeRangeModal isOpen={isModalOpen} setClosed={setModalClosed} />
      <div className="form-group monitoring-dashboards__dropdown-wrap">
        <label
          className="monitoring-dashboards__dropdown-title"
          htmlFor="monitoring-time-range-dropdown"
        >
          {t('public~Time range')}
        </label>
        <DropdownDeprecated
          className="monitoring-dashboards__variable-dropdown"
          dropdownItems={_.map(items, (name, key) => (
            <DropdownItemDeprecated component="button" key={key} onClick={() => onChange(key)}>
              {name}
            </DropdownItemDeprecated>
          ))}
          isOpen={isOpen}
          onSelect={setClosed}
          toggle={
            <DropdownToggleDeprecated
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
            </DropdownToggleDeprecated>
          }
        />
      </div>
    </>
  );
};

export default TimespanDropdown;
