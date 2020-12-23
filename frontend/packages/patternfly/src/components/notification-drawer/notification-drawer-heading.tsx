import * as React from 'react';
import { useTranslation } from 'react-i18next';

const NotificationDrawerHeading: React.FC<NotificationDrawerHeadingProps> = ({
  count,
  children,
  onClose,
}) => {
  const { t } = useTranslation();
  return (
    <div className="pf-c-notification-drawer">
      <div className="pf-c-notification-drawer__header">
        <h1 className="pf-c-notification-drawer__header-title">
          {t('notification-drawer~Notifications')}
        </h1>
        {count && (
          <span className="pf-c-notification-drawer__header-status">
            {t('notification-drawer~{{count}} unread', { count })}
          </span>
        )}
        <div className="pf-c-notification-drawer__header-action">
          <div className="pf-c-notification-drawer__header-action-close">
            <button
              className="pf-c-button pf-m-plain"
              type="button"
              aria-label={t('notification-drawer~Close')}
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
};

type NotificationDrawerHeadingProps = {
  children: React.ReactNode;
  count?: number;
  /** A callback for when the close button is clicked */
  onClose: () => void;
};

export default NotificationDrawerHeading;
