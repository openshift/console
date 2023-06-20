import i18next from 'i18next';

export const displayDurationInWords = (start: string, stop: string): string => {
  if (!start) {
    return '-';
  }
  const startTime = new Date(start).getTime();
  const stopTime = stop ? new Date(stop).getTime() : new Date().getTime();
  let duration = Math.round((stopTime - startTime) / 1000);
  const time = [];
  let durationInWords = '';
  while (duration >= 60) {
    time.push(duration % 60);
    duration = Math.floor(duration / 60);
  }
  time.push(duration);
  if (time[2]) {
    durationInWords += `${time[2]} ${
      time[2] > 1 ? i18next.t('public~hours') : i18next.t('public~hour')
    } `;
  }
  if (time[1]) {
    durationInWords += `${time[1]} ${
      time[1] > 1 ? i18next.t('public~minutes') : i18next.t('public~minute')
    } `;
  }
  if (time[0]) {
    durationInWords += `${time[0]} ${
      time[0] > 1 ? i18next.t('public~seconds') : i18next.t('public~second')
    } `;
  }
  return durationInWords.trim();
};
