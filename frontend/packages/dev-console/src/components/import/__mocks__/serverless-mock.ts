import { ServerlessData } from '../import-types';

export const serverlessInitialValues: ServerlessData = {
  scaling: {
    minpods: '',
    maxpods: '',
    concurrencytarget: '',
    concurrencylimit: '',
    autoscale: {
      autoscalewindow: '',
      autoscalewindowUnit: 's',
      defaultAutoscalewindowUnit: 's',
    },
    concurrencyutilization: '',
  },
  domainMapping: [],
};
