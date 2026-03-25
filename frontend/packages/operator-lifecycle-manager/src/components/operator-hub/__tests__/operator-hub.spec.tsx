import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { operatorHubDetailsProps, itemWithLongDescription } from '../../../../mocks';
import type { OperatorHubItem } from '../index';
import { OperatorHubItemDetails } from '../operator-hub-item-details';
import { getProviderValue, keywordCompare } from '../operator-hub-items';

jest.mock('../../clusterserviceversion', () => ({
  MarkdownView: jest.fn(() => '[MARKDOWN_VIEW]'),
}));

type KeywordCompareTestItem = Partial<OperatorHubItem> &
  Pick<OperatorHubItem, 'name' | 'description'> & {
    keywords: string[];
  };

describe('OperatorHubItemDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display long description when provided', () => {
    const { rerender } = renderWithProviders(
      <OperatorHubItemDetails updateChannel={''} updateVersion={''} {...operatorHubDetailsProps} />,
    );

    // Initially, user sees no long description
    expect(screen.queryByText('[MARKDOWN_VIEW]')).not.toBeInTheDocument();

    // Rerender with item that has longDescription
    rerender(
      <OperatorHubItemDetails
        updateChannel={''}
        updateVersion={''}
        {...operatorHubDetailsProps}
        item={itemWithLongDescription}
      />,
    );

    // User should now see the detailed description
    expect(screen.getByText('[MARKDOWN_VIEW]')).toBeVisible();
  });
});

describe('OperatorHub utility functions', () => {
  describe('keywordCompare', () => {
    const mockItems: KeywordCompareTestItem[] = [
      { name: 'prometheus', description: 'Monitoring tool', keywords: [] },
      { name: 'amq-streams', description: 'high performance streaming', keywords: [] },
      { name: 'etcd', description: 'key-value store', keywords: [] },
      { name: 'test', description: 'test operator', keywords: [] },
    ];

    it('should return all items when filter is empty', () => {
      const results = mockItems.filter((item) => keywordCompare('', item as OperatorHubItem));
      expect(results).toHaveLength(4);
    });

    it('should return matching item when searching by exact name', () => {
      const results = mockItems.filter((item) =>
        keywordCompare('prometheus', item as OperatorHubItem),
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('prometheus');
    });

    it('should return matching item when searching by description phrase', () => {
      const results = mockItems.filter((item) =>
        keywordCompare('high performance', item as OperatorHubItem),
      );
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('amq-streams');
    });

    it('should return no results when search term does not match any items', () => {
      const results = mockItems.filter((item) =>
        keywordCompare('this will have no results', item as OperatorHubItem),
      );
      expect(results).toHaveLength(0);
    });

    it('should return true for empty search term to show all items', () => {
      const item: KeywordCompareTestItem = {
        name: 'test',
        description: 'Test operator',
        keywords: [],
      };
      // Empty search should match all items (user sees all operators)
      expect(keywordCompare('', item as OperatorHubItem)).toBe(true);
    });

    it('should match operators by name for user search functionality', () => {
      const item: KeywordCompareTestItem = {
        name: 'prometheus',
        description: 'Other text',
        keywords: [],
      };
      // User searching for "prometheus" should find Prometheus operator
      expect(keywordCompare('prometheus', item as OperatorHubItem)).toBe(true);
      // User searching partial name "prom" should also find it
      expect(keywordCompare('prom', item as OperatorHubItem)).toBe(true);
      // User searching unrelated term should not find it
      expect(keywordCompare('database', item as OperatorHubItem)).toBe(false);
    });

    it('should match operators by description for comprehensive search', () => {
      const item: KeywordCompareTestItem = {
        name: 'test',
        description: 'Monitoring tool',
        keywords: [],
      };
      // User searching for functionality should find relevant operators
      expect(keywordCompare('monitoring', item as OperatorHubItem)).toBe(true);
      expect(keywordCompare('tool', item as OperatorHubItem)).toBe(true);
      // Unrelated search terms should not match
      expect(keywordCompare('storage', item as OperatorHubItem)).toBe(false);
    });

    it('should match operators by keywords for enhanced discoverability', () => {
      const item: KeywordCompareTestItem = {
        name: 'test',
        description: 'Test',
        keywords: ['database', 'storage'],
      };
      // User searching by category keywords should find relevant operators
      expect(keywordCompare('database', item as OperatorHubItem)).toBe(true);
      expect(keywordCompare('storage', item as OperatorHubItem)).toBe(true);
      // Keywords not in the array should not match
      expect(keywordCompare('networking', item as OperatorHubItem)).toBe(false);
    });

    it('should handle case sensitivity correctly for user search experience', () => {
      const item: KeywordCompareTestItem = {
        name: 'Prometheus',
        description: 'Monitoring Tool',
        keywords: [],
      };
      // User typing lowercase should find capitalized operator names
      expect(keywordCompare('prometheus', item as OperatorHubItem)).toBe(true);
      expect(keywordCompare('monitoring', item as OperatorHubItem)).toBe(true);
      // Filter string is case-sensitive (user must type lowercase)
      expect(keywordCompare('MONITORING', item as OperatorHubItem)).toBe(false);
    });

    it('should return false when search term does not match any operator fields', () => {
      const item: KeywordCompareTestItem = {
        name: 'test',
        description: 'Test operator',
        keywords: [],
      };
      // User searching for unrelated terms should not see irrelevant operators
      expect(keywordCompare('nomatch', item as OperatorHubItem)).toBe(false);
      expect(keywordCompare('xyz', item as OperatorHubItem)).toBe(false);
      expect(keywordCompare('unrelated', item as OperatorHubItem)).toBe(false);
    });
  });

  describe('getProviderValue', () => {
    it('should handle empty provider names', () => {
      expect(getProviderValue('')).toBe('');
    });

    it('should handle missing provider data gracefully for robust UI', () => {
      // User should not see errors when provider data is missing
      expect(getProviderValue(null)).toBe(null);
      expect(getProviderValue(undefined)).toBe(undefined);
      expect(getProviderValue('')).toBe('');
    });

    it('should preserve clean provider names without modification', () => {
      // User should see provider names that don't need cleaning unchanged
      expect(getProviderValue('Red Hat')).toBe('Red Hat');
      expect(getProviderValue('Custom Provider')).toBe('Custom Provider');
      expect(getProviderValue('Community')).toBe('Community');
    });

    it('should remove Inc from end of provider name', () => {
      expect(getProviderValue('CoreOS, Inc')).toBe('CoreOS');
      expect(getProviderValue('CoreOS, Inc.')).toBe('CoreOS');
    });

    it('should remove LLC from end of provider name', () => {
      expect(getProviderValue('Dummy LLC')).toBe('Dummy');
      expect(getProviderValue('Another Company, LLC')).toBe('Another Company');
    });

    it('should handle provider names with both Inc and periods', () => {
      expect(getProviderValue('Example Corp., Inc.')).toBe('Example Corp.');
      expect(getProviderValue('Example Corp., Inc')).toBe('Example Corp.');
    });

    it('should trim whitespace from result', () => {
      expect(getProviderValue('Test Inc')).toBe('Test');
      expect(getProviderValue('Test LLC')).toBe('Test');
    });
  });
});
