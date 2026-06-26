import type { FC, Ref } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  NotificationDrawerListItem,
  NotificationDrawerListItemBody,
  NotificationDrawerListItemHeader,
} from '@patternfly/react-core';
import { RhUiEllipsisVerticalIcon } from '@patternfly/react-icons';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ToastNotification } from '@console/shared/src/components/toast/types';

type ToastNotificationDrawerItemProps = {
  notification: ToastNotification;
  onClear: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
};

const mapToastVariant = (
  variant: ToastNotification['variant'],
): 'custom' | 'success' | 'danger' | 'warning' | 'info' => {
  switch (variant) {
    case AlertVariant.success:
      return 'success';
    case AlertVariant.danger:
      return 'danger';
    case AlertVariant.warning:
      return 'warning';
    case AlertVariant.info:
      return 'info';
    default:
      return 'custom';
  }
};

const ToastNotificationDrawerItem: FC<ToastNotificationDrawerItemProps> = ({
  notification,
  onClear,
  onMarkRead,
  onMarkUnread,
}) => {
  const { t } = useTranslation('public');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const drawerVariant = mapToastVariant(notification.variant);

  return (
    <NotificationDrawerListItem
      variant={drawerVariant}
      isRead={notification.isRead}
      onClick={() => onMarkRead(notification.id)}
    >
      <NotificationDrawerListItemHeader variant={drawerVariant} title={notification.title}>
        <Dropdown
          isOpen={isDropdownOpen}
          onOpenChange={(open) => setIsDropdownOpen(open)}
          onSelect={() => setIsDropdownOpen(false)}
          popperProps={{ position: 'right' }}
          toggle={(toggleRef: Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              isExpanded={isDropdownOpen}
              variant="plain"
              onClick={(event) => {
                event.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
              aria-label={t('Notification actions')}
              icon={<RhUiEllipsisVerticalIcon />}
            />
          )}
        >
          <DropdownList>
            <DropdownItem
              onClick={(event) => {
                event.stopPropagation();
                if (notification.isRead) {
                  onMarkUnread(notification.id);
                } else {
                  onMarkRead(notification.id);
                }
              }}
            >
              {notification.isRead ? t('Mark as unread') : t('Mark as read')}
            </DropdownItem>
            <DropdownItem
              onClick={(event) => {
                event.stopPropagation();
                onClear(notification.id);
              }}
            >
              {t('Clear')}
            </DropdownItem>
          </DropdownList>
        </Dropdown>
      </NotificationDrawerListItemHeader>
      <NotificationDrawerListItemBody
        timestamp={<Timestamp simple timestamp={new Date(notification.timestamp).toISOString()} />}
      >
        {notification.content}
      </NotificationDrawerListItemBody>
    </NotificationDrawerListItem>
  );
};

type ToastNotificationDrawerItemsProps = {
  notifications: ToastNotification[];
  onClear: (id: string) => void;
  onMarkRead: (id: string) => void;
  onMarkUnread: (id: string) => void;
};

export const ToastNotificationDrawerItems: FC<ToastNotificationDrawerItemsProps> = ({
  notifications,
  onClear,
  onMarkRead,
  onMarkUnread,
}) => (
  <>
    {notifications.map((notification) => (
      <ToastNotificationDrawerItem
        key={notification.id}
        notification={notification}
        onClear={onClear}
        onMarkRead={onMarkRead}
        onMarkUnread={onMarkUnread}
      />
    ))}
  </>
);
