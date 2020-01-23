import * as React from 'react';

const NotificationDrawerHeading: React.FC<NotificationDrawerHeadingProps> = ({
  count,
  children,
}) => (
  <div className="pf-c-notification-drawer">
    <div className="pf-c-notification-drawer__header">
      <h1 className="pf-c-notification-drawer__header-title">Notifications</h1>
      {count && (
        <span className="pf-c-notification-drawer__header-status">{`${count} unread`}</span>
      )}
    </div>
    <div className="pf-c-notification-drawer__body">
      <div className="pf-c-notification-drawer__group-list">{children}</div>
    </div>
  </div>
);

type NotificationDrawerHeadingProps = {
  children: React.ReactNode;
  count?: number;
};

export default NotificationDrawerHeading;
