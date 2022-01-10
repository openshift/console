import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from '../../../extensions/console-types';
import GenericStatus from './GenericStatus';
import { RedExclamationCircleIcon, GreenCheckCircleIcon, BlueInfoCircleIcon } from './icons';

export const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);
ErrorStatus.displayName = 'ErrorStatus';

export const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={BlueInfoCircleIcon} />
);
InfoStatus.displayName = 'InfoStatus';

export const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);
ProgressStatus.displayName = 'ProgressStatus';

export const SuccessStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={GreenCheckCircleIcon} />
);
SuccessStatus.displayName = 'SuccessStatus';
