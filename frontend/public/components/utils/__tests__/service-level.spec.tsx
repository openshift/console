import { createElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import { ServiceLevel } from '../service-level';

// Regression test for OCPBUGS-128832: https://issues.redhat.com/browse/OCPBUGS-128832
// When pull-secret has no cloud.openshift.com entry, the console should skip
// the OCM API call entirely rather than sending a request with an empty token.

const mockDispatch = jest.fn();

jest.mock('@console/dynamic-plugin-sdk/src/api/core-api', () => ({
  k8sGet: jest.fn(),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetchJSON: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: () => mockDispatch,
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn().mockReturnValue({
    level: null,
    daysRemaining: null,
    clusterID: '',
    trialDateEnd: null,
    hasSecretAccess: false,
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@console/shared/src/components/links/ExternalLink', () => ({
  ExternalLink: () => null,
}));

jest.mock('../../../models', () => ({
  SecretModel: { kind: 'Secret', apiVersion: 'v1' },
}));

jest.mock('../../../module/k8s', () => ({
  getOCMLink: () => 'https://example.com',
}));

jest.mock('@console/internal/actions/ui', () => ({
  setServiceLevel: (...args: unknown[]) => ({ type: 'setServiceLevel', payload: args }),
}));

jest.mock('../datetime', () => ({
  getDuration: (ms: number) => ({ days: Math.floor(ms / 86400000) }),
  dateFormatter: { format: (d: Date) => d.toISOString() },
}));

jest.mock('../field-level-help', () => ({
  FieldLevelHelp: () => null,
}));

jest.mock('../types', () => ({
  NotificationTypes: { warning: 'warning' },
}));

const k8sGetMock = k8sGet as jest.Mock;
const coFetchJSONMock = coFetchJSON as unknown as jest.Mock;

const makePullSecretResponse = (auths: Record<string, unknown>) => ({
  data: {
    '.dockerconfigjson': btoa(JSON.stringify({ auths })),
  },
});

const renderServiceLevel = (clusterID = 'test-cluster-id') =>
  render(
    createElement(
      ServiceLevel,
      { clusterID, loading: createElement('span', null, 'loading') },
      createElement('span', null, 'content'),
    ),
  );

describe('OCPBUGS-128832: skip OCM API call when cloud.openshift.com token is unavailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.SERVER_FLAGS = {
      ...window.SERVER_FLAGS,
      branding: 'ocp',
    };
  });

  it('should NOT call OCM API when cloud.openshift.com entry is missing from pull-secret', async () => {
    k8sGetMock.mockResolvedValue(
      makePullSecretResponse({
        'registry.redhat.io': { auth: 'some-registry-token' },
      }),
    );

    renderServiceLevel();

    await waitFor(() => expect(k8sGetMock).toHaveBeenCalled());

    // Core assertion: OCM API must NOT be called with an empty token
    expect(coFetchJSONMock).not.toHaveBeenCalled();

    // Service level dispatched with null values and hasSecretAccess=true
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setServiceLevel',
        payload: [null, null, 'test-cluster-id', null, true],
      }),
    );
  });

  it('should NOT call OCM API when cloud.openshift.com auth value is empty string', async () => {
    k8sGetMock.mockResolvedValue(
      makePullSecretResponse({
        'cloud.openshift.com': { auth: '' },
      }),
    );

    renderServiceLevel();

    await waitFor(() => expect(k8sGetMock).toHaveBeenCalled());

    expect(coFetchJSONMock).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'setServiceLevel',
        payload: [null, null, 'test-cluster-id', null, true],
      }),
    );
  });

  it('should call OCM API with proper Authorization header when token is present', async () => {
    k8sGetMock.mockResolvedValue(
      makePullSecretResponse({
        'cloud.openshift.com': { auth: 'valid-token-123' },
      }),
    );
    coFetchJSONMock.mockResolvedValue({
      items: [{ support_level: 'Premium', eval_expiration_date: '2027-12-31T00:00:00Z' }],
    });

    renderServiceLevel();

    await waitFor(() => expect(coFetchJSONMock).toHaveBeenCalled());

    expect(coFetchJSONMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/accounts_mgmt/v1/subscriptions'),
      'GET',
      expect.objectContaining({
        headers: { Authorization: 'AccessToken test-cluster-id:valid-token-123' },
      }),
    );
  });

  it('should not crash when cloud.openshift.com entry is absent (original TypeError bug)', async () => {
    k8sGetMock.mockResolvedValue(
      makePullSecretResponse({
        'registry.redhat.io': { auth: 'token' },
        'quay.io': { auth: 'token' },
      }),
    );

    // Before the fix, accessing secret.auths['cloud.openshift.com'].auth
    // would throw TypeError: Cannot read properties of undefined (reading 'auth')
    expect(() => renderServiceLevel()).not.toThrow();

    await waitFor(() => expect(k8sGetMock).toHaveBeenCalled());
    expect(coFetchJSONMock).not.toHaveBeenCalled();
  });
});
