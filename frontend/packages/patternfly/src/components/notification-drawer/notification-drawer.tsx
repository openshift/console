import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateSecondaryActions,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import {
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from '@patternfly/react-core/dist/js/experimental/components/Drawer';

import NotificationDrawerHeading from './notification-drawer-heading';
import NotificationTypeHeading from './notification-type-heading';

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
  update = 'update',
}

const emptyState = (toggleDrawer) => (
  <EmptyState variant={EmptyStateVariant.full} className="co-status-card__alerts-msg">
    <Title headingLevel="h5" size="lg">
      No critical alerts
    </Title>
    <EmptyStateBody>
      There are currently no critical alerts firing. There may be firing alerts of other severities
      or silenced critical alerts however.
    </EmptyStateBody>
    <EmptyStateSecondaryActions>
      <Link to="/monitoring/alerts" onClick={toggleDrawer}>
        View all alerts
      </Link>
    </EmptyStateSecondaryActions>
  </EmptyState>
);

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isDrawerExpanded,
  children,
  toggleNotificationDrawer,
  alertData = [],
  updateData = [],
}) => {
  const [isAlertExpanded, toggleAlertExpanded] = React.useState<boolean>(true);
  const [isAvailableUpdateExpanded, toggleAvailableUpdateExpanded] = React.useState<boolean>(false);
  const criticalAlerts = _.isEmpty(alertData) ? emptyState(toggleNotificationDrawer) : alertData;
  return (
    <Drawer isExpanded={isDrawerExpanded} isInline>
      <DrawerContent>{children}</DrawerContent>
      <DrawerPanelContent noPadding>
        <NotificationDrawerHeading count={alertData.length + updateData.length}>
          <NotificationTypeHeading
            isExpanded={isAlertExpanded}
            label="Critical Alerts"
            count={alertData.length}
            onExpandContents={toggleAlertExpanded}
          >
            {criticalAlerts}
          </NotificationTypeHeading>
          {!_.isEmpty(updateData) && (
            <NotificationTypeHeading
              isExpanded={isAvailableUpdateExpanded}
              label="Messages"
              count={updateData.length}
              onExpandContents={toggleAvailableUpdateExpanded}
            >
              {updateData}
            </NotificationTypeHeading>
          )}
        </NotificationDrawerHeading>
      </DrawerPanelContent>
    </Drawer>
  );
};

NotificationDrawer.displayName = 'NotificationDrawer';

export type NotificationDrawerProps = {
  isDrawerExpanded: boolean;
  toggleNotificationDrawer: () => any;
  alertData?: JSX.Element[];
  updateData?: JSX.Element[];
};

export default NotificationDrawer;
