import * as React from 'react';
import { GreenCheckCircleIcon } from './Icons';
import StatusIconAndText from './StatusIconAndText';

type SuccessStatusProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
};

const SuccessStatus: React.FC<SuccessStatusProps> = (props) => (
  <StatusIconAndText {...props} icon={<GreenCheckCircleIcon />} />
);

export default SuccessStatus;
