import * as React from 'react';
import { InfoCircleIcon, HourglassHalfIcon, InProgressIcon } from '@patternfly/react-icons';
import { RedExclamationCircleIcon, GreenCheckCircleIcon } from './icons';
import GenericStatus from './GenericStatus';
import { StatusComponentProps } from './types';
import StatusIconAndText from './StatusIconAndText';

export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);

export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InfoCircleIcon} />
);

export const PendingStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={HourglassHalfIcon} />
);

export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);

export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <StatusIconAndText {...props} icon={<GreenCheckCircleIcon />} />
);
