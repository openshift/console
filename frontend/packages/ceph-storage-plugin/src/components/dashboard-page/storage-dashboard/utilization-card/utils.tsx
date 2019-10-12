import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import { Humanize, humanizeNumber } from '@console/internal/components/utils';

export const humanizeIOPS: Humanize = (value) => {
  const humanizedNumber = humanizeNumber(value);
  const unit = 'IOPS';
  return {
    ...humanizedNumber,
    string: `${humanizedNumber.value} ${unit}`,
    unit,
  };
};

export const humanizeLatency: Humanize = (value) => {
  const humanizedNumber = humanizeNumber(value);
  const unit = 'ms';
  return {
    ...humanizedNumber,
    string: `${humanizedNumber.value} ${unit}`,
    unit,
  };
};

export const getLatestValue = (stats: DataPoint[]) => Number(_.get(stats[stats.length - 1], 'y'));
