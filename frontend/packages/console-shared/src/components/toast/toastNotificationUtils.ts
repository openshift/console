import { NotificationBadgeVariant } from '@patternfly/react-core';
import type { TFunction } from 'i18next';
import type { ToastNotification } from './types';
import { DEFAULT_TOAST_DRAWER_GROUP } from './types';

export const getNotificationsVariant = (
  toastUnreadCount: number,
  hasUnreadDangerNotifications: boolean,
): NotificationBadgeVariant => {
  if (hasUnreadDangerNotifications) {
    return NotificationBadgeVariant.attention;
  }
  if (toastUnreadCount > 0) {
    return NotificationBadgeVariant.unread;
  }
  return NotificationBadgeVariant.plain;
};

export const getToastDrawerGroupTitle = (groupName: string, t: TFunction): string =>
  groupName === DEFAULT_TOAST_DRAWER_GROUP ? t('Other Alerts') : groupName;

export const groupToastNotifications = (
  notifications: ToastNotification[],
): Record<string, ToastNotification[]> =>
  notifications.reduce<Record<string, ToastNotification[]>>((groups, notification) => {
    const groupName = notification.drawerGroup || DEFAULT_TOAST_DRAWER_GROUP;
    groups[groupName] = groups[groupName] ? [...groups[groupName], notification] : [notification];
    return groups;
  }, {});

export const getToastNotificationsForGroup = (
  groupedNotifications: Record<string, ToastNotification[]>,
  groupName: string,
): ToastNotification[] => groupedNotifications[groupName] || [];

export const getCustomToastDrawerGroups = (
  groupedNotifications: Record<string, ToastNotification[]>,
): string[] =>
  Object.keys(groupedNotifications).filter((groupName) => groupName !== DEFAULT_TOAST_DRAWER_GROUP);
