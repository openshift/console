import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { ImageVuln } from '../../types';
import { getImageVulnerabilityDataViewRows } from '../ImageVulnerabilitiesTable';

const baseImageVuln: ImageVuln = {
  feature: {
    name: 'libcurl',
    namespaceName: 'RHEL7',
    version: '7.29.0-51.el7',
    versionformat: 'rpm',
    vulnerabilities: [],
  },
  vulnerability: {
    name: 'RHSA-2019:1880',
    namespaceName: 'RHEL7',
    description: 'curl: NTLM password overflow',
    link: 'https://access.redhat.com/errata/RHSA-2019:1880',
    fixedby: '0:7.29.0-51.el7_6.3',
    severity: 'Critical',
  },
};

const appDependencyVuln: ImageVuln = {
  ...baseImageVuln,
  vulnerability: {
    ...baseImageVuln.vulnerability,
    metadata: JSON.stringify({ UpdatedBy: 'CodeReadyAnalytics' }),
  },
};

const renderRow = (obj: ImageVuln, ids: string[]) => {
  const columns: ConsoleDataViewColumn<ImageVuln>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getImageVulnerabilityDataViewRows(
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

describe('getImageVulnerabilityDataViewRows', () => {
  it('should link the vulnerability name to its advisory', () => {
    renderRow(baseImageVuln, ['name']);
    const link = screen.getByRole('link', { name: /RHSA-2019:1880/ });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', 'https://access.redhat.com/errata/RHSA-2019:1880');
  });

  it('should display the severity, package, and versions', () => {
    renderRow(baseImageVuln, ['severity', 'package', 'currentVersion', 'fixedInVersion']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent.trim())).toEqual([
      'Critical',
      'libcurl',
      '7.29.0-51.el7',
      '0:7.29.0-51.el7_6.3',
    ]);
  });

  it('should report Red Hat base image vulnerabilities', () => {
    renderRow(baseImageVuln, ['type', 'source']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'Base image',
      'Red Hat',
    ]);
  });

  it('should report Snyk app dependency vulnerabilities', () => {
    renderRow(appDependencyVuln, ['type', 'source']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'App dependency',
      'Snyk',
    ]);
  });

  it('should show a placeholder when there is no fix available', () => {
    renderRow(
      { ...baseImageVuln, vulnerability: { ...baseImageVuln.vulnerability, fixedby: '' } },
      ['fixedInVersion'],
    );
    expect(screen.getByRole('cell', { name: '-' })).toBeVisible();
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(baseImageVuln, ['package', 'currentVersion']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'libcurl',
      '7.29.0-51.el7',
    ]);
    expect(screen.queryByText('RHSA-2019:1880')).not.toBeInTheDocument();
  });
});
