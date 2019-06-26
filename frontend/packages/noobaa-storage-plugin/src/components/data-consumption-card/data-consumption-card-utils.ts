import * as _ from 'lodash';
import {
  humanizeBinaryBytesWithoutB,
  humanizeDecimalBytes,
} from '@console/internal/components/utils';
import { getMetric, getValue, PrometheusMetricResult } from '../../utils';
import {
  PROVIDERS,
  ACCOUNTS,
  BY_IOPS,
  BY_LOGICAL_USAGE,
  BY_PHYSICAL_VS_LOGICAL_USAGE,
  BY_EGRESS,
} from '../../constants';

/* Chart Data Handlers */

const iopsChartData: GetBarChartData = (data, metricType, metric1, metric2) => {
  const arr1 = [];
  const arr2 = [];
  _.forEach(data, (iops) => {
    const y1 = getMetric(iops, metric1);
    const y2 = getMetric(iops, metric2);
    const reads = {
      name: 'Total Reads',
      x: getMetric(iops, metricType),
      y: Number(humanizeDecimalBytes(y1).value),
    };
    const writes = {
      name: 'Total Writes',
      x: getMetric(iops, metricType),
      y: Number(humanizeDecimalBytes(y2).value),
    };
    arr1.push(reads);
    arr2.push(writes);
  });
  return arr1.length > 0 && arr2.length > 0 ? [arr1, arr2] : [];
};

const accountsLogicalUsageChartData: GetBarChartData = (data, metricType) => [
  data.map((logicalUsage) => ({
    name: 'Logical Usage',
    x: getMetric(logicalUsage, metricType),
    y: Number(humanizeBinaryBytesWithoutB(Number(getValue(logicalUsage))).value),
  })),
];
const providersPhysicalVsLogicalChartData: GetBarChartData = (data) => {
  const arr1 = [];
  const arr2 = [];
  _.forEach(data, (physicalVsLogicalData) => {
    const y1 = Number(getMetric(physicalVsLogicalData, 'physical_size'));
    const y2 = Number(getMetric(physicalVsLogicalData, 'logical_size'));
    const reads = {
      name: 'Total Physical',
      x: getMetric(physicalVsLogicalData, 'type'),
      y: Number(humanizeDecimalBytes(y1).value),
    };
    const writes = {
      name: 'Total Logical',
      x: getMetric(physicalVsLogicalData, 'type'),
      y: Number(humanizeDecimalBytes(y2).value),
    };
    arr1.push(reads);
    arr2.push(writes);
  });
  return arr1.length > 0 && arr2.length > 0 ? [arr1, arr2] : [];
};

const providersEgressChartData: GetBarChartData = (data) => [
  data.map((egress) => ({
    name: getMetric(egress, 'type'),
    x: getMetric(egress, 'type'),
    y: Number(humanizeBinaryBytesWithoutB(Number(getValue(egress))).value),
  })),
];

/* Legends Data Handlers */

const iopsChartLegendData = (data: [BarChartData[], BarChartData[]]) => {
  const totalReads = data[0].reduce((total: number, iops: BarChartData) => total + iops.y, 0);
  const totalWrites = data[1].reduce((total: number, iops: BarChartData) => total + iops.y, 0);
  return [{ name: `Total Reads ${totalReads}` }, { name: `Total Writes ${totalWrites}` }];
};

const providersPhysicalVsLogicalChartLegendData = (data: [BarChartData[], BarChartData[]]) => {
  const valueL = humanizeBinaryBytesWithoutB(
    data[0].reduce((total: number, logical: BarChartData) => total + logical.y, 0),
  );
  const valueP = humanizeBinaryBytesWithoutB(
    data[1].reduce((total: number, physical: BarChartData) => total + physical.y, 0),
  );
  return [
    { name: `Total Logical ${valueL.value}${valueP.unit}` },
    { name: `Total Physical ${valueP.value}${valueP.unit}` },
  ];
};

const accountsLogicalUsageChartLegendData = (data: [BarChartData[]]) => {
  const { unit, value } = humanizeBinaryBytesWithoutB(
    data[0].reduce((total: number, logicalUsage: BarChartData) => total + logicalUsage.y, 0),
  );
  return [{ name: `Logical usage ${value}${unit}` }];
};

const providersEgressChartLegendData = (data: [BarChartData[]]) => {
  const result = data[0].map((egress: BarChartData) => {
    const { unit, value } = humanizeBinaryBytesWithoutB(egress.y);
    return { name: `${egress.x} ${value}${unit}` };
  });
  return result;
};

export const metricsChartDataMap = {
  [ACCOUNTS]: {
    [BY_IOPS]: (data) => iopsChartData(data, 'account', 'read_count', 'write_count'),
    [BY_LOGICAL_USAGE]: (data) => accountsLogicalUsageChartData(data, 'account'),
  },
  [PROVIDERS]: {
    [BY_IOPS]: (data) => iopsChartData(data, 'type', 'read_count', 'write_count'),
    [BY_PHYSICAL_VS_LOGICAL_USAGE]: (data) => providersPhysicalVsLogicalChartData(data),
    [BY_EGRESS]: (data) => providersEgressChartData(data),
  },
};

export const metricsChartLegendDataMap = {
  [ACCOUNTS]: {
    [BY_IOPS]: (data) => iopsChartLegendData(data),
    [BY_LOGICAL_USAGE]: (data) => accountsLogicalUsageChartLegendData(data),
  },
  [PROVIDERS]: {
    [BY_IOPS]: (data) => iopsChartLegendData(data),
    [BY_PHYSICAL_VS_LOGICAL_USAGE]: (data) => providersPhysicalVsLogicalChartLegendData(data),
    [BY_EGRESS]: (data) => providersEgressChartLegendData(data),
  },
};

export type BarChartData = {
  x: string;
  y: number;
  name: string;
};

export type GetBarChartData = (
  data: PrometheusMetricResult[],
  metricType?: string,
  metric1?: string,
  metric2?: string,
) => [BarChartData[], BarChartData[]] | BarChartData[] | [BarChartData[]];
