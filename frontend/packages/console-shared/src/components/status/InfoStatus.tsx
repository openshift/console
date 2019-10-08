import * as React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { StatusComponentProps } from './types';
import GenericStatus from './GenericStatus';

const InfoStatus: React.FC<StatusComponentProps> = (props) => (
  <GenericStatus {...props} Icon={InfoCircleIcon} />
);

export default InfoStatus;
