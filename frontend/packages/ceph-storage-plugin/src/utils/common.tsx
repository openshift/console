import * as React from 'react';

import { getLastLanguage } from '@console/app/src/components/user-preferences/language/getLastLanguage';
import { humanizePercentage, HumanizeResult } from '@console/internal/components/utils';

import { StorageClusterKind } from '../types';

export const checkArbiterCluster = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.arbiter?.enable;

export const checkFlexibleScaling = (storageCluster: StorageClusterKind): boolean =>
  storageCluster?.spec?.flexibleScaling;

export const toList = (text: string[]): React.ReactNode => (
  <div
    style={{
      overflowY: text.length > 3 ? 'scroll' : 'visible',
      maxHeight: '5rem',
      overflowX: 'hidden',
    }}
  >
    {text.map((s) => (
      <li key={s}>{s}</li>
    ))}
  </div>
);

export const calcPercentage = (value: number, total: number): HumanizeResult =>
  humanizePercentage((value * 100) / total);

export const twelveHoursdateTimeNoYear = new Intl.DateTimeFormat(getLastLanguage() || undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hour12: true,
});
