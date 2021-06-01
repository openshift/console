import * as React from 'react';

export const useDateRange = (duration: number): [Date, Date, (date: Date) => void] => {
  const [endDate, setEndDate] = React.useState<Date>();
  const [startDate, setStartDate] = React.useState<Date>();
  const updateEndDate = React.useCallback(
    (newEndDate: Date) => {
      if (!endDate || newEndDate > endDate) {
        setEndDate(newEndDate);
        setStartDate(new Date(newEndDate.getTime() - duration));
      }
    },
    [duration, endDate],
  );
  React.useEffect(() => endDate && setStartDate(new Date(endDate.getTime() - duration)), [
    duration,
    endDate,
  ]);
  return [startDate, endDate, updateEndDate];
};
