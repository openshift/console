import * as React from 'react';
import StatusIconAndText from './StatusIconAndText';
import PopoverStatus from './PopoverStatus';
import { StatusComponentProps } from './types';

type GenericStatusProps = StatusComponentProps & {
  Icon: React.ComponentType<{}>;
};

const GenericStatus: React.FC<GenericStatusProps> = (props) => {
  const { Icon, children, ...restProps } = props;
  return children ? (
    <PopoverStatus {...restProps} icon={<Icon />}>
      {children}
    </PopoverStatus>
  ) : (
    <StatusIconAndText {...restProps} icon={<Icon />} />
  );
};

export default GenericStatus;
