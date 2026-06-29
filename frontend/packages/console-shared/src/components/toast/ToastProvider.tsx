import type { FC, ReactNode } from 'react';
import { useState, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  AlertGroup,
  AlertActionCloseButton,
  AlertActionLink,
  AlertVariant,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type {
  ToastOptions,
  ToastContextValues,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { NotificationHistoryContext } from './NotificationHistoryContext';
import { ToastContext } from './ToastContext';
import { getOverflowCount, getVisibleToasts, normalizeToastOptions } from './toastDisplayUtils';
import type { ToastNotification, ToastRenderOptions } from './types';
import {
  DEFAULT_MAX_DISPLAYED_TOASTS,
  DEFAULT_MAX_NOTIFICATION_HISTORY,
  DEFAULT_TOAST_DRAWER_GROUP,
} from './types';

interface ToastProviderProps {
  children?: ReactNode;
  isNotificationDrawerExpanded?: boolean;
  maxDisplayed?: number;
  onNotificationDrawerOpen?: () => void;
}

/** Stable reference to append toast alerts to the document body */
const appendTo = () => document.body;

const toToastNotification = (toast: ToastRenderOptions): ToastNotification => ({
  ...toast,
  timestamp: Date.now(),
  isRead: false,
  drawerGroup: toast.drawerGroup ?? DEFAULT_TOAST_DRAWER_GROUP,
});

export const ToastProvider: FC<ToastProviderProps> = ({
  children,
  isNotificationDrawerExpanded = false,
  maxDisplayed = DEFAULT_MAX_DISPLAYED_TOASTS,
  onNotificationDrawerOpen,
}) => {
  const { t } = useTranslation('console-shared');
  const [toasts, setToasts] = useState<ToastRenderOptions[]>([]);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const toastIdCounterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((state) => {
      const index = state.findIndex((toast) => toast.id === id);
      if (index !== -1) {
        const toast = state[index];
        if (toast.onRemove) {
          toast.onRemove(toast.id);
        }
        return [...state.slice(0, index), ...state.slice(index + 1, state.length)];
      }
      return state;
    });
    setNotifications((state) => state.filter((notification) => notification.id !== id));
  }, []);

  const clearVisibleToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (toast: ToastOptions) => {
      const clone: ToastRenderOptions = normalizeToastOptions({
        id: toast.id || `toast-${++toastIdCounterRef.current}`,
        ...toast,
      });

      setNotifications((state) => {
        if (clone.persistInDrawer !== true) {
          return state;
        }
        const notification = toToastNotification(clone);
        const next = [notification, ...state.filter((item) => item.id !== notification.id)];
        return next.slice(0, DEFAULT_MAX_NOTIFICATION_HISTORY);
      });

      if (!isNotificationDrawerExpanded) {
        setToasts((state) => {
          const index = state.findIndex((item) => item.id === clone.id);
          if (index !== -1) {
            return [clone, ...state.slice(0, index), ...state.slice(index + 1, state.length)];
          }
          return [clone, ...state];
        });
      }

      return clone.id;
    },
    [isNotificationDrawerExpanded],
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((state) =>
      state.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

  const markNotificationUnread = useCallback((id: string) => {
    setNotifications((state) =>
      state.map((notification) =>
        notification.id === id ? { ...notification, isRead: false } : notification,
      ),
    );
  }, []);

  const clearNotification = useCallback(
    (id: string) => {
      setNotifications((state) => {
        const notification = state.find((item) => item.id === id);
        notification?.onClose?.();
        return state.filter((item) => item.id !== id);
      });
      removeToast(id);
    },
    [removeToast],
  );

  const clearAllNotifications = useCallback(() => {
    setNotifications((state) => {
      state.forEach((notification) => notification.onClose?.());
      return [];
    });
    clearVisibleToasts();
  }, [clearVisibleToasts]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((state) => state.map((notification) => ({ ...notification, isRead: true })));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const hasUnreadDangerNotifications = useMemo(
    () =>
      notifications.some(
        (notification) => !notification.isRead && notification.variant === AlertVariant.danger,
      ),
    [notifications],
  );

  const overflowMessage = useMemo(() => {
    const overflow = getOverflowCount(toasts, maxDisplayed);
    if (overflow > 0) {
      return t('View {{count}} more notification', { count: overflow });
    }
    return '';
  }, [maxDisplayed, t, toasts]);

  const onOverflowClick = useCallback(() => {
    clearVisibleToasts();
    onNotificationDrawerOpen?.();
  }, [clearVisibleToasts, onNotificationDrawerOpen]);

  const toastController = useMemo<ToastContextValues>(
    () => ({
      addToast,
      removeToast,
    }),
    [addToast, removeToast],
  );

  const notificationHistoryController = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasUnreadDangerNotifications,
      markNotificationRead,
      markNotificationUnread,
      clearNotification,
      clearAllNotifications,
      markAllNotificationsRead,
    }),
    [
      clearAllNotifications,
      clearNotification,
      hasUnreadDangerNotifications,
      markAllNotificationsRead,
      markNotificationRead,
      markNotificationUnread,
      notifications,
      unreadCount,
    ],
  );

  const visibleToasts = useMemo(() => getVisibleToasts(toasts, maxDisplayed), [
    maxDisplayed,
    toasts,
  ]);

  return (
    <ToastContext.Provider value={toastController}>
      <NotificationHistoryContext.Provider value={notificationHistoryController}>
        {children}
        {!isNotificationDrawerExpanded && toasts.length > 0 ? (
          <AlertGroup
            appendTo={appendTo}
            isToast
            isLiveRegion
            overflowMessage={overflowMessage}
            onOverflowClick={onOverflowClick}
          >
            {visibleToasts.map((toast) => (
              <Alert
                key={toast.id}
                title={toast.title}
                variant={toast.variant}
                timeout={toast.timeout}
                onTimeout={() => removeToast(toast.id)}
                data-test={toast.dataTest || `${toast.title} alert`}
                actionClose={
                  toast.dismissible ? (
                    <AlertActionCloseButton
                      onClose={() => {
                        toast.onClose && toast.onClose();
                        removeToast(toast.id);
                      }}
                    />
                  ) : undefined
                }
                actionLinks={
                  toast.actions?.length > 0 ? (
                    <>
                      {toast.actions.map((action) => (
                        <AlertActionLink
                          key={action.label}
                          onClick={() => {
                            if (action.dismiss) {
                              removeToast(toast.id);
                            }
                            action.callback();
                          }}
                          component={action.component}
                          data-test={action.dataTest || 'toast-action'}
                        >
                          {action.label}
                        </AlertActionLink>
                      ))}
                    </>
                  ) : undefined
                }
              >
                {toast.content}
              </Alert>
            ))}
          </AlertGroup>
        ) : null}
      </NotificationHistoryContext.Provider>
    </ToastContext.Provider>
  );
};
