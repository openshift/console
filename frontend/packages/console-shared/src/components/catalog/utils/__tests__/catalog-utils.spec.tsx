import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import {
  keywordCompare,
  calculateCatalogItemRelevanceScore,
  getRedHatPriority,
} from '../catalog-utils';

// Mock CatalogItem data for testing
const createMockCatalogItem = (overrides: Partial<CatalogItem> = {}): CatalogItem => ({
  uid: 'mock-uid',
  type: 'operator',
  name: 'Mock Operator',
  description: 'Mock description',
  provider: 'Mock Provider',
  creationTimestamp: '2023-01-01T00:00:00Z',
  tags: [],
  cta: {
    label: 'Install',
    href: '/install',
  },
  icon: {
    url: 'https://example.com/icon.png',
  },
  ...overrides,
});

describe('calculateCatalogItemRelevanceScore', () => {
  it('assigns correct points for title exact match', () => {
    const item = createMockCatalogItem({
      name: 'database',
      description: 'database tool',
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Title exact (100) + exact bonus (50) + starts bonus (25) + description (20) + description starts bonus (5) = 200
    expect(score).toBe(200);
  });

  it('assigns correct points for title starts with match', () => {
    const item = createMockCatalogItem({
      name: 'database-operator',
      description: 'A database operator',
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Title contains (100) + starts bonus (25) + description (20) = 145
    expect(score).toBe(145);
  });

  it('assigns correct points for metadata name matches', () => {
    const item = createMockCatalogItem({
      name: 'Storage Tool',
      attributes: {
        metadataName: 'database',
      },
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Metadata exact (80) + exact bonus (40) + starts bonus (20) = 140
    expect(score).toBe(140);
  });

  it('assigns correct points for keyword matches', () => {
    const item = createMockCatalogItem({
      name: 'Storage Operator',
      tags: ['database', 'storage'],
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Keyword match = 60
    expect(score).toBe(60);
  });

  it('assigns correct points for description matches', () => {
    const item = createMockCatalogItem({
      name: 'Storage Tool',
      description: 'database management solution',
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Description contains (20) + starts bonus (5) = 25
    expect(score).toBe(25);
  });

  it('combines multiple scoring sources correctly', () => {
    const item = createMockCatalogItem({
      name: 'database-operator', // Title: 100 + 25 = 125
      description: 'database management solution', // Description: 20 + 5 = 25
      tags: ['database', 'operator'], // Keywords: 60
      attributes: {
        metadataName: 'db-operator', // No metadata match: 0
      },
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    // Total: 125 + 25 + 60 + 0 = 210
    expect(score).toBe(210);
  });

  it('returns 0 for no matches', () => {
    const item = createMockCatalogItem({
      name: 'Network Tool',
      description: 'Network management',
      tags: ['network', 'connectivity'],
    });

    const score = calculateCatalogItemRelevanceScore('database', item);
    expect(score).toBe(0);
  });

  it('handles missing or empty search term', () => {
    const item = createMockCatalogItem({ name: 'Test Operator' });

    expect(calculateCatalogItemRelevanceScore('', item)).toBe(0);
    expect(calculateCatalogItemRelevanceScore(null as any, item)).toBe(0);
    expect(calculateCatalogItemRelevanceScore(undefined as any, item)).toBe(0);
  });

  it('handles missing or malformed item properties', () => {
    const incompleteItem = createMockCatalogItem({
      name: undefined as any,
      description: undefined as any,
      tags: undefined as any,
    });

    expect(() => calculateCatalogItemRelevanceScore('test', incompleteItem)).not.toThrow();
    expect(calculateCatalogItemRelevanceScore('test', incompleteItem)).toBe(0);
  });
});

describe('getRedHatPriority', () => {
  it('returns EXACT_MATCH for exact Red Hat provider matches', () => {
    const exactMatches = [
      'Red Hat',
      'red hat',
      'RED HAT',
      'Red Hat Inc',
      'red hat inc',
      'Red Hat, Inc.',
      'red hat, inc.',
    ];

    exactMatches.forEach((provider) => {
      const item = createMockCatalogItem({
        attributes: { provider },
      });
      expect(getRedHatPriority(item)).toBe(2); // EXACT_MATCH
    });
  });

  it('returns CONTAINS_REDHAT for providers containing Red Hat', () => {
    const containsMatches = [
      'Red Hat Marketplace',
      'Red Hat Solutions',
      'Something Red Hat',
      'red hat marketplace',
      'Red Hat Advanced Cluster Management',
    ];

    containsMatches.forEach((provider) => {
      const item = createMockCatalogItem({
        attributes: { provider },
      });
      expect(getRedHatPriority(item)).toBe(1); // CONTAINS_REDHAT
    });
  });

  it('returns NON_REDHAT for non-Red Hat providers', () => {
    const nonRedHatProviders = ['Community', 'Amazon', 'Microsoft', 'Google', 'Konveyor', 'CNCF'];

    nonRedHatProviders.forEach((provider) => {
      const item = createMockCatalogItem({
        attributes: { provider },
      });
      expect(getRedHatPriority(item)).toBe(0); // NON_REDHAT
    });
  });

  it('checks provider field as fallback', () => {
    const item = createMockCatalogItem({
      provider: 'Red Hat',
      attributes: {}, // No provider in attributes
    });
    expect(getRedHatPriority(item)).toBe(2); // EXACT_MATCH
  });

  it('handles missing provider information', () => {
    const item = createMockCatalogItem({
      provider: undefined as any,
      attributes: {},
    });
    expect(getRedHatPriority(item)).toBe(0); // NON_REDHAT
  });
});

describe('keywordCompare', () => {
  const mockOperators = [
    createMockCatalogItem({
      uid: 'operator-1',
      name: 'Red Hat OpenShift GitOps',
      type: 'operator',
      attributes: {
        provider: 'Red Hat Inc',
      },
      description: 'OpenShift GitOps operator for Argo CD',
      tags: ['gitops', 'argocd'],
    }),
    createMockCatalogItem({
      uid: 'operator-2',
      name: 'gitops-primer',
      type: 'operator',
      attributes: {
        provider: 'Konveyor',
      },
      description: 'GitOps tools and workflows primer',
      tags: ['gitops', 'primer'],
    }),
    createMockCatalogItem({
      uid: 'operator-3',
      name: 'Harness GitOps Operator',
      type: 'operator',
      attributes: {
        provider: 'Harness Inc.',
      },
      description: 'GitOps operator from Harness',
      tags: ['gitops', 'harness'],
    }),
  ];

  it('prioritizes Red Hat providers when searching', () => {
    const result = keywordCompare('gitops', mockOperators);

    // Red Hat operator should be first
    expect(result[0].name).toBe('Red Hat OpenShift GitOps');
    expect(result[0].attributes?.provider).toBe('Red Hat Inc');
  });

  it('sorts by Red Hat priority without search term', () => {
    const result = keywordCompare('', mockOperators);

    // Red Hat operator should be first
    expect(result[0].name).toBe('Red Hat OpenShift GitOps');
    expect(result[0].attributes?.provider).toBe('Red Hat Inc');

    // Other operators should follow alphabetically
    expect(result[1].name).toBe('gitops-primer');
    expect(result[2].name).toBe('Harness GitOps Operator');
  });

  it('filters items with relevance score > 0 when searching', () => {
    const mixedItems = [
      ...mockOperators,
      createMockCatalogItem({
        uid: 'non-matching',
        name: 'Database Operator',
        type: 'operator',
        description: 'Database management',
        tags: ['database'],
      }),
    ];

    const result = keywordCompare('gitops', mixedItems);

    // Should only return items that match 'gitops'
    expect(result).toHaveLength(3);
    expect(
      result.every(
        (item) =>
          item.name.toLowerCase().includes('gitops') ||
          (typeof item.description === 'string' &&
            item.description.toLowerCase().includes('gitops')) ||
          item.tags?.some((tag) => tag.includes('gitops')),
      ),
    ).toBe(true);
  });

  it('returns all items when no search term provided', () => {
    const result = keywordCompare('', mockOperators);
    expect(result).toHaveLength(mockOperators.length);
  });

  it('handles empty items array', () => {
    const result = keywordCompare('gitops', []);
    expect(result).toEqual([]);
  });

  it('handles non-operator items (no console.table)', () => {
    const nonOperatorItems = [
      createMockCatalogItem({
        uid: 'template-1',
        name: 'Database Template',
        type: 'template',
      }),
    ];

    // Should not throw error and should return items
    expect(() => keywordCompare('database', nonOperatorItems)).not.toThrow();
    const result = keywordCompare('database', nonOperatorItems);
    expect(result).toHaveLength(1);
  });

  it('respects relevance scoring when differences are significant', () => {
    const items = [
      createMockCatalogItem({
        name: 'Storage Manager Tool', // High relevance for 'storage'
        type: 'operator',
        attributes: { provider: 'Other Company' },
        description: 'Storage management solution',
        tags: ['storage', 'management'],
      }),
      createMockCatalogItem({
        name: 'Red Hat Storage Solution', // Lower relevance for 'storage'
        type: 'operator',
        attributes: { provider: 'Red Hat' },
        description: 'Enterprise storage solution',
        tags: ['enterprise', 'storage'],
      }),
    ];

    const result = keywordCompare('storage', items);

    // Red Hat should still be prioritized due to priority delta threshold
    expect(result[0].attributes?.provider).toBe('Red Hat');
    expect(result[1].attributes?.provider).toBe('Other Company');
  });
});
