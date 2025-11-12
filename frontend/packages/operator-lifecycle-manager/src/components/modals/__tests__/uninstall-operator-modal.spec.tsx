import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { useOperands } from '@console/shared/src/hooks/useOperands';
import { testSubscription, dummyPackageManifest } from '../../../../mocks';
import { ClusterServiceVersionModel, SubscriptionModel } from '../../../models';
import { SubscriptionKind } from '../../../types';
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

jest.mock('react-i18next', () => {
  const reactI18next = jest.requireActual('react-i18next');
  return {
    ...reactI18next,
    Trans: () => null,
  };
});

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sGetResource: jest.fn(),
}));

describe(UninstallOperatorModal.name, () => {
  let k8sKill: jest.Mock;
  let k8sGet: jest.Mock;
  let k8sPatch: jest.Mock;
  let close: jest.Mock;
  let cancel: jest.Mock;
  let subscription: SubscriptionKind;

  beforeEach(() => {
    k8sKill = jest.fn().mockResolvedValue({});
    k8sGet = jest.fn().mockResolvedValue({});
    k8sPatch = jest.fn().mockResolvedValue({});
    close = jest.fn();
    cancel = jest.fn();
    subscription = {
      ...testSubscription,
      metadata: { ...testSubscription.metadata },
      spec: { ...testSubscription.spec },
      status: { installedCSV: 'testapp.v1.0.0' },
    };

    (useK8sWatchResource as jest.Mock).mockReturnValue([dummyPackageManifest, true, null]);
    (useAccessReview as jest.Mock).mockReturnValue(false);
    (useOperands as jest.Mock).mockReturnValue([[], true, '']);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a modal form', () => {
    render(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    expect(screen.getByRole('form')).toBeVisible();
    expect(screen.getByText('Uninstall Operator?')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Uninstall' })).toBeVisible();
  });

  it('calls `props.k8sKill` to delete the subscription when form is submitted', async () => {
    render(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(k8sKill).toHaveBeenCalled();
    });

    expect(k8sKill).toHaveBeenCalledTimes(2);
    expect(k8sKill.mock.calls[0]).toEqual([
      SubscriptionModel,
      subscription,
      {},
      {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      },
    ]);
  });

  it('calls `props.k8sKill` to delete the `ClusterServiceVersion` from the subscription namespace when form is submitted', async () => {
    render(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(k8sKill).toHaveBeenCalledTimes(2);
    });

    expect(k8sKill.mock.calls[1]).toEqual([
      ClusterServiceVersionModel,
      {
        metadata: {
          name: 'testapp.v1.0.0',
          namespace: testSubscription.metadata.namespace,
        },
      },
      {},
      {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      },
    ]);
  });

  it('does not call `props.k8sKill` to delete `ClusterServiceVersion` if `status.installedCSV` field missing from subscription', async () => {
    const subscriptionWithoutCSV = {
      ...testSubscription,
      metadata: { ...testSubscription.metadata },
      spec: { ...testSubscription.spec },
      status: testSubscription.status ? { ...testSubscription.status } : undefined,
    };
    render(
      <UninstallOperatorModal
        subscription={subscriptionWithoutCSV}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(k8sKill).toHaveBeenCalledTimes(1);
    });
  });

  it('adds delete options with `propagationPolicy`', async () => {
    render(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(k8sKill).toHaveBeenCalledTimes(2);
    });

    expect(k8sKill.mock.calls[0]).toEqual([
      SubscriptionModel,
      subscription,
      {},
      {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      },
    ]);
    expect(k8sKill.mock.calls[1]).toEqual([
      ClusterServiceVersionModel,
      {
        metadata: {
          name: 'testapp.v1.0.0',
          namespace: testSubscription.metadata.namespace,
        },
      },
      {},
      {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      },
    ]);
  });

  it('calls `props.close` after successful submit', async () => {
    render(
      <UninstallOperatorModal
        subscription={subscription}
        k8sKill={k8sKill}
        k8sGet={k8sGet}
        k8sPatch={k8sPatch}
        close={close}
        cancel={cancel}
      />,
    );

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(close).toHaveBeenCalled();
    });
  });
});
