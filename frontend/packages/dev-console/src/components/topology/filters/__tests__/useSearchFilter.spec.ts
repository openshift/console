// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { testHook } from '../../../../test/test-utils';
import { useSearchFilter } from '../useSearchFilter';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const testUseSearchFilter = (
  text: string | null | undefined,
  searchQuery: string | undefined,
): ReturnType<typeof useSearchFilter> => {
  (useSelector as jest.Mock).mockImplementation((fn: (state: Partial<RootState>) => any) => {
    return fn({
      plugins: {
        devconsole: { topology: new Map(Object.entries({ filters: { searchQuery } })) },
      },
    });
  });
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSearchFilter(text);
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
});
