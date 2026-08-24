import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SortByDirection } from '@patternfly/react-table';
import type { ConsoleDataViewColumn } from '../types';
import { findSortColumnIndex, useConsoleDataViewSort } from '../useConsoleDataViewSort';

const columns: ConsoleDataViewColumn<unknown>[] = [
  { id: 'name', title: 'Name', sort: 'metadata.name', cell: 'Name' },
  { id: 'requester', title: 'Requester', sort: "metadata.annotations['openshift.io/requester']", cell: 'Requester' },
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
    const { result, rerender } = renderHook(
      ({ cols }) => useConsoleDataViewSort({ columns: cols }),
      {
        wrapper: wrapper('/k8s/cluster/projects?sortBy=requester&orderBy=desc'),
        initialProps: { cols: columns },
      },
    );

    expect(result.current.sortBy.index).toBe(1);
    expect(result.current.sortBy.direction).toBe(SortByDirection.desc);

    rerender({ cols: columns.map((c) => ({ ...c })) });

    expect(result.current.sortBy.index).toBe(1);
    expect(result.current.sortBy.direction).toBe(SortByDirection.desc);
  });
});
