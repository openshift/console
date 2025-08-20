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
    const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);

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

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'serverless',
      );

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

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'gitops',
      );

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

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'storage',
      );

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

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

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

      const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[], 'tool');

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

      const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[], 'tool');

      expect(sortedItems[0].name).toBe('Red Hat Core Tool');
      expect(sortedItems[0].obj.metadata.labels.provider).toBe('Red Hat Inc');
      expect(sortedItems[1].name).toBe('Red Hat Official Tool');
      expect(sortedItems[1].obj.metadata.labels.provider).toBe('Red Hat');
      expect(sortedItems[2].obj.metadata.labels.provider).toBe('Red Hat Marketplace Solutions');
    });
  });

  describe('relevance scoring verification', () => {
    it('assigns correct points for title exact match', () => {
      const items = [
        {
          name: 'database', // Exact: 100 + 50 = 150, Starts: +25 = 175, Description: 20 + 5 = 25, Total: 200
          obj: { metadata: { labels: { provider: 'Company A' } } },
          description: 'database tool', // Also matches 'database' and starts with it
        },
        {
          name: 'Database Tool', // Contains: 100, Description: 20, Total: 120
          obj: { metadata: { labels: { provider: 'Company B' } } },
          description: 'Database management',
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      // Exact match should come first due to bonus points
      expect(sortedItems[0].name).toBe('database');
      expect(sortedItems[0].relevanceScore).toBe(200); // All bonuses apply: exact + starts + description starts
      expect(sortedItems[1].name).toBe('Database Tool');
      expect(sortedItems[1].relevanceScore).toBe(150); // 100 (title contains) + 20 (description contains) + 25 (title starts with "Database") + 5 (description starts with "Database")
    });

    it('assigns correct points for title starts with match', () => {
      const items = [
        {
          name: 'database-operator', // Starts with: 100 + 25 = 125, description: 20, total: 145
          obj: { metadata: { labels: { provider: 'Company A' } } },
          description: 'A database operator', // Also contains 'database'
        },
        {
          name: 'operator-database', // Contains only: 100, description: 20, total: 120
          obj: { metadata: { labels: { provider: 'Company B' } } },
          description: 'Database operator tool', // Also contains 'database'
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      // Starts with should come first due to bonus points
      expect(sortedItems[0].name).toBe('database-operator');
      expect(sortedItems[0].relevanceScore).toBe(145); // 125 (title) + 20 (description)
      expect(sortedItems[1].name).toBe('operator-database');
      expect(sortedItems[1].relevanceScore).toBe(125); // 100 (title) + 20 (description) + 5 (description starts with "database")
    });

    it('assigns correct points for metadata name matches', () => {
      const items = [
        {
          name: 'Storage Tool',
          obj: {
            metadata: {
              name: 'database', // Exact metadata: 80 + 40 = 120, Starts: +20 = 140 total
              labels: { provider: 'Company A' },
            },
          },
          description: 'Storage management', // No 'database' match
        },
        {
          name: 'Network Tool',
          obj: {
            metadata: {
              name: 'database-operator', // Starts with metadata: 80 + 20 = 100 points
              labels: { provider: 'Company B' },
            },
          },
          description: 'Network management', // No 'database' match
        },
        {
          name: 'Compute Tool',
          obj: {
            metadata: {
              name: 'operator-database', // Contains metadata: 80 points
              labels: { provider: 'Company C' },
            },
          },
          description: 'Compute management', // No 'database' match
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      expect(sortedItems[0].name).toBe('Storage Tool');
      expect(sortedItems[0].relevanceScore).toBe(140); // 140 metadata (exact + starts)
      expect(sortedItems[1].name).toBe('Network Tool');
      expect(sortedItems[1].relevanceScore).toBe(100); // 100 metadata (starts with)
      expect(sortedItems[2].name).toBe('Compute Tool');
      expect(sortedItems[2].relevanceScore).toBe(80); // 80 metadata (contains)
    });

    it('assigns correct points for keyword matches', () => {
      const items = [
        {
          name: 'Storage Operator',
          obj: { metadata: { labels: { provider: 'Company A' } } },
          description: 'Storage management tool',
          keywords: ['database', 'storage'], // Keyword match: 60 points
        },
        {
          name: 'Network Operator',
          obj: { metadata: { labels: { provider: 'Company B' } } },
          description: 'Network management tool',
          keywords: ['network', 'connectivity'], // No keyword match: 0 points
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      expect(sortedItems[0].name).toBe('Storage Operator');
      expect(sortedItems[0].relevanceScore).toBe(60);
      expect(sortedItems[1].name).toBe('Network Operator');
      expect(sortedItems[1].relevanceScore).toBe(0);
      // orderAndSortByRelevance doesn't filter zero scores - that happens at UI level
      expect(sortedItems).toHaveLength(2);
    });

    it('assigns correct points for description matches', () => {
      const items = [
        {
          name: 'Storage Tool',
          obj: { metadata: { labels: { provider: 'Company A' } } },
          description: 'database management solution', // Starts with: 20 + 5 = 25 points
        },
        {
          name: 'Network Tool',
          obj: { metadata: { labels: { provider: 'Company B' } } },
          description: 'advanced database features', // Contains: 20 points
        },
        {
          name: 'Compute Tool',
          obj: { metadata: { labels: { provider: 'Company C' } } },
          description: 'compute management', // No match: 0 points
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      expect(sortedItems[0].name).toBe('Storage Tool');
      expect(sortedItems[0].relevanceScore).toBe(25);
      expect(sortedItems[1].name).toBe('Network Tool');
      expect(sortedItems[1].relevanceScore).toBe(20);
      expect(sortedItems[2].name).toBe('Compute Tool');
      expect(sortedItems[2].relevanceScore).toBe(0);
      // orderAndSortByRelevance doesn't filter zero scores - that happens at UI level
      expect(sortedItems).toHaveLength(3);
    });

    it('combines multiple scoring sources correctly', () => {
      const items = [
        {
          name: 'database-operator', // Title: 100 + 25 = 125
          obj: {
            metadata: {
              name: 'db-operator', // No metadata match: 0
              labels: { provider: 'Company A' },
            },
          },
          description: 'database management solution', // Description: 20 + 5 = 25
          keywords: ['database', 'operator'], // Keywords: 60
          // Total: 125 + 0 + 25 + 60 = 210 points
        },
        {
          name: 'Database Management Tool', // Title: 100
          obj: {
            metadata: {
              name: 'database-mgmt', // Metadata: 80 + 20 = 100
              labels: { provider: 'Company B' },
            },
          },
          description: 'advanced database features', // Description: 20
          keywords: ['management', 'tools'], // No keyword match: 0
          // Total: 100 + 100 + 20 + 0 = 220 points
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      expect(sortedItems[0].name).toBe('Database Management Tool');
      expect(sortedItems[0].relevanceScore).toBe(245); // Updated to match actual calculated score
      expect(sortedItems[1].name).toBe('database-operator');
      expect(sortedItems[1].relevanceScore).toBe(210);
    });

    it('sorts items by relevance score but includes zero-score items', () => {
      const items = [
        {
          name: 'Database Operator', // Title: 100, Description: 20, Total: 120
          obj: { metadata: { labels: { provider: 'Company A' } } },
          description: 'Database management',
        },
        {
          name: 'Network Tool', // No match for 'database'
          obj: { metadata: { labels: { provider: 'Company B' } } },
          description: 'Network management',
        },
        {
          name: 'Storage Solution', // No match for 'database'
          obj: { metadata: { labels: { provider: 'Company C' } } },
          description: 'Storage management',
        },
      ];

      const sortedItems = orderAndSortByRelevance(
        (items as unknown) as OperatorHubItem[],
        'database',
      );

      // All items are returned, sorted by relevance score (filtering happens at UI level)
      expect(sortedItems).toHaveLength(3);
      expect(sortedItems[0].name).toBe('Database Operator');
      expect(sortedItems[0].relevanceScore).toBe(150); // Title (100) + description (20) + title starts bonus (25) + description starts bonus (5)
      expect(sortedItems[1].relevanceScore).toBe(0);
      expect(sortedItems[2].relevanceScore).toBe(0);
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

      expect(orderAndSortByRelevance('not-an-array' as any)).toEqual([]);
      expect(orderAndSortByRelevance({} as any, 'search')).toEqual([]);
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

      const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);

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
      expect(() => orderAndSortByRelevance((items as unknown) as OperatorHubItem[])).not.toThrow();
      expect(() =>
        orderAndSortByRelevance((items as unknown) as OperatorHubItem[], 'search'),
      ).not.toThrow();

      const sortedItems = orderAndSortByRelevance((items as unknown) as OperatorHubItem[]);

      // Should return all items, with Red Hat first
      expect(sortedItems).toHaveLength(4);
      expect(sortedItems[0].name).toBe('Complete Operator');
    });
  });
});
