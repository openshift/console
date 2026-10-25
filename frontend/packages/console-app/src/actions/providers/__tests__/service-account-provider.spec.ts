import { renderHook, act } from '@testing-library/react';
import { downloadKubeconfig } from '@console/internal/components/utils/download-kubeconfig';
import { ServiceAccountModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useToast } from '@console/shared/src/components/toast/useToast';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useServiceAccountActionsProvider } from '../service-account-provider';

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: () => jest.fn(),
}));

jest.mock('react-router', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options?.name ? key.replace('{{name}}', String(options.name)) : key,
  }),
}));

jest.mock('@console/internal/components/utils', () => ({
  asAccessReview: jest.fn((_model, _obj, verb, subresource) => ({ verb, subresource })),
}));

jest.mock('@console/internal/components/utils/download-kubeconfig', () => ({
  downloadKubeconfig: jest.fn(() => Promise.resolve()),
}));

jest.mock('@console/shared/src/components/toast/useToast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'core~v1~ServiceAccount'),
}));

jest.mock('../../hooks/useCommonResourceActions', () => ({
  useCommonResourceActions: jest.fn(() => []),
}));

const useK8sModelMock = useK8sModel as jest.Mock;
const downloadKubeconfigMock = downloadKubeconfig as jest.Mock;
const useToastMock = useToast as jest.Mock;
const addToast = jest.fn();

const createServiceAccount = (name: string, namespace: string): K8sResourceKind => ({
  apiVersion: 'v1',
  kind: 'ServiceAccount',
  metadata: { name, namespace },
});

describe('useServiceAccountActionsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sModelMock.mockReturnValue([ServiceAccountModel, false]);
    useToastMock.mockReturnValue({ addToast });
  });

  it('provides a "Download kubeconfig" action gated on the token subresource', () => {
    const sa = createServiceAccount('my-sa', 'my-ns');
    const { result } = renderHook(() => useServiceAccountActionsProvider(sa));
    const [actions] = result.current;

    const action = actions.find((a) => a.id === 'download-kubeconfig-service-account');
    expect(action).toBeDefined();
    expect(action.label).toBe('Download kubeconfig');
    expect(action.accessReview).toEqual({ verb: 'create', subresource: 'token' });
  });

  it('downloads a ServiceAccount kubeconfig when the action is triggered', () => {
    const sa = createServiceAccount('my-sa', 'my-ns');
    const { result } = renderHook(() => useServiceAccountActionsProvider(sa));
    const [actions] = result.current;
    const action = actions.find((a) => a.id === 'download-kubeconfig-service-account');

    act(() => {
      (action.cta as () => void)();
    });

    expect(downloadKubeconfigMock).toHaveBeenCalledWith('ServiceAccount', 'my-sa', 'my-ns');
  });

  it('surfaces a toast when the kubeconfig download fails', async () => {
    downloadKubeconfigMock.mockRejectedValueOnce(new Error('403 Forbidden'));
    const sa = createServiceAccount('my-sa', 'my-ns');
    const { result } = renderHook(() => useServiceAccountActionsProvider(sa));
    const [actions] = result.current;
    const action = actions.find((a) => a.id === 'download-kubeconfig-service-account');

    await act(async () => {
      (action.cta as () => void)();
    });

    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Failed to download kubeconfig', content: '403 Forbidden' }),
    );
  });

  it('does not provide the action when the resource has no name or namespace', () => {
    const { result } = renderHook(() => useServiceAccountActionsProvider(undefined));
    const [actions] = result.current;
    expect(actions.find((a) => a.id === 'download-kubeconfig-service-account')).toBeUndefined();
  });
});
