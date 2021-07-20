import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import { TFunction } from 'i18next';
import {
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
  BlueSyncIcon,
  GrayUnknownIcon,
  BlueArrowCircleUpIcon,
} from '@console/shared/src/components/status/icons';

export enum HealthState {
  OK = 'OK',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  LOADING = 'LOADING',
  UNKNOWN = 'UNKNOWN',
  UPDATING = 'UPDATING',
  PROGRESS = 'PROGRESS',
  UPGRADABLE = 'UPGRADABLE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export const healthStateMessage = (state: keyof typeof HealthState, t: TFunction): string => {
  switch (state) {
    case HealthState.OK:
      return '';
    case HealthState.UNKNOWN:
      return t('console-shared~Unknown');
    case HealthState.PROGRESS:
      return t('console-shared~Pending');
    case HealthState.UPDATING:
      return t('console-shared~Updating');
    case HealthState.WARNING:
      return t('console-shared~Degraded');
    case HealthState.ERROR:
      return t('console-shared~Degraded');
    case HealthState.LOADING:
      return t('console-shared~Loading');
    case HealthState.UPGRADABLE:
      return t('console-shared~Upgrade available');
    case HealthState.NOT_AVAILABLE:
      return t('console-shared~Not available');
    default:
      return t('console-shared~Unknown');
  }
};

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
  },
  [HealthState.PROGRESS]: {
    priority: 2,
    health: HealthState.PROGRESS,
    icon: <InProgressIcon title="In progress" />,
  },
  [HealthState.UPDATING]: {
    priority: 3,
    health: HealthState.UPDATING,
    icon: <BlueSyncIcon title="Updating" />,
  },
  [HealthState.UPGRADABLE]: {
    priority: 4,
    health: HealthState.UPGRADABLE,
    icon: <BlueArrowCircleUpIcon title="Upgrade available" />,
  },
  [HealthState.WARNING]: {
    priority: 5,
    health: HealthState.WARNING,
    icon: <YellowExclamationTriangleIcon title="Warning" />,
  },
  [HealthState.ERROR]: {
    priority: 6,
    health: HealthState.ERROR,
    icon: <RedExclamationCircleIcon title="Error" />,
  },
  [HealthState.LOADING]: {
    priority: 7,
    health: HealthState.LOADING,
    icon: <div className="skeleton-health" />,
  },
  [HealthState.NOT_AVAILABLE]: {
    priority: 8,
    health: HealthState.NOT_AVAILABLE,
    icon: <GrayUnknownIcon title="Not available" />,
  },
};

export type HealthStateMappingValues = {
  icon: React.ReactNode;
  priority: number;
  health: HealthState;
};
