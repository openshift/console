import * as React from 'react';

import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';

type HelpIconPopoverProps = {
  bodyContent: React.ReactNode;
  position?: PopoverPosition;
};

export const HelpIconPopover: React.FC<HelpIconPopoverProps> = ({
  position = PopoverPosition.right,
  bodyContent,
  ...props
}) => (
  <Popover position={position} bodyContent={bodyContent}>
    <Button variant="plain" className="pf-c-form__group-label-help" {...props}>
      <HelpIcon noVerticalAlign />
    </Button>
  </Popover>
);
