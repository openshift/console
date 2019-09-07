import * as _ from 'lodash';
import {
  Humanize,
  humanizeBinaryBytesWithoutB,
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
    if (!name) val = x; // For Egress having the legends name = providers/accounts name
    return {
      name: val,
      x: _.truncate(x, { length: 18 }),
      y: Number(humanize(y, unit).value),
    };
  });
};

export const getLegendData: GetLegendData = (response, humanize) => {
  const value = _.get(response, 'data.result[0].value[1]', null);
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
      max = getMaxVal(result.logicalUsage, humanizeBinaryBytesWithoutB);
      chartData = [
        getChartData(
          result.logicalUsage,
          metric,
          humanizeBinaryBytesWithoutB,
          max.unit,
          'Total Logical Used Capacity',
        ),
      ];
      legendData = [
        {
          name: `Total Logical Used Capacity ${getLegendData(
            result.totalLogicalUsage,
            humanizeBinaryBytesWithoutB,
          )}`,
        },
      ];
      break;
    case 'PROVIDERS_BY_PHYSICAL_VS_LOGICAL_USAGE':
      firstBarMax = getMaxVal(result.physicalUsage, humanizeBinaryBytesWithoutB);
      secondBarMax = getMaxVal(result.logicalUsage, humanizeBinaryBytesWithoutB);
      max = firstBarMax.value > secondBarMax.value ? firstBarMax : secondBarMax;
      chartData = [
        getChartData(
          result.physicalUsage,
          metric,
          humanizeBinaryBytesWithoutB,
          max.unit,
          'Total Logical Used Capacity',
        ),
        getChartData(
          result.logicalUsage,
          metric,
          humanizeBinaryBytesWithoutB,
          max.unit,
          'Total Physical Used Capacity',
        ),
      ];
      legendData = [
        {
          name: `Total Logical Used Capacity ${getLegendData(
            result.totalPhysicalUsage,
            humanizeBinaryBytesWithoutB,
          )}`,
        },
        {
          name: `Total Physical Used Capacity ${getLegendData(
            result.totalLogicalUsage,
            humanizeBinaryBytesWithoutB,
          )}`,
        },
      ];
      break;
    case 'PROVIDERS_BY_EGRESS':
      max = getMaxVal(result.egress, humanizeBinaryBytesWithoutB);
      chartData = [getChartData(result.egress, metric, humanizeBinaryBytesWithoutB, max.unit)];
      legendData = chartData[0].map((dataPoint) => ({
        name: `${dataPoint.x} ${humanizeBinaryBytesWithoutB(dataPoint.y).string}`,
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

type ChartData = [ChartDataPoint[]] | [ChartDataPoint[], ChartDataPoint[]];

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
