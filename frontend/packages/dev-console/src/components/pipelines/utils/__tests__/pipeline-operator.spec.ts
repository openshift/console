import { k8sList } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import { getPipelineOperatorVersion } from '../pipeline-operator';

jest.mock('@console/internal/module/k8s', () => ({
  k8sList: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

const k8sListMock = k8sList as jest.Mock;

describe('getPipelineOperatorVersion', () => {
  it('should fetch the ClusterServiceVersion from the api', async () => {
    const csvs = [
      {
        metadata: { name: 'openshift-pipelines-operator.v1.0.1' },
        spec: { version: '1.0.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));

    const version = await getPipelineOperatorVersion('unit-test');

    expect(version.raw).toBe('1.0.1');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(0);
    expect(version.patch).toBe(1);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should return the active ClusterServiceVersion if multiple returns', async () => {
    const csvs = [
      {
        metadata: { name: 'openshift-pipelines-operator.v1.0.1' },
        spec: { version: '1.0.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v1.1.1' },
        spec: { version: '1.1.1' },
        status: { phase: 'Pending' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));

    const version = await getPipelineOperatorVersion('unit-test');

    expect(version.raw).toBe('1.0.1');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(0);
    expect(version.patch).toBe(1);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should fetch the latest (highest) ClusterServiceVersion from the api', async () => {
    const csvs = [
      {
        metadata: { name: 'openshift-pipelines-operator.v1.0.1' },
        spec: { version: '1.0.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v10.11.12' },
        spec: { version: '10.11.12' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v1.1.1' },
        spec: { version: '1.1.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));

    const version = await getPipelineOperatorVersion('unit-test');

    expect(version.raw).toBe('10.11.12');
    expect(version.major).toBe(10);
    expect(version.minor).toBe(11);
    expect(version.patch).toBe(12);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should return null if there is no ClusterServiceVersion available', async () => {
    k8sListMock.mockReturnValueOnce(Promise.resolve([]));
    await expect(getPipelineOperatorVersion('unit-test')).resolves.toBe(null);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should return null if there is no pipeline operator at all', async () => {
    const csvs = [
      {
        metadata: { name: 'another-operator' },
        spec: { version: '1.0.0' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));
    await expect(getPipelineOperatorVersion('unit-test')).resolves.toBe(null);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should return null if there is no matching ClusterServiceVersion available', async () => {
    const csvs = [
      {
        metadata: { name: 'another-operator' },
        spec: { version: '1.0.0' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v1.1.1' },
        spec: { version: '1.1.1' },
        status: { phase: 'Installing' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));
    await expect(getPipelineOperatorVersion('unit-test')).resolves.toBe(null);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });
});
