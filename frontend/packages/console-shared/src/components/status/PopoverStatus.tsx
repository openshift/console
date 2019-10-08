import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import StatusIconAndText from './StatusIconAndText';

const PopoverStatus: React.FC<PopoverStatusProps> = ({
  title,
  hideHeader,
  icon,
  activeIcon,
  children,
  ...other
}) => {
  const [isActive, setActive] = React.useState(false);
  const onHide = React.useCallback(() => setActive(false), [setActive]);
  const onShow = React.useCallback(() => setActive(true), [setActive]);

  return (
    <Popover
      position={PopoverPosition.right}
      headerContent={hideHeader ? null : title}
      bodyContent={children}
      aria-label={title}
      onHide={onHide}
      onShow={onShow}
    >
      <Button variant="link" isInline>
        <StatusIconAndText
          {...other}
          title={title}
          icon={isActive && activeIcon ? activeIcon : icon}
        />
      </Button>
    </Popover>
  );
};

type PopoverStatusProps = React.ComponentProps<typeof StatusIconAndText> & {
  activeIcon?: React.ReactElement;
  hideHeader?: boolean;
};

export default PopoverStatus;
