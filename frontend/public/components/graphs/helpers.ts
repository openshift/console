import * as _ from 'lodash-es';

import {PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH} from './index';

export enum PrometheusEndpoint {
  QUERY = 'api/v1/query',
  QUERY_RANGE = 'api/v1/query_range',
}


// Range vector queries require end, start, and step search params
const getRangeVectorSearchParams = (timespan: number, samples: number = 60): URLSearchParams => {
  const now = Date.now();
  const init = timespan ? [
    [ 'end', `${now / 1000}` ],
    [ 'start', `${(now - timespan) / 1000}` ],
    [ 'step', `${timespan / samples / 1000}` ],
  ] : [];
  return new URLSearchParams(init);
};

const getSearchParams = ({endpoint, timespan, samples, ...params}: PrometheusURLProps): URLSearchParams => {
  const searchParams = endpoint === PrometheusEndpoint.QUERY_RANGE ? getRangeVectorSearchParams(timespan, samples) : new URLSearchParams();
  _.each(params, (value, key) => value && searchParams.append(key, value.toString()));
  return searchParams;
};

export const getPrometheusURL = (props: PrometheusURLProps): string => {
  const basePath = props.namespace ? PROMETHEUS_TENANCY_BASE_PATH : PROMETHEUS_BASE_PATH;
  const params = getSearchParams(props);
  return `${basePath}/${props.endpoint}?${params.toString()}`;
};

type PrometheusURLProps = {
  endpoint: PrometheusEndpoint;
  namespace?: string;
  query: string;
  samples: number;
  timeout?: number;
  timespan: number;
};
