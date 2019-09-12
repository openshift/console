import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import StatusIconAndText from './StatusIconAndText';

const PopoverStatus: React.FC<React.ComponentProps<typeof StatusIconAndText>> = ({
  title,
  children,
  ...other
}) => (
  <Popover position={PopoverPosition.right} headerContent={title} bodyContent={children}>
    <Button variant="link" isInline>
      <StatusIconAndText {...other} title={title} />
    </Button>
  </Popover>
);

export default PopoverStatus;
