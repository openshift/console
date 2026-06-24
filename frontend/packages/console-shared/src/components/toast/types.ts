import type { ToastOptions } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

/** Internal grouping key for the default notification drawer section. Use `getToastDrawerGroupTitle` for display. */
export const DEFAULT_TOAST_DRAWER_GROUP = 'default';
export const DEFAULT_MAX_DISPLAYED_TOASTS = 3;
export const DEFAULT_MAX_NOTIFICATION_HISTORY = 100;

export type ToastNotification = ToastOptions & {
  id: string;
  timestamp: number;
  isRead: boolean;
  drawerGroup: string;
};

export type NotificationHistoryContextValues = {
  notifications: ToastNotification[];
  unreadCount: number;
  hasUnreadDangerNotifications: boolean;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markAllNotificationsRead: () => void;
};
