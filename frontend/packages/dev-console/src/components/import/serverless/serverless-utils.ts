import { AutoscaleWindowType } from '../import-types';

export const getAutoscaleWindow = (autoscaleValue: string): AutoscaleWindowType => {
  const windowRegEx = /^[0-9]+|[a-zA-Z]*/g;
  const [val, unit] = autoscaleValue?.match(windowRegEx);
  return {
    autoscalewindow: Number(val) || '',
    autoscalewindowUnit: unit || 's',
    defaultAutoscalewindowUnit: unit || 's',
  };
};
