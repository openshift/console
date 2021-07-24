import { HumanizeResult } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/module/k8s';

// Operator uses`<kind>.<apiGroup>/<apiVersion>`
export const getGVK = (label: string) => {
  const kind = label.slice(0, label.indexOf('.'));
  const apiGroup = label.slice(label.indexOf('.') + 1, label.indexOf('/'));
  const apiVersion = label.slice(label.indexOf('/') + 1, label.length);
  return { kind, apiGroup, apiVersion };
};

export type SystemMetrics = {
  metrics: {
    [systeName: string]: {
      rawCapacity: HumanizeResult;
      usedCapacity: HumanizeResult;
      iops: HumanizeResult;
      throughput: HumanizeResult;
      latency: HumanizeResult;
    };
  };
};

type MetricNormalize = (
  latency: PrometheusResponse,
  throughput: PrometheusResponse,
  rawCapacity: PrometheusResponse,
  usedCapacity: PrometheusResponse,
  iops: PrometheusResponse,
) => SystemMetrics['metrics'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const normalizeMetrics: MetricNormalize = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _latency,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _throughput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rawCapacity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _usedCapacity,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _iops,
) => {
  // Todo(bipuladh): Add parsing logic for above items
  return {
    metrics: {} as any,
  };
};
