import * as React from 'react';
import { RedExclamationCircleIcon } from './Icons';
import { StatusComponentProps } from './types';
import GenericStatus from './GenericStatus';

const ErrorStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={RedExclamationCircleIcon} />
);

export default ErrorStatus;
