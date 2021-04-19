import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';

import { DatePicker, TimePicker } from '@patternfly/react-core';

import {
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetTimespan,
} from '../../../actions/ui';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../../factory/modal';
import { dateFormatter } from '../../utils/datetime';

// Get YYYY-MM-DD date string for a date object
const toISODate = (date: Date): string => date.toISOString().split('T')[0];

const CustomTimeRangeModal = ({ cancel, close }: ModalComponentProps) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();

  // Default to a time range that covers all of today
  const now = new Date();
  const [fromDate, setFromDate] = React.useState(now);
  const [fromTime, setFromTime] = React.useState('00:00');
  const [toDate, setToDate] = React.useState(now);
  const [toTime, setToTime] = React.useState('23:59');

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const from = Date.parse(`${toISODate(fromDate)} ${fromTime}`);
    const to = Date.parse(`${toISODate(toDate)} ${toTime}`);
    dispatch(monitoringDashboardsSetEndTime(to));
    dispatch(monitoringDashboardsSetTimespan(to - from));
    close();
  };

  return (
    <form onSubmit={submit} name="form" className="modal-content modal-content--no-inner-scroll">
      <ModalTitle>{t('public~Custom time range')}</ModalTitle>
      <ModalBody>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label>{t('public~From')}</label>
          </div>
          <div className="col-sm-4">
            <DatePicker
              onChange={(str, date) => setFromDate(date)}
              value={dateFormatter.format(fromDate)}
            />
          </div>
          <div className="col-sm-4">
            <TimePicker is24Hour onChange={setFromTime} time={fromTime} />
          </div>
        </div>
        <div className="row co-m-form-row">
          <div className="col-sm-12">
            <label>{t('public~To')}</label>
          </div>
          <div className="col-sm-4">
            <DatePicker
              onChange={(str, date) => setToDate(date)}
              value={dateFormatter.format(toDate)}
            />
          </div>
          <div className="col-sm-4">
            <TimePicker is24Hour onChange={setToTime} time={toTime} />
          </div>
        </div>
      </ModalBody>
      <ModalSubmitFooter cancel={cancel} inProgress={false} submitText={t('public~Save')} />
    </form>
  );
};

export default createModalLauncher(CustomTimeRangeModal);
