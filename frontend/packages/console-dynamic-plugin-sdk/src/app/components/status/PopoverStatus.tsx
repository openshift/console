import * as React from 'react';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
import './PopoverStatus.scss';

type PopoverStatusProps = {
  statusBody: React.ReactNode;
  onHide?: () => void;
  onShow?: () => void;
  title?: string;
  hideHeader?: boolean;
  isVisible?: boolean;
  shouldClose?: (hideFunction: any) => void;
};

/**
 * Component for creating a status popover item
 * @param {ReactNode} statusBody - content displayed within the popover.
 * @param {function} [onHide] - (optional) function invoked when popover begins to transition out
 * @param {function} [onShow] - (optional) function invoked when popover begins to appear
 * @param {string} [title] - (optional) title for the popover
 * @param {boolean} [hideHeader] - (optional) when true, header text is hidden
 * @param {boolean} [isVisible] - (optional) when true, the popover is displayed
 * @param {function} [shouldClose] - (optional) callback function invoked when the popover is closed only if isVisible is also controlled
 * @param {ReactNode} [children] - (optional) children for the component
 * @example
 * ```tsx
 * <PopoverStatus title={title} statusBody={statusBody}>
 *   {children}
 * </PopoverStatus>
 * ```
 */
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
      <Button variant="link" isInline className="co-popover-status-button">
        {statusBody}
      </Button>
    </Popover>
  );
};

export default PopoverStatus;
