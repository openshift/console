import * as React from 'react';

import { CPU_DESC, MEMORY_DESC, STORAGE_DESC, NETWORK_DESC } from './strings';
import { Humanize, humanizeBinaryBytesWithoutB, humanizeDecimalBytesPerSec, humanizeSeconds } from '../../utils';
import { MetricType } from './metric-type';

export const metricTypeMap: MetricTypeMap = {
  [MetricType.CPU]: {
    description: CPU_DESC,
    humanize: humanizeSeconds,
  },
  [MetricType.MEMORY]: {
    description: MEMORY_DESC,
    humanize: humanizeBinaryBytesWithoutB,
  },
  [MetricType.STORAGE]: {
    description: STORAGE_DESC,
    humanize: humanizeSeconds,
  },
  [MetricType.NETWORK]: {
    description: NETWORK_DESC,
    humanize: humanizeDecimalBytesPerSec,
  },
};

export const ConsumersFilter: React.FC<ConsumersFilterProps> = ({ children }) =>
  <div className="co-consumers-card__filters">{children}</div>;

type ConsumersFilterProps = {
  children: React.ReactNode;
};

type MetricTypeMap = {
  [key: string]: {
    description: string,
    humanize: Humanize,
  },
};
