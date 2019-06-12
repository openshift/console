import * as React from 'react';

import { GreenCheckCircleIcon } from './Icons';
import StatusIconAndText from './StatusIconAndText';

type SuccessStatusProps = {
  title?: string;
  iconOnly?: boolean;
};

const SuccessStatus: React.FC<SuccessStatusProps> = ({ title, iconOnly }) => (
  <StatusIconAndText icon={<GreenCheckCircleIcon />} title={title} iconOnly={iconOnly} />
);

export default SuccessStatus;
