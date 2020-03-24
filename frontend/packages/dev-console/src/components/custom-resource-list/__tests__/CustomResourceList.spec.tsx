import {
  CustomResourceListProps,
  CustomResourceListRowFilter,
  CustomResourceListRowProps,
} from '../custom-resource-list-types';
import { SortByDirection, sortable } from '@patternfly/react-table';
import * as React from 'react';
import { TableRow, TableData, Table, TextFilter } from '@console/internal/components/factory';
import { shallow } from 'enzyme';
import CustomResourceList from '../CustomResourceList';

let customResourceListProps: CustomResourceListProps;

const mockColumnClasses = {
  name: 'col-lg-4',
  version: 'col-lg-4',
  status: 'col-lg-4',
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

const MockTableRow: React.FC<CustomResourceListRowProps> = ({ obj, index, key, style }) => (
  <TableRow id={obj.name} index={index} trKey={key} style={style}>
    <TableData className={mockColumnClasses.name}>{obj.name}</TableData>
    <TableData className={mockColumnClasses.version}>{obj.version}</TableData>
    <TableData className={mockColumnClasses.status}>{obj.status}</TableData>
  </TableRow>
);

// Couldn't test scenarios that work around useEffect becuase it seems there is no way to trigger useEffect from within the tests.
// More tests will be added once we find a way to do so. All the required mock-data is already added.
describe('CustomeResourceList', () => {
  const mockReducer = (item) => {
    return item.status;
  };

  const getItems = () => {
    const items = [
      { name: 'item1', version: '1', status: 'successful' },
      {
        name: 'item2',
        version: '2',
        status: 'successful',
      },
      { name: 'item3', version: '3', status: 'failed' },
      {
        name: 'item4',
        version: '4',
        status: 'failed',
      },
    ];
    return Promise.resolve(items);
  };

  const getFilteredItems = (items: any, filters: string[]) => {
    return items.filter((item) => {
      return filters.includes(item.status);
    });
  };

  const mockSelectedStatuses = ['successful', 'failed'];

  const mockRowFilters: CustomResourceListRowFilter[] = [
    {
      type: 'mock-filter',
      selected: mockSelectedStatuses,
      reducer: mockReducer,
      items: mockSelectedStatuses.map((status) => ({
        id: status,
        title: status,
      })),
    },
  ];

  customResourceListProps = {
    queryArg: '',
    fetchCustomResources: getItems,
    rowFilters: mockRowFilters,
    sortBy: 'version',
    sortOrder: SortByDirection.desc,
    rowFilterReducer: getFilteredItems,
    resourceRow: MockTableRow,
    resourceHeader: MockTableHeader,
  };

  const customResourceList = shallow(<CustomResourceList {...customResourceListProps} />);
  it('should render Table component', () => {
    expect(customResourceList.find(Table).exists()).toBe(true);
  });

  it('should render TextFilter component', () => {
    expect(customResourceList.find(TextFilter).exists()).toBe(true);
  });
});
