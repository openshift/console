import { renderHook } from '@testing-library/react';
import type { PackageManifestKind } from '../../types';
import useOperatorCatalogItems from '../useOperatorCatalogItems';
import { useOperatorHubPackageManifests } from '../useOperatorHubPackageManifests';

jest.mock('../useOperatorGroups', () => ({
  useOperatorGroups: jest.fn(() => [[], true, undefined]),
}));
jest.mock('../useOperatorHubPackageManifests', () => ({
  useOperatorHubPackageManifests: jest.fn(() => [[], true, undefined]),
}));
jest.mock('../useSubscriptions', () => ({
  useSubscriptions: jest.fn(() => [[], true, undefined]),
}));
jest.mock('../useClusterServiceVersions', () => ({
  useClusterServiceVersions: jest.fn(() => [[], true, undefined]),
}));
jest.mock('../useClusterCloudCredentialConfig', () => ({
  useClusterCloudCredentialConfig: jest.fn(() => [undefined, true, undefined]),
}));
jest.mock('../useClusterInfrastructureConfig', () => ({
  useClusterInfrastructureConfig: jest.fn(() => [undefined, true, undefined]),
}));
jest.mock('../useClusterAuthenticationConfig', () => ({
  useClusterAuthenticationConfig: jest.fn(() => [undefined, true, undefined]),
}));

const mockUseFlag = jest.fn();
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

const packageManifest = {
  apiVersion: 'packages.operators.coreos.com/v1',
  kind: 'PackageManifest',
  metadata: {
    name: 'test-operator',
    namespace: 'openshift-marketplace',
  },
  status: {
    catalogSource: 'redhat-operators',
    catalogSourceNamespace: 'openshift-marketplace',
    catalogSourceDisplayName: 'Red Hat Operators',
    defaultChannel: 'stable',
    provider: { name: 'Red Hat' },
    channels: [
      {
        name: 'stable',
        currentCSV: 'test-operator.v1.0.0',
        currentCSVDesc: {
          displayName: 'Test Operator',
          version: '1.0.0',
          annotations: {},
        },
      },
    ],
  },
} as PackageManifestKind;

describe('useOperatorCatalogItems', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(true);
    jest
      .mocked(useOperatorHubPackageManifests)
      .mockReturnValue([[packageManifest], true, undefined]);
  });

  // The Classic Operators catalog page pins catalogType="operator-olmv0" and
  // CatalogServiceProvider buckets items by item.type, so an item type that does not match the
  // console.catalog/item-provider extension leaves the page rendering an empty grid.
  it('should emit items typed to match the operator-olmv0 catalog item provider extension', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items, loaded] = result.current;

    expect(loaded).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('operator-olmv0');
  });

  // Outside Tech Preview there is no Next-Gen to migrate to, so a package that OLM has not
  // actually deprecated must not be badged as deprecated.
  it('should not badge a non-deprecated package outside Tech Preview', () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges?.map((badge) => badge.text)).not.toContain('Deprecated');
  });

  it('should badge every package as deprecated in Tech Preview', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges?.map((badge) => badge.text)).toContain('Deprecated');
  });

  it('should badge every package as a Classic Operator in Tech Preview', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges?.[0]).toEqual(
      expect.objectContaining({ text: 'Classic Operator', color: 'grey', placement: 'header' }),
    );
  });

  // Outside Tech Preview there is no Next-Gen catalog, so the only operator catalog must look
  // exactly as it did before the split.
  it('should not badge packages as Classic Operators outside Tech Preview', () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges).toEqual([]);
  });

  it('should keep the Classic Operator badge in the header and every other badge in the footer', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;
    const placementFor = (text: string) =>
      items[0].badges?.find((badge) => badge.text === text)?.placement;

    expect(placementFor('Classic Operator')).toBe('header');
    expect(placementFor('Deprecated')).toBeUndefined();
  });
});
