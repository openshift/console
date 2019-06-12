import * as React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';

import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';

type InfoStatusProps = {
  title?: string;
  iconOnly?: boolean;
};

const InfoStatus: React.FC<InfoStatusProps> = ({ title, iconOnly, children }) => {
  const icon = <InfoCircleIcon />;
  return children ? (
    <PopoverStatus icon={icon} title={title} iconOnly={iconOnly}>
      {children}
    </PopoverStatus>
  ) : (
    <StatusIconAndText icon={icon} title={title} iconOnly={iconOnly} />
  );
};

export default InfoStatus;
