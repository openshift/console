import { SemVer } from 'semver';
import { k8sList } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  getPipelineOperatorVersion,
  isGAVersionInstalled,
  isSimplifiedMetricsInstalled,
} from '../pipeline-operator';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sList: jest.fn(),
}));

beforeEach(() => {
  jest.resetAllMocks();
});

const k8sListMock = k8sList as jest.Mock;

describe('isGAVersionInstalled', () => {
  it('should return false if the operator is not identified', () => {
    expect(isGAVersionInstalled(null)).toBe(false);
  });

  it('should return true if the installed operator is below 1.4.0', () => {
    expect(isGAVersionInstalled(new SemVer('1.3.1'))).toBe(false);
  });

  it('should return true if the installed operator is above 1.4.0', () => {
    expect(isGAVersionInstalled(new SemVer('1.5.1'))).toBe(true);
  });
});

describe('isSimplifiedMetricsInstalled', () => {
  it('should return false if the operator is not identified', () => {
    expect(isSimplifiedMetricsInstalled(null)).toBe(false);
  });

  it('should return false if the installed operator is less than or equal to 1.5.2', () => {
    expect(isSimplifiedMetricsInstalled(new SemVer('1.3.1'))).toBe(false);
    expect(isSimplifiedMetricsInstalled(new SemVer('1.4.1'))).toBe(false);
    expect(isSimplifiedMetricsInstalled(new SemVer('1.5.1'))).toBe(false);
    expect(isSimplifiedMetricsInstalled(new SemVer('1.5.2'))).toBe(false);
  });

  it('should return true if the installed operator is above 1.5.2', () => {
    expect(isSimplifiedMetricsInstalled(new SemVer('1.6.2'))).toBe(true);
    expect(isSimplifiedMetricsInstalled(new SemVer('1.7.0'))).toBe(true);
    expect(isSimplifiedMetricsInstalled(new SemVer('1.8.0'))).toBe(true);
  });
});

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

  it('should return the installed version for the old name of pipeline ClusterServiceVersion', async () => {
    const csvs = [
      {
        metadata: { name: 'redhat-openshift-pipelines.v1.3.1' },
        spec: { version: '1.3.1' },
        status: { phase: 'Deleting' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v1.1.1' },
        spec: { version: '1.1.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));
    const version = await getPipelineOperatorVersion('unit-test');
    expect(version.raw).toBe('1.1.1');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(1);
    expect(version.patch).toBe(1);
    expect(k8sList).toHaveBeenCalledTimes(1);
  });

  it('should return installed version for the new name of pipeline ClusterServiceVersion', async () => {
    const csvs = [
      {
        metadata: { name: 'redhat-openshift-pipelines.v1.3.1' },
        spec: { version: '1.3.1' },
        status: { phase: 'Succeeded' },
      } as ClusterServiceVersionKind,
      {
        metadata: { name: 'openshift-pipelines-operator.v1.1.1' },
        spec: { version: '1.1.1' },
        status: { phase: 'Deleting' },
      } as ClusterServiceVersionKind,
    ];
    k8sListMock.mockReturnValueOnce(Promise.resolve(csvs));
    const version = await getPipelineOperatorVersion('unit-test');
    expect(version.raw).toBe('1.3.1');
    expect(version.major).toBe(1);
    expect(version.minor).toBe(3);
    expect(version.patch).toBe(1);
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
