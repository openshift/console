import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ColumnManagementModal } from '@console/internal/components/modals/column-management-modal';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

const columnManagementID = referenceForModel(PodModel);
const columnManagementType = 'Pod';
const columnLayout = [
  {
    title: 'Name',
    id: 'name',
  },
  {
    title: 'Namespace',
    id: 'namespace',
  },
  {
    title: 'Status',
    id: 'status',
  },
  {
    title: 'Ready',
    id: 'ready',
  },
  {
    title: 'Restarts',
    id: 'restarts',
  },
  {
    title: 'Owner',
    id: 'owner',
  },
  {
    title: 'Memory',
    id: 'memory',
  },
  {
    title: 'CPU',
    id: 'cpu',
  },
  {
    title: 'Created',
    id: 'created',
  },
  {
    title: 'Node',
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
    id: '',
  },
];

const columnLayoutNamespaceDisabled = [
  {
    title: 'Name',
    id: 'name',
  },
  {
    title: 'Namespace',
    id: 'namespace',
  },
  {
    title: 'Status',
    id: 'status',
  },
  {
    title: 'Ready',
    id: 'ready',
  },
  {
    title: 'Restarts',
    id: 'restarts',
  },
  {
    title: 'Owner',
    id: 'owner',
  },
  {
    title: 'Memory',
    id: 'memory',
  },
  {
    title: 'CPU',
    id: 'cpu',
  },
  {
    title: 'Created',
    id: 'created',
  },
  {
    title: 'Node',
    additional: true,
    id: 'node',
  },
  {
    title: 'Labels',
    additional: true,
    id: 'labels',
  },
  {
    title: 'IP Address',
    additional: true,
    id: 'ipaddress',
  },
  {
    title: '',
    id: '',
  },
];

describe(ColumnManagementModal.displayName, () => {
  const renderColumnManagementModal = (columns = columnLayout) => {
    return renderWithProviders(
      <ColumnManagementModal
        columnLayout={{
          columns,
          id: columnManagementID,
          selectedColumns: new Set(
            columns.reduce((acc, column) => {
              if (column.id && !column.additional) {
                acc.push(column.id);
              }
              return acc;
            }, []),
          ),
          type: columnManagementType,
        }}
        userSettingState={null}
        setUserSettingState={jest.fn()}
      />,
    );
  };

  it('renders max row info alert', () => {
    renderColumnManagementModal();

    const alert = screen.getByText('You can select up to {{MAX_VIEW_COLS}} columns');
    expect(alert).toBeInTheDocument();
  });

  it('renders two data lists', () => {
    renderColumnManagementModal();

    const defaultColumnList = screen.getByLabelText('Default column list');
    const additionalColumnList = screen.getByLabelText('Additional column list');

    expect(defaultColumnList).toBeInTheDocument();
    expect(additionalColumnList).toBeInTheDocument();
  });

  it('renders 12 checkboxes with name, and last 3 disabled', () => {
    renderColumnManagementModal();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(12);

    // Check specific disabled states
    expect(checkboxes[0]).toBeDisabled(); // namespace is always disabled
    expect(checkboxes[1]).not.toBeDisabled(); // all default columns should be enabled
    expect(checkboxes[8]).not.toBeDisabled(); // all default columns should be enabled
    expect(checkboxes[9]).toBeDisabled(); // all additional columns should be disabled
    expect(checkboxes[11]).toBeDisabled(); // all additional columns should be disabled
  });

  it('renders a single disabled checkbox when under MAX columns', () => {
    const modifiedColumns = columnLayoutNamespaceDisabled.reduce((acc, column) => {
      if (column.id && !column.additional && column.id !== 'cpu') {
        acc.push(column.id);
      }
      return acc;
    }, []);

    renderWithProviders(
      <ColumnManagementModal
        columnLayout={{
          columns: columnLayoutNamespaceDisabled,
          id: columnManagementID,
          selectedColumns: new Set(modifiedColumns),
          type: columnManagementType,
        }}
        userSettingState={null}
        setUserSettingState={jest.fn()}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(12);
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).not.toBeDisabled();
    expect(checkboxes[8]).not.toBeDisabled();
    expect(checkboxes[9]).not.toBeDisabled();
    expect(checkboxes[11]).not.toBeDisabled();
  });
});
