import { renderHook, act } from '@testing-library/react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { StorageClassModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useStorageClassActions } from '../storageclass-provider';

const DEFAULT_CLASS_ANNOTATION = 'storageclass.kubernetes.io/is-default-class';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sPatchResource: jest.fn(),
  getGroupVersionKindForModel: jest.fn(() => ({
    group: 'storage.k8s.io',
    version: 'v1',
    kind: 'StorageClass',
  })),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/core-api', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

jest.mock('@console/internal/components/storage-class', () => ({
  defaultClassAnnotation: 'storageclass.kubernetes.io/is-default-class',
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  asAccessReview: jest.fn(),
}));

jest.mock('../../hooks/useCommonResourceActions', () => ({
  useCommonResourceActions: jest.fn(() => []),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'storage.k8s.io~v1~StorageClass'),
}));

const k8sPatchResourceMock = k8sPatchResource as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useK8sModelMock = useK8sModel as jest.Mock;

const createStorageClass = (
  name: string,
  annotations?: Record<string, string>,
): K8sResourceKind => ({
  apiVersion: 'storage.k8s.io/v1',
  kind: 'StorageClass',
  metadata: {
    name,
    ...(annotations && { annotations }),
  },
});

describe('useStorageClassActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sModelMock.mockReturnValue([StorageClassModel, false]);
    useK8sWatchResourceMock.mockReturnValue([[], true, null]);
    k8sPatchResourceMock.mockResolvedValue({});
  });

  it('should return the "Set as default" action as the first action', () => {
    const sc = createStorageClass('test-sc');
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;
    expect(actions[0].id).toBe('make-default-storageclass');
    expect(actions[0].label).toBe('Set as default');
  });

  it('should disable the action when the storage class is already default', () => {
    const sc = createStorageClass('test-sc', {
      [DEFAULT_CLASS_ANNOTATION]: 'true',
    });
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;
    expect(actions[0].disabled).toBe(true);
  });

  it('should enable the action when the storage class is not default', () => {
    const sc = createStorageClass('test-sc', {
      [DEFAULT_CLASS_ANNOTATION]: 'false',
    });
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;
    expect(actions[0].disabled).toBe(false);
  });

  it('should use "add" op to set the annotation when annotations exist but key is missing', async () => {
    const sc = createStorageClass('test-sc', {
      description: 'Some storage class',
    });
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;

    await act(async () => {
      await (actions[0].cta as () => Promise<void>)();
    });

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          {
            op: 'add',
            path: `/metadata/annotations/${DEFAULT_CLASS_ANNOTATION.replace('/', '~1')}`,
            value: 'true',
          },
        ],
      }),
    );
  });

  it('should add annotations object when metadata has no annotations', async () => {
    const sc = createStorageClass('test-sc');
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;

    await act(async () => {
      await (actions[0].cta as () => Promise<void>)();
    });

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          { op: 'add', path: '/metadata/annotations', value: {} },
          {
            op: 'add',
            path: `/metadata/annotations/${DEFAULT_CLASS_ANNOTATION.replace('/', '~1')}`,
            value: 'true',
          },
        ],
      }),
    );
  });

  it('should use "add" op even when annotation already exists with false value', async () => {
    const sc = createStorageClass('test-sc', {
      [DEFAULT_CLASS_ANNOTATION]: 'false',
    });
    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;

    await act(async () => {
      await (actions[0].cta as () => Promise<void>)();
    });

    expect(k8sPatchResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          {
            op: 'add',
            path: `/metadata/annotations/${DEFAULT_CLASS_ANNOTATION.replace('/', '~1')}`,
            value: 'true',
          },
        ],
      }),
    );
  });

  it('should unset the existing default storage class after setting the new one', async () => {
    const existingDefault = createStorageClass('old-default', {
      [DEFAULT_CLASS_ANNOTATION]: 'true',
    });
    const sc = createStorageClass('new-default', {
      [DEFAULT_CLASS_ANNOTATION]: 'false',
    });

    useK8sWatchResourceMock.mockReturnValue([[existingDefault, sc], true, null]);

    const { result } = renderHook(() => useStorageClassActions(sc));
    const [actions] = result.current;

    await act(async () => {
      await (actions[0].cta as () => Promise<void>)();
    });

    // First call: set new default
    expect(k8sPatchResourceMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: [
          {
            op: 'add',
            path: `/metadata/annotations/${DEFAULT_CLASS_ANNOTATION.replace('/', '~1')}`,
            value: 'true',
          },
        ],
        resource: sc,
      }),
    );

    // Second call: unset old default
    expect(k8sPatchResourceMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: [
          {
            op: 'replace',
            path: `/metadata/annotations/${DEFAULT_CLASS_ANNOTATION.replace('/', '~1')}`,
            value: 'false',
          },
        ],
        resource: existingDefault,
      }),
    );
  });
});
