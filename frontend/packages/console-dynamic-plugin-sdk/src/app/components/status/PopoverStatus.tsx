import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';

type PopoverStatusProps = {
  statusBody: React.ReactNode;
  onHide?: () => void;
  onShow?: () => void;
  title?: string;
  hideHeader?: boolean;
  isVisible?: boolean;
  shouldClose?: (hideFunction: any) => void;
};

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

export default PopoverStatus;
