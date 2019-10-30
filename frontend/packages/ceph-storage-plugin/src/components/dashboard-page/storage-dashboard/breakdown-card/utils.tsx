import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import { Humanize } from '@console/internal/components/utils';
import { Colors } from './bar-colors';

const getTotal = (stats: StackDataPoint[]) =>
  stats.reduce((total, dataPoint) => total + dataPoint.y, 0);

const addOthers = (stats: StackDataPoint[], totalUsed: string, humanize: Humanize) => {
  const top5Total = getTotal(stats);
  const others = Number(totalUsed) - top5Total;
  const othersData = {
    x: '',
    y: others,
    name: 'Others',
    color: Colors.OTHER,
    label: humanize(others).string,
    id: 6,
  };
  return othersData;
};

export const addAvailable = (
  stats: StackDataPoint[],
  total: string,
  used: string,
  totalUsed: string,
  humanize: Humanize,
) => {
  const availableInBytes = Number(total) - Number(used);
  let othersData = {};
  if (stats.length === 5) {
    othersData = addOthers(stats, totalUsed, humanize);
  }
  const availableData = {
    x: '',
    y: availableInBytes,
    label: humanize(availableInBytes).string,
    id: 7,
  };
  return _.isEmpty(othersData) ? [...stats, availableData] : [...stats, othersData, availableData];
};

export const getBarRadius = (index: number, length: number) => {
  let barRadius = {};
  if (index === 0) {
    barRadius = { bottom: 3 };
  }
  if (index === length - 1) {
    barRadius = { top: 3 };
  }
  return barRadius;
};

export const isAvailableBar = (index: number, length: number) => {
  let barColor = {};
  if (index === length - 1) {
    barColor = { fill: Colors.AVAILABLE };
  }
  return barColor;
};

export const getStackChartStats: GetStackStats = (response, humanize) =>
  response.map((r, i) => {
    const capacity = humanize(r.y).string;
    return {
      // INFO: x value needs to be same for single bar stack chart
      x: '',
      y: r.y,
      name: _.truncate(`${r.x}`, { length: 12 }),
      link: `${r.x}`,
      color: Colors.LINK,
      label: capacity,
      id: i,
    };
  });

type GetStackStats = (response: DataPoint[], humanize: Humanize) => StackDataPoint[];

export type StackDataPoint = {
  x: string;
  y: number;
  name: string;
  label: string;
  link: string;
  color: string;
  id: number;
};

export const getCapacityValue = (cephUsed: string, cephTotal: string, humanize: Humanize) => {
  const totalFormatted = humanize(cephTotal || 0);
  const usedFormatted = humanize(cephUsed || 0, null, totalFormatted.unit);
  const available = humanize(
    totalFormatted.value - usedFormatted.value,
    totalFormatted.unit,
    totalFormatted.unit,
  );
  return available;
};
