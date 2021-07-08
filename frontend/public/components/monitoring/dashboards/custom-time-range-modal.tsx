import * as _ from 'lodash-es';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch, useSelector } from 'react-redux';

import { DatePicker, TimePicker } from '@patternfly/react-core';

import {
  monitoringDashboardsSetEndTime,
  monitoringDashboardsSetTimespan,
} from '../../../actions/ui';
import { RootState } from '../../../redux';
import {
  createModalLauncher,
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
} from '../../factory/modal';
import { toISODateString, twentyFourHourTime } from '../../utils/datetime';

const CustomTimeRangeModal = ({ cancel, close }: ModalComponentProps) => {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const endTime = useSelector(({ UI }: RootState) => UI.getIn(['monitoringDashboards', 'endTime']));
  const timespan = useSelector(({ UI }: RootState) =>
    UI.getIn(['monitoringDashboards', 'timespan']),
  );

  // If a time is already set in Redux, default to that, otherwise default to a time range that
  // covers all of today
  const now = new Date();
  const defaultFrom = endTime && timespan ? new Date(endTime - timespan) : undefined;
  const [fromDate, setFromDate] = React.useState(toISODateString(defaultFrom ?? now));
  const [fromTime, setFromTime] = React.useState(
    defaultFrom ? twentyFourHourTime(defaultFrom) : '00:00',
  );
  const [toDate, setToDate] = React.useState(toISODateString(endTime ? new Date(endTime) : now));
  const [toTime, setToTime] = React.useState(
    endTime ? twentyFourHourTime(new Date(endTime)) : '23:59',
  );

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const from = Date.parse(`${fromDate} ${fromTime}`);
    const to = Date.parse(`${toDate} ${toTime}`);
    if (_.isInteger(from) && _.isInteger(to)) {
      dispatch(monitoringDashboardsSetEndTime(to));
      dispatch(monitoringDashboardsSetTimespan(to - from));
      close();
    }
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
            <DatePicker onChange={(str) => setFromDate(str)} value={fromDate} />
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
            <DatePicker onChange={(str) => setToDate(str)} value={toDate} />
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
