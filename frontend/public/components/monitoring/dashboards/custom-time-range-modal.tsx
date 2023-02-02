import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  DatePicker,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  TimePicker,
} from '@patternfly/react-core';

import { dashboardsSetEndTime, dashboardsSetTimespan } from '../../../actions/observe';
import { RootState } from '../../../redux';
import { setQueryArguments } from '../../utils';

const zeroPad = (number: number) => (number < 10 ? `0${number}` : number);

// Get YYYY-MM-DD date string for a date object
const toISODateString = (date: Date): string =>
  `${date.getFullYear()}-${zeroPad(date.getMonth() + 1)}-${zeroPad(date.getDate())}`;

// Get HH:MM time string for a date object
const toISOTimeString = (date: Date): string =>
  new Intl.DateTimeFormat(
    'en',
    // TODO: TypeScript 3 doesn't allow the `hourCycle` attribute so use "as any" until we upgrade
    { hour: 'numeric', minute: 'numeric', hourCycle: 'h23' } as any,
  ).format(date);

type CustomTimeRangeModalProps = {
  activePerspective: string;
  isOpen: boolean;
  setClosed: () => void;
};

const CustomTimeRangeModal: React.FC<CustomTimeRangeModalProps> = ({
  activePerspective,
  isOpen,
  setClosed,
}) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const endTime = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', activePerspective, 'endTime']),
  );
  const timespan = useSelector(({ observe }: RootState) =>
    observe.getIn(['dashboards', activePerspective, 'timespan']),
  );

  // If a time is already set in Redux, default to that, otherwise default to a time range that
  // covers all of today
  const now = new Date();
  const defaultFrom = endTime && timespan ? new Date(endTime - timespan) : undefined;
  const [fromDate, setFromDate] = React.useState(toISODateString(defaultFrom ?? now));
  const [fromTime, setFromTime] = React.useState(
    defaultFrom ? toISOTimeString(defaultFrom) : '00:00',
  );
  const [toDate, setToDate] = React.useState(toISODateString(endTime ? new Date(endTime) : now));
  const [toTime, setToTime] = React.useState(
    endTime ? toISOTimeString(new Date(endTime)) : '23:59',
  );

  const submit: React.MouseEventHandler<HTMLButtonElement> = () => {
    const from = Date.parse(`${fromDate} ${fromTime}`);
    const to = Date.parse(`${toDate} ${toTime}`);
    if (_.isInteger(from) && _.isInteger(to)) {
      dispatch(dashboardsSetEndTime(to, activePerspective));
      dispatch(dashboardsSetTimespan(to - from, activePerspective));
      setQueryArguments({
        endTime: to.toString(),
        timeRange: (to - from).toString(),
      });
      setClosed();
    }
  };

  return (
    <Modal
      hasNoBodyWrapper
      isOpen={isOpen}
      position="top"
      showClose={false}
      title={t('public~Custom time range')}
      variant={ModalVariant.small}
    >
      <Flex className="custom-time-range-modal" direction={{ default: 'column' }}>
        <FlexItem spacer={{ default: 'spacerNone' }}>
          <label>{t('public~From')}</label>
        </FlexItem>
        <Flex>
          <FlexItem>
            <DatePicker onChange={(event, str) => setFromDate(str)} value={fromDate} />
          </FlexItem>
          <FlexItem>
            <TimePicker is24Hour onChange={(event, text) => setFromTime(text)} time={fromTime} />
          </FlexItem>
        </Flex>
        <FlexItem spacer={{ default: 'spacerNone' }}>
          <label>{t('public~To')}</label>
        </FlexItem>
        <Flex>
          <FlexItem>
            <DatePicker onChange={(event, str) => setToDate(str)} value={toDate} />
          </FlexItem>
          <FlexItem>
            <TimePicker is24Hour onChange={(event, text) => setToTime(text)} time={toTime} />
          </FlexItem>
        </Flex>
        <Flex className="custom-time-range-modal-footer">
          <FlexItem align={{ default: 'alignRight' }}>
            <Button variant="secondary" onClick={setClosed}>
              {t('public~Cancel')}
            </Button>
          </FlexItem>
          <FlexItem>
            <Button variant="primary" onClick={submit}>
              {t('public~Save')}
            </Button>
          </FlexItem>
        </Flex>
      </Flex>
    </Modal>
  );
};

export default CustomTimeRangeModal;
