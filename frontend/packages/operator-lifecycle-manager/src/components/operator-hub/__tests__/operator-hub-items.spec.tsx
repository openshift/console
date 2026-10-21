import type { OperatorHubItem } from '../index';
import { determineCategories, orderAndSortByRelevance } from '../operator-hub-items';

describe('determineCategories', () => {
  it('should merge categories by name', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['a-category'],
      } as OperatorHubItem,
      {
        categories: ['a-category', 'b-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
      'b-category': {
        id: 'b-category',
        label: 'b-category',
        field: 'categories',
        values: ['b-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should sort categories by name', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['c-category'],
      } as OperatorHubItem,
      {
        categories: ['d-category', 'b-category'],
      } as OperatorHubItem,
      {
        categories: ['a-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
      'b-category': {
        id: 'b-category',
        label: 'b-category',
        field: 'categories',
        values: ['b-category'],
      },
      'c-category': {
        id: 'c-category',
        label: 'c-category',
        field: 'categories',
        values: ['c-category'],
      },
      'd-category': {
        id: 'd-category',
        label: 'd-category',
        field: 'categories',
        values: ['d-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should not return categories if there is no defined', () => {
    const operatorHubItems: OperatorHubItem[] = [
      // No categories attribute
      {} as OperatorHubItem,
      // Empty categories array
      {
        categories: [],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {};
    expect(actualCategories).toEqual(expectedCategories);
  });

  it('should not return category if string is empty', () => {
    const operatorHubItems: OperatorHubItem[] = [
      {
        categories: ['a-category', ''],
      } as OperatorHubItem,
      {
        categories: [null, '', 'a-category'],
      } as OperatorHubItem,
    ];
    const actualCategories = determineCategories(operatorHubItems);
    const expectedCategories = {
      'a-category': {
        id: 'a-category',
        label: 'a-category',
        field: 'categories',
        values: ['a-category'],
      },
    };
    expect(actualCategories).toEqual(expectedCategories);
  });
});

// NOTE: Most sorting and relevance logic is now tested in catalog-utils.spec.tsx
// These tests remain for legacy compatibility and basic functionality verification

describe('orderAndSortByRelevance', () => {
  it('sorts Red Hat items before non-Red Hat items', () => {
    const items = [
      { name: 'B Operator', obj: { metadata: { labels: { provider: 'Other Company' } } } },
      { name: 'A Operator', obj: { metadata: { labels: { provider: 'Red Hat' } } } },
      { name: 'C Operator', obj: { metadata: { labels: { provider: 'Red Hat Marketplace' } } } },
      { name: 'D Operator', obj: { metadata: { labels: { provider: 'Another Company' } } } },
    ];
    const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);
    expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat');
    expect(sortedItems[1].obj.metadata.labels.provider).toBe('Red Hat Marketplace');
    expect(sortedItems[2].obj.metadata.labels.provider).not.toBe('Red Hat');
    expect(sortedItems[3].obj.metadata.labels.provider).not.toBe('Red Hat');
  });

  it('sorts items alphabetically within each provider group', () => {
    const items = [
      { name: 'Z Operator', obj: { metadata: { labels: { provider: 'Other Company' } } } },
      { name: 'B Operator', obj: { metadata: { labels: { provider: 'Red Hat' } } } },
      { name: 'A Operator', obj: { metadata: { labels: { provider: 'Red Hat Marketplace' } } } },
      { name: 'Y Operator', obj: { metadata: { labels: { provider: 'Another Company' } } } },
    ];
    const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);
    expect(sortedItems[0].name).toBe('B Operator');
    expect(sortedItems[1].name).toBe('A Operator');
    expect(sortedItems[2].name).toBe('Y Operator');
    expect(sortedItems[3].name).toBe('Z Operator');
  });

  it('prioritizes Red Hat providers when searching', () => {
    const items = [
      {
        name: 'gitops-primer',
        provider: 'Community',
        obj: { metadata: { labels: { provider: 'Konveyor' } } },
        description: 'GitOps tools and workflows primer',
        keywords: ['gitops', 'primer'],
      },
      {
        name: 'Red Hat OpenShift GitOps',
        provider: 'Red Hat',
        obj: { metadata: { labels: { provider: 'Red Hat Inc' } } },
        description: 'OpenShift GitOps operator for Argo CD',
        keywords: ['gitops', 'argocd'],
      },
    ];

    const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[], 'gitops');

    // Red Hat operator should be prioritized
    expect(sortedItems[0].name).toBe('Red Hat OpenShift GitOps');
    expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat Inc');
  });

  describe('edge cases', () => {
    it('handles null, undefined, and empty arrays gracefully', () => {
      expect(orderAndSortByRelevance(null)).toEqual([]);
      expect(orderAndSortByRelevance(null, 'search')).toEqual([]);

      expect(orderAndSortByRelevance(undefined)).toEqual([]);
      expect(orderAndSortByRelevance(undefined, 'search')).toEqual([]);

      expect(orderAndSortByRelevance([])).toEqual([]);
      expect(orderAndSortByRelevance([], 'search')).toEqual([]);

      expect(orderAndSortByRelevance('not-an-array' as any)).toEqual([]);
      expect(orderAndSortByRelevance({} as any, 'search')).toEqual([]);
    });

    it('handles items with missing or malformed properties', () => {
      const items = [
        {
          name: 'Complete Operator',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'A complete operator',
        },
        {
          name: 'Operator with minimal data',
          // Missing other properties
        },
      ];

      // Should not throw errors
      expect(() => orderAndSortByRelevance((items as unknown) as OperatorHubItem[])).not.toThrow();
      expect(() =>
        orderAndSortByRelevance((items as unknown) as OperatorHubItem[], 'search'),
      ).not.toThrow();

      const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);

      // Should return all items, with Red Hat first
      expect(sortedItems).toHaveLength(2);
      expect(sortedItems[0].name).toBe('Complete Operator');
    });
  });
});
