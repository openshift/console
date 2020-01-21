import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from '@patternfly/react-core/dist/js/experimental/components/Drawer';

import NotificationDrawerHeading from './notification-drawer-heading';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isExpanded,
  children,
  notificationEntries,
  count = 0,
}) => {
  return (
    <Drawer isExpanded={isExpanded} isInline>
      <DrawerContent>{children}</DrawerContent>
      <DrawerPanelContent noPadding>
        <NotificationDrawerHeading count={count}>{notificationEntries}</NotificationDrawerHeading>
      </DrawerPanelContent>
    </Drawer>
  );
};

NotificationDrawer.displayName = 'NotificationDrawer';

export type NotificationDrawerProps = {
  isExpanded: boolean;
  notificationEntries?: JSX.Element[];
  count?: number;
  children: React.ReactNode;
};

export default NotificationDrawer;
