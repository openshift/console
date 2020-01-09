import * as React from 'react';

export enum Duration {
  ONE_HR = '1 Hour',
  SIX_HR = '6 Hours',
  TWENTY_FOUR_HR = '24 Hours',
}

const ONE_HOUR = 60 * 60 * 1000;

export const UTILIZATION_QUERY_HOUR_MAP = {
  [Duration.ONE_HR]: ONE_HOUR,
  [Duration.SIX_HR]: 6 * ONE_HOUR,
  [Duration.TWENTY_FOUR_HR]: 24 * ONE_HOUR,
};

export const useMetricDuration = (): MetricDuration => {
  const [duration, setDuration] = React.useState(Duration.ONE_HR);
  const setMetricDuration = React.useCallback((d: Duration) => setDuration(Duration[d]), [
    setDuration,
  ]);
  return [duration, setMetricDuration];
};

type MetricDuration = [Duration, (duration: Duration) => void];
