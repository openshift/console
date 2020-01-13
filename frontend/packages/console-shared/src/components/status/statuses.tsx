import * as React from 'react';
import { InfoCircleIcon, HourglassHalfIcon, InProgressIcon } from '@patternfly/react-icons';
import {
  RedExclamationCircleIcon,
  GreenCheckCircleIcon,
  YellowExclamationTriangleIcon,
} from './icons';
import GenericStatus from './GenericStatus';
import { StatusComponentProps } from './types';

export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);
ErrorStatus.displayName = 'ErrorStatus';

export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InfoCircleIcon} />
);
InfoStatus.displayName = 'InfoStatus';

export const PendingStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={HourglassHalfIcon} />
);
PendingStatus.displayName = 'PendingStatus';

export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);
ProgressStatus.displayName = 'ProgressStatus';

export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={GreenCheckCircleIcon} />
);
SuccessStatus.displayName = 'SuccessStatus';

export const WarningStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={YellowExclamationTriangleIcon} />
);
WarningStatus.displayName = 'WarningStatus';
