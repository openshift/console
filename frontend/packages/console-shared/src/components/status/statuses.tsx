import * as React from 'react';
import { HourglassHalfIcon, InProgressIcon } from '@patternfly/react-icons';
import {
  RedExclamationCircleIcon,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
  BlueInfoCircleIcon,
} from './icons';
import GenericStatus from './GenericStatus';
import { StatusComponentProps } from './types';

export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => <RedExclamationCircleIcon className="co-icon-and-text__icon" title="Error" />}
  />
);
ErrorStatus.displayName = 'ErrorStatus';

export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => <BlueInfoCircleIcon className="co-icon-and-text__icon" title="Information" />}
  />
);
InfoStatus.displayName = 'InfoStatus';

export const PendingStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => <HourglassHalfIcon className="co-icon-and-text__icon" title="Pending" />}
  />
);
PendingStatus.displayName = 'PendingStatus';

export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => <InProgressIcon className="co-icon-and-text__icon" title="In progress" />}
  />
);
ProgressStatus.displayName = 'ProgressStatus';

export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => <GreenCheckCircleIcon className="co-icon-and-text__icon" title="Healthy" />}
  />
);
SuccessStatus.displayName = 'SuccessStatus';

export const WarningStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus
    {...props}
    Icon={() => (
      <YellowExclamationTriangleIcon className="co-icon-and-text__icon" title="Warning" />
    )}
  />
);
WarningStatus.displayName = 'WarningStatus';
