import type { FC, ReactNode } from 'react';
import { SortByDirection } from '@patternfly/react-table';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useConsoleDataViewData } from '../useConsoleDataViewData';

jest.mock('@console/internal/components/factory/Table/active-columns-hook', () => ({
  useActiveColumns: jest.fn(({ columns }) => [columns]),
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

const renderData = (overrides = {}) =>
  renderHook(
    () =>
      useConsoleDataViewData<Item>({
        columns,
        filteredData: [...data],
        filters: { name: '', label: '' },
        getDataViewRows,
        ...overrides,
      }),
    { wrapper },
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
