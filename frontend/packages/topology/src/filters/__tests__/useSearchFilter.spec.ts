import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { useSearchFilter } from '../useSearchFilter';

jest.mock('../filter-utils', () => ({
  getTopologySearchQuery: jest.fn(),
}));

let mockCurrentSearchQuery = '';
let mockLabelsQuery = '';

jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () =>
      new Map().set('searchQuery', mockCurrentSearchQuery).set('labels', mockLabelsQuery),
  };
});

const testUseSearchFilter = (
  text: string | null | undefined,
  searchQuery: string | undefined,
  labels?: { [key: string]: string },
  labelsQuery?: string,
): ReturnType<typeof useSearchFilter> => {
  mockCurrentSearchQuery = searchQuery;
  mockLabelsQuery = labelsQuery;
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

  it('should match labels to labels query even if the name filter does not match', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, 'test', { foo: 'bar' }, 'foo=bar')[0]).toBe(true);
      expect(
        testUseSearchFilter(null, 'test', { foo: 'bar', bar: 'baz' }, 'foo=bar,bar=baz')[0],
      ).toBe(true);
    });
  });

  it('should match text to search query even if the labels filter does not match', () => {
    testHook(() => {
      expect(testUseSearchFilter('test', 'test', { foo: 'bar' }, 'foo=')[0]).toBe(true);
      expect(testUseSearchFilter('search', 'search', {}, 'foo=bar')[0]).toBe(true);
    });
  });

  it('should not match labels to labels query', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, null, { foo: 'test' }, 'foo=bar,bar=baz')[0]).toBe(false);
      expect(testUseSearchFilter(null, null, { foo: 'bar' }, '')[0]).toBe(false);
      expect(testUseSearchFilter(null, null, { foo: 'bar' }, null)[0]).toBe(false);
      expect(testUseSearchFilter(null, null, {}, null)[0]).toBe(false);
      expect(testUseSearchFilter(null, null, { foo: 'bar' }, 'foo=bar,bar=baz')[0]).toBe(false);
    });
  });

  it('should return search query', () => {
    testHook(() => {
      expect(testUseSearchFilter(null, undefined)[1]).toBe(undefined);
      expect(testUseSearchFilter(null, null)[1]).toBe(null);
      expect(testUseSearchFilter(null, 'test')[1]).toBe('test');
    });
  });
});
