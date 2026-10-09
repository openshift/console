import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as _ from 'lodash';
import { k8sGetResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useOperands } from '@console/shared/src/hooks/useOperands';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { testSubscription, dummyPackageManifest } from '../../../../mocks';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../../models';
import type { UninstallOperatorModalProps } from '../uninstall-operator-modal';
import { UninstallOperatorModal } from '../uninstall-operator-modal';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useOperands', () => ({
  useOperands: jest.fn(),
}));

jest.mock('@console/shared/src/components/modals/ModalFooterWithAlerts', () => ({
  ModalFooterWithAlerts: jest.fn(({ children }) => children),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key.replace(/^[^~]+~/, ''), // Remove namespace prefix (e.g., "olm~")
    i18n: { language: 'en' },
  }),
  withTranslation: () => (component) => component,
  Trans: () => null,
}));

const mockNavigate = jest.fn();
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: () => mockNavigate,
}));

const mockK8sKill = jest.fn();

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sGetResource: jest.fn(),
  k8sKill: (...args) => mockK8sKill(...args),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  ...jest.requireActual('@console/shared/src/utils/console-fetch'),
  coFetchJSON: jest.fn(),
}));

describe('UninstallOperatorModal', () => {
  let uninstallOperatorModalProps: UninstallOperatorModalProps;

  beforeEach(() => {
    jest.clearAllMocks();
    mockK8sKill.mockResolvedValue({});
    (k8sGetResource as jest.Mock).mockResolvedValue({});

    uninstallOperatorModalProps = {
      subscription: {
        ..._.cloneDeep(testSubscription),
        status: { installedCSV: 'testapp.v1.0.0' },
      },
      close: jest.fn(),
      cancel: jest.fn(),
    };

    (useK8sWatchResource as jest.Mock).mockReturnValue([dummyPackageManifest, true, null]);
    (useAccessReview as jest.Mock).mockReturnValue(false);
    (useOperands as jest.Mock).mockReturnValue([[], true, '']);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays modal title and uninstall button when rendered', () => {
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    expect(screen.getByText('Uninstall Operator?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Uninstall' })).toBeVisible();
  });

  it('deletes subscription when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    await user.click(uninstallButton);

    await waitFor(() => {
      expect(mockK8sKill).toHaveBeenCalledTimes(2);
    });

    expect(mockK8sKill).toHaveBeenCalledWith(
      SubscriptionModel,
      uninstallOperatorModalProps.subscription,
      {},
      {},
      expect.objectContaining({
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      }),
    );
  });

  it('deletes ClusterServiceVersion when form is submitted', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    await user.click(uninstallButton);

    await waitFor(() => {
      expect(mockK8sKill).toHaveBeenCalledTimes(2);
    });

    expect(mockK8sKill).toHaveBeenCalledWith(
      ClusterServiceVersionModel,
      expect.objectContaining({
        metadata: expect.objectContaining({
          name: 'testapp.v1.0.0',
          namespace: testSubscription.metadata.namespace,
        }),
      }),
      {},
      {},
      expect.objectContaining({
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      }),
    );
  });

  it('does not delete ClusterServiceVersion when installedCSV is missing from subscription', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UninstallOperatorModal {...uninstallOperatorModalProps} subscription={testSubscription} />,
    );

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    await user.click(uninstallButton);

    await waitFor(() => {
      expect(mockK8sKill).toHaveBeenCalledTimes(1);
    });
  });

  it('calls close callback after successful form submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    await user.click(uninstallButton);

    await waitFor(() => {
      expect(uninstallOperatorModalProps.close).toHaveBeenCalledTimes(1);
    });
  });

  it.each(['success', 'failure'])(
    'finishes uninstall once when a successful poll is followed by %s',
    async (result) => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const pendingPolls: {
        resolve: (result: { items: unknown[] }) => void;
        reject: (error: Error) => void;
      }[] = [];
      jest.mocked(coFetchJSON).mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            pendingPolls.push({ resolve, reject });
          }),
      );
      (useOperands as jest.Mock).mockReturnValue([
        [{ apiVersion: 'v1', kind: 'ConfigMap', metadata: { name: 'operand', namespace: 'test' } }],
        true,
        '',
      ]);
      renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

      await user.click(
        screen.getByRole('checkbox', { name: 'Delete all operand instances for this operator' }),
      );
      await user.click(screen.getByRole('button', { name: 'Uninstall' }));
      await act(async () => {
        jest.advanceTimersByTime(4_000);
      });
      expect(pendingPolls).toHaveLength(2);
      await act(async () => {
        pendingPolls[0].resolve({ items: [] });
      });
      await act(async () => {
        if (result === 'failure') {
          pendingPolls[1].reject(new Error('Late operand poll failed'));
        } else {
          pendingPolls[1].resolve({ items: [] });
        }
      });
      expect(uninstallOperatorModalProps.close).not.toHaveBeenCalled();
      expect(mockK8sKill).toHaveBeenCalledTimes(1);
      await act(async () => {
        jest.advanceTimersByTime(1_000);
      });

      expect(uninstallOperatorModalProps.close).toHaveBeenCalledTimes(1);
      expect(mockK8sKill).toHaveBeenCalledTimes(3);
    },
  );

  it('shows subscription deletion failures without closing the modal', async () => {
    const user = userEvent.setup();
    mockK8sKill.mockRejectedValue(new Error('Subscription deletion failed'));
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    await user.click(screen.getByRole('button', { name: 'Uninstall' }));

    expect(await screen.findByText(/Subscription deletion failed/)).toBeVisible();
    expect(uninstallOperatorModalProps.close).not.toHaveBeenCalled();
  });
});
