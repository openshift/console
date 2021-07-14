import * as React from 'react';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared/src/components/status/icons';

enum ImageStates {
  STARTING_REPLY = 'starting_replay',
  STOP_REPLYING = 'stop_replaying',
  REPLYING = 'replaying',
  STOPPED = 'stopped',
  ERROR = 'error',
  SYNCING = 'syncing',
  UNKNOWN = 'unknown',
}

export const ImageStateLegendMap: { [state in ImageStates]: string } = {
  [ImageStates.STARTING_REPLY]: 'Start replay',
  [ImageStates.STOP_REPLYING]: 'Stop reply',
  [ImageStates.REPLYING]: 'Replaying',
  [ImageStates.STOPPED]: 'Stopped',
  [ImageStates.ERROR]: 'Error',
  [ImageStates.SYNCING]: 'Syncing',
  [ImageStates.UNKNOWN]: 'Unknown',
};

enum ImageHealth {
  OK = 'OK',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN',
}

export const healthStateMapping: { [key in ImageHealth]: HealthMappingValues } = {
  [ImageHealth.OK]: {
    health: ImageHealth.OK,
    priority: 0,
    icon: <GreenCheckCircleIcon />,
  },
  [ImageHealth.UNKNOWN]: {
    health: ImageHealth.UNKNOWN,
    priority: 1,
    icon: <GrayUnknownIcon />,
  },
  [ImageHealth.WARNING]: {
    health: ImageHealth.WARNING,
    priority: 2,
    icon: <YellowExclamationTriangleIcon />,
  },
  [ImageHealth.ERROR]: {
    health: ImageHealth.ERROR,
    priority: 3,
    icon: <RedExclamationCircleIcon />,
  },
};

export type HealthMappingValues = {
  icon: React.ReactNode;
  health: ImageHealth;
  priority: number;
};
