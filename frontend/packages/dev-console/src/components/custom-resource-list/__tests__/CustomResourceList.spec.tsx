import * as React from 'react';
import { shallow } from 'enzyme';
import * as fuzzy from 'fuzzysearch';
import { SortByDirection, sortable } from '@patternfly/react-table';
import {
  TableRow,
  TableData,
  Table,
  TextFilter,
  RowFunction,
} from '@console/internal/components/factory';
import CustomResourceList from '../CustomResourceList';
import {
  CustomResourceListProps,
  CustomResourceListRowFilter,
} from '../custom-resource-list-types';

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

const MockTableRow: RowFunction = ({ obj, index, key, style }) => (
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

  const getFilteredItemsByRow = (items: any, filters: string[]) => {
    return items.filter((item) => {
      return filters.includes(item.status);
    });
  };

  const getFilteredItemsByText = (items: any, filter: string) => {
    return items.filter((item) => fuzzy(filter, item.name));
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
    rowFilterReducer: getFilteredItemsByRow,
    textFilterReducer: getFilteredItemsByText,
    resourceRow: MockTableRow,
    resourceHeader: MockTableHeader,
  };

  const customResourceList = shallow(<CustomResourceList {...customResourceListProps} />);
  it('should render Table component', () => {
    expect(customResourceList.find(Table).exists()).toBe(true);
  });

  it('should render TextFilter component only when textFilterReducer is present', () => {
    expect(customResourceList.find(TextFilter).exists()).toBe(true);
    customResourceListProps.textFilterReducer = undefined;
    const customResourceListNew = shallow(<CustomResourceList {...customResourceListProps} />);
    expect(customResourceListNew.find(TextFilter).exists()).toBe(false);
  });
});
