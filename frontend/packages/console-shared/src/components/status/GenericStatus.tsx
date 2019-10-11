import * as React from 'react';
import { StatusComponentProps } from './types';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';

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

type GenericStatusProps = StatusComponentProps & {
  Icon: React.ComponentType<{}>;
};

export default GenericStatus;
