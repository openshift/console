import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Build, BuildRun } from '../../../types';
import { getBuildDataViewRows } from '../BuildTable';

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: jest.fn(({ name }) => name),
}));
jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
  LazyActionMenu: jest.fn(() => 'Actions'),
}));
jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: jest.fn(({ timestamp }) => timestamp),
}));
jest.mock('../BuildOutput', () => ({
  __esModule: true,
  default: jest.fn(({ buildSpec }) => buildSpec.output.image),
}));
jest.mock('../../buildrun-status/BuildRunStatus', () => ({
  __esModule: true,
  default: jest.fn(() => 'Succeeded'),
  getBuildRunStatus: jest.fn(() => 'Succeeded'),
}));
jest.mock('../../buildrun-duration/BuildRunDuration', () => ({
  __esModule: true,
  default: jest.fn(() => '3 minutes'),
  getBuildRunDuration: jest.fn(() => '3 minutes'),
}));

const latestBuild = {
  apiVersion: 'shipwright.io/v1beta1',
  kind: 'BuildRun',
  metadata: {
    name: 'nodejs-build-run-1',
    namespace: 'test-project',
    creationTimestamp: '2026-01-01T00:00:00Z',
  },
} as BuildRun;

const build = {
  apiVersion: 'shipwright.io/v1beta1',
  kind: 'Build',
  metadata: { name: 'nodejs-build', namespace: 'test-project' },
  spec: { output: { image: 'quay.io/example/nodejs:latest' } },
  latestBuild,
} as Build;

const renderRow = (obj: Build, ids: string[]) => {
  const columns: ConsoleDataViewColumn<Build>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getBuildDataViewRows(
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

describe('getBuildDataViewRows', () => {
  it('should display the build name, namespace, and output image', () => {
    renderRow(build, ['name', 'namespace', 'output']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'nodejs-build',
      'test-project',
      'quay.io/example/nodejs:latest',
    ]);
  });

  it('should display the latest run, its status, time, and duration', () => {
    renderRow(build, ['lastRun', 'lastRunStatus', 'lastRunTime', 'lastRunDuration']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'nodejs-build-run-1',
      'Succeeded',
      '2026-01-01T00:00:00Z',
      '3 minutes',
    ]);
  });

  it('should show placeholders for a build that has never run', () => {
    renderRow({ ...build, latestBuild: undefined }, [
      'lastRun',
      'lastRunStatus',
      'lastRunTime',
      'lastRunDuration',
    ]);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '-',
      '-',
      '-',
      '-',
    ]);
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(build, ['output', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'quay.io/example/nodejs:latest',
      'nodejs-build',
    ]);
    expect(screen.queryByText('test-project')).not.toBeInTheDocument();
  });
});
