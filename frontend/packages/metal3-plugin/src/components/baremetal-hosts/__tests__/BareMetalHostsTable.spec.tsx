import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { BareMetalHostBundle } from '../../types';
import { getBareMetalHostDataViewRows } from '../BareMetalHostsTable';

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: jest.fn(({ name }) => name),
}));
jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
  LazyActionMenu: jest.fn(() => 'Actions'),
}));
jest.mock('../BareMetalHostStatus', () => ({
  __esModule: true,
  default: jest.fn(({ status }) => status),
}));
jest.mock('../BareMetalHostSecondaryStatus', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../BareMetalHostRole', () => ({ __esModule: true, default: jest.fn(() => 'worker') }));
jest.mock('../NodeLink', () => ({
  __esModule: true,
  default: jest.fn(({ nodeName }) => nodeName ?? null),
}));

const bundle: BareMetalHostBundle = {
  metadata: { name: 'worker-0' },
  host: {
    apiVersion: 'metal3.io/v1alpha1',
    kind: 'BareMetalHost',
    metadata: { name: 'worker-0', namespace: 'openshift-machine-api' },
    spec: { bmc: { address: 'ipmi://192.168.111.1:6230', credentialsName: 'worker-0-bmc' } },
    status: {
      hardware: { systemVendor: { serialNumber: 'SN-0001' } },
    },
  } as BareMetalHostBundle['host'],
  node: { metadata: { name: 'worker-0.example.com' } } as BareMetalHostBundle['node'],
  machine: undefined,
  machineSet: undefined,
  nodeMaintenance: undefined,
  status: { status: 'provisioned' },
};

const renderRow = (obj: BareMetalHostBundle, ids: string[]) => {
  const columns: ConsoleDataViewColumn<BareMetalHostBundle>[] = ids.map((id) => ({
    id,
    title: id,
  }));
  const [cells] = getBareMetalHostDataViewRows(
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

describe('getBareMetalHostDataViewRows', () => {
  it('should display the host name, status, and node', () => {
    renderRow(bundle, ['name', 'status', 'node']);
    expect(screen.getByRole('cell', { name: 'worker-0' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'provisioned' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'worker-0.example.com' })).toBeVisible();
  });

  it('should display the management address and serial number', () => {
    renderRow(bundle, ['address', 'serialNumber']);
    expect(screen.getByRole('cell', { name: 'ipmi://192.168.111.1:6230' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'SN-0001' })).toBeVisible();
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(bundle, ['serialNumber', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'SN-0001',
      'worker-0',
    ]);
    expect(screen.queryByText('worker-0.example.com')).not.toBeInTheDocument();
  });

  it('should show placeholders when the address and serial number are unavailable', () => {
    const hostWithoutHardware = {
      ...bundle,
      host: { ...bundle.host, spec: {}, status: {} },
    } as BareMetalHostBundle;
    renderRow(hostWithoutHardware, ['address', 'serialNumber']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['-', '-']);
  });
});
