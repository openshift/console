import * as React from 'react';
import { Drawer, DrawerContent, DrawerPanelContent, DrawerPanelBody } from '@patternfly/react-core';

import NotificationDrawerHeading from './notification-drawer-heading';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isExpanded,
  isInline,
  children,
  notificationEntries,
  className,
  onClose,
}) => {
  // Added check for `isExpanded` due to flaw in patternfly drawer. Remove the check on patternfly version upgrade
  const panelContent = isExpanded && (
    <DrawerPanelContent className={className}>
      <NotificationDrawerHeading onClose={onClose}>{notificationEntries}</NotificationDrawerHeading>
      <DrawerPanelBody hasNoPadding />
    </DrawerPanelContent>
  );
  return (
    <Drawer isExpanded={isExpanded} isInline={isInline}>
      <DrawerContent panelContent={panelContent}>{children}</DrawerContent>
    </Drawer>
  );
};

NotificationDrawer.displayName = 'NotificationDrawer';

export type NotificationDrawerProps = {
  isInline: boolean;
  isExpanded: boolean;
  notificationEntries?: JSX.Element[];
  count?: number;
  children: React.ReactNode;
  className: string;
  /** A callback for when the close button is clicked */
  onClose: () => void;
};

export default NotificationDrawer;
