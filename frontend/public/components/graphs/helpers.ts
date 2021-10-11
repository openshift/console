import * as _ from 'lodash-es';
import {
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from './index';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/internal-types';
export { PrometheusEndpoint };

// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (
  endTime: number = Date.now(),
  samples: number = DEFAULT_PROMETHEUS_SAMPLES,
  timespan: number = DEFAULT_PROMETHEUS_TIMESPAN,
): URLSearchParams => {
  const params = new URLSearchParams();
  params.append('start', `${(endTime - timespan) / 1000}`);
  params.append('end', `${endTime / 1000}`);
  params.append('step', `${timespan / samples / 1000}`);
  return params;
};

const getSearchParams = ({
  endpoint,
  endTime,
  timespan,
  samples,
  ...params
}: PrometheusURLProps): URLSearchParams => {
  const searchParams =
    endpoint === PrometheusEndpoint.QUERY_RANGE
      ? getRangeVectorSearchParams(endTime, samples, timespan)
      : new URLSearchParams();
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()));
  return searchParams;
};

export const getPrometheusURL = (
  props: PrometheusURLProps,
  basePath: string = props.namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH,
): string => {
  if (props.endpoint !== PrometheusEndpoint.RULES && !props.query) {
    return '';
  }
  const params = getSearchParams(props);
  return `${basePath}/${props.endpoint}?${params.toString()}`;
};

type PrometheusURLProps = {
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query?: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
};
