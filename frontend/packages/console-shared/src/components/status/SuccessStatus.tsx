import * as React from 'react';
import { GreenCheckCircleIcon } from './Icons';
import StatusIconAndText from './StatusIconAndText';
import { StatusComponentProps } from './types';

type SuccessStatusProps = StatusComponentProps;

const SuccessStatus: React.FC<SuccessStatusProps> = (props) => (
  <StatusIconAndText {...props} icon={<GreenCheckCircleIcon />} />
);

export default SuccessStatus;
