import type { OLMCatalogItem } from '../../types';
import { normalizeCatalogItem } from '../catalog-item';

const baseItem = {
  id: 'redhat-operators/example',
  capabilities: 'Basic Install',
  catalog: 'redhat-operators',
  categories: ['Developer Tools'],
  createdAt: '2026-01-01T00:00:00Z',
  description: 'An example operator',
  displayName: 'Example Operator',
  hasIcon: true,
  image: 'registry.example.com/example:v1',
  infrastructureFeatures: [],
  keywords: ['example'],
  markdownDescription: '# Example',
  name: 'example',
  provider: 'Red Hat',
  repository: 'https://example.com/repo',
  support: 'Red Hat',
  validSubscription: [],
  version: '1.0.0',
} as unknown as OLMCatalogItem;

describe('normalizeCatalogItem', () => {
  it('should emit the shared operator type with the Next-Gen generation', () => {
    expect(normalizeCatalogItem(baseItem)).toMatchObject({
      type: 'operator',
      attributes: { olmGeneration: 'Next-Gen' },
    });
  });

  it('should badge the item as a Next-Gen Operator with a purple badge', () => {
    expect(normalizeCatalogItem(baseItem).badges).toEqual([
      expect.objectContaining({
        text: 'Next-Gen Operator',
        color: 'purple',
      }),
    ]);
  });
});
