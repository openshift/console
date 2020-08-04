import { testHook } from '../../../../test/test-utils';
import { useSearchFilter } from '../useSearchFilter';
import { getTopologySearchQuery, getTopologySearchType, TopologySearchType } from '../filter-utils';

jest.mock('../filter-utils', () => {
  const ActualFilterUtils = require.requireActual('../filter-utils');
  return {
    ...ActualFilterUtils,
    getTopologySearchQuery: jest.fn(),
    getTopologySearchType: jest.fn(),
  };
});

const testUseSearchFilter = (
  text: string | null | undefined,
  searchQuery: string | undefined,
  labels?: string[],
  searchType?: string,
): ReturnType<typeof useSearchFilter> => {
  (getTopologySearchQuery as jest.Mock).mockImplementation(() => searchQuery);
  (getTopologySearchType as jest.Mock).mockImplementation(() => searchType || 'name');

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSearchFilter(text, labels);
};

describe('useSearchFilter', () => {
  it('should handle null | undefined text', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, 'test')[0]).toBe(false);
      expect(testUseSearchFilter(null, '')[0]).toBe(false);
      expect(testUseSearchFilter(null, undefined)[0]).toBe(false);
      expect(testUseSearchFilter(undefined, 'test')[0]).toBe(false);
      expect(testUseSearchFilter(undefined, '')[0]).toBe(false);
      expect(testUseSearchFilter(undefined, undefined)[0]).toBe(false);
    });
  });

  it('should fuzzy match text to search query', () => {
    testHook(() => {
      expect(testUseSearchFilter('testing', 'testing')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'ei')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'foobar')[0]).toBe(false);
      expect(testUseSearchFilter('testing', 'z')[0]).toBe(false);
      expect(testUseSearchFilter('testing', undefined)[0]).toBe(false);
    });
  });

  it('should match case insensitive', () => {
    testHook(() => {
      expect(testUseSearchFilter('testing', 'TEST')[0]).toBe(true);
      expect(testUseSearchFilter('testing', 'EI')[0]).toBe(true);
    });
  });

  it('should return search query', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, undefined)[1]).toBe(undefined);
      expect(testUseSearchFilter(null, null)[1]).toBe(null);
      expect(testUseSearchFilter(null, 'test')[1]).toBe('test');
    });
  });

  it('should handle null | undefined | empty labels', () => {
    const searchType = TopologySearchType.label;
    testHook(() => {
      expect(testUseSearchFilter(null, 'test', null, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, '', null, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, undefined, null, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, 'test', undefined, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, '', undefined, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, undefined, undefined, searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, 'test', [], searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, '', [], searchType)[0]).toBe(false);
      expect(testUseSearchFilter(null, undefined, [], searchType)[0]).toBe(false);
    });
  });

  it('should match labels to search query', () => {
    const searchType = TopologySearchType.label;
    const labels = ['fake=fake', 'app=test'];
    testHook(() => {
      expect(testUseSearchFilter('', 'app=test', labels, searchType)[0]).toBe(true);
      expect(testUseSearchFilter('', 'app=Test', labels, searchType)[0]).toBe(false);
      expect(testUseSearchFilter('', 'app=fake', labels, searchType)[0]).toBe(false);
      expect(testUseSearchFilter('', 'fake=app', labels, searchType)[0]).toBe(false);
      expect(testUseSearchFilter('', undefined, labels, searchType)[0]).toBe(false);
    });
  });

  it('should return search query', () => {
    const searchType = TopologySearchType.label;
    const labels = ['fake=fake', 'app=test'];
    testHook(() => {
      expect(testUseSearchFilter(null, undefined, labels, searchType)[1]).toBe(undefined);
      expect(testUseSearchFilter(null, null, labels, searchType)[1]).toBe(null);
      expect(testUseSearchFilter(null, 'test', labels, searchType)[1]).toBe('test');
    });
  });

  it('should return search type', () => {
    const searchType = TopologySearchType.label;
    const labels = ['fake=fake', 'app=test'];
    testHook(() => {
      expect(testUseSearchFilter(null, undefined)[2]).toBe(TopologySearchType.name);
      expect(testUseSearchFilter(null, null, labels)[2]).toBe(TopologySearchType.name);
      expect(testUseSearchFilter(null, 'test', labels)[2]).toBe(TopologySearchType.name);
      expect(testUseSearchFilter(null, undefined, labels, searchType)[2]).toBe(searchType);
      expect(testUseSearchFilter(null, null, labels, searchType)[2]).toBe(searchType);
      expect(testUseSearchFilter(null, 'test', labels, searchType)[2]).toBe(searchType);
    });
  });
});
