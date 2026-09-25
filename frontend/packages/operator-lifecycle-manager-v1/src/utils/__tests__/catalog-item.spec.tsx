import type { OLMCatalogItem } from '../../types';
import { normalizeCatalogItem } from '../catalog-item';

jest.mock('../../../../../get-local-plugins', () => ({ default: [] }));

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
      name: 'preserves lifecycle metadata including unknown fields',
      fields: {
        lifecycleData: {
          package: 'test-package',
          schema: 'io.openshift.operators.lifecycles.v1alpha1',
          versions: [
            { name: '2.0', platformCompatibility: [{ name: 'openshift', versions: ['4.18'] }] },
          ],
          extra: { preserved: true },
        },
      },
    },
    { name: 'preserves an empty lifecycle object', fields: { lifecycleData: {} } },
    { name: 'preserves absent lifecycle data', fields: { lifecycleData: null } },
    { name: 'accepts older responses without lifecycle data', fields: {} },
  ])('$name', ({ fields }) => {
    const item = normalizeCatalogItem({ ...catalogItem, ...fields });

    expect(item.data).toEqual({
      categories: ['Storage'],
      latestVersion: '2.0.0',
      lifecycleData: fields.lifecycleData ?? null,
    });
  });

  it('preserves lifecycle metadata alongside catalog attributes and installation links', () => {
    const item = normalizeCatalogItem({
      ...catalogItem,
      lifecycleData: { package: 'test-package', versions: [{ name: '2.0' }] },
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
      lifecycleData: { package: 'test-package', versions: [{ name: '2.0' }] },
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
    expect(item.data).toMatchObject({ lifecycleData: null });
  });
});
