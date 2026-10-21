import { act, renderHook } from '@testing-library/react';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { settleAllPromises } from '@console/dynamic-plugin-sdk/src/utils/promise';
import { fetchK8s } from '@console/internal/graphql/client';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { mockHelmChartRepositories } from '../../components/__tests__/helm-release-mock-data';
import { FLAG_OPENSHIFT_HELM } from '../../const';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../models';
import { hasEnabledHelmCharts, useDetectHelmChartRepositories } from '../helm-detection-provider';

const ns: string = 'ns';

jest.mock('@console/dynamic-plugin-sdk/src/utils/promise', () => ({
  settleAllPromises: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/internal/graphql/client', () => ({
  ...jest.requireActual('@console/internal/graphql/client'),
  fetchK8s: jest.fn(),
}));

const settleAllPromisesMock = settleAllPromises as jest.Mock;
const useActiveNamespaceMock = useActiveNamespace as jest.Mock;
const fetchK8sMock = fetchK8s as jest.Mock;

describe('hasEnabledHelmCharts', () => {
  it('should return false if all chart repositories are disabled', () => {
    const disabledHelmChartRepositories: K8sResourceKind[] = mockHelmChartRepositories.map(
      (hcr) => ({ ...hcr, spec: { ...hcr.spec, disabled: true } }),
    );
    expect(hasEnabledHelmCharts(disabledHelmChartRepositories)).toBe(false);
  });
  it('should return true if any chart repository is not disabled', () => {
    const helmChartRepositories: K8sResourceKind[] = mockHelmChartRepositories.map((hcr, index) => {
      if (index === 0) {
        return { ...hcr, spec: { ...hcr.spec, disabled: true } };
      }
      return hcr;
    });
    expect(hasEnabledHelmCharts(helmChartRepositories)).toBe(true);
  });
  it('should return false if helmChartRepositories is null or undefined', () => {
    expect(hasEnabledHelmCharts(undefined)).toBe(false);
  });
  it('should return false if helmChartRepositories is an empty array', () => {
    expect(hasEnabledHelmCharts([])).toBe(false);
  });
});

describe('useDetectHelmChartRepositories', () => {
  const setFeatureFlag = jest.fn();
  const helmChartRepositoryList = {
    items: mockHelmChartRepositories,
  };
  // Dummy promise that resolves - actual return value doesn't matter since settleAllPromises is mocked
  const dummyPromise = Promise.resolve({});

  beforeEach(() => {
    jest.useFakeTimers();
    useActiveNamespaceMock.mockReturnValue([ns]);
    // Default mock for fetchK8s - returns a resolved promise
    fetchK8sMock.mockReturnValue(dummyPromise);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should call fetchK8s with HelmChartRepositoryModel and ProjectHelmChartRepositoryModel', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[helmChartRepositoryList, helmChartRepositoryList], [], []]),
    );
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    expect(fetchK8sMock).toHaveBeenCalledTimes(2);
    expect(fetchK8sMock.mock.calls[0]).toEqual([HelmChartRepositoryModel]);
    expect(fetchK8sMock.mock.calls[1]).toEqual([ProjectHelmChartRepositoryModel, null, ns]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and true if only cluster scoped helm chart repository is available', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[helmChartRepositoryList, { items: [] }], [], []]),
    );
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, true]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and true if only project scoped helm chart repository is available', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[{ items: [] }, helmChartRepositoryList], [], []]),
    );
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, true]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and true if both project and cluster scoped helm chart repositories are available', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[helmChartRepositoryList, helmChartRepositoryList], [], []]),
    );
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, true]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and false if no CR helm chart repository is available', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[{ items: [] }, { items: [] }], [], []]),
    );
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(1);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, false]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and false if fetchK8s returns rejected promise for both cluster and project scoped helm chart repositories with atleast one of them being error 404', async () => {
    const error404 = new HttpError('404', 404, {
      status: 404,
    } as Response);
    const error200 = new HttpError('200', 200, {
      status: 200,
    } as Response);

    // settleAllPromises mock returns errors in rejectedReasons array
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error404, error200], []]));

    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(2);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, false]);
  });

  it('should call setFeatureFlag with FLAG_OPENSHIFT_HELM flag and undefined if fetchK8s returns rejected promise for both cluster and project scoped helm chart repositories with none of them being error 404', async () => {
    const error200 = new HttpError('200', 200, {
      status: 200,
    } as Response);
    // settleAllPromises mock returns errors in rejectedReasons array
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error200, error200], []]));
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(setFeatureFlag).toHaveBeenCalledTimes(2);
    expect(setFeatureFlag.mock.calls[0]).toEqual([FLAG_OPENSHIFT_HELM, undefined]);
  });

  it('should call fetchK8s every 10 seconds', async () => {
    settleAllPromisesMock.mockReturnValue(
      Promise.resolve([[helmChartRepositoryList, helmChartRepositoryList], [], []]),
    );
    renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    expect(fetchK8sMock).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(20 * 1000);
    expect(fetchK8sMock).toHaveBeenCalledTimes(6);
  });

  it('should not call fetchK8s every 10 seconds if fetchK8s returns rejected promise for both cluster and project scoped helm chart repositories', async () => {
    const error404 = new HttpError('404', 404, {
      status: 404,
    } as Response);
    const error200 = new HttpError('200', 200, {
      status: 200,
    } as Response);
    // settleAllPromises mock returns errors in rejectedReasons array
    settleAllPromisesMock.mockReturnValue(Promise.resolve([[], [error404, error200], []]));
    const { rerender } = renderHook(() => useDetectHelmChartRepositories(setFeatureFlag));
    await act(async () => {
      rerender();
    });
    expect(fetchK8sMock).toHaveBeenCalledTimes(4);
    jest.advanceTimersByTime(20 * 1000);
    expect(fetchK8sMock).toHaveBeenCalledTimes(4);
  });
});
