import * as _ from 'lodash';
import { DataPoint } from '@console/internal/components/graphs';
import {
  Humanize,
  humanizeNumber,
  humanizeSeconds,
  secondsToNanoSeconds,
} from '@console/internal/components/utils';

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
  const humanizedTime = humanizeSeconds(secondsToNanoSeconds(value), null, 'ms');
  return humanizedTime;
};

export const getLatestValue = (stats: DataPoint[] = []) =>
  Number(_.get(stats[stats.length - 1], 'y'));
