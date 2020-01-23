import * as React from 'react';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueSyncIcon,
  GrayUnknownIcon,
} from '@console/shared/src/components/status/icons';
import { InProgressIcon } from '@patternfly/react-icons';

export enum HealthState {
  OK = 'OK',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  UPGRADING = 'UPGRADING',
  PROGRESS = 'PROGRESS',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export const healthStateMapping: { [key in HealthStateMappingKeys]: HealthStateMappingValues } = {
  [HealthState.OK]: {
    icon: <GreenCheckCircleIcon />,
  },
  [HealthState.ERROR]: {
    icon: <RedExclamationCircleIcon />,
    message: 'Degraded',
  },
  [HealthState.WARNING]: {
    icon: <YellowExclamationTriangleIcon />,
    message: 'Degraded',
  },
  [HealthState.UPGRADING]: {
    icon: <BlueSyncIcon />,
    message: 'Upgrading',
  },
  [HealthState.PROGRESS]: {
    icon: <InProgressIcon />,
    message: 'Pending',
  },
  [HealthState.UNKNOWN]: {
    icon: <GrayUnknownIcon />,
    message: 'Unknown',
  },
  [HealthState.NOT_AVAILABLE]: {
    icon: <GrayUnknownIcon />,
    message: 'Not available',
  },
};

export const operatorHealthPriority: {
  [key in HealthStateMappingKeys]: {
    priority: number;
    health: HealthState;
  } & HealthStateMappingValues;
} = {
  [HealthState.OK]: {
    priority: 0,
    health: HealthState.OK,
    ...healthStateMapping[HealthState.OK],
  },
  [HealthState.UNKNOWN]: {
    priority: 1,
    health: HealthState.UNKNOWN,
    ...healthStateMapping[HealthState.UNKNOWN],
  },
  [HealthState.PROGRESS]: {
    priority: 2,
    health: HealthState.PROGRESS,
    ...healthStateMapping[HealthState.PROGRESS],
  },
  [HealthState.UPGRADING]: {
    priority: 3,
    health: HealthState.UPGRADING,
    ...healthStateMapping[HealthState.UPGRADING],
  },
  [HealthState.WARNING]: {
    priority: 4,
    health: HealthState.WARNING,
    ...healthStateMapping[HealthState.WARNING],
  },
  [HealthState.ERROR]: {
    priority: 5,
    health: HealthState.ERROR,
    ...healthStateMapping[HealthState.ERROR],
  },
  [HealthState.NOT_AVAILABLE]: {
    priority: 6,
    health: HealthState.NOT_AVAILABLE,
    ...healthStateMapping[HealthState.NOT_AVAILABLE],
  },
};

type HealthStateMappingKeys = Exclude<keyof typeof HealthState, 'LOADING'>;

export type HealthStateMappingValues = {
  icon: React.ReactNode;
  message?: string;
};
