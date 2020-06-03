import * as React from 'react';
import { Drawer, DrawerContent, DrawerPanelContent, DrawerPanelBody } from '@patternfly/react-core';

import NotificationDrawerHeading from './notification-drawer-heading';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isExpanded,
  isInline,
  children,
  notificationEntries,
  className,
}) => {
  const panelContent = (
    <DrawerPanelContent className={className}>
      <NotificationDrawerHeading>{notificationEntries}</NotificationDrawerHeading>
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
};

export default NotificationDrawer;
