import i18next from 'i18next';

export const displayDurationInWords = (start: string, stop: string): string => {
  if (!start) {
    return '-';
  }
  const startTime = new Date(start).getTime();
  const stopTime = stop ? new Date(stop).getTime() : new Date().getTime();
  const duration = Math.max(0, Math.round((stopTime - startTime) / 1000));
  if (!Number.isFinite(duration)) {
    return '-';
  }
  const seconds = duration % 60;
  const minutes = Math.floor(duration / 60) % 60;
  const hours = Math.floor(duration / 3600);
  const durationInWords = [];
  if (hours) {
    durationInWords.push(
      `${hours} ${hours > 1 ? i18next.t('public~hours') : i18next.t('public~hour')}`,
    );
  }
  if (minutes) {
    durationInWords.push(
      `${minutes} ${minutes > 1 ? i18next.t('public~minutes') : i18next.t('public~minute')}`,
    );
  }
  if (seconds || !durationInWords.length) {
    durationInWords.push(
      `${seconds} ${seconds === 1 ? i18next.t('public~second') : i18next.t('public~seconds')}`,
    );
  }
  return durationInWords.join(' ');
};

export enum BuildStrategyType {
  Docker = 'Docker',
  Devfile = 'Devfile',
  Custom = 'Custom',
  JenkinsPipeline = 'JenkinsPipeline',
  Source = 'Source',
}

export const getStrategyType = (strategy: BuildStrategyType) => {
  switch (strategy) {
    case BuildStrategyType.Docker:
      return 'dockerStrategy';
    case BuildStrategyType.Devfile:
      return 'devfileStrategy';
    case BuildStrategyType.Custom:
      return 'customStrategy';
    case BuildStrategyType.JenkinsPipeline:
      return 'jenkinsPipelineStrategy';
    case BuildStrategyType.Source:
      return 'sourceStrategy';
    default:
      return null;
  }
};
