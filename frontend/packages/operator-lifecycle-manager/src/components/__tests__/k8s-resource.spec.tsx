import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import type { ProvidedAPI } from '../../types';
import { getOperandResourceDataViewRows, useOperandResourceColumns } from '../k8s-resource';

jest.mock('@patternfly/react-topology', () => ({}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp,
}));

const resource: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: 'test-pod',
    namespace: 'test-ns',
    creationTimestamp: '2026-01-01T00:00:00Z',
  },
  status: { phase: 'Running' },
};

const providedAPI = { resources: [] } as ProvidedAPI;
const linkFor = jest.fn((obj: K8sResourceKind) => <a href={`/${obj.metadata.name}`}>{obj.kind}</a>);

const renderRow = (obj: K8sResourceKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<K8sResourceKind>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getOperandResourceDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: { linkFor, providedAPI }, index: 0 }],
    columns,
  );
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          {cells.map(({ id, cell }) => (
            <td key={id}>{cell}</td>
          ))}
        </tr>
      </tbody>
    </table>,
  );
};

describe('useOperandResourceColumns', () => {
  it('returns the expected column titles', () => {
    const { result } = renderHookWithProviders(() => useOperandResourceColumns());
    expect(result.current.columns.map(({ title }) => title)).toEqual([
      'Name',
      'Kind',
      'Status',
      'Created',
    ]);
  });

  it('makes every column resizable, since the table has no actions column', () => {
    const { result } = renderHookWithProviders(() => useOperandResourceColumns());
    expect(result.current.columns.every(({ resizableProps }) => !!resizableProps)).toBe(true);
  });
});

describe('getOperandResourceDataViewRows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the name via the supplied linkFor callback', () => {
    renderRow(resource, ['name']);
    expect(linkFor).toHaveBeenCalledWith(resource, providedAPI);
    expect(screen.getByRole('link', { name: 'Pod' })).toHaveAttribute('href', '/test-pod');
  });

  it('renders kind, status and creation timestamp', () => {
    renderRow(resource, ['kind', 'status', 'created']);
    expect(screen.getByRole('cell', { name: 'Pod' })).toBeVisible();
    expect(screen.getByText('Running')).toBeVisible();
    expect(screen.getByRole('cell', { name: '2026-01-01T00:00:00Z' })).toBeVisible();
  });

  it('falls back to Created when the resource reports no phase', () => {
    renderRow({ ...resource, status: undefined }, ['status']);
    expect(screen.getByText('Created')).toBeVisible();
  });

  it('preserves the requested column order and omits inactive columns', () => {
    renderRow(resource, ['created', 'kind']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '2026-01-01T00:00:00Z',
      'Pod',
    ]);
  });
});
