import * as _ from 'lodash-es';
import * as React from 'react';

import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
  humanizePacketsPerSec,
} from '../../utils';

export const formatNumber = (s: string, decimals = 2, format = 'short'): React.ReactNode => {
  const value = Number(s);
  if (_.isNil(s) || isNaN(value)) {
    return s || <span className="text-muted">-</span>;
  }

  switch (format) {
    case 'percentunit':
      return Intl.NumberFormat(undefined, {
        style: 'percent',
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      }).format(value);
    case 'bytes':
      return humanizeBinaryBytes(value).string;
    case 'Bps':
      return humanizeDecimalBytesPerSec(value).string;
    case 'pps':
      return humanizePacketsPerSec(value).string;
    case 'short':
    // fall through
    default:
      return humanizeNumber(value).string;
  }
};
