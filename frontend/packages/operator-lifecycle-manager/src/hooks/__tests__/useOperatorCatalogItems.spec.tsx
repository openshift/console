import { renderHook } from '@testing-library/react';
import type {
  AuthenticationKind,
  CloudCredentialKind,
  InfrastructureKind,
} from '@console/internal/module/k8s';
import { OLMAnnotation } from '../../components/operator-hub';
import type { PackageManifestKind } from '../../types';
import { useClusterAuthenticationConfig } from '../useClusterAuthenticationConfig';
import { useClusterCloudCredentialConfig } from '../useClusterCloudCredentialConfig';
import { useClusterInfrastructureConfig } from '../useClusterInfrastructureConfig';
import { useClusterServiceVersions } from '../useClusterServiceVersions';
import { useOperatorCatalogItems } from '../useOperatorCatalogItems';
import { useOperatorGroups } from '../useOperatorGroups';
import { useOperatorHubPackageManifests } from '../useOperatorHubPackageManifests';
import { useSubscriptions } from '../useSubscriptions';

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
          annotations: {
            [OLMAnnotation.InfrastructureFeatures]: '["tokenAuth"]',
            [OLMAnnotation.TokenAuthAWS]: 'true',
          },
        },
      },
    ],
  },
} as unknown as PackageManifestKind;

const cloudCredentials = { spec: { credentialsMode: 'Manual' } } as CloudCredentialKind;
const infrastructure = { status: { platform: 'AWS' } } as InfrastructureKind;
const authentication = {
  spec: { serviceAccountIssuer: 'https://issuer.example.com' },
} as AuthenticationKind;

const forbidden = 'forbidden';

const renderCatalogItems = () =>
  renderHook(() => useOperatorCatalogItems({ namespace: 'test-ns' }));

beforeEach(() => {
  jest.mocked(useOperatorGroups).mockReturnValue([[], true, null]);
  jest.mocked(useOperatorHubPackageManifests).mockReturnValue([[packageManifest], true, null]);
  jest.mocked(useSubscriptions).mockReturnValue([[], true, null]);
  jest.mocked(useClusterServiceVersions).mockReturnValue([[], true, null]);
  jest.mocked(useClusterCloudCredentialConfig).mockReturnValue([cloudCredentials, true, null]);
  jest.mocked(useClusterInfrastructureConfig).mockReturnValue([infrastructure, true, null]);
  jest.mocked(useClusterAuthenticationConfig).mockReturnValue([authentication, true, null]);
});

describe('useOperatorCatalogItems', () => {
  beforeEach(() => {
    mockUseFlag.mockReturnValue(true);
    jest
      .mocked(useOperatorHubPackageManifests)
      .mockReturnValue([[packageManifest], true, undefined]);
  });

  it('should emit items typed to match the operator catalog item provider extension', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items, loaded] = result.current;

    expect(loaded).toBe(true);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: 'operator',
      attributes: { operatorCatalog: 'Classic Operators' },
    });
  });

  // Outside Technology Preview there is no OLMv1 to migrate to, so a package that OLM has not
  // actually deprecated must not be badged as deprecated.
  it('should not badge a non-deprecated package outside Technology Preview', () => {
    mockUseFlag.mockReturnValue(false);

    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges?.map((badge) => badge.text)).not.toContain('Deprecated');
  });

  it('should badge every package as deprecated in Technology Preview', () => {
    const { result } = renderHook(() => useOperatorCatalogItems({ namespace: 'default' }));
    const [items] = result.current;

    expect(items[0].badges?.map((badge) => badge.text)).toContain('Deprecated');
  });

  it('returns items when the cluster config resources are forbidden', () => {
    jest.mocked(useClusterCloudCredentialConfig).mockReturnValue([undefined, false, forbidden]);
    jest.mocked(useClusterInfrastructureConfig).mockReturnValue([undefined, false, forbidden]);
    jest.mocked(useClusterAuthenticationConfig).mockReturnValue([undefined, false, forbidden]);

    const [items, loaded, loadError] = renderCatalogItems().result.current;

    expect(loaded).toBe(true);
    expect(loadError).toBeFalsy();
    expect(items).toHaveLength(1);
  });

  it('is not loaded until the cluster config resources settle', () => {
    jest.mocked(useClusterAuthenticationConfig).mockReturnValue([undefined, false, null]);

    const [, loaded] = renderCatalogItems().result.current;

    expect(loaded).toBe(false);
  });

  it('is not loaded until the cloud credentials settle', () => {
    jest.mocked(useClusterCloudCredentialConfig).mockReturnValue([undefined, false, null]);

    const [, loaded] = renderCatalogItems().result.current;

    expect(loaded).toBe(false);
  });

  it('adds tokenized auth to the install link when the cluster config resources are readable', () => {
    const [items] = renderCatalogItems().result.current;

    expect(items[0].cta.href).toContain('tokenizedAuth=AWS');
  });

  it('omits tokenized auth from the install link when authentication is forbidden', () => {
    jest.mocked(useClusterAuthenticationConfig).mockReturnValue([undefined, false, forbidden]);

    const [items] = renderCatalogItems().result.current;

    expect(items[0].cta.href).not.toContain('tokenizedAuth');
  });

  it('omits tokenized auth from the install link when infrastructure is forbidden', () => {
    jest.mocked(useClusterInfrastructureConfig).mockReturnValue([undefined, false, forbidden]);

    const [items] = renderCatalogItems().result.current;

    expect(items[0].cta.href).not.toContain('tokenizedAuth');
  });

  it('omits tokenized auth from the install link when cloud credentials are forbidden', () => {
    jest.mocked(useClusterCloudCredentialConfig).mockReturnValue([undefined, false, forbidden]);

    const [items] = renderCatalogItems().result.current;

    expect(items[0].cta.href).not.toContain('tokenizedAuth');
  });

  // A transient error must not strip the Role ARN field on a real STS cluster.
  it('keeps tokenized auth when a cluster config resource errors after loading', () => {
    jest.mocked(useClusterAuthenticationConfig).mockReturnValue([authentication, true, 'timeout']);

    const [items, loaded, loadError] = renderCatalogItems().result.current;

    expect(loaded).toBe(true);
    expect(loadError).toBeFalsy();
    expect(items[0].cta.href).toContain('tokenizedAuth=AWS');
  });

  it('propagates load errors from the operator resources', () => {
    jest
      .mocked(useOperatorHubPackageManifests)
      .mockReturnValue([[], true, 'packagemanifests failed']);

    const [items, , loadError] = renderCatalogItems().result.current;

    expect(loadError).toContain('packagemanifests failed');
    expect(items).toHaveLength(0);
  });
});
