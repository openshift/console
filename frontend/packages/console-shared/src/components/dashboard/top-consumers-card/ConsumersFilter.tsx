import * as React from 'react';
import {
  humanizeSeconds,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils/units';
import { Humanize } from '@console/internal/components/utils/types';
import { CPU_DESC, MEMORY_DESC, STORAGE_DESC, NETWORK_DESC } from './strings';
import { MetricType } from './metric-type';
import './top-consumers-card.scss';

const toNanoSeconds = (value: React.ReactText) => {
  const val = Number(value);
  return Number.isFinite(val) ? val * 1000 ** 3 : 0;
};

export const metricTypeMap: MetricTypeMap = {
  [MetricType.CPU]: {
    description: CPU_DESC,
    humanize: (value) => humanizeSeconds(toNanoSeconds(value)),
  },
  [MetricType.MEMORY]: {
    description: MEMORY_DESC,
    humanize: humanizeBinaryBytes,
  },
  [MetricType.STORAGE]: {
    description: STORAGE_DESC,
    humanize: (value) => humanizeSeconds(toNanoSeconds(value)),
  },
  [MetricType.NETWORK]: {
    description: NETWORK_DESC,
    humanize: humanizeDecimalBytesPerSec,
  },
};

const ConsumersFilter: React.FC<ConsumersFilterProps> = ({ children }) => (
  <div className="co-dashboard-card__body--top-margin co-consumers-card__filters">{children}</div>
);

export default ConsumersFilter;

type ConsumersFilterProps = {
  children: React.ReactNode;
};

type MetricTypeMap = {
  [key: string]: {
    description: string;
    humanize: Humanize;
  };
};
