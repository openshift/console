import * as React from 'react';
import { HourglassHalfIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from './types';
import GenericStatus from './GenericStatus';

const PendingStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={HourglassHalfIcon} />
);

export default PendingStatus;
