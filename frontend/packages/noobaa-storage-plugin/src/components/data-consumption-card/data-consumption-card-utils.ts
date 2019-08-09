import * as _ from 'lodash';
import {
  humanizeDecimalBytes,
  humanizeBinaryBytes,
  humanizeNumber,
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

/* utility function to convert number in words */
export const numberInWords = (n: number): string => {
  const hNumber = humanizeNumber(n);
  // units: ['', 'k', 'm', 'b'],
  const mapToWord: { [k: string]: string } = {
    '': '',
    k: 'thousands',
    m: 'millions',
    b: 'billions',
  };
  return mapToWord[hNumber.unit];
};

/* Chart Data Handlers */

const iopsChartData: GetBarChartData = (data, metricType, readMetric, writeMetric) => {
  const readArr: BarChartData[] = [];
  const writeArr: BarChartData[] = [];
  _.forEach(data, (iops) => {
    const readYAxisValue = Number(getMetric(iops, readMetric));
    const writeYAxisValue = Number(getMetric(iops, writeMetric));
    let humanizedTotal = humanizeDecimalBytes(readYAxisValue);
    const reads: BarChartData = {
      name: 'Total Reads',
      x: getMetric(iops, metricType),
      y: Number(humanizedTotal.value),
      unit: humanizedTotal.unit,
      yOriginal: readYAxisValue,
    };
    humanizedTotal = humanizeDecimalBytes(writeYAxisValue);
    const writes: BarChartData = {
      name: 'Total Writes',
      x: getMetric(iops, metricType),
      y: Number(humanizedTotal.value),
      unit: humanizedTotal.unit,
      yOriginal: writeYAxisValue,
    };
    readArr.push(reads);
    writeArr.push(writes);
  });
  return readArr.length && writeArr.length ? [readArr, writeArr] : [];
};

const accountsLogicalUsageChartData: GetBarChartData = (data, metricType) => {
  const mappedData = data.map((logicalUsage) => {
    const logicalUsageVal = Number(getValue(logicalUsage));
    const humanizedData = humanizeBinaryBytes(logicalUsageVal);
    return {
      name: 'Logical Used Capacity',
      x: getMetric(logicalUsage, metricType),
      y: Number(humanizedData.value),
      unit: humanizedData.unit,
      yOriginal: logicalUsageVal,
    };
  });
  return [mappedData];
};

const providersPhysicalVsLogicalChartData: GetBarChartData = (data) => {
  const readArr: BarChartData[] = [];
  const writeArr: BarChartData[] = [];
  _.forEach(data, (physicalVsLogicalData) => {
    const readYAxisValue = Number(getMetric(physicalVsLogicalData, 'physical_size'));
    const writeYAxisValue = Number(getMetric(physicalVsLogicalData, 'logical_size'));
    let humanizedData = humanizeBinaryBytes(readYAxisValue);
    const reads = {
      name: 'Total Physical',
      x: getMetric(physicalVsLogicalData, 'type'),
      y: Number(humanizedData.value),
      unit: humanizedData.unit,
      yOriginal: readYAxisValue,
    };
    humanizedData = humanizeBinaryBytes(writeYAxisValue);
    const writes = {
      name: 'Total Logical',
      x: getMetric(physicalVsLogicalData, 'type'),
      y: Number(humanizedData.value),
      unit: humanizedData.unit,
      yOriginal: writeYAxisValue,
    };
    readArr.push(reads);
    writeArr.push(writes);
  });
  return readArr.length && writeArr.length ? [readArr, writeArr] : [];
};

const providersEgressChartData: GetBarChartData = (data) => {
  const mappedData: BarChartData[] = data.map((egress) => {
    const egressVal = Number(getValue(egress));
    const humanizedData = humanizeBinaryBytes(egressVal);
    const egressType = getMetric(egress, 'type');
    return {
      name: egressType,
      x: egressType,
      y: Number(humanizedData.value),
      unit: humanizedData.unit,
      yOriginal: egressVal,
    };
  });
  return [mappedData];
};

/* Legends Data Handlers */

const iopsChartLegendData = (data: [BarChartData[], BarChartData[]]) => {
  const totalReads = data[0].reduce(
    (total: number, iops: BarChartData) => total + iops.yOriginal,
    0,
  );
  const totalWrites = data[1].reduce(
    (total: number, iops: BarChartData) => total + iops.yOriginal,
    0,
  );
  const humanizedReads = humanizeNumber(totalReads.toFixed(1));
  const humanizedWrites = humanizeNumber(totalWrites.toFixed(1));
  return [
    { name: `Total Reads ${humanizedReads.string}` },
    { name: `Total Writes ${humanizedWrites.string}` },
  ];
};

const providersPhysicalVsLogicalChartLegendData = (data: [BarChartData[], BarChartData[]]) => {
  const valueL = data[0].reduce(
    (total: number, logical: BarChartData) => total + logical.yOriginal,
    0,
  );
  const valueLH = humanizeBinaryBytes(valueL.toFixed(1));
  const valueP = data[1].reduce(
    (total: number, physical: BarChartData) => total + physical.yOriginal,
    0,
  );
  const valuePH = humanizeBinaryBytes(valueP.toFixed(1));
  return [
    { name: `Total Logical    ${valueLH.string}` },
    { name: `Total Physical   ${valuePH.string}` },
  ];
};

const accountsLogicalUsageChartLegendData = (data: [BarChartData[]]) => {
  const totalLU = data[0].reduce(
    (total: number, logicalUsage: BarChartData) => total + logicalUsage.yOriginal,
    0,
  );
  const totalLUH = humanizeBinaryBytes(totalLU.toFixed(1));
  return [{ name: `Logical Used Capacity ${totalLUH.string}` }];
};

const providersEgressChartLegendData = (data: [BarChartData[]]) => {
  const result = data[0].map((egress: BarChartData) => {
    const totalH = humanizeBinaryBytes(egress.yOriginal.toFixed(1));
    return { name: `${egress.x}  ${totalH.string}` };
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
  unit: string;
  yOriginal: number;
};

export type GetBarChartData = (
  data: PrometheusMetricResult[],
  metricType?: string,
  readMetric?: string,
  writeMetric?: string,
) => [BarChartData[], BarChartData[]] | BarChartData[] | [BarChartData[]];
