import { screen, fireEvent, waitFor } from '@testing-library/react';
import * as _ from 'lodash';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useOperands } from '@console/shared/src/hooks/useOperands';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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
  ModalFooterWithAlerts: jest.fn(({ children }) => <div>{children}</div>),
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
  k8sGetResource: jest.fn(),
  k8sKill: (...args) => mockK8sKill(...args),
}));

describe(UninstallOperatorModal.name, () => {
  let uninstallOperatorModalProps: UninstallOperatorModalProps;

  beforeEach(() => {
    jest.clearAllMocks();
    mockK8sKill.mockResolvedValue({});

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

  it('displays modal title and uninstall button when rendered', () => {
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    expect(screen.getByText('Uninstall Operator?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Uninstall' })).toBeVisible();
  });

  it('deletes subscription when form is submitted', async () => {
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    fireEvent.click(uninstallButton);

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
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    fireEvent.click(uninstallButton);

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
    renderWithProviders(
      <UninstallOperatorModal {...uninstallOperatorModalProps} subscription={testSubscription} />,
    );

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    fireEvent.click(uninstallButton);

    await waitFor(() => {
      expect(mockK8sKill).toHaveBeenCalledTimes(1);
    });
  });

  it('calls close callback after successful form submission', async () => {
    renderWithProviders(<UninstallOperatorModal {...uninstallOperatorModalProps} />);

    const uninstallButton = screen.getByRole('button', { name: 'Uninstall' });
    fireEvent.click(uninstallButton);

    await waitFor(() => {
      expect(uninstallOperatorModalProps.close).toHaveBeenCalledTimes(1);
    });
  });
});
