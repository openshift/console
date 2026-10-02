import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RevisionKind } from '../../../types';
import { getRevisionDataViewRows } from '../RevisionRow';

jest.mock('@console/internal/module/k8s', () => ({
  K8sResourceConditionStatus: { True: 'True', False: 'False', Unknown: 'Unknown' },
}));
jest.mock('@console/internal/module/k8s/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Revision'),
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

const resource: RevisionKind = {
  apiVersion: 'serving.knative.dev/v1',
  kind: 'Revision',
  metadata: {
    name: 'sample',
    namespace: 'test-project',
    generation: 3,
    creationTimestamp: '2026-01-01T00:00:00Z',
    labels: { 'serving.knative.dev/service': 'parent-service' },
  },
  status: {
    conditions: [{ type: 'Ready', status: 'False', message: 'Waiting for deployment' }],
  },
};

const renderRow = (obj: RevisionKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<RevisionKind>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getRevisionDataViewRows(
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

describe('RevisionRow', () => {
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

  it('should display the parent service', () => {
    renderRow(resource, ['service']);
    expect(screen.getByRole('cell', { name: 'parent-service' })).toBeVisible();
  });
  it('should display conditions, readiness, and reason', () => {
    renderRow(resource, ['conditions', 'ready', 'reason']);
    expect(screen.getByRole('cell', { name: '0 OK / 1' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'False' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Waiting for deployment' })).toBeVisible();
  });
  it('should handle missing status and parent service', () => {
    renderRow({ ...resource, metadata: { ...resource.metadata, labels: {} }, status: undefined }, [
      'service',
      'conditions',
      'ready',
      'reason',
    ]);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '',
      '-',
      '-',
      '-',
    ]);
  });
});
