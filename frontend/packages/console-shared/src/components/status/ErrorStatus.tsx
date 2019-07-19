import * as React from 'react';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';
import { RedExclamationCircleIcon } from './Icons';

type ErrorStatusProps = {
  title?: string;
  iconOnly?: boolean;
};

const ErrorStatus: React.FC<ErrorStatusProps> = ({ title, iconOnly, children }) => {
  const icon = <RedExclamationCircleIcon />;
  return children ? (
    <PopoverStatus icon={icon} title={title} iconOnly={iconOnly}>
      {children}
    </PopoverStatus>
  ) : (
    <StatusIconAndText icon={icon} title={title} iconOnly={iconOnly} />
  );
};

export default ErrorStatus;
