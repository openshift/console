import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import { Instance as TippyInstance } from 'tippy.js';

const PopoverStatus: React.FC<PopoverStatusProps> = ({
  hideHeader,
  children,
  isVisible = null,
  shouldClose = null,
  statusBody,
  title,
  onHide,
  onShow,
}) => {
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
        {statusBody}
      </Button>
    </Popover>
  );
};

type PopoverStatusProps = {
  statusBody: React.ReactNode;
  onHide?: () => void;
  onShow?: () => void;
  title?: string;
  hideHeader?: boolean;
  isVisible?: boolean;
  shouldClose?: (tip: TippyInstance) => void;
};

export default PopoverStatus;
