import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ServiceKind } from '../../../types';
import { getServiceDataViewRows } from '../ServiceRow';

jest.mock('@console/internal/module/k8s', () => ({
  K8sResourceConditionStatus: { True: 'True', False: 'False', Unknown: 'Unknown' },
}));
jest.mock('@console/internal/module/k8s/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Service'),
}));
jest.mock('@console/app/src/components/data-view/ConsoleDataView', () => ({
  actionsCellProps: {},
  getNameCellProps: jest.fn(() => ({})),
}));
jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: ({ name }) => name,
}));
jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
  LazyActionMenu: () => null,
}));
jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp,
}));
jest.mock('@console/shared/src/components/text/ClampedText', () => ({
  ClampedText: ({ children }) => children,
}));

const resource: ServiceKind = {
  apiVersion: 'serving.knative.dev/v1',
  kind: 'Service',
  metadata: {
    name: 'sample',
    namespace: 'test-project',
    generation: 3,
    creationTimestamp: '2026-01-01T00:00:00Z',
    labels: { 'serving.knative.dev/service': 'parent-service' },
  },
  status: {
    conditions: [{ type: 'Ready', status: 'False', message: 'Waiting for deployment' }],
    url: 'https://example.com',
  },
};

const renderRow = (obj: ServiceKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<ServiceKind>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getServiceDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: undefined, index: 0 }],
    columns,
  );
  return render(
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

describe('ServiceRow', () => {
  it('should display the resource name and namespace', () => {
    renderRow(resource, ['name', 'namespace']);
    expect(screen.getByRole('cell', { name: 'sample' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'test-project' })).toBeVisible();
  });
  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(resource, ['created', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '2026-01-01T00:00:00Z',
      'sample',
    ]);
    expect(screen.queryByText('test-project')).not.toBeInTheDocument();
  });

  it('should link to the service URL', () => {
    renderRow(resource, ['url']);
    expect(screen.getByRole('link', { name: /https:\/\/example.com/ })).toHaveAttribute(
      'href',
      'https://example.com',
    );
  });
  it('should display readiness, reason, and revision', () => {
    renderRow(resource, ['ready', 'reason', 'revision']);
    expect(screen.getByRole('cell', { name: 'False' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Waiting for deployment' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '3' })).toBeVisible();
  });
  it('should show placeholders when status and revision are unavailable', () => {
    renderRow(
      { ...resource, metadata: { ...resource.metadata, generation: undefined }, status: undefined },
      ['url', 'conditions', 'ready', 'reason', 'revision'],
    );
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '-',
      '-',
      '-',
      '-',
      '-',
    ]);
  });
});
