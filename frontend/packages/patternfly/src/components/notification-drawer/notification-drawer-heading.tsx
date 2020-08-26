import * as React from 'react';

const NotificationDrawerHeading: React.FC<NotificationDrawerHeadingProps> = ({
  count,
  children,
  onClose,
}) => (
  <div className="pf-c-notification-drawer">
    <div className="pf-c-notification-drawer__header">
      <h1 className="pf-c-notification-drawer__header-title">Notifications</h1>
      {count && (
        <span className="pf-c-notification-drawer__header-status">{`${count} unread`}</span>
      )}
      <div className="pf-c-notification-drawer__header-action">
        <div className="pf-c-notification-drawer__header-action-close">
          <button
            className="pf-c-button pf-m-plain"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
    <div className="pf-c-notification-drawer__body">
      <div className="pf-c-notification-drawer__group-list">{children}</div>
    </div>
  </div>
);

type NotificationDrawerHeadingProps = {
  children: React.ReactNode;
  count?: number;
  /** A callback for when the close button is clicked */
  onClose: () => void;
};

export default NotificationDrawerHeading;
