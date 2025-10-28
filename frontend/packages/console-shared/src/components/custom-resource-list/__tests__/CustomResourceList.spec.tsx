import * as React from 'react';
import { SortByDirection, sortable } from '@patternfly/react-table';
import { screen } from '@testing-library/react';
import * as fuzzy from 'fuzzysearch';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { RowFilter } from '@console/internal/components/filter-toolbar';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import CustomResourceList from '../CustomResourceList';

// Mock only the child components that CustomResourceList uses
jest.mock('@console/internal/components/factory/table', () => ({
  Table: () => 'Table',
}));

jest.mock('@console/internal/components/filter-toolbar', () => ({
  FilterToolbar: () => 'Filter Toolbar',
}));

jest.mock('@console/shared/src/components/loading/LoadingBox', () => ({
  LoadingBox: () => 'Loading...',
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  default: ({ children }) => children,
}));

const mockColumnClasses = {
  name: 'mock-name-column',
  version: 'mock-version-column',
  status: 'mock-status-column',
};

const MockTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'name',
      transforms: [sortable],
      props: { className: mockColumnClasses.name },
    },
    {
      title: 'Version',
      sortField: 'version',
      transforms: [sortable],
      props: { className: mockColumnClasses.version },
    },
    {
      title: 'Status',
      sortField: 'status',
      transforms: [sortable],
      props: { className: mockColumnClasses.status },
    },
  ];
};

const MockTableRow: React.FC<RowFunctionArgs> = ({ obj }) => (
  <>
    <TableData className={mockColumnClasses.name}>{obj.name}</TableData>
    <TableData className={mockColumnClasses.version}>{obj.version}</TableData>
    <TableData className={mockColumnClasses.status}>{obj.status}</TableData>
  </>
);

describe('CustomResourceList', () => {
  let customResourceListProps: React.ComponentProps<typeof CustomResourceList>;

  const mockReducer = (item) => {
    return item.status;
  };

  const resources = [
    { name: 'item1', version: '1', status: 'successful' },
    { name: 'item2', version: '2', status: 'successful' },
    { name: 'item3', version: '3', status: 'failed' },
    { name: 'item4', version: '4', status: 'failed' },
  ];

  const getFilteredItemsByRow = (items: any, filters: string[]) => {
    return items.filter((item) => {
      return filters.includes(item.status);
    });
  };

  const getFilteredItemsByText = (items: any, filter: string) => {
    return items.filter((item) => fuzzy(filter, item.name));
  };

  const mockSelectedStatuses = ['successful', 'failed'];

  const mockRowFilters: RowFilter[] = [
    {
      filterGroupName: 'Status',
      type: 'mock-filter',
      reducer: mockReducer,
      items: mockSelectedStatuses.map((status) => ({
        id: status,
        title: status,
      })),
    },
  ];

  beforeEach(() => {
    customResourceListProps = {
      queryArg: '',
      resources,
      textFilter: 'name',
      rowFilters: mockRowFilters,
      sortBy: 'version',
      sortOrder: SortByDirection.desc,
      rowFilterReducer: getFilteredItemsByRow,
      textFilterReducer: getFilteredItemsByText,
      ResourceRow: MockTableRow,
      resourceHeader: MockTableHeader,
    };
  });

  it('should render FilterToolbar when both rowFilters and textFilter are present', () => {
    renderWithProviders(<CustomResourceList {...customResourceListProps} />);

    expect(screen.getByText(/Filter Toolbar/)).toBeVisible();
    expect(screen.getByText(/Table/)).toBeVisible();
  });

  it('should render FilterToolbar when only textFilter is present', () => {
    renderWithProviders(<CustomResourceList {...customResourceListProps} rowFilters={undefined} />);

    expect(screen.getByText(/Filter Toolbar/)).toBeVisible();
  });

  it('should render FilterToolbar when only rowFilters is present', () => {
    renderWithProviders(<CustomResourceList {...customResourceListProps} textFilter={undefined} />);

    expect(screen.getByText(/Filter Toolbar/)).toBeVisible();
  });

  it('should not render FilterToolbar when neither rowFilters nor textFilter is present', () => {
    renderWithProviders(
      <CustomResourceList
        {...customResourceListProps}
        textFilter={undefined}
        rowFilters={undefined}
      />,
    );

    expect(screen.queryByText('Filter Toolbar')).not.toBeInTheDocument();
    expect(screen.getByText('Table')).toBeVisible();
  });

  it('should render the EmptyState component when no resources are provided', () => {
    renderWithProviders(<CustomResourceList {...customResourceListProps} resources={[]} />);

    expect(screen.getByText('No resources found')).toBeVisible();
    expect(screen.queryByText('Table')).not.toBeInTheDocument();
  });

  it('should render the LoadingBox while loading', () => {
    renderWithProviders(<CustomResourceList {...customResourceListProps} loaded={false} />);

    expect(screen.getByText('Loading...')).toBeVisible();

    // When loading, Table and FilterToolbar should not render
    expect(screen.queryByText('Table')).not.toBeInTheDocument();
    expect(screen.queryByText('Filter Toolbar')).not.toBeInTheDocument();
  });
});
