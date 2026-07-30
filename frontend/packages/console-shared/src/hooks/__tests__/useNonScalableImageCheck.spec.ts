import { renderHook } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useNonScalableImageCheck } from '../useNonScalableImageCheck';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;

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

const makeIST = (nonScalable?: string) => ({
  image: {
    dockerImageMetadata: {
      Config: {
        Labels: nonScalable !== undefined ? { 'io.openshift.non-scalable': nonScalable } : {},
      },
    },
  },
});

describe('useNonScalableImageCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isNonScalable=true when IST has io.openshift.non-scalable=true', () => {
    mockUseK8sWatchResource.mockReturnValue([makeIST('true'), true, null]);
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should return isNonScalable=false when IST does not have the label', () => {
    mockUseK8sWatchResource.mockReturnValue([makeIST(), true, null]);
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should pass null to useK8sWatchResource when there are no triggers', () => {
    mockUseK8sWatchResource.mockReturnValue([null, true, null]);
    const resource = makeDeploymentConfig();

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null);
  });

  it('should handle Deployment with image.openshift.io/triggers annotation', () => {
    mockUseK8sWatchResource.mockReturnValue([makeIST('true'), true, null]);
    const resource = makeDeployment('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(true);
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'ImageStreamTag',
        name: 'myapp:latest',
        namespace: 'test-ns',
      }),
    );
  });

  it('should return isNonScalable=false when useK8sWatchResource returns an error', () => {
    mockUseK8sWatchResource.mockReturnValue([null, true, new Error('Forbidden')]);
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should pass null to useK8sWatchResource for Deployment without trigger annotation', () => {
    mockUseK8sWatchResource.mockReturnValue([null, true, null]);
    const resource = makeDeployment();

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null);
  });

  it('should return loading=true while useK8sWatchResource has not loaded', () => {
    mockUseK8sWatchResource.mockReturnValue([null, false, null]);
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
    expect(result.current.loading).toBe(true);
  });

  it('should pass null to useK8sWatchResource when resource is null', () => {
    mockUseK8sWatchResource.mockReturnValue([null, true, null]);

    const { result } = renderHook(() => useNonScalableImageCheck(null));

    expect(result.current.isNonScalable).toBe(false);
    expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null);
  });

  it('should return isNonScalable=false when label value is not "true"', () => {
    mockUseK8sWatchResource.mockReturnValue([makeIST('false'), true, null]);
    const resource = makeDeploymentConfig('myapp:latest');

    const { result } = renderHook(() => useNonScalableImageCheck(resource));

    expect(result.current.isNonScalable).toBe(false);
  });
});
