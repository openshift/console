import * as React from 'react';
import { TFunction } from 'i18next';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared/src/components/status/icons';

import { ImageStates } from '../../../types';

export const ImageStateLegendMap = (t: TFunction): { [state in ImageStates]: string } => ({
  [ImageStates.STARTING_REPLAY]: t('ceph-storage-plugin~Start replay'),
  [ImageStates.STOPPING_REPLAY]: t('ceph-storage-plugin~Stop reply'),
  [ImageStates.REPLAYING]: t('ceph-storage-plugin~Replaying'),
  [ImageStates.STOPPED]: t('ceph-storage-plugin~Stopped'),
  [ImageStates.ERROR]: t('ceph-storage-plugin~Error'),
  [ImageStates.SYNCING]: t('ceph-storage-plugin~Syncing'),
  [ImageStates.UNKNOWN]: t('ceph-storage-plugin~Unknown'),
});

enum ImageHealth {
  OK = 'OK',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN',
}

export const healthStateMapping: { [key in ImageHealth]: HealthMappingValues } = {
  [ImageHealth.OK]: {
    health: ImageHealth.OK,
    icon: <GreenCheckCircleIcon />,
  },
  [ImageHealth.UNKNOWN]: {
    health: ImageHealth.UNKNOWN,
    icon: <GrayUnknownIcon />,
  },
  [ImageHealth.WARNING]: {
    health: ImageHealth.WARNING,
    icon: <YellowExclamationTriangleIcon />,
  },
  [ImageHealth.ERROR]: {
    health: ImageHealth.ERROR,
    icon: <RedExclamationCircleIcon />,
  },
};

type HealthMappingValues = {
  icon: React.ReactNode;
  health: ImageHealth;
};
