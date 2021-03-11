import * as React from 'react';
import { useTranslation } from 'react-i18next';

// duration dropdown 컴포넌트 i18n 적용...

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
  const { t } = useTranslation();
  const durationItems = {
    ['ONE_HR']: t('SINGLE:MSG_OVERVIEW_MAIN_CARDCLUSTERUTILIZATION_1_1'),
    ['SIX_HR']: t('SINGLE:MSG_OVERVIEW_MAIN_CARDCLUSTERUTILIZATION_6_1'),
    ['TWENTY_FOUR_HR']: t('SINGLE:MSG_OVERVIEW_MAIN_CARDCLUSTERUTILIZATION_24_1'),
  };

  const [duration, setDuration] = React.useState(durationItems['ONE_HR']);
  const setMetricDuration = React.useCallback(d => setDuration(durationItems[d]), [setDuration]);
  return [duration, setMetricDuration];
};

type MetricDuration = [string, (duration: string) => void];
