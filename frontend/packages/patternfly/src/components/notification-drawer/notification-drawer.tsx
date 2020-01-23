import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from '@patternfly/react-core/dist/js/experimental/components/Drawer';

import NotificationDrawerHeading from './notification-drawer-heading';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isExpanded,
  isInline,
  children,
  notificationEntries,
}) => {
  return (
    <Drawer isExpanded={isExpanded} isInline={isInline}>
      <DrawerContent>{children}</DrawerContent>
      <DrawerPanelContent noPadding>
        <NotificationDrawerHeading>{notificationEntries}</NotificationDrawerHeading>
      </DrawerPanelContent>
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
};

export default NotificationDrawer;
