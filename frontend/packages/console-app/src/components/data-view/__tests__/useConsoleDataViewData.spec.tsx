import type { FC, ReactNode } from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { act, renderHook } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { useConsoleDataViewData } from '../useConsoleDataViewData';

jest.mock('@console/internal/components/factory/Table/active-columns-hook', () => ({
  useActiveColumns: jest.fn(({ columns }) => [columns, true]),
}));

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(() => ['default']),
}));

type Item = { metadata: { name: string; creationTimestamp: string } };

const item = (name: string, creationTimestamp: string): Item => ({
  metadata: { name, creationTimestamp },
});

const data = [
  item('charlie', '2026-01-03T00:00:00Z'),
  item('alpha', '2026-01-01T00:00:00Z'),
  item('bravo', '2026-01-02T00:00:00Z'),
];

const columns: ConsoleDataViewColumn<Item>[] = [
  { id: 'name', title: 'Name', sort: 'metadata.name' },
  { id: 'started', title: 'Started', sort: 'metadata.creationTimestamp' },
];

const getDataViewRows: GetDataViewRows<Item> = (rows, cols) =>
  rows.map(({ obj }) => cols.map(({ id }) => ({ id, cell: obj.metadata.name })));

const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const browserWrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderData = (
  overrides: Partial<Parameters<typeof useConsoleDataViewData<Item>>[0]> = {},
  routerWrapper = wrapper,
) =>
  renderHook(
    (hookOverrides) =>
      useConsoleDataViewData<Item>({
        columns,
        filteredData: [...data],
        filters: { name: '', label: '' },
        getDataViewRows,
        ...hookOverrides,
      }),
    { wrapper: routerWrapper, initialProps: overrides },
  );

const namesInOrder = (result: { current: { dataViewRows: any[] } }) =>
  result.current.dataViewRows.map(([firstCell]) => firstCell.cell);

describe('useConsoleDataViewData default sort', () => {
  it('should sort by the first column ascending when no default is given', () => {
    const { result } = renderData();
    expect(namesInOrder(result)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('should sort by the requested column and direction', () => {
    const { result } = renderData({
      defaultSortColumnId: 'started',
      defaultSortDirection: SortByDirection.desc,
    });
    expect(namesInOrder(result)).toEqual(['charlie', 'bravo', 'alpha']);
  });

  it('should sort ascending by the requested column when no direction is given', () => {
    const { result } = renderData({ defaultSortColumnId: 'started' });
    expect(namesInOrder(result)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('should fall back to the first column when the requested column is not present', () => {
    const { result } = renderData({ defaultSortColumnId: 'does-not-exist' });
    expect(namesInOrder(result)).toEqual(['alpha', 'bravo', 'charlie']);
  });
});

describe('useConsoleDataViewData sort cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.history.replaceState({}, '', '?sortBy=Started&orderBy=desc');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    window.history.replaceState({}, '', '/');
    (useActiveColumns as jest.Mock).mockImplementation(({ columns: active }) => [active, true]);
  });

  it('should retain the saved sort while active-column preferences load', () => {
    (useActiveColumns as jest.Mock).mockReturnValue([columns.slice(0, 1), false]);
    const { result, rerender } = renderData({}, browserWrapper);

    act(() => jest.runOnlyPendingTimers());
    expect(new URLSearchParams(window.location.search).get('sortBy')).toBe('Started');

    (useActiveColumns as jest.Mock).mockReturnValue([columns, true]);
    rerender({});
    act(() => jest.runOnlyPendingTimers());

    expect(new URLSearchParams(window.location.search).get('sortBy')).toBe('Started');
    expect(namesInOrder(result)).toEqual(['charlie', 'bravo', 'alpha']);
  });

  it('should wait for extension columns before removing an unavailable sort', () => {
    (useActiveColumns as jest.Mock).mockReturnValue([columns.slice(0, 1), true]);
    const { rerender } = renderData({ columnsResolved: false }, browserWrapper);

    act(() => jest.runOnlyPendingTimers());
    expect(new URLSearchParams(window.location.search).get('sortBy')).toBe('Started');

    rerender({ columnsResolved: true });
    act(() => jest.runOnlyPendingTimers());

    expect(new URLSearchParams(window.location.search).has('sortBy')).toBe(false);
  });
});
