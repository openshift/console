import type { OLMCatalogItem } from '../../types';
import { normalizeCatalogItem } from '../catalog-item';

jest.mock('@console/dynamic-plugin-sdk/src/runtime/plugin-init', () => ({
  initConsolePlugins: jest.fn(),
}));

const catalogItem: OLMCatalogItem = {
  id: 'catalog/package/bundle',
  capabilities: '',
  catalog: 'catalog',
  categories: ['Storage'],
  createdAt: '',
  description: '',
  displayName: 'Test Package',
  hasIcon: false,
  image: '',
  infrastructureFeatures: [],
  keywords: [],
  markdownDescription: '',
  name: 'test-package',
  provider: '',
  repository: '',
  source: '',
  support: '',
  validSubscription: [],
  version: '2.0.0',
};

describe('normalizeCatalogItem', () => {
  it.each([
    {
      name: 'preserves available versions and compatibility',
      fields: {
        availableVersions: ['2.0.0', '1.0.0'],
        clusterCompatibility: 'compatible' as const,
      },
      expected: {
        availableVersions: ['2.0.0', '1.0.0'],
        clusterCompatibility: 'compatible',
      },
    },
    {
      name: 'preserves an incompatible package',
      fields: {
        availableVersions: ['2.0.0'],
        clusterCompatibility: 'incompatible' as const,
      },
      expected: {
        availableVersions: ['2.0.0'],
        clusterCompatibility: 'incompatible',
      },
    },
    {
      name: 'preserves unknown compatibility',
      fields: {
        availableVersions: ['2.0.0'],
        clusterCompatibility: 'unknown' as const,
      },
      expected: {
        availableVersions: ['2.0.0'],
        clusterCompatibility: 'unknown',
      },
    },
    {
      name: 'preserves an empty version list',
      fields: { availableVersions: [] },
      expected: { availableVersions: [], clusterCompatibility: 'unknown' },
    },
    {
      name: 'defaults fields for older catalog responses',
      fields: {},
      expected: {
        availableVersions: [],
        clusterCompatibility: 'unknown',
      },
    },
  ])('$name', ({ fields, expected }) => {
    const item = normalizeCatalogItem({ ...catalogItem, ...fields });

    expect(item.data).toMatchObject({
      categories: ['Storage'],
      latestVersion: '2.0.0',
      ...expected,
    });
  });

  it('preserves version metadata alongside catalog attributes and installation links', () => {
    const item = normalizeCatalogItem({
      ...catalogItem,
      availableVersions: ['2.0.0', '1.0.0'],
      clusterCompatibility: 'compatible',
      infrastructureFeatures: ['disconnected', 'unknown-feature'],
      validSubscription: ['Paid subscription'],
      description: 'Package description',
      markdownDescription: 'Package details',
      repository: 'https://example.com/repository',
      createdAt: '2026-01-01T00:00:00Z',
      hasIcon: true,
    });

    expect(item.attributes.infrastructureFeatures).toEqual(['Disconnected']);
    expect(item.tags).toEqual(['storage']);
    expect(item.description).toBe('Package description');
    expect(item.cta.href).toBe(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=test-package&version=2.0.0&catalog=catalog',
    );
    expect(item.icon.url).toBe('/api/olm/catalog-icons/catalog/test-package');
    expect(item.data).toMatchObject({
      availableVersions: ['2.0.0', '1.0.0'],
      clusterCompatibility: 'compatible',
    });
  });

  it('uses the package name and description when display metadata is missing', () => {
    const item = normalizeCatalogItem({
      ...catalogItem,
      displayName: '',
      version: '',
      markdownDescription: 'Package summary',
    });

    expect(item.name).toBe('test-package');
    expect(item.description).toBe('Package summary');
    expect(item.cta.href).toBe(
      '/k8s/cluster/olm.operatorframework.io~v1~ClusterExtension/~new?packageName=test-package&catalog=catalog',
    );
    expect(item.data).toMatchObject({ availableVersions: [], clusterCompatibility: 'unknown' });
  });
});
