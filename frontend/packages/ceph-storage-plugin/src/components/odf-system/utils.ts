import * as _ from 'lodash';
import {
  HumanizeResult,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/module/k8s';
import { StorageSystemKind } from '../../types';
import {
  humanizeIOPS,
  humanizeLatency,
} from '../dashboards/persistent-internal/utilization-card/utils';

// Operator uses`<kind>.<apiGroup>/<apiVersion>`
export const getGVK = (label: string) => {
  const kind = label.slice(0, label.indexOf('.'));
  const apiGroup = label.slice(label.indexOf('.') + 1, label.indexOf('/'));
  const apiVersion = label.slice(label.indexOf('/') + 1, label.length);
  return { kind, apiGroup, apiVersion };
};

type SystemMetrics = {
  [systeName: string]: {
    rawCapacity: HumanizeResult;
    usedCapacity: HumanizeResult;
    iops: HumanizeResult;
    throughput: HumanizeResult;
    latency: HumanizeResult;
    health: string;
  };
};

type MetricNormalize = (
  systems: StorageSystemKind[],
  latency: PrometheusResponse,
  throughput: PrometheusResponse,
  rawCapacity: PrometheusResponse,
  usedCapacity: PrometheusResponse,
  iops: PrometheusResponse,
  healthData: PrometheusResponse,
) => SystemMetrics;

export const normalizeMetrics: MetricNormalize = (
  systems,
  latency,
  throughput,
  rawCapacity,
  usedCapacity,
  iops,
  healthData,
) => {
  if (
    _.isEmpty(systems) ||
    !latency ||
    !throughput ||
    !rawCapacity ||
    !usedCapacity ||
    !iops ||
    !healthData
  ) {
    return {};
  }
  return systems.reduce<SystemMetrics>((acc, curr) => {
    acc[curr.metadata.name] = {
      rawCapacity: humanizeBinaryBytes(
        rawCapacity.data.result.find((item) => item?.metric?.managedBy === curr.spec.name)
          ?.value?.[1],
      ),
      usedCapacity: humanizeBinaryBytes(
        usedCapacity.data.result.find((item) => item?.metric?.managedBy === curr.spec.name)
          ?.value?.[1],
      ),
      iops: humanizeIOPS(
        iops.data.result.find((item) => item?.metric?.managedBy === curr.spec.name)?.value?.[1],
      ),
      throughput: humanizeDecimalBytesPerSec(
        throughput.data.result.find((item) => item?.metric?.managedBy === curr.spec.name)
          ?.value?.[1],
      ),
      latency: humanizeLatency(
        latency.data.result.find((item) => item?.metric?.managedBy === curr.spec.name)?.value?.[1],
      ),
      health: healthData.data.result.find(
        (item) => item?.metric?.storage_system === curr.metadata.name,
      )?.value?.[1],
    };
    return acc;
  }, {});
};

export const healthStateMap = (state: string) => {
  switch (state) {
    case '0':
      return 'Ready';
    case '1':
      return 'Warning';
    case '2':
      return 'Error';
    default:
      return null;
  }
};
