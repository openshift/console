import { render, screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { BareMetalHostDisk } from '../../../types/host';
import { getBareMetalHostDiskDataViewRows } from '../BareMetalHostDisks';

const ssd: BareMetalHostDisk = {
  name: '/dev/sda',
  sizeBytes: 480103981056,
  rotational: false,
  model: 'PERC H730P',
  serialNumber: 'DISK-SSD-0001',
  vendor: 'DELL',
  hctl: '0:2:0:0',
};

const renderRow = (obj: BareMetalHostDisk, ids: string[]) => {
  const columns: ConsoleDataViewColumn<BareMetalHostDisk>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getBareMetalHostDiskDataViewRows(
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

describe('getBareMetalHostDiskDataViewRows', () => {
  it('should display the disk name, model, vendor, serial number, and HCTL', () => {
    renderRow(ssd, ['name', 'model', 'vendor', 'serialNumber', 'hctl']);
    expect(screen.getByRole('cell', { name: '/dev/sda' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'PERC H730P' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'DELL' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'DISK-SSD-0001' })).toBeVisible();
    expect(screen.getByRole('cell', { name: '0:2:0:0' })).toBeVisible();
  });

  it('should humanize the disk size', () => {
    renderRow(ssd, ['size']);
    expect(screen.getByRole('cell', { name: '480.1 GB' })).toBeVisible();
  });

  it('should label non-rotational disks as SSD and rotational disks as Rotational', () => {
    renderRow(ssd, ['type']);
    expect(screen.getByRole('cell', { name: 'SSD' })).toBeVisible();

    renderRow({ ...ssd, rotational: true }, ['type']);
    expect(screen.getByRole('cell', { name: 'Rotational' })).toBeVisible();
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(ssd, ['vendor', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'DELL',
      '/dev/sda',
    ]);
    expect(screen.queryByText('PERC H730P')).not.toBeInTheDocument();
  });
});
