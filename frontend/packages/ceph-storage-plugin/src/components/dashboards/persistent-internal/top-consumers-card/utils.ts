import * as _ from 'lodash';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import {
  PrometheusResult,
  PrometheusResponse,
  DataPoint,
} from '@console/internal/components/graphs';

export const getMetricType: GetMetricType = (resource, metricType) =>
  resource?.metric?.[metricType] ?? '';

export const getGraphVectorStats: GetStats = (response, metricType, unit) => {
  return response.map((r) => {
    const name = getMetricType(r, metricType);
    const truncatedName = _.truncate(name, { length: 40 });
    return r.values.map((arr) => ({
      name: truncatedName,
      x: new Date(arr[0] * 1000),
      y: Number(humanizeBinaryBytes(arr[1], null, unit).value),
    }));
  });
};

export const sortResources: SortResourcesProps = (a, b) => {
  const aVal = a?.values;
  const bVal = b?.values;
  const x: number = parseInt(a?.values?.[aVal.length - 1]?.[1], 10);
  const y: number = parseInt(b?.values?.[bVal.length - 1]?.[1], 10);
  return y - x;
};

type PrometheusMetricResult = {
  metric: { [key: string]: any };
  value?: [number, string | number];
};

type GetStats = (
  response: PrometheusResponse['data']['result'],
  metric?: string,
  unit?: string,
) => DataPoint[][];

type SortResourcesProps = (a: PrometheusResult, b: PrometheusResult) => number;

type GetMetricType = (resources: PrometheusMetricResult, metricType: string) => string;
