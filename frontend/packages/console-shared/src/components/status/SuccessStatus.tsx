import * as React from 'react';
import { GreenCheckCircleIcon } from './Icons';
import StatusIconAndText from './StatusIconAndText';

type SuccessStatusProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
};

const SuccessStatus: React.FC<SuccessStatusProps> = ({ title, iconOnly, noTooltip = false }) => (
  <StatusIconAndText
    icon={<GreenCheckCircleIcon />}
    title={title}
    iconOnly={iconOnly}
    noTooltip={noTooltip}
  />
);

export default SuccessStatus;
