import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router';
import { SortByDirection } from '@patternfly/react-table';
import type { ConsoleDataViewColumn } from '../types';
import { findSortColumnIndex, useConsoleDataViewSort } from '../useConsoleDataViewSort';

const columns: ConsoleDataViewColumn<unknown>[] = [
  { id: 'name', title: 'Name', sort: 'metadata.name', cell: 'Name' },
  {
    id: 'requester',
    title: 'Requester',
    sort: "metadata.annotations['openshift.io/requester']",
    cell: 'Requester',
  },
  { id: 'created', title: 'Created', sort: 'metadata.creationTimestamp', cell: 'Created' },
];

describe('findSortColumnIndex', () => {
  it('matches a column by id', () => {
    expect(findSortColumnIndex(columns, 'requester')).toBe(1);
  });

  it('matches a column by title for existing URLs', () => {
    expect(findSortColumnIndex(columns, 'Requester')).toBe(1);
  });

  it('returns -1 when the key is missing', () => {
    expect(findSortColumnIndex(columns, null)).toBe(-1);
    expect(findSortColumnIndex(columns, 'unknown')).toBe(-1);
  });
});

describe('useConsoleDataViewSort', () => {
  const wrapper =
    (initialEntry: string) =>
    ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    );

  const wrapperWithSearchControl = (initialEntry: string) => {
    const searchParamsApi: { clearSortBy: () => void } = { clearSortBy: () => undefined };

    const SearchParamsBridge = () => {
      const [searchParams, setSearchParams] = useSearchParams();
      searchParamsApi.clearSortBy = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('sortBy');
        setSearchParams(next, { replace: true });
      };
      return null;
    };

    return {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[initialEntry]}>
          <SearchParamsBridge />
          {children}
        </MemoryRouter>
      ),
      clearSortBy: () => searchParamsApi.clearSortBy(),
    };
  };

  it('restores sort from the sortBy query param after columns are rebuilt', () => {
    const { result, rerender } = renderHook(
      ({ cols }) => useConsoleDataViewSort({ columns: cols }),
      {
        wrapper: wrapper('/k8s/cluster/projects?sortBy=Requester&orderBy=asc'),
        initialProps: { cols: columns },
      },
    );

    expect(result.current.sortBy).toEqual({ index: 1, direction: SortByDirection.asc });

    rerender({ cols: [...columns] });

    expect(result.current.sortBy).toEqual({ index: 1, direction: SortByDirection.asc });
  });

  it('keeps the current sort column when columns rebuild without a sortBy param', () => {
    const { wrapper: testWrapper, clearSortBy } = wrapperWithSearchControl(
      '/k8s/cluster/projects?sortBy=requester&orderBy=desc',
    );
    const { result, rerender } = renderHook(
      ({ cols }) => useConsoleDataViewSort({ columns: cols }),
      {
        wrapper: testWrapper,
        initialProps: { cols: columns },
      },
    );

    expect(result.current.sortBy.index).toBe(1);
    expect(result.current.sortBy.direction).toBe(SortByDirection.desc);

    act(() => {
      clearSortBy();
    });

    rerender({ cols: columns.map((c) => ({ ...c })) });

    expect(result.current.sortBy.index).toBe(1);
    expect(result.current.sortBy.direction).toBe(SortByDirection.desc);
  });

  it('follows the selected column id when columns are reordered without a sortBy param', () => {
    const { wrapper: testWrapper, clearSortBy } = wrapperWithSearchControl(
      '/k8s/cluster/projects?sortBy=requester&orderBy=desc',
    );
    const { result, rerender } = renderHook(
      ({ cols }) => useConsoleDataViewSort({ columns: cols }),
      {
        wrapper: testWrapper,
        initialProps: { cols: columns },
      },
    );

    expect(result.current.sortBy.index).toBe(1);

    act(() => {
      clearSortBy();
    });

    rerender({ cols: [columns[0], columns[2], columns[1]].map((c) => ({ ...c })) });

    expect(result.current.sortBy.index).toBe(2);
    expect(result.current.sortBy.direction).toBe(SortByDirection.desc);
  });

  it('falls back to the default sort when the selected column is removed and sortBy is absent', () => {
    const { wrapper: testWrapper, clearSortBy } = wrapperWithSearchControl(
      '/k8s/cluster/projects?sortBy=requester&orderBy=desc',
    );
    const { result, rerender } = renderHook(
      ({ cols }) => useConsoleDataViewSort({ columns: cols }),
      {
        wrapper: testWrapper,
        initialProps: { cols: columns },
      },
    );

    expect(result.current.sortBy.index).toBe(1);

    act(() => {
      clearSortBy();
    });

    rerender({ cols: [columns[0], columns[2]].map((c) => ({ ...c })) });

    expect(result.current.sortBy).toEqual({ index: 0, direction: SortByDirection.asc });
  });
});
