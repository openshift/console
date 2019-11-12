export const ONE_HR = '1 Hour';
export const SIX_HR = '6 Hours';
export const TWENTY_FOUR_HR = '24 Hours';

const ONE_HOUR = 60 * 60 * 1000;

export const UTILIZATION_QUERY_HOUR_MAP = {
  [ONE_HR]: ONE_HOUR,
  [SIX_HR]: 6 * ONE_HOUR,
  [TWENTY_FOUR_HR]: 24 * ONE_HOUR,
};
