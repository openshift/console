import * as React from 'react';
import { InfoCircleIcon } from '@patternfly/react-icons';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';

type InfoStatusProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
};

const InfoStatus: React.FC<InfoStatusProps> = ({
  title,
  iconOnly,
  noTooltip = false,
  children,
}) => {
  const icon = <InfoCircleIcon />;
  return children ? (
    <PopoverStatus icon={icon} title={title} iconOnly={iconOnly}>
      {children}
    </PopoverStatus>
  ) : (
    <StatusIconAndText icon={icon} title={title} iconOnly={iconOnly} noTooltip={noTooltip} />
  );
};

export default InfoStatus;
