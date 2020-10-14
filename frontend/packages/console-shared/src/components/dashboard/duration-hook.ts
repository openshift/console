import * as React from 'react';
import { useTranslation } from 'react-i18next';

export enum Duration {
  ONE_HR = '1 Hour',
  SIX_HR = '6 Hours',
  TWENTY_FOUR_HR = '24 Hours',
}

export const TranslatedDuration: React.FC<TranslatedDurationProps> = ({ duration }) => {
  let translatedString;
  const { t } = useTranslation();

  switch (duration) {
    case Duration.ONE_HR:
      translatedString = t('dashboard~1 Hour');
      break;
    case Duration.SIX_HR:
      translatedString = t('dashboard~6 Hours');
      break;
    default:
      translatedString = t('dashboard~24 Hours');
      break;
  }
  return translatedString;
};

type TranslatedDurationProps = {
  duration: Duration;
};

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
