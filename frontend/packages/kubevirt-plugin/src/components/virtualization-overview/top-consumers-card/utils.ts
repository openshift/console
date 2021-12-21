import {
  humanizeBinaryBytes,
  humanizeDecimalBytes,
  humanizeDecimalBytesPerSec,
  humanizeSeconds,
} from '@console/internal/components/utils';
import { STORAGE_IOPS_UNIT } from '../../../constants/virt-overview';
import { TopConsumerMetric } from '../../../constants/virt-overview/top-consumers-card/top-consumer-metric';

export const getValue = (value) => parseFloat(value);

export const humanizeTopConsumerMetric = (value: number, metric: TopConsumerMetric) => {
  let humanizedValue;
  switch (metric) {
    case TopConsumerMetric.CPU:
      humanizedValue = humanizeSeconds(value, 's', 'ms');
      break;
    case TopConsumerMetric.MEMORY:
      humanizedValue = humanizeBinaryBytes(value, 'B', 'GiB');
      break;
    case TopConsumerMetric.FILESYSTEM:
      humanizedValue = humanizeBinaryBytes(value, 'B');
      break;
    case TopConsumerMetric.MEMORY_SWAP:
      humanizedValue = humanizeDecimalBytes(value, 'MB');
      break;
    case TopConsumerMetric.VCPU_WAIT:
      humanizedValue = humanizeSeconds(value, 's', 'ms');
      break;
    case TopConsumerMetric.STORAGE_THROUGHPUT:
      humanizedValue = humanizeDecimalBytesPerSec(value, 'MBps');
      break;
    case TopConsumerMetric.STORAGE_IOPS:
      humanizedValue = { value: value.toFixed(2), unit: STORAGE_IOPS_UNIT };
      break;
    default:
      humanizedValue = { value, unit: '' };
  }

  return { value: humanizedValue.value, unit: humanizedValue.unit };
};

export const getHumanizedValue = (value, metric) => {
  const rawValue = getValue(value);
  return humanizeTopConsumerMetric(rawValue, metric);
};
