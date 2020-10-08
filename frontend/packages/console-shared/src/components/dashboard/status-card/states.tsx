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
  UPDATING = 'UPDATING',
  PROGRESS = 'PROGRESS',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export const healthStateMapping: { [key in HealthState]: HealthStateMappingValues } = {
  [HealthState.OK]: {
    priority: 0,
    health: HealthState.OK,
    icon: <GreenCheckCircleIcon title="Healthy" />,
  },
  [HealthState.UNKNOWN]: {
    priority: 1,
    health: HealthState.UNKNOWN,
    icon: <GrayUnknownIcon title="Unknown" />,
    message: 'Unknown',
  },
  [HealthState.PROGRESS]: {
    priority: 2,
    health: HealthState.PROGRESS,
    icon: <InProgressIcon title="In progress" />,
    message: 'Pending',
  },
  [HealthState.UPDATING]: {
    priority: 3,
    health: HealthState.UPDATING,
    icon: <BlueSyncIcon title="Updating" />,
    message: 'Updating',
  },
  [HealthState.WARNING]: {
    priority: 4,
    health: HealthState.WARNING,
    icon: <YellowExclamationTriangleIcon title="Warning" />,
    message: 'Degraded',
  },
  [HealthState.ERROR]: {
    priority: 5,
    health: HealthState.ERROR,
    icon: <RedExclamationCircleIcon title="Error" />,
    message: 'Degraded',
  },
  [HealthState.LOADING]: {
    priority: 6,
    health: HealthState.LOADING,
    icon: <div className="skeleton-health" />,
    message: 'Loading',
  },
  [HealthState.NOT_AVAILABLE]: {
    priority: 7,
    health: HealthState.NOT_AVAILABLE,
    icon: <GrayUnknownIcon title="Not available" />,
    message: 'Not available',
  },
};

export type HealthStateMappingValues = {
  icon: React.ReactNode;
  message?: string;
  priority: number;
  health: HealthState;
};
