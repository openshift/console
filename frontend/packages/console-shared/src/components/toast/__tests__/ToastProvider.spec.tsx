import { useContext } from 'react';
import { AlertVariant } from '@patternfly/react-core';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ToastContextValues } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { NotificationHistoryContext } from '../NotificationHistoryContext';
import { ToastContext } from '../ToastContext';
import { ToastProvider } from '../ToastProvider';
import type { NotificationHistoryContextValues } from '../types';
import { DEFAULT_MAX_DISPLAYED_TOASTS } from '../types';

describe('ToastProvider', () => {
  let toastContext: ToastContextValues;
  let notificationHistoryContext: NotificationHistoryContextValues;

  const TestComponent = () => {
    toastContext = useContext(ToastContext);
    notificationHistoryContext = useContext(NotificationHistoryContext);
    return null;
  };

  it('should provide a context', () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    expect(typeof toastContext.addToast).toBe('function');
    expect(typeof toastContext.removeToast).toBe('function');
    expect(typeof notificationHistoryContext.clearNotification).toBe('function');
  });

  it('should add and remove alerts', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    // fixed id
    const id1 = 'foo';
    // generated id
    let id2: string;

    act(() => {
      toastContext.addToast({
        id: id1,
        title: 'test success',
        variant: AlertVariant.success,
        content: 'description 1',
        persistInDrawer: true,
      });
      id2 = toastContext.addToast({
        title: 'test danger',
        variant: AlertVariant.danger,
        content: 'description 2',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
      expect(screen.getByText('test danger')).toBeVisible();
    });

    expect(screen.getByText('description 1')).toBeVisible();
    expect(screen.getByText('description 2')).toBeVisible();
    expect(notificationHistoryContext.notifications).toHaveLength(2);

    act(() => {
      toastContext.removeToast(id1);
      toastContext.removeToast(id2);
    });

    await waitFor(() => {
      expect(screen.queryByText('test success')).not.toBeInTheDocument();
      expect(screen.queryByText('test danger')).not.toBeInTheDocument();
    });
    expect(notificationHistoryContext.notifications).toHaveLength(0);
  });

  it('should cap visible toasts and show overflow message', async () => {
    const onNotificationDrawerOpen = jest.fn();
    renderWithProviders(
      <ToastProvider maxDisplayed={2} onNotificationDrawerOpen={onNotificationDrawerOpen}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'toast 1',
        variant: AlertVariant.info,
        content: 'description 1',
        persistInDrawer: true,
      });
      toastContext.addToast({
        title: 'toast 2',
        variant: AlertVariant.info,
        content: 'description 2',
        persistInDrawer: true,
      });
      toastContext.addToast({
        title: 'toast 3',
        variant: AlertVariant.info,
        content: 'description 3',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('toast 3')).toBeVisible();
      expect(screen.getByText('toast 2')).toBeVisible();
      expect(screen.queryByText('toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('View 1 more notification')).toBeVisible();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('View 1 more notification'));
    expect(onNotificationDrawerOpen).toHaveBeenCalledTimes(1);
  });

  it('should keep incrementing generated toast ids when notification drawer expansion changes', async () => {
    const { rerender } = renderWithProviders(
      <ToastProvider isNotificationDrawerExpanded={false}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'toast 1',
        variant: AlertVariant.info,
        content: 'description 1',
        persistInDrawer: true,
      });
      toastContext.addToast({
        title: 'toast 2',
        variant: AlertVariant.info,
        content: 'description 2',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(2);
    });

    rerender(
      <ToastProvider isNotificationDrawerExpanded>
        <TestComponent />
      </ToastProvider>,
    );

    let thirdToastId: string;
    act(() => {
      thirdToastId = toastContext.addToast({
        title: 'toast 3',
        variant: AlertVariant.warning,
        content: 'description 3',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(thirdToastId).toBe('toast-3');
      expect(notificationHistoryContext.notifications).toHaveLength(3);
      expect(notificationHistoryContext.notifications.map(({ id }) => id)).toEqual([
        'toast-3',
        'toast-2',
        'toast-1',
      ]);
      expect(notificationHistoryContext.notifications.map(({ title }) => title)).toEqual([
        'toast 3',
        'toast 2',
        'toast 1',
      ]);
    });
  });

  it('should clear notification history and invoke onClose when cleared from the drawer', async () => {
    const onClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'toast-history',
        title: 'history toast',
        variant: AlertVariant.success,
        content: 'history description',
        onClose,
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(1);
    });

    act(() => {
      notificationHistoryContext.clearNotification('toast-history');
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(0);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should invoke onClose for all notifications when clearing the drawer', async () => {
    const onCloseOne = jest.fn();
    const onCloseTwo = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'toast-one',
        onClose: onCloseOne,
        title: 'toast one',
        variant: AlertVariant.info,
        content: 'description 1',
        persistInDrawer: true,
      });
      toastContext.addToast({
        id: 'toast-two',
        onClose: onCloseTwo,
        title: 'toast two',
        variant: AlertVariant.info,
        content: 'description 2',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(2);
    });

    act(() => {
      notificationHistoryContext.clearAllNotifications();
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(0);
      expect(onCloseOne).toHaveBeenCalledTimes(1);
      expect(onCloseTwo).toHaveBeenCalledTimes(1);
    });
  });

  it('should replace notification history when a toast is removed and replaced', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'upload-progress',
        title: 'Uploading',
        variant: AlertVariant.info,
        content: 'in progress',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(1);
    });

    act(() => {
      toastContext.removeToast('upload-progress');
      toastContext.addToast({
        id: 'upload-complete',
        title: 'Upload complete',
        variant: AlertVariant.success,
        content: 'done',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications).toHaveLength(1);
      expect(notificationHistoryContext.notifications[0].id).toBe('upload-complete');
    });
  });

  it('should not show toast when notification drawer is expanded', async () => {
    renderWithProviders(
      <ToastProvider isNotificationDrawerExpanded>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'drawer toast',
        variant: AlertVariant.info,
        content: 'drawer description',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('drawer toast')).not.toBeInTheDocument();
      expect(notificationHistoryContext.notifications).toHaveLength(1);
    });
  });

  it('should hide visible toasts when notification drawer is opened', async () => {
    const { rerender } = renderWithProviders(
      <ToastProvider isNotificationDrawerExpanded={false}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'visible toast',
        variant: AlertVariant.info,
        content: 'visible description',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('visible toast')).toBeInTheDocument();
    });

    rerender(
      <ToastProvider isNotificationDrawerExpanded>
        <TestComponent />
      </ToastProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText('visible toast')).not.toBeInTheDocument();
      expect(notificationHistoryContext.notifications).toHaveLength(1);
    });
  });

  it('should not persist default toasts in the drawer', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'default toast',
        variant: AlertVariant.success,
        content: 'toast only',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('default toast')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(0);
    });
  });

  it('should persist toast in drawer when persistInDrawer is true', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'drawer toast',
        variant: AlertVariant.success,
        content: 'persisted in drawer',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('drawer toast')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(1);
    });
  });

  it('should default skipOverflow to false when persistInDrawer is true', async () => {
    const totalToasts = DEFAULT_MAX_DISPLAYED_TOASTS + 1;
    renderWithProviders(
      <ToastProvider maxDisplayed={DEFAULT_MAX_DISPLAYED_TOASTS}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      for (let index = 1; index <= totalToasts; index += 1) {
        toastContext.addToast({
          id: `drawer-${index}`,
          title: `drawer toast ${index}`,
          variant: AlertVariant.info,
          content: `description ${index}`,
          persistInDrawer: true,
        });
      }
    });

    await waitFor(() => {
      for (let index = 2; index <= totalToasts; index += 1) {
        expect(screen.getByText(`drawer toast ${index}`)).toBeVisible();
      }
      expect(screen.queryByText('drawer toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('View 1 more notification')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(totalToasts);
    });
  });

  it('should show all default toasts without overflow link', async () => {
    renderWithProviders(
      <ToastProvider maxDisplayed={DEFAULT_MAX_DISPLAYED_TOASTS}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        toastContext.addToast({
          id: `default-${index}`,
          title: `default toast ${index}`,
          variant: AlertVariant.info,
          content: `description ${index}`,
        });
      }
    });

    await waitFor(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        expect(screen.getByText(`default toast ${index}`)).toBeVisible();
      }
      expect(screen.queryByText(/View .* more notification/)).not.toBeInTheDocument();
    });
  });

  it('should always show skipOverflow toasts without triggering overflow', async () => {
    renderWithProviders(
      <ToastProvider maxDisplayed={1}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'always-visible',
        title: 'always visible toast',
        variant: AlertVariant.info,
        content: 'always visible',
        skipOverflow: true,
      });
      toastContext.addToast({
        title: 'capped toast 1',
        variant: AlertVariant.info,
        content: 'capped 1',
        persistInDrawer: true,
      });
      toastContext.addToast({
        title: 'capped toast 2',
        variant: AlertVariant.info,
        content: 'capped 2',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('always visible toast')).toBeVisible();
      expect(screen.getByText('capped toast 2')).toBeVisible();
      expect(screen.queryByText('capped toast 1')).not.toBeInTheDocument();
      expect(screen.getByText('View 1 more notification')).toBeVisible();
    });
  });

  it('should dismiss toast on action', async () => {
    const user = userEvent.setup();
    const actionFn = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: AlertVariant.success,
        content: 'description 1',
        actions: [
          {
            label: 'action 1',
            dismiss: true,
            callback: actionFn,
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
    });

    const actionButton = screen.getByRole('button', { name: /action 1/i });
    await user.click(actionButton);

    expect(actionFn).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText('test success')).not.toBeInTheDocument();
    });
  });

  it('should have anchor tag if component "a" is passed', async () => {
    const actionFn = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: AlertVariant.success,
        content: 'description 1',
        actions: [
          {
            label: 'action 1',
            dismiss: true,
            callback: actionFn,
            component: 'a',
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
    });

    const actionLink = await screen.findByText('action 1');
    expect(actionLink).toBeVisible();
    expect(screen.queryByRole('button', { name: 'action 1' })).not.toBeInTheDocument();
  });

  it('should dismiss toast on action on anchor click', async () => {
    const user = userEvent.setup();
    const actionFn = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: AlertVariant.success,
        content: 'description 1',
        actions: [
          {
            label: 'action 1',
            dismiss: true,
            callback: actionFn,
            component: 'a',
          },
        ],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeInTheDocument();
    });

    const actionLink = await screen.findByText('action 1');
    await user.click(actionLink);

    expect(actionFn).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText('test success')).not.toBeInTheDocument();
    });
  });

  it('should call onToastClose if provided on toast close', async () => {
    const user = userEvent.setup();
    const toastClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: AlertVariant.success,
        content: 'description 1',
        onClose: toastClose,
        dismissible: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(toastClose).toHaveBeenCalled();
    });
  });

  it('should minimize a non-dismissible drawer-persisted toast as an icon button without invoking onClose and keep it unread in history', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'upload-progress',
        title: 'Uploading disk.img',
        variant: AlertVariant.info,
        content: 'in progress',
        dismissible: false,
        timeout: false,
        persistInDrawer: true,
        skipOverflow: true,
        minimizable: true,
        onClose,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Uploading disk.img')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(1);
      expect(notificationHistoryContext.notifications[0].isRead).toBe(false);
    });

    act(() => {
      notificationHistoryContext.markNotificationRead('upload-progress');
    });

    await waitFor(() => {
      expect(notificationHistoryContext.notifications[0].isRead).toBe(true);
    });

    // Non-dismissible toasts have no close button, so Minimize renders as an icon
    // button in that slot instead of a text action link.
    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument();
    const minimizeButton = screen.getByRole('button', {
      name: 'Minimize alert: Uploading disk.img',
    });
    await user.click(minimizeButton);

    await waitFor(() => {
      expect(screen.queryByText('Uploading disk.img')).not.toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(notificationHistoryContext.notifications).toHaveLength(1);
    expect(notificationHistoryContext.notifications[0].isRead).toBe(false);
  });

  it('should minimize a dismissible drawer-persisted toast via an explicit minimize action, alongside the close button', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'dismissible-minimizable',
        title: 'dismissible minimizable toast',
        variant: AlertVariant.info,
        content: 'description',
        dismissible: true,
        persistInDrawer: true,
        actions: [{ label: 'Minimize', minimize: true, callback: jest.fn() }],
        onClose,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('dismissible minimizable toast')).toBeVisible();
    });

    // This toast never sets `minimizable`, so Minimize only comes from the
    // explicit `actions[].minimize` entry, rendered as a text link.
    expect(
      screen.queryByRole('button', { name: 'Minimize alert: dismissible minimizable toast' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    const minimizeLink = screen.getByRole('button', { name: 'Minimize' });
    await user.click(minimizeLink);

    await waitFor(() => {
      expect(screen.queryByText('dismissible minimizable toast')).not.toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(notificationHistoryContext.notifications).toHaveLength(1);
    expect(notificationHistoryContext.notifications[0].isRead).toBe(false);
  });

  it('should render the minimize action at the position specified in the actions array', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'ordered-actions',
        title: 'ordered actions toast',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
        actions: [
          { label: 'View details', callback: jest.fn() },
          { label: 'Minimize', minimize: true, callback: jest.fn() },
          { label: 'Retry', callback: jest.fn() },
        ],
      });
    });

    let buttons: HTMLElement[];
    await waitFor(() => {
      buttons = screen.getAllByRole('button', {
        name: /^(View details|Minimize|Retry)$/,
      });
      expect(buttons).toHaveLength(3);
    });

    expect(buttons.map((button) => button.textContent)).toEqual([
      'View details',
      'Minimize',
      'Retry',
    ]);
  });

  it('should still invoke a minimize action callback in addition to minimizing', async () => {
    const user = userEvent.setup();
    const minimizeCallback = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'minimize-with-callback',
        title: 'minimize with callback toast',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
        actions: [{ label: 'Minimize', minimize: true, callback: minimizeCallback }],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('minimize with callback toast')).toBeVisible();
    });

    const minimizeLink = screen.getByRole('button', { name: 'Minimize' });
    await user.click(minimizeLink);

    await waitFor(() => {
      expect(screen.queryByText('minimize with callback toast')).not.toBeInTheDocument();
    });
    expect(minimizeCallback).toHaveBeenCalledTimes(1);
    expect(notificationHistoryContext.notifications).toHaveLength(1);
  });

  it('should render an explicit minimize action even without persistInDrawer, but clicking it has no effect', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'no-drawer-minimize-action',
        title: 'no drawer minimize action toast',
        variant: AlertVariant.info,
        content: 'description',
        actions: [{ label: 'Minimize', minimize: true, callback: jest.fn() }],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('no drawer minimize action toast')).toBeVisible();
    });

    const minimizeLink = screen.getByRole('button', { name: 'Minimize' });
    await user.click(minimizeLink);

    await waitFor(() => {
      // No-op: `minimizeToast` only takes effect for `persistInDrawer: true` toasts.
      expect(screen.getByText('no drawer minimize action toast')).toBeVisible();
    });
  });

  it('should not minimize a toast that is not persisted in the drawer', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'ephemeral-toast',
        title: 'ephemeral toast',
        variant: AlertVariant.info,
        content: 'on screen only',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('ephemeral toast')).toBeVisible();
    });

    act(() => {
      toastContext.minimizeToast('ephemeral-toast');
    });

    await waitFor(() => {
      expect(screen.getByText('ephemeral toast')).toBeVisible();
    });
    expect(notificationHistoryContext.notifications).toHaveLength(0);
  });

  it('should not reset a notification to unread when its toast was already cleared from the visible stack', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ToastProvider maxDisplayed={1}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'stale-notification',
        title: 'stale notification toast',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
      });
    });

    act(() => {
      notificationHistoryContext.markNotificationRead('stale-notification');
    });

    act(() => {
      toastContext.addToast({
        title: 'overflow toast',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('View 1 more notification')).toBeVisible();
    });

    // Clears the visible toast stack (e.g. via the overflow link) while notification
    // history, including the already-read entry below, is left untouched.
    await user.click(screen.getByText('View 1 more notification'));

    await waitFor(() => {
      expect(screen.queryByText('stale notification toast')).not.toBeInTheDocument();
    });

    act(() => {
      toastContext.minimizeToast('stale-notification');
    });

    expect(notificationHistoryContext.notifications).toHaveLength(2);
    expect(
      notificationHistoryContext.notifications.find((n) => n.id === 'stale-notification').isRead,
    ).toBe(true);
  });

  it('should not render an automatic Minimize icon button when minimizable or persistInDrawer is missing, or no actions are given', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'minimizable-no-drawer',
        title: 'minimizable without drawer',
        variant: AlertVariant.info,
        content: 'description',
        minimizable: true,
      });
      toastContext.addToast({
        id: 'drawer-not-minimizable',
        title: 'drawer toast not minimizable',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('minimizable without drawer')).toBeVisible();
      expect(screen.getByText('drawer toast not minimizable')).toBeVisible();
    });

    expect(screen.queryByRole('button', { name: 'Minimize' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Minimize alert:/ })).not.toBeInTheDocument();
  });

  it('should render both the icon button and an explicit minimize action when both are configured', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'both-minimize-controls',
        title: 'explicit action toast',
        variant: AlertVariant.info,
        content: 'description',
        dismissible: false,
        persistInDrawer: true,
        minimizable: true,
        actions: [{ label: 'Custom minimize', minimize: true, callback: jest.fn() }],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('explicit action toast')).toBeVisible();
    });

    // Each mechanism is controlled independently: `minimizable` alone gates the icon
    // button, so consumers who only want the action link simply omit `minimizable`.
    expect(
      screen.getByRole('button', { name: 'Minimize alert: explicit action toast' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom minimize' })).toBeInTheDocument();
  });

  it('should not render the icon button when minimizable is not set, even with an explicit minimize action', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'action-only-minimize',
        title: 'action only toast',
        variant: AlertVariant.info,
        content: 'description',
        dismissible: false,
        persistInDrawer: true,
        actions: [{ label: 'Custom minimize', minimize: true, callback: jest.fn() }],
      });
    });

    await waitFor(() => {
      expect(screen.getByText('action only toast')).toBeVisible();
    });

    expect(
      screen.queryByRole('button', { name: 'Minimize alert: action only toast' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Custom minimize' })).toBeInTheDocument();
  });

  it('should minimize a toast via an action with a custom label, without invoking onClose and keeping it unread', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        id: 'custom-label-minimize',
        title: 'custom label minimize toast',
        variant: AlertVariant.info,
        content: 'description',
        persistInDrawer: true,
        actions: [{ label: 'Hide for now', minimize: true, callback: jest.fn() }],
        onClose,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('custom label minimize toast')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(1);
      expect(notificationHistoryContext.notifications[0].isRead).toBe(false);
    });

    const minimizeLink = screen.getByRole('button', { name: 'Hide for now' });
    await user.click(minimizeLink);

    await waitFor(() => {
      expect(screen.queryByText('custom label minimize toast')).not.toBeInTheDocument();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(notificationHistoryContext.notifications).toHaveLength(1);
    expect(notificationHistoryContext.notifications[0].isRead).toBe(false);
  });
});
