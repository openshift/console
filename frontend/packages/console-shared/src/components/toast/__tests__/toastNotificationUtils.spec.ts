import { NotificationBadgeVariant } from '@patternfly/react-core';
import type { TFunction } from 'i18next';
import {
  getCustomToastDrawerGroups,
  getNotificationsVariant,
  getToastDrawerGroupTitle,
  getToastNotificationsForGroup,
  groupToastNotifications,
} from '../toastNotificationUtils';
import type { ToastNotification } from '../types';
import { DEFAULT_TOAST_DRAWER_GROUP } from '../types';

const t = ((key: string) => key) as TFunction;

const notification = (id: string, drawerGroup?: string): ToastNotification =>
  ({
    id,
    title: id,
    variant: 'info',
    content: id,
    timestamp: 0,
    isRead: false,
    drawerGroup: drawerGroup || DEFAULT_TOAST_DRAWER_GROUP,
  } as ToastNotification);

describe('toastNotificationUtils', () => {
  it('should group notifications by drawer group', () => {
    const grouped = groupToastNotifications([
      notification('toast-1'),
      notification('toast-2', 'Uploads'),
      notification('toast-3', 'Uploads'),
    ]);

    expect(grouped[DEFAULT_TOAST_DRAWER_GROUP]).toHaveLength(1);
    expect(grouped.Uploads).toHaveLength(2);
  });

  it('should return notifications for a group', () => {
    const grouped = groupToastNotifications([notification('toast-1', 'Uploads')]);

    expect(getToastNotificationsForGroup(grouped, 'Uploads')).toHaveLength(1);
    expect(getToastNotificationsForGroup(grouped, 'Missing')).toEqual([]);
  });

  it('should return custom drawer groups excluding the default group', () => {
    const grouped = groupToastNotifications([
      notification('toast-1'),
      notification('toast-2', 'Uploads'),
      notification('toast-3', 'Operations'),
    ]);

    expect(getCustomToastDrawerGroups(grouped)).toEqual(['Uploads', 'Operations']);
  });

  it('should translate the default drawer group title', () => {
    expect(getToastDrawerGroupTitle(DEFAULT_TOAST_DRAWER_GROUP, t)).toBe('Other Alerts');
    expect(getToastDrawerGroupTitle('Uploads', t)).toBe('Uploads');
  });

  it('should resolve notification badge variant from toast unread state', () => {
    expect(getNotificationsVariant(0, true)).toBe(NotificationBadgeVariant.attention);
    expect(getNotificationsVariant(2, false)).toBe(NotificationBadgeVariant.unread);
    expect(getNotificationsVariant(0, false)).toBe(NotificationBadgeVariant.plain);
  });
});
