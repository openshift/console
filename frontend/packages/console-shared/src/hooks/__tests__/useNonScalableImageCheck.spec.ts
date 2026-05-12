import { renderHook, waitFor } from '@testing-library/react';
import { k8sGet } from '@console/internal/module/k8s';
import { useNonScalableImageCheck } from '../useNonScalableImageCheck';

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  k8sGet: jest.fn(),
}));

const mockK8sGet = k8sGet as jest.Mock;

const makeDeploymentConfig = (istName?: string, namespace = 'test-ns') => ({
  kind: 'DeploymentConfig',
  apiVersion: 'apps.openshift.io/v1',
  metadata: { name: 'test-dc', namespace },
  spec: {
    replicas: 1,
    triggers: istName
      ? [
          {
            type: 'ImageChange',
            imageChangeParams: {
              from: { kind: 'ImageStreamTag', name: istName, namespace },
            },
          },
        ]
      : [],
  },
});

const makeDeployment = (istName?: string, namespace = 'test-ns') => ({
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'test-deploy',
    namespace,
    annotations: istName
      ? {
          'image.openshift.io/triggers': JSON.stringify([
            { from: { kind: 'ImageStreamTag', name: istName, namespace } },
          ]),
        }
      : {},
  },
  spec: { replicas: 1 },
});

const makeIST = (nonScalable?: string | boolean) => {
  const labels: Record<string, string | boolean> = {};
  if (nonScalable !== undefined) {
    labels['io.openshift.non-scalable'] = nonScalable;
  }
  return {
    image: {
      dockerImageMetadata: {
        Config: {
          Labels: labels,
        },
      },
    },
  };
};

describe('useNonScalableImageCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isNonScalable=true when IST has io.openshift.non-scalable=true (string)', async () => {
    mockK8sGet.mockResolvedValue(makeIST('true'));
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    await waitFor(() => {
      expect(result.current.isNonScalable).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return isNonScalable=true when IST has io.openshift.non-scalable=true (boolean)', async () => {
    mockK8sGet.mockResolvedValue(makeIST(true));
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    await waitFor(() => {
      expect(result.current.isNonScalable).toBe(true);
    });
  });

  it('should return isNonScalable=false when IST does not have the label', async () => {
    mockK8sGet.mockResolvedValue(makeIST());
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    await waitFor(() => {
      expect(result.current.isNonScalable).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return isNonScalable=false when there are no triggers', () => {
    const resource = makeDeploymentConfig();

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mockK8sGet).not.toHaveBeenCalled();
  });

  it('should handle Deployment with image.openshift.io/triggers annotation', async () => {
    mockK8sGet.mockResolvedValue(makeIST('true'));
    const resource = makeDeployment('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    await waitFor(() => {
      expect(result.current.isNonScalable).toBe(true);
    });
  });

  it('should return isNonScalable=false when k8sGet fails', async () => {
    mockK8sGet.mockRejectedValue(new Error('Forbidden'));
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    await waitFor(() => {
      expect(result.current.isNonScalable).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should return isNonScalable=false for Deployment without trigger annotation', () => {
    const resource = makeDeployment();

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(mockK8sGet).not.toHaveBeenCalled();
  });
});
