import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { DEFAULT_DURATION, DEFAULT_DURATION_KEY } from '../constants';

export const useUtilizationDuration = (
  adjustDuration?: (duration: number) => number,
): UtilizationDurationState => {
  const dispatch = useDispatch();
  const duration =
    useSelector(({ UI }) => UI.getIn(['utilizationDuration', 'duration'])) ?? DEFAULT_DURATION;
  const endDate =
    useSelector(({ UI }) => UI.getIn(['utilizationDuration', 'endDate'])) ?? new Date();
  const selectedKey =
    useSelector(({ UI }) => UI.getIn(['utilizationDuration', 'selectedKey'])) ??
    DEFAULT_DURATION_KEY;
  const startDate = new Date(endDate.getTime() - duration);
  const updateEndDate = React.useCallback(
    (date: Date) => date > endDate && dispatch(UIActions.setUtilizationDurationEndTime(date)),
    [dispatch, endDate],
  );
  const updateDuration = React.useCallback(
    (newDuration: number) =>
      dispatch(UIActions.setUtilizationDuration(adjustDuration?.(newDuration) ?? newDuration)),
    [adjustDuration, dispatch],
  );
  const updateSelectedKey = React.useCallback(
    (key: string) => dispatch(UIActions.setUtilizationDurationSelectedKey(key)),
    [dispatch],
  );

  return {
    duration,
    endDate,
    selectedKey,
    startDate,
    updateDuration,
    updateEndDate,
    updateSelectedKey,
  };
};

type UtilizationDurationState = {
  duration: number;
  endDate: Date;
  selectedKey: string;
  startDate: Date;
  updateDuration: (duration: number) => void;
  updateEndDate: (endDate: Date) => void;
  updateSelectedKey: (key: string) => void;
};
