import { useContext } from 'react';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import type { ToastContextType } from '../ToastContext';
import ToastContext, { ToastVariant } from '../ToastContext';
import ToastProvider from '../ToastProvider';

describe('ToastProvider', () => {
  let toastContext: ToastContextType;

  const TestComponent = () => {
    toastContext = useContext(ToastContext);
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
        variant: ToastVariant.success,
        content: 'description 1',
      });
      id2 = toastContext.addToast({
        title: 'test danger',
        variant: ToastVariant.danger,
        content: 'description 2',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
      expect(screen.getByText('test danger')).toBeVisible();
    });

    expect(screen.getByText('description 1')).toBeVisible();
    expect(screen.getByText('description 2')).toBeVisible();

    act(() => {
      toastContext.removeToast(id1);
      toastContext.removeToast(id2);
    });

    await waitFor(() => {
      expect(screen.queryByText('test success')).not.toBeInTheDocument();
      expect(screen.queryByText('test danger')).not.toBeInTheDocument();
    });
  });

  it('should dismiss toast on action', async () => {
    const actionFn = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: ToastVariant.success,
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
    fireEvent.click(actionButton);

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
        variant: ToastVariant.success,
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
    expect(actionLink.closest('a')).toBeVisible();
  });

  it('should dismiss toast on action on anchor click', async () => {
    const actionFn = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: ToastVariant.success,
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
    const anchorElement = actionLink.closest('a');
    if (anchorElement) {
      fireEvent.click(anchorElement);
    }

    expect(actionFn).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByText('test success')).not.toBeInTheDocument();
    });
  });

  it('should call onToastClose if provided on toast close', async () => {
    const toastClose = jest.fn();
    renderWithProviders(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    act(() => {
      toastContext.addToast({
        title: 'test success',
        variant: ToastVariant.success,
        content: 'description 1',
        onClose: toastClose,
        dismissible: true,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('test success')).toBeVisible();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(toastClose).toHaveBeenCalled();
  });
});
