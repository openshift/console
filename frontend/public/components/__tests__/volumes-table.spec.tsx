import { screen } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { K8sResourceKind, PodKind } from '../../module/k8s';
import type { RowVolumeData } from '../volumes-table';
import { getVolumeDataViewRows } from '../volumes-table';

jest.mock('../utils/volume-type', () => ({
  VolumeType: jest.fn(({ volume }) => volume?.configMap?.name ?? 'unknown'),
}));
jest.mock('../utils/resource-icon', () => ({ ResourceIcon: jest.fn(() => null) }));
jest.mock('../../kinds', () => ({ connectToModel: jest.fn(() => () => null) }));
jest.mock('../modals/remove-volume-modal', () => ({ useRemoveModalLauncher: jest.fn() }));

const pod: PodKind = {
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: { name: 'my-pod', namespace: 'test-project' },
  spec: {
    volumes: [{ name: 'config', configMap: { name: 'my-config-map' } }],
    containers: [
      {
        name: 'web',
        volumeMounts: [{ name: 'config', mountPath: '/etc/config', subPath: 'app.conf' }],
      },
    ],
  },
};

const deployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: 'my-deployment', namespace: 'test-project' },
  spec: { template: pod },
} as unknown as K8sResourceKind;

const volume = (overrides: Partial<RowVolumeData> = {}): RowVolumeData => ({
  name: 'config',
  readOnly: false,
  volumeDetail: pod.spec.volumes[0],
  container: 'web',
  mountPath: '/etc/config',
  subPath: 'app.conf',
  resource: pod,
  ...overrides,
});

/** PatternFly's Td consumes the sticky and border props; a plain td only understands data-*. */
const dataAttributes = (props: Record<string, any> = {}) =>
  Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith('data-')));

const renderRow = (obj: RowVolumeData, ids: string[]) => {
  const columns: ConsoleDataViewColumn<RowVolumeData>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getVolumeDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: undefined, index: 0 }],
    columns,
  );
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          {cells.map(({ id, cell, props }) => (
            <td key={id} {...dataAttributes(props)}>
              {cell}
            </td>
          ))}
        </tr>
      </tbody>
    </table>,
  );
};

describe('getVolumeDataViewRows', () => {
  it('should display the volume name, mount path, subpath, and type', () => {
    renderRow(volume(), ['name', 'mountPath', 'subPath', 'type']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'config',
      '/etc/config',
      'app.conf',
      'my-config-map',
    ]);
  });

  it('should keep the data-test hooks the storage tests select on', () => {
    renderRow(volume(), ['name', 'mountPath']);
    expect(screen.getByTestId('volume-name-config')).toHaveTextContent('config');
    expect(screen.getByTestId('mount-path-config')).toHaveTextContent('/etc/config');
  });

  it('should note when a volume mount has no subpath', () => {
    renderRow(volume({ subPath: undefined }), ['subPath']);
    expect(screen.getByRole('cell', { name: 'No subpath' })).toBeVisible();
  });

  it('should report read-only mounts as read-only and the rest as read/write', () => {
    renderRow(volume({ readOnly: true }), ['permissions']);
    expect(screen.getByRole('cell', { name: 'Read-only' })).toBeVisible();

    renderRow(volume(), ['permissions']);
    expect(screen.getByRole('cell', { name: 'Read/Write' })).toBeVisible();
  });

  it('should link a Pod volume to the container that mounts it', () => {
    renderRow(volume(), ['utilizedBy']);
    expect(screen.getByRole('link', { name: 'web' })).toHaveAttribute(
      'href',
      '/k8s/ns/test-project/pods/my-pod/containers/web',
    );
  });

  it('should name the container without linking it for a workload volume', () => {
    renderRow(volume({ resource: deployment }), ['utilizedBy']);
    expect(screen.getByRole('cell', { name: 'web' })).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should preserve the selected column order and omit hidden columns', () => {
    renderRow(volume(), ['mountPath', 'name']);
    expect(screen.getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      '/etc/config',
      'config',
    ]);
    expect(screen.queryByText('app.conf')).not.toBeInTheDocument();
  });
});
