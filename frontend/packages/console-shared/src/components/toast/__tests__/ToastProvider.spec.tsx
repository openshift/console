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
      });
      id2 = toastContext.addToast({
        title: 'test danger',
        variant: AlertVariant.danger,
        content: 'description 2',
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
      });
      toastContext.addToast({
        title: 'toast 2',
        variant: AlertVariant.info,
        content: 'description 2',
      });
      toastContext.addToast({
        title: 'toast 3',
        variant: AlertVariant.info,
        content: 'description 3',
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
      });
      toastContext.addToast({
        title: 'toast 2',
        variant: AlertVariant.info,
        content: 'description 2',
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
      });
      toastContext.addToast({
        id: 'toast-two',
        onClose: onCloseTwo,
        title: 'toast two',
        variant: AlertVariant.info,
        content: 'description 2',
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

  it('should not persist toast in drawer when persistInDrawer is false', async () => {
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'ephemeral toast',
        variant: AlertVariant.success,
        content: 'toast only',
        persistInDrawer: false,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('ephemeral toast')).toBeVisible();
      expect(notificationHistoryContext.notifications).toHaveLength(0);
    });
  });

  it('should force skipOverflow when persistInDrawer is false', async () => {
    renderWithProviders(
      <ToastProvider maxDisplayed={DEFAULT_MAX_DISPLAYED_TOASTS}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        toastContext.addToast({
          id: `ephemeral-${index}`,
          title: `ephemeral toast ${index}`,
          variant: AlertVariant.info,
          content: `description ${index}`,
          persistInDrawer: false,
          skipOverflow: false,
        });
      }
    });

    await waitFor(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        expect(screen.getByText(`ephemeral toast ${index}`)).toBeVisible();
      }
      expect(screen.queryByText(/View .* more notification/)).not.toBeInTheDocument();
      expect(notificationHistoryContext.notifications).toHaveLength(0);
    });
  });

  it('should show all ephemeral toasts without overflow link', async () => {
    renderWithProviders(
      <ToastProvider maxDisplayed={DEFAULT_MAX_DISPLAYED_TOASTS}>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        toastContext.addToast({
          id: `ephemeral-${index}`,
          title: `ephemeral toast ${index}`,
          variant: AlertVariant.info,
          content: `description ${index}`,
          persistInDrawer: false,
          skipOverflow: true,
        });
      }
    });

    await waitFor(() => {
      for (let index = 1; index <= DEFAULT_MAX_DISPLAYED_TOASTS + 1; index += 1) {
        expect(screen.getByText(`ephemeral toast ${index}`)).toBeVisible();
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
      });
      toastContext.addToast({
        title: 'capped toast 2',
        variant: AlertVariant.info,
        content: 'capped 2',
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
});
