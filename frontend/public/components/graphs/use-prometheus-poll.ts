/* eslint-disable react-hooks/exhaustive-deps */
import * as _ from 'lodash-es';
import { useEffect, useRef } from 'react';
import { prometheusTenancyBasePath, prometheusBasePath } from '.';
import { coFetchJSON } from '../../co-fetch';
import { useSafetyFirst } from '../safety-first';

// TODO This effect only handles prometheus matrix data. For now,
// area charts are the only component using this, so that's okay, but will need
// to be expanded to handle vector data as well.
export const usePrometheusPoll = ({
  basePath,
  defaultQueryName = '',
  namespace,
  numSamples,
  query,
  timeout,
  timeSpan = 60 * 60 * 1000,
}: PrometheusPollProps ) => {
  const [data, setData] = useSafetyFirst([]);
  const interval = useRef(null);
  useEffect(() => {
    const fetch = () => {
      const end = Date.now();
      const start = end - timeSpan;
      const baseUrl = basePath || (namespace ? prometheusTenancyBasePath : prometheusBasePath);
      const pollFrequency = Math.max(timeSpan / 120, 3000); // Update every 3 seconds at most
      const stepSize = (numSamples ? (timeSpan / numSamples) : pollFrequency) / 1000;
      const timeoutParam = timeout ? `&timeout=${encodeURIComponent(timeout.toString())}` : '';
      const queries = !_.isArray(query) ? [{query, name: defaultQueryName}] : query;
      const promises = queries.map(q => {
        const nsParam = namespace ? `&namespace=${encodeURIComponent(namespace)}` : '';
        const url = `${baseUrl}/api/v1/query_range?query=${encodeURIComponent(q.query)}&start=${start / 1000}&end=${end / 1000}&step=${stepSize}${nsParam}${timeoutParam}`;
        return coFetchJSON(url).then(result => {
          const values = _.get(result, 'data.result[0].values');
          return _.map(values, v => ({
            name: q.name,
            x: new Date(v[0] * 1000),
            y: parseFloat(v[1]),
          }));
        });
      });
      Promise.all(promises)
        .then(d => setData(d))
        /* eslint-disable-next-line no-console */
        .catch(e => console.warn(`Error retrieving Prometheus data: ${e}`))
        .then(() => {
          interval.current = setTimeout(fetch, pollFrequency);
        });
    };

    if (query) {
      fetch();
    }
    return () => {
      clearInterval(interval.current);
    };
  }, [basePath, defaultQueryName, namespace, numSamples, query, timeout, timeSpan]);

  return [data] as [GraphDataPoint[][]];
};

export type PrometheusQuery = {
  name: string;
  query: string;
};

type PrometheusPollProps = {
  basePath?: string;
  defaultQueryName?: string;
  namespace?: string;
  numSamples?: number;
  query: PrometheusQuery[] | string;
  timeout?: number;
  timeSpan?: number;
}

type GraphDataPoint = {
  name?: string;
  x: Date;
  y: number;
};
