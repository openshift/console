import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { Instance as TippyInstance } from 'tippy.js';
import StatusIconAndText from './StatusIconAndText';

const PopoverStatus: React.FC<PopoverStatusProps> = ({
  title,
  hideHeader,
  icon,
  activeIcon,
  children,
  isVisible = null,
  shouldClose = null,
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
      isVisible={isVisible}
      shouldClose={shouldClose}
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
  isVisible?: boolean;
  shouldClose?: (tip: TippyInstance) => void;
};

export default PopoverStatus;
