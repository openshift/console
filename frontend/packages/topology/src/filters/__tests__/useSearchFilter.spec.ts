import { renderHook } from '@testing-library/react';
import { useSearchFilter } from '../useSearchFilter';

jest.mock('../filter-utils', () => ({
  getTopologySearchQuery: jest.fn(),
}));

let mockCurrentSearchQuery: string | null | undefined = '';
let mockLabelsQuery: string | null | undefined = '';

jest.mock('@console/shared', () => {
  const ActualShared = jest.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () =>
      new Map().set('searchQuery', mockCurrentSearchQuery).set('labels', mockLabelsQuery),
  };
});

describe('useSearchFilter', () => {
  it('should handle null | undefined text', () => {
    mockCurrentSearchQuery = 'test';
    mockLabelsQuery = '';
    const { result: r1 } = renderHook(() => useSearchFilter(null));
    expect(r1.current[0]).toBe(false);

    mockCurrentSearchQuery = '';
    const { result: r2 } = renderHook(() => useSearchFilter(null));
    expect(r2.current[0]).toBe(false);

    mockCurrentSearchQuery = undefined;
    const { result: r3 } = renderHook(() => useSearchFilter(null));
    expect(r3.current[0]).toBe(false);

    mockCurrentSearchQuery = 'test';
    const { result: r4 } = renderHook(() => useSearchFilter(undefined));
    expect(r4.current[0]).toBe(false);

    mockCurrentSearchQuery = '';
    const { result: r5 } = renderHook(() => useSearchFilter(undefined));
    expect(r5.current[0]).toBe(false);

    mockCurrentSearchQuery = undefined;
    const { result: r6 } = renderHook(() => useSearchFilter(undefined));
    expect(r6.current[0]).toBe(false);
  });

  it('should fuzzy match text to search query', () => {
    mockLabelsQuery = '';
    mockCurrentSearchQuery = 'testing';
    const { result: r1 } = renderHook(() => useSearchFilter('testing'));
    expect(r1.current[0]).toBe(true);

    mockCurrentSearchQuery = 'ei';
    const { result: r2 } = renderHook(() => useSearchFilter('testing'));
    expect(r2.current[0]).toBe(true);

    mockCurrentSearchQuery = 'foobar';
    const { result: r3 } = renderHook(() => useSearchFilter('testing'));
    expect(r3.current[0]).toBe(false);

    mockCurrentSearchQuery = 'z';
    const { result: r4 } = renderHook(() => useSearchFilter('testing'));
    expect(r4.current[0]).toBe(false);

    mockCurrentSearchQuery = undefined;
    const { result: r5 } = renderHook(() => useSearchFilter('testing'));
    expect(r5.current[0]).toBe(false);
  });

  it('should match case insensitive', () => {
    mockLabelsQuery = '';
    mockCurrentSearchQuery = 'TEST';
    const { result: r1 } = renderHook(() => useSearchFilter('testing'));
    expect(r1.current[0]).toBe(true);

    mockCurrentSearchQuery = 'EI';
    const { result: r2 } = renderHook(() => useSearchFilter('testing'));
    expect(r2.current[0]).toBe(true);
  });

  it('should match labels to labels query even if the name filter does not match', () => {
    mockCurrentSearchQuery = 'test';
    mockLabelsQuery = 'foo=bar';
    const { result: r1 } = renderHook(() => useSearchFilter(null, { foo: 'bar' }));
    expect(r1.current[0]).toBe(true);

    mockLabelsQuery = 'foo=bar,bar=baz';
    const { result: r2 } = renderHook(() => useSearchFilter(null, { foo: 'bar', bar: 'baz' }));
    expect(r2.current[0]).toBe(true);
  });

  it('should match text to search query even if the labels filter does not match', () => {
    mockCurrentSearchQuery = 'test';
    mockLabelsQuery = 'foo=';
    const { result: r1 } = renderHook(() => useSearchFilter('test', { foo: 'bar' }));
    expect(r1.current[0]).toBe(true);

    mockCurrentSearchQuery = 'search';
    mockLabelsQuery = 'foo=bar';
    const { result: r2 } = renderHook(() => useSearchFilter('search', {}));
    expect(r2.current[0]).toBe(true);
  });

  it('should not match labels to labels query', () => {
    mockCurrentSearchQuery = null;
    mockLabelsQuery = 'foo=bar,bar=baz';
    const { result: r1 } = renderHook(() => useSearchFilter(null, { foo: 'test' }));
    expect(r1.current[0]).toBe(false);

    mockLabelsQuery = '';
    const { result: r2 } = renderHook(() => useSearchFilter(null, { foo: 'bar' }));
    expect(r2.current[0]).toBe(false);

    mockLabelsQuery = null;
    const { result: r3 } = renderHook(() => useSearchFilter(null, { foo: 'bar' }));
    expect(r3.current[0]).toBe(false);

    const { result: r4 } = renderHook(() => useSearchFilter(null, {}));
    expect(r4.current[0]).toBe(false);

    mockLabelsQuery = 'foo=bar,bar=baz';
    const { result: r5 } = renderHook(() => useSearchFilter(null, { foo: 'bar' }));
    expect(r5.current[0]).toBe(false);
  });

  it('should return search query', () => {
    mockLabelsQuery = '';
    mockCurrentSearchQuery = undefined;
    const { result: r1 } = renderHook(() => useSearchFilter(null));
    expect(r1.current[1]).toBe(undefined);

    mockCurrentSearchQuery = null;
    const { result: r2 } = renderHook(() => useSearchFilter(null));
    expect(r2.current[1]).toBe(null);

    mockCurrentSearchQuery = 'test';
    const { result: r3 } = renderHook(() => useSearchFilter(null));
    expect(r3.current[1]).toBe('test');
  });
});
