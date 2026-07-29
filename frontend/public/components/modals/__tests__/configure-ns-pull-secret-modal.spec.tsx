import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ServiceAccountModel } from '../../../models';
import {
  k8sCreate as k8sCreateMock,
  k8sGet as k8sGetMock,
  k8sPatchByName as k8sPatchByNameMock,
} from '../../../module/k8s';
import {
  ConfigureNamespacePullSecretModalOverlay,
  getDefaultServiceAccountPatch,
} from '../configure-ns-pull-secret-modal';

jest.mock('../../../module/k8s', () => ({
  ...jest.requireActual('../../../module/k8s'),
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sPatchByName: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePromiseHandler', () => ({
  usePromiseHandler: () => [jest.fn((promise: Promise<unknown>) => promise), false, ''],
}));

const namespace = {
  metadata: {
    name: 'test-ns',
  },
} as const;

describe('getDefaultServiceAccountPatch', () => {
  it('should append to imagePullSecrets when the field exists', () => {
    expect(getDefaultServiceAccountPatch(true, 'my-pull-secret')).toEqual([
      {
        op: 'add',
        path: '/imagePullSecrets/-',
        value: { name: 'my-pull-secret' },
      },
    ]);
  });

  it('should initialize imagePullSecrets when the field is missing', () => {
    expect(getDefaultServiceAccountPatch(false, 'my-pull-secret')).toEqual([
      {
        op: 'add',
        path: '/imagePullSecrets',
        value: [{ name: 'my-pull-secret' }],
      },
    ]);
  });
});

describe('ConfigureNamespacePullSecretModalOverlay submit flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (k8sCreateMock as jest.Mock).mockResolvedValue({});
    (k8sPatchByNameMock as jest.Mock).mockResolvedValue({});
  });

  const fillAndSubmitForm = async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Secret name'), 'my-pull-secret');
    await user.type(screen.getByLabelText('Registry address'), 'quay.io');
    await user.type(screen.getByLabelText('Username'), 'test-user');
    await user.type(screen.getByLabelText('Password'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Save' }));
  };

  it('should initialize imagePullSecrets when field is missing on service account', async () => {
    (k8sGetMock as jest.Mock).mockResolvedValue({});
    const closeOverlay = jest.fn();

    renderWithProviders(
      <ConfigureNamespacePullSecretModalOverlay
        namespace={namespace}
        closeOverlay={closeOverlay}
      />,
    );

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(k8sPatchByNameMock).toHaveBeenCalledWith(
        ServiceAccountModel,
        'default',
        'test-ns',
        getDefaultServiceAccountPatch(false, 'my-pull-secret'),
      );
    });

    expect((k8sCreateMock as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (k8sGetMock as jest.Mock).mock.invocationCallOrder[0],
    );
    expect((k8sGetMock as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (k8sPatchByNameMock as jest.Mock).mock.invocationCallOrder[0],
    );
    await waitFor(() => {
      expect(closeOverlay).toHaveBeenCalled();
    });
  });

  it('should append to imagePullSecrets when field exists on service account', async () => {
    (k8sGetMock as jest.Mock).mockResolvedValue({ imagePullSecrets: [] });
    const closeOverlay = jest.fn();

    renderWithProviders(
      <ConfigureNamespacePullSecretModalOverlay
        namespace={namespace}
        closeOverlay={closeOverlay}
      />,
    );

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(k8sPatchByNameMock).toHaveBeenCalledWith(
        ServiceAccountModel,
        'default',
        'test-ns',
        getDefaultServiceAccountPatch(true, 'my-pull-secret'),
      );
    });
  });

  it('should fetch the default service account before patching', async () => {
    (k8sGetMock as jest.Mock).mockResolvedValue({});
    const closeOverlay = jest.fn();

    renderWithProviders(
      <ConfigureNamespacePullSecretModalOverlay
        namespace={namespace}
        closeOverlay={closeOverlay}
      />,
    );

    await fillAndSubmitForm();

    await waitFor(() => {
      expect(k8sGetMock).toHaveBeenCalledWith(ServiceAccountModel, 'default', 'test-ns', {});
    });
  });
});
