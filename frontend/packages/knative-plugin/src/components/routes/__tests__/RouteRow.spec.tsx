import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { RouteKind } from '../../../types';
import { getRouteDataViewRows } from '../RouteRow';

jest.mock('@console/internal/module/k8s', () => ({
  K8sResourceConditionStatus: { True: 'True', False: 'False', Unknown: 'Unknown' },
}));
jest.mock('@console/internal/module/k8s/k8s', () => ({
  referenceFor: jest.fn(() => 'serving.knative.dev~v1~Route'),
}));
jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: ({ name }) => name,
}));
jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp,
}));
jest.mock('@console/internal/components/utils/link', () => ({
  ExternalLinkWithCopy: ({ text }) => text,
}));
const resource: RouteKind = {
  apiVersion: 'serving.knative.dev/v1',
  kind: 'Route',
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
    traffic: [{ revisionName: 'sample-00001', percent: 100 }],
  },
};

const renderRow = (obj: RouteKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<RouteKind>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getRouteDataViewRows(
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

describe('RouteRow', () => {
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

  it('should display the URL and conditions', () => {
    renderRow(resource, ['url', 'conditions']);
    expect(screen.getByRole('cell', { name: /https:\/\/example.com/ })).toBeVisible();
    expect(screen.getByRole('cell', { name: '0 OK / 1' })).toBeVisible();
  });
  it('should display the traffic percentage and revision', () => {
    renderRow(resource, ['traffic']);
    expect(screen.getByRole('cell')).toHaveTextContent('100% → sample-00001');
  });
  it('should show placeholders when status is unavailable', () => {
    renderRow({ ...resource, status: undefined }, ['url', 'conditions', 'traffic']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['-', '-', '-']);
  });
});
