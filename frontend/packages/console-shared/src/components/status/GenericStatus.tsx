import * as React from 'react';
import { StatusComponentProps } from './types';
import PopoverStatus from './PopoverStatus';
import StatusIconAndText from './StatusIconAndText';

const GenericStatus: React.FC<GenericStatusProps> = (props) => {
  const { Icon, children, popoverTitle, title, ...restProps } = props;
  return React.Children.toArray(children).length ? (
    <PopoverStatus
      title={popoverTitle || title}
      {...restProps}
      statusBody={<StatusIconAndText {...restProps} title={title} icon={<Icon />} />}
    >
      {children}
    </PopoverStatus>
  ) : (
    <StatusIconAndText {...restProps} title={title} icon={<Icon />} />
  );
};

type GenericStatusProps = StatusComponentProps & {
  Icon: React.ComponentType<{}>;
  popoverTitle?: string;
};

export default GenericStatus;
