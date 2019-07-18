import * as React from 'react';
import { Popover, PopoverPosition } from '@patternfly/react-core';
import { Button } from 'patternfly-react';

import StatusIconAndText from './StatusIconAndText';

const PopoverStatus: React.FC<React.ComponentProps<typeof StatusIconAndText>> = ({
  icon,
  title,
  spin,
  children,
  iconOnly,
}) => (
  <Popover position={PopoverPosition.right} headerContent={title} bodyContent={children}>
    <Button bsStyle="link">
      <StatusIconAndText icon={icon} title={title} spin={spin} iconOnly={iconOnly} />
    </Button>
  </Popover>
);

export default PopoverStatus;
