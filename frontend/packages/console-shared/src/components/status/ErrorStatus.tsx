import * as React from 'react';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';
import { RedExclamationCircleIcon } from './Icons';

type ErrorStatusProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
};

const ErrorStatus: React.FC<ErrorStatusProps> = (props) => {
  const icon = <RedExclamationCircleIcon />;
  return props.children ? (
    <PopoverStatus {...props} icon={icon} />
  ) : (
    <StatusIconAndText {...props} icon={icon} />
  );
};

export default ErrorStatus;
