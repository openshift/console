import * as React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from '@patternfly/react-core/dist/js/experimental/components/Drawer';

import NotificationDrawerHeading from './notification-drawer-heading';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isExpanded,
  isDrawerHidden,
  isInline,
  children,
  notificationEntries,
  className,
}) => {
  return (
    <Drawer isExpanded={isExpanded} isInline={isInline}>
      <DrawerContent>{children}</DrawerContent>
      <DrawerPanelContent className={className} noPadding hidden={isDrawerHidden}>
        <NotificationDrawerHeading>{notificationEntries}</NotificationDrawerHeading>
      </DrawerPanelContent>
    </Drawer>
  );
};

NotificationDrawer.displayName = 'NotificationDrawer';

export type NotificationDrawerProps = {
  isInline: boolean;
  isExpanded: boolean;
  isDrawerHidden: boolean;
  notificationEntries?: JSX.Element[];
  count?: number;
  children: React.ReactNode;
  className: string;
};

export default NotificationDrawer;
