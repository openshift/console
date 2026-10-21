import { screen, configure } from '@testing-library/react';
import type { ConsoleDataViewColumn } from '@console/app/src/components/data-view/types';
import type { K8sResourceKind, RowProps } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getDataViewRows, HelmReleaseResourceStatus } from '../HelmReleaseResourcesRow';

configure({ testIdAttribute: 'data-test' });

let testData: RowProps<K8sResourceKind>[];
let testColumns: ConsoleDataViewColumn<K8sResourceKind>[];

describe('getDataViewRows', () => {
  beforeEach(() => {
    testData = [
      {
        obj: {
          kind: 'Secret',
          metadata: {
            creationTimestamp: '2020-01-20T05:37:13Z',
            name: 'sh.helm.release.v1.helm-mysql.v1',
            namespace: 'deb',
          },
        },
        rowData: undefined,
        activeColumnIDs: new Set(['name', 'type', 'status', 'created']),
        index: 0,
      },
    ];

    testColumns = [
      { id: 'name', title: 'Name', cell: null },
      { id: 'type', title: 'Type', cell: null },
      { id: 'status', title: 'Status', cell: null },
      { id: 'created', title: 'Created', cell: null },
    ] as ConsoleDataViewColumn<K8sResourceKind>[];
  });

  it('should return data view rows with correct structure', () => {
    const rows = getDataViewRows(testData, testColumns);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveLength(4); // Should have 4 columns

    // Check that each row has the expected structure
    rows[0].forEach((cell) => {
      expect(cell).toHaveProperty('id');
      expect(cell).toHaveProperty('cell');
    });
  });

  it('should render resource data correctly', () => {
    const rows = getDataViewRows(testData, testColumns);
    const nameCell = rows[0].find((cell: any) => cell.id === 'name') as any;

    // Test name cell content
    renderWithProviders(nameCell.cell);
    expect(screen.getByText('sh.helm.release.v1.helm-mysql.v1')).toBeTruthy();
  });

  it('should render type cell correctly', () => {
    const rows = getDataViewRows(testData, testColumns);
    const typeCell = rows[0].find((cell: any) => cell.id === 'type') as any;

    // Test type cell content
    renderWithProviders(typeCell.cell);
    expect(screen.getByText('Secret')).toBeTruthy();
  });

  it('should render the number of pods deployed for resources that support it', () => {
    const testResource = testData[0].obj;
    renderWithProviders(<HelmReleaseResourceStatus resource={testResource} />);
    // Check for status display
    expect(screen.getByText('Created')).toBeTruthy();

    // Test with deployment resource
    const deploymentResource = {
      ...testResource,
      kind: 'Deployment',
      spec: { replicas: 1 },
      status: { replicas: 1 },
    };

    renderWithProviders(<HelmReleaseResourceStatus resource={deploymentResource} />);
    // Check for deployment-specific content like replica count
    expect(screen.getByText('1 of 1 pods')).toBeTruthy();
  });
});
