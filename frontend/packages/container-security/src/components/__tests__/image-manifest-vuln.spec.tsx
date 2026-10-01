import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { Priority } from '../../const';
import type { ImageManifestVuln } from '../../types';
import { getImageManifestVulnDataViewRows, totalCount } from '../image-manifest-vuln';
import { fakeVulnFor } from './bad-pods';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: jest.fn(({ displayName, name }) => displayName ?? name),
  navFactory: {},
  SectionHeading: jest.fn(() => null),
  ResourceSummary: jest.fn(() => null),
  DetailsItem: jest.fn(() => null),
  Loading: jest.fn(() => null),
}));

const renderRow = (obj: ImageManifestVuln, ids: string[]) => {
  const columns: ConsoleDataViewColumn<ImageManifestVuln>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getImageManifestVulnDataViewRows(
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

describe('totalCount', () => {
  it('should return 0 if vuln status not present', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    delete vuln.status;
    const tCount = totalCount(vuln);
    expect(tCount).toBe(0);
  });
  it('Total vuln should be 2', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    const tCount = totalCount(vuln);
    expect(tCount).toBe(2);
  });
});

describe('getImageManifestVulnDataViewRows', () => {
  it('should shorten the image name and display the namespace', () => {
    renderRow(fakeVulnFor(Priority.Critical), ['name', 'namespace']);
    expect(screen.getByRole('cell', { name: 'alecmerdler/bad-pod' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'default' })).toBeVisible();
  });

  it('should display the vulnerability counts', () => {
    renderRow(fakeVulnFor(Priority.Critical), [
      'highestSeverity',
      'affectedPods',
      'fixable',
      'total',
    ]);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent.trim())).toEqual([
      'Critical',
      '1',
      '0',
      '2',
    ]);
  });

  it('should show a dash when the image has not been scanned yet', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    delete vuln.status;
    renderRow(vuln, ['highestSeverity', 'affectedPods', 'fixable', 'total']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent.trim())).toEqual([
      '-',
      '0',
      '0',
      '0',
    ]);
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(fakeVulnFor(Priority.Critical), ['total', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '2',
      'alecmerdler/bad-pod',
    ]);
    expect(screen.queryByText('default')).not.toBeInTheDocument();
  });
});
