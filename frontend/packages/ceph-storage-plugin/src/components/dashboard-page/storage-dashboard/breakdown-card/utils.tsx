import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import { Humanize } from '@console/internal/components/utils';
import { Colors, COLORMAP, OTHER_TOOLTIP } from './consts';

const getTotal = (stats: StackDataPoint[]) =>
  stats.reduce((total, dataPoint) => total + dataPoint.y, 0);

const addOthers = (
  stats: StackDataPoint[],
  metricTotal: string,
  humanize: Humanize,
): StackDataPoint => {
  const top5Total = getTotal(stats);
  const others = Number(metricTotal) - top5Total;
  const othersData = {
    x: '0',
    y: others,
    name: 'Other',
    color: Colors.OTHER,
    label: humanize(others).string,
    fill: 'rgb(96, 98, 103)',
    link: OTHER_TOOLTIP,
    id: 6,
    ns: '',
  };
  return othersData;
};

export const addAvailable = (
  stats: StackDataPoint[],
  capacityTotal: string,
  capacityUsed: string,
  metricTotal: string,
  humanize: Humanize,
) => {
  let othersData: StackDataPoint;
  let availableData: StackDataPoint;
  let newChartData: StackDataPoint[] = [...stats];
  if (stats.length === 5) {
    othersData = addOthers(stats, metricTotal, humanize);
    newChartData = [...stats, othersData] as StackDataPoint[];
  }
  if (capacityTotal) {
    const availableInBytes = Number(capacityTotal) - Number(capacityUsed);
    availableData = {
      x: '0',
      y: availableInBytes,
      name: 'Available',
      link: '',
      color: '',
      label: humanize(availableInBytes).string,
      fill: '#b8bbbe',
      id: 7,
      ns: '',
    };
    newChartData = [...newChartData, availableData] as StackDataPoint[];
  }
  return newChartData;
};

export const getLegends = (data: StackDataPoint[]) =>
  data.map((d: StackDataPoint) => ({
    name: d.name || d.label,
    labels: { fill: d.color },
    symbol: { fill: d.fill },
    link: d.link,
    ns: d.ns,
  }));

export const getBarRadius = (index: number, length: number) => {
  if (index === length - 1) {
    return {
      bottom: 3,
      top: 3,
    };
  }
  if (index === 0) {
    return { bottom: 3 };
  }
  return {};
};

export const sortInstantVectorStats = (stats: DataPoint[]): DataPoint[] => {
  stats.sort((a, b) => {
    const y1 = a.y;
    const y2 = b.y;
    if (y1 === y2) {
      const x1 = a.x;
      const x2 = b.x;
      return x1 < x2 ? -1 : x1 > x2 ? 1 : 0;
    }
    return y2 - y1;
  });
  return stats.length === 6 ? stats.splice(0, 5) : stats;
};

export const getStackChartStats: GetStackStats = (response, humanize) =>
  response.map((r, i) => {
    const capacity = humanize(r.y).string;
    return {
      // x value needs to be same for single bar stack chart
      x: '0',
      y: r.y,
      name: _.truncate(`${r.x}`, { length: 12 }),
      link: `${r.x}`,
      color: Colors.LINK,
      fill: COLORMAP[i],
      label: capacity,
      id: i,
      ns: r.metric.namespace,
    };
  });

type GetStackStats = (response: DataPoint[], humanize: Humanize) => StackDataPoint[];

export type StackDataPoint = DataPoint<string> & {
  name: string;
  link: string;
  color: string;
  fill: string;
  id: number;
  ns: string;
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
