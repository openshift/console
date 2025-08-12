import { determineCategories, orderAndSortByRelevance } from './operator-hub-items';
import { OperatorHubItem } from './index';

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

describe('orderAndSortByRelevance', () => {
  it('sorts Red Hat items before non-Red Hat items', () => {
    const items = [
      { name: 'B Operator', obj: { metadata: { labels: { provider: 'Other Company' } } } },
      { name: 'A Operator', obj: { metadata: { labels: { provider: 'Red Hat' } } } },
      { name: 'C Operator', obj: { metadata: { labels: { provider: 'Red Hat Marketplace' } } } },
      { name: 'D Operator', obj: { metadata: { labels: { provider: 'Another Company' } } } },
    ];
    const sortedItems = orderAndSortByRelevance(items);
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
    const sortedItems = orderAndSortByRelevance(items);
    expect(sortedItems[0].name).toBe('B Operator');
    expect(sortedItems[1].name).toBe('A Operator');
    expect(sortedItems[2].name).toBe('Y Operator');
    expect(sortedItems[3].name).toBe('Z Operator');
  });

  it('sorts Red Hat items before non-Red Hat items based on metadata.labels.provider', () => {
    const items = [
      {
        name: 'Community Operator',
        provider: 'Community',
        obj: { metadata: { labels: { provider: 'Community Team' } } },
      },
      {
        name: 'Red Hat Metadata Operator',
        provider: 'Some Company',
        obj: { metadata: { labels: { provider: 'Red Hat Inc' } } },
      },
      {
        name: 'Standard Red Hat Operator',
        provider: 'Red Hat',
        obj: { metadata: { labels: { provider: 'Red Hat' } } },
      },
      {
        name: 'Third Party Operator',
        provider: 'Third Party',
        obj: { metadata: { labels: { provider: 'Third Party Solutions' } } },
      },
    ];
    const sortedItems = orderAndSortByRelevance(items);

    expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat Inc');
    expect(sortedItems[1].obj.metadata.labels.provider).toBe('Red Hat');
    expect(sortedItems[2].obj.metadata.labels.provider).toBe('Community Team');
    expect(sortedItems[3].obj.metadata.labels.provider).toBe('Third Party Solutions');
  });

  describe('with search terms', () => {
    it('prioritizes Red Hat providers when searching for "serverless"', () => {
      const items = [
        {
          name: 'Amazon OpenSearchServerless',
          provider: 'Amazon',
          obj: { metadata: { labels: { provider: 'Amazon' } } },
          description: 'Amazon OpenSearch Serverless service',
          keywords: ['search', 'amazon'],
        },
        {
          name: 'OpenShift Serverless Logic Operator',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'OpenShift Serverless Logic operator',
          keywords: ['serverless', 'logic'],
        },
        {
          name: 'Generic Serverless Tool',
          provider: 'Generic Inc',
          obj: { metadata: { labels: { provider: 'Generic Inc' } } },
          description: 'A generic serverless platform',
          keywords: ['serverless', 'platform'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'serverless');

      // Red Hat operator should be first even with similar relevance score
      expect(sortedItems[0].name).toBe('OpenShift Serverless Logic Operator');
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat');

      // Other serverless operators should follow
      expect(sortedItems[1].name).toBe('Generic Serverless Tool');
      expect(sortedItems[2].name).toBe('Amazon OpenSearchServerless');
    });

    it('prioritizes Red Hat providers when searching for "gitops"', () => {
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
        {
          name: 'GitOps Toolkit',
          provider: 'Flux Project',
          obj: { metadata: { labels: { provider: 'Flux Community' } } },
          description: 'GitOps toolkit for continuous delivery',
          keywords: ['gitops', 'flux'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'gitops');

      // Red Hat operator should be prioritized even with lower relevance score
      // because score difference is within 100 points
      expect(sortedItems[0].name).toBe('Red Hat OpenShift GitOps');
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat Inc');

      // Other gitops operators should follow in alphabetical order
      // Both "gitops-primer" and "GitOps Toolkit" have same relevance score
      // so they are sorted alphabetically
      expect(sortedItems[1].name).toBe('GitOps Toolkit');
      expect(sortedItems[2].name).toBe('gitops-primer');
    });

    it('respects relevance scoring when differences are significant (>100 points)', () => {
      const items = [
        {
          name: 'Storage Manager Tool',
          provider: 'Other Company',
          obj: { metadata: { labels: { provider: 'Other Company' } } },
          description: 'Storage management solution',
          keywords: ['storage', 'management'],
        },
        {
          name: 'Red Hat Storage Solution',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'Enterprise storage solution',
          keywords: ['enterprise', 'storage'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'storage');

      // "Storage Manager Tool" scores: title match (100) + starts with (25) + keyword (60) = 185 points
      // "Red Hat Storage Solution" scores: title match (100) + keyword (60) = 160 points
      // Score difference is 25, which is <= 100, so Red Hat priority should apply
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat');
      expect(sortedItems[1].obj.metadata.labels.provider).toBe('Other Company');
    });

    it('sorts by relevance score when Red Hat priority difference is minimal', () => {
      const items = [
        {
          name: 'Database Tool',
          provider: 'Third Party',
          obj: { metadata: { labels: { provider: 'Third Party Inc' } } },
          description: 'Database management tool',
          keywords: ['database', 'management'],
        },
        {
          name: 'Database Operator',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'Red Hat database operator',
          keywords: ['database', 'operator'],
        },
        {
          name: 'Another Database Solution',
          provider: 'Another Company',
          obj: { metadata: { labels: { provider: 'Another Company' } } },
          description: 'Another database solution',
          keywords: ['database', 'solution'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'database');

      // Red Hat should be prioritized even with same relevance score
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat');
      expect(sortedItems[0].name).toBe('Database Operator');

      // "Database Tool" has higher relevance score than "Another Database Solution"
      // Database Tool: name match (100) + starts with (25) + keyword (60) = 185
      // Another Database Solution: name match (100) + keyword (60) = 160
      expect(sortedItems[1].name).toBe('Database Tool');
      expect(sortedItems[2].name).toBe('Another Database Solution');
    });

    it('handles mixed provider field sources correctly', () => {
      const items = [
        {
          name: 'Community Tool',
          obj: { metadata: { labels: { provider: 'Community' } } },
          description: 'Community developed tool',
          keywords: ['community', 'tool'],
        },
        {
          name: 'Red Hat Certified Tool',
          obj: { metadata: { labels: { provider: 'Red Hat, Inc.' } } },
          description: 'Tool certified by Red Hat',
          keywords: ['certified', 'tool'],
        },
        {
          name: 'Red Hat Native Tool',
          obj: { metadata: { labels: { provider: 'Other Company' } } },
          description: 'Native Red Hat tool',
          keywords: ['native', 'tool'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'tool');

      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat, Inc.');
      expect(sortedItems[1].name).toBe('Community Tool');
      expect(sortedItems[2].name).toBe('Red Hat Native Tool');
    });

    it('prioritizes exact Red Hat matches over contains matches', () => {
      const items = [
        {
          name: 'Red Hat Marketplace Tool',
          obj: { metadata: { labels: { provider: 'Red Hat Marketplace Solutions' } } },
          description: 'Tool from Red Hat Marketplace',
          keywords: ['marketplace', 'tool'],
        },
        {
          name: 'Red Hat Core Tool',
          obj: { metadata: { labels: { provider: 'Red Hat Inc' } } },
          description: 'Core Red Hat tool',
          keywords: ['core', 'tool'],
        },
        {
          name: 'Red Hat Official Tool',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'Official Red Hat tool',
          keywords: ['official', 'tool'],
        },
      ];

      const sortedItems = orderAndSortByRelevance(items, 'tool');

      expect(sortedItems[0].name).toBe('Red Hat Core Tool');
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat Inc');
      expect(sortedItems[1].name).toBe('Red Hat Official Tool');
      expect(sortedItems[1].obj.metadata.labels.provider).toBe('Red Hat');
      expect(sortedItems[2].obj.metadata.labels.provider).toBe('Red Hat Marketplace Solutions');
    });
  });

  describe('edge cases', () => {
    it('handles null, undefined, and empty arrays gracefully', () => {
      expect(orderAndSortByRelevance(null)).toEqual([]);
      expect(orderAndSortByRelevance(null, 'search')).toEqual([]);

      expect(orderAndSortByRelevance(undefined)).toEqual([]);
      expect(orderAndSortByRelevance(undefined, 'search')).toEqual([]);

      expect(orderAndSortByRelevance([])).toEqual([]);
      expect(orderAndSortByRelevance([], 'search')).toEqual([]);

      expect(orderAndSortByRelevance('not-an-array')).toEqual([]);
      expect(orderAndSortByRelevance({}, 'search')).toEqual([]);
    });

    it('filters out null and undefined items from arrays', () => {
      const items = [
        null,
        {
          name: 'Valid Operator',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'A valid operator',
        },
        undefined,
        {
          name: 'Another Valid Operator',
          provider: 'Community',
          obj: { metadata: { labels: { provider: 'Community' } } },
          description: 'Another valid operator',
        },
        null,
      ];

      const sortedItems = orderAndSortByRelevance(items);

      // Should only return the valid items
      expect(sortedItems).toHaveLength(2);
      expect(sortedItems[0].name).toBe('Valid Operator');
      expect(sortedItems[1].name).toBe('Another Valid Operator');
    });

    it('handles items with missing or malformed properties', () => {
      const items = [
        {
          // Missing name and provider
          description: 'Operator with missing properties',
        },
        {
          name: 'Operator with minimal data',
          // Missing other properties
        },
        {
          name: 'Operator with null obj',
          provider: 'Test Provider',
          obj: null,
          description: 'Operator with null obj',
        },
        {
          name: 'Complete Operator',
          provider: 'Red Hat',
          obj: { metadata: { labels: { provider: 'Red Hat' } } },
          description: 'A complete operator',
        },
      ];

      // Should not throw errors
      expect(() => orderAndSortByRelevance(items)).not.toThrow();
      expect(() => orderAndSortByRelevance(items, 'search')).not.toThrow();

      const sortedItems = orderAndSortByRelevance(items);

      // Should return all items, with Red Hat first
      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].name).toBe('Complete Operator');
    });
  });
});
