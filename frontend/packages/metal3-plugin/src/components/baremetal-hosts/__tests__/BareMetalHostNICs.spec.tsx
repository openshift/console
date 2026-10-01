import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { BareMetalHostNIC } from '../../../types/host';
import { getBareMetalHostNICDataViewRows } from '../BareMetalHostNICs';

jest.mock('@patternfly/react-icons', () => ({
  RhMicronsCheckboxCompleteIcon: jest.fn(() => 'pxe-enabled'),
  RhMicronsCheckboxIncompleteIcon: jest.fn(() => 'pxe-disabled'),
}));

const nic: BareMetalHostNIC = {
  name: 'eno1',
  model: '0x8086 0x1521',
  ip: '192.168.111.20',
  mac: '00:1a:2b:3c:4d:5e',
  speedGbps: 10,
  vlanId: 100,
  pxe: true,
};

const renderRow = (obj: BareMetalHostNIC, ids: string[]) => {
  const columns: ConsoleDataViewColumn<BareMetalHostNIC>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getBareMetalHostNICDataViewRows(
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

describe('getBareMetalHostNICDataViewRows', () => {
  it('should display the NIC name, model, IP, MAC address, and VLAN ID', () => {
    renderRow(nic, ['name', 'model', 'ip', 'mac', 'vlanId']);
    expect(screen.getByRole('cell', { name: 'eno1' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '0x8086 0x1521' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '192.168.111.20' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '00:1a:2b:3c:4d:5e' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '100' })).toBeVisible();
  });

  it('should display the link speed in Gbps', () => {
    renderRow(nic, ['speed']);
    expect(screen.getByRole('cell', { name: '10 Gbps' })).toBeVisible();
  });

  it('should distinguish PXE-enabled from PXE-disabled interfaces', () => {
    renderRow(nic, ['pxe']);
    expect(screen.getByRole('cell', { name: 'pxe-enabled' })).toBeVisible();

    renderRow({ ...nic, pxe: false }, ['pxe']);
    expect(screen.getByRole('cell', { name: 'pxe-disabled' })).toBeVisible();
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(nic, ['ip', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '192.168.111.20',
      'eno1',
    ]);
    expect(screen.queryByText('00:1a:2b:3c:4d:5e')).not.toBeInTheDocument();
  });
});
