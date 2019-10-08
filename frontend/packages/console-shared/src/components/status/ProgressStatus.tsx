import * as React from 'react';
import { InProgressIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from './types';
import GenericStatus from './GenericStatus';

const ProgressStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InProgressIcon} />
);

export default ProgressStatus;
