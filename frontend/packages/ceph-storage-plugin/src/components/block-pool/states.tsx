import * as React from 'react';

import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  GrayUnknownIcon,
} from '@console/shared/src/components/status/icons';

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
