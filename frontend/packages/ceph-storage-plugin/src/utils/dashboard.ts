import { PrometheusResponse } from '@console/internal/components/graphs';

export const getGaugeValue = (response: PrometheusResponse) =>
  response?.data?.result?.[0]?.value?.[1];

export const getResiliencyProgress = (results: PrometheusResponse): number => {
  /**
   * Possible values for progress:
   *   - A float value of String type
   *   - 'NaN'
   *   - undefined
   */
  const progress: string = getGaugeValue(results);
  return parseFloat(progress);
};
