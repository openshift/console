import * as React from 'react';
import { InfoCircleIcon, HourglassHalfIcon, InProgressIcon, SyncAltIcon } from '@patternfly/react-icons';
import {
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from './icons';
import GenericStatus from './GenericStatus';
import { StatusComponentProps } from './types';
import StatusIconAndText from './StatusIconAndText';

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
  <StatusIconAndText {...props} icon={<SyncAltIcon />} />
);
SuccessStatus.displayName = 'SuccessStatus';

export const WarningStatus: React.FC<StatusComponentProps> = (props) => (
  <StatusIconAndText {...props} icon={<YellowExclamationTriangleIcon />} />
);
WarningStatus.displayName = 'WarningStatus';
