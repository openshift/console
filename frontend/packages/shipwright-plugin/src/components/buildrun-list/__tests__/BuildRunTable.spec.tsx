import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { BuildRun } from '../../../types';
import { getBuildRunDataViewRows } from '../BuildRunTable';

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: jest.fn(({ name }) => name),
}));
jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: jest.fn(({ timestamp }) => timestamp),
}));
jest.mock('../../buildrun-status/BuildRunStatus', () => ({
  __esModule: true,
  default: jest.fn(({ buildRun }) => buildRun.status.conditions[0].reason),
  getBuildRunStatus: jest.fn(),
}));
jest.mock('../../buildrun-duration/BuildRunDuration', () => ({
  __esModule: true,
  default: jest.fn(() => '1 minute 5 seconds'),
  getBuildRunDurationInSeconds: jest.fn(),
}));

const buildRun = {
  apiVersion: 'shipwright.io/v1beta1',
  kind: 'BuildRun',
  metadata: {
    name: 'golang-build-run-1',
    namespace: 'test-project',
    creationTimestamp: '2026-01-01T00:00:00Z',
  },
  status: { conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }] },
} as BuildRun;

const renderRow = (obj: BuildRun, ids: string[]) => {
  const columns: ConsoleDataViewColumn<BuildRun>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getBuildRunDataViewRows(
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

describe('getBuildRunDataViewRows', () => {
  it('should display the build run name and namespace', () => {
    renderRow(buildRun, ['name', 'namespace']);
    expect(screen.getByRole('cell', { name: 'golang-build-run-1' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'test-project' })).toBeVisible();
  });

  it('should display the status, start time, and duration', () => {
    renderRow(buildRun, ['status', 'started', 'duration']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Failed',
      '2026-01-01T00:00:00Z',
      '1 minute 5 seconds',
    ]);
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(buildRun, ['started', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '2026-01-01T00:00:00Z',
      'golang-build-run-1',
    ]);
    expect(screen.queryByText('test-project')).not.toBeInTheDocument();
  });
});
