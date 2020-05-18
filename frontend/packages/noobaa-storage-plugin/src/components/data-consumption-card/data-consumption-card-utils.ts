import * as _ from 'lodash';
import {
  Humanize,
  humanizeBinaryBytes,
  humanizeNumber,
  HumanizeResult,
} from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  ACCOUNTS,
  BY_IOPS,
  BY_LOGICAL_USAGE,
  BY_PHYSICAL_VS_LOGICAL_USAGE,
  BY_EGRESS,
  PROVIDERS,
} from '../../constants';
import { DATA_CONSUMPTION_QUERIES, ObjectServiceDashboardQuery } from '../../constants/queries';
import { getGaugeValue } from '../../utils';

export const DataConsumersValue = {
  [PROVIDERS]: 'PROVIDERS_',
  [ACCOUNTS]: 'ACCOUNTS_',
};
export const DataConsumersSortByValue = {
  [BY_IOPS]: 'BY_IOPS',
  [BY_LOGICAL_USAGE]: 'BY_LOGICAL_USAGE',
  [BY_PHYSICAL_VS_LOGICAL_USAGE]: 'BY_PHYSICAL_VS_LOGICAL_USAGE',
  [BY_EGRESS]: 'BY_EGRESS',
};

/* utility mapper to convert number in words */
export const numberInWords: { [k: string]: string } = {
  '': '',
  k: 'thousands',
  m: 'millions',
  b: 'billions',
};

export const getQueries: GetQueries = (metric, kpi) => {
  const queries =
    DATA_CONSUMPTION_QUERIES[
      ObjectServiceDashboardQuery[DataConsumersValue[metric] + DataConsumersSortByValue[kpi]]
    ];
  const keys = Object.keys(queries);
  return { queries, keys };
};

const getMaxVal: GetMaxVal = (response, humanize) => {
  const result: PrometheusResponse['data']['result'] = _.get(response, 'data.result', []);
  let maxVal = { unit: '', value: 0, string: '' };
  if (result.length) {
    maxVal = humanize(_.maxBy(result, (r) => Number(r.value[1])).value[1]);
  }
  return maxVal;
};

export const getChartData: GetChartData = (response, metric, humanize, unit, name) => {
  const result = _.get(response, 'data.result', []);
  return result.map((r) => {
    const x = _.get(r, ['metric', metric], '');
    const y = parseFloat(_.get(r, 'value[1]'));
    let val = name;
    if (!name) val = x; // For Egress, which have the legend name(name) as providers name(x)
    return {
      name: val,
      x: _.truncate(x, { length: 18 }),
      y: Number(humanize(y, null, unit).value),
    };
  });
};

export const getLegendData: GetLegendData = (response, humanize) => {
  const value = getGaugeValue(response);
  return value ? humanize(value).string : '';
};

export const getDataConsumptionChartData: GetDataConsumptionChartData = (
  result,
  metric,
  dropdownValue,
) => {
  let chartData: ChartData;
  let legendData: LegendData;
  let max: HumanizeResult;
  let firstBarMax: HumanizeResult;
  let secondBarMax: HumanizeResult;
  let nonFormattedData: ChartDataPoint[];
  switch (dropdownValue) {
    case 'PROVIDERS_BY_IOPS':
    case 'ACCOUNTS_BY_IOPS':
      firstBarMax = getMaxVal(result.read, humanizeNumber);
      secondBarMax = getMaxVal(result.write, humanizeNumber);
      max = firstBarMax.value > secondBarMax.value ? firstBarMax : secondBarMax;
      chartData = [
        getChartData(result.read, metric, humanizeNumber, max.unit, 'Total Reads'),
        getChartData(result.write, metric, humanizeNumber, max.unit, 'Total Writes'),
      ];
      legendData = [
        { name: `Total Reads ${getLegendData(result.totalRead, humanizeNumber)}` },
        { name: `Total Writes ${getLegendData(result.totalWrite, humanizeNumber)}` },
      ];
      break;
    case 'ACCOUNTS_BY_LOGICAL_USAGE':
      max = getMaxVal(result.logicalUsage, humanizeBinaryBytes);
      chartData = [
        getChartData(
          result.logicalUsage,
          metric,
          humanizeBinaryBytes,
          max.unit,
          'Total Logical Used Capacity',
        ),
      ];
      legendData = [
        {
          name: `Total Logical Used Capacity ${getLegendData(
            result.totalLogicalUsage,
            humanizeBinaryBytes,
          )}`,
        },
      ];
      break;
    case 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE':
      firstBarMax = getMaxVal(result.physicalUsage, humanizeBinaryBytes);
      secondBarMax = getMaxVal(result.logicalUsage, humanizeBinaryBytes);
      max = firstBarMax.value > secondBarMax.value ? firstBarMax : secondBarMax;
      chartData = [
        getChartData(
          result.logicalUsage,
          metric,
          humanizeBinaryBytes,
          max.unit,
          'Total Logical Used Capacity',
        ),
        getChartData(
          result.physicalUsage,
          metric,
          humanizeBinaryBytes,
          max.unit,
          'Total Physical Used Capacity',
        ),
      ];
      legendData = [
        {
          name: `Total Logical Used Capacity ${getLegendData(
            result.totalLogicalUsage,
            humanizeBinaryBytes,
          )}`,
        },
        {
          name: `Total Physical Used Capacity ${getLegendData(
            result.totalPhysicalUsage,
            humanizeBinaryBytes,
          )}`,
        },
      ];
      break;
    case 'PROVIDERS_BY_EGRESS':
      max = getMaxVal(result.egress, humanizeBinaryBytes);
      nonFormattedData = getChartData(result.egress, metric, humanizeBinaryBytes, max.unit);
      chartData = nonFormattedData.length ? nonFormattedData.map((dataPoint) => [dataPoint]) : [[]];
      legendData = nonFormattedData.map((dataPoint) => ({
        name: `${dataPoint.x.replace(
          /(^[A-Z]|_[A-Z])([A-Z]+)/g,
          (_g, g1, g2) => g1 + g2.toLowerCase(),
        )} ${dataPoint.y} ${max.unit}`,
      }));
      break;
    default:
      chartData = [[{ x: '', y: 0, name: '' }]];
      legendData = [{ name: '' }];
  }
  return { chartData, legendData, max };
};

export type ChartDataPoint = {
  x: string;
  y: number;
  name: string;
};

type ChartData = ChartDataPoint[][];

type LegendData = { name: string }[];

type QueryObject = {
  [key: string]: string;
};

type GetChartData = (
  response: PrometheusResponse,
  metric: string,
  humanize: Humanize,
  maxUnit: string,
  name?: string,
) => ChartDataPoint[];

type GetDataConsumptionChartData = (
  result: { [key: string]: PrometheusResponse },
  metric: string,
  dropdownValue: string,
) => {
  chartData: ChartData;
  legendData: LegendData;
  max: HumanizeResult;
};

type GetQueries = (metric: string, kpi: string) => { queries: QueryObject; keys: string[] };

type GetMaxVal = (response: PrometheusResponse, humanize: Humanize) => HumanizeResult;

type GetLegendData = (response: PrometheusResponse, humanize: Humanize) => string;
