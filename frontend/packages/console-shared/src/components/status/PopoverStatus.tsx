import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import StatusIconAndText from './StatusIconAndText';

const PopoverStatus: React.FC<React.ComponentProps<typeof StatusIconAndText>> = ({
  icon,
  title,
  spin,
  children,
  iconOnly,
  noTooltip = false,
}) => (
  <Popover position={PopoverPosition.right} headerContent={title} bodyContent={children}>
    <Button variant="link" isInline>
      <StatusIconAndText
        icon={icon}
        title={title}
        spin={spin}
        iconOnly={iconOnly}
        noTooltip={noTooltip}
      />
    </Button>
  </Popover>
);

export default PopoverStatus;
