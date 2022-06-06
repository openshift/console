import * as React from 'react';
import i18next from 'i18next';
import { BuildRun } from '../../types';

export const getDuration = (seconds: number, long?: boolean): string => {
  if (seconds === 0) {
    return i18next.t('shipwright-plugin~less than a sec');
  }
  let sec = Math.round(seconds);
  let min = 0;
  let hr = 0;
  let duration = '';
  if (sec >= 60) {
    min = Math.floor(sec / 60);
    sec %= 60;
  }
  if (min >= 60) {
    hr = Math.floor(min / 60);
    min %= 60;
  }
  if (hr > 0) {
    duration += long
      ? i18next.t('shipwright-plugin~{{count}} hour', { count: hr })
      : i18next.t('shipwright-plugin~{{hr}}h', { hr });
    duration += ' ';
  }
  if (min > 0) {
    duration += long
      ? i18next.t('shipwright-plugin~{{count}} minute', { count: min })
      : i18next.t('shipwright-plugin~{{min}}m', { min });
    duration += ' ';
  }
  if (sec > 0) {
    duration += long
      ? i18next.t('shipwright-plugin~{{count}} second', { count: sec })
      : i18next.t('shipwright-plugin~{{sec}}s', { sec });
  }

  return duration.trim();
};

export const getBuildRunDurationInSeconds = (buildRun: BuildRun): number | null => {
  const startTime = buildRun?.status?.startTime;
  const completionTime = buildRun?.status?.completionTime;
  if (!startTime) {
    return null;
  }
  const start = new Date(startTime).getTime();
  const end = completionTime ? new Date(completionTime).getTime() : new Date().getTime();
  return (end - start) / 1000;
};

export const getBuildRunDuration = (buildRun: BuildRun): string => {
  const seconds = getBuildRunDurationInSeconds(buildRun);
  if (!seconds) {
    return '-';
  }
  return getDuration(seconds, true);
};

const BuildRunDuration: React.FC<{ buildRun: BuildRun }> = ({ buildRun }) => {
  return <>{getBuildRunDuration(buildRun)}</>;
};

export default BuildRunDuration;
