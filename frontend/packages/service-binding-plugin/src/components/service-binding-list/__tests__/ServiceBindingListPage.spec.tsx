import * as React from 'react';
import { render } from '@testing-library/react';
import { FilterValue } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ListPage, ListPageProps } from '@console/internal/components/factory';
import { ServiceBinding } from 'packages/service-binding-plugin/src/types';
import { connectedServiceBinding, failedServiceBinding } from '../../../__tests__/mock-data';
import ServiceBindingListPage from '../ServiceBindingListPage';

jest.mock('@console/internal/components/factory', () => ({
  ...require.requireActual('@console/internal/components/factory'),
  ListPage: jest.fn(),
}));

describe('ServiceBindingListPage', () => {
  const listPageRenderProps = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    (ListPage as jest.Mock).mockImplementation((props) => {
      listPageRenderProps(props);
      return null;
    });
  });

  it('should render a ListPage with a status filter', async () => {
    render(<ServiceBindingListPage />);

    expect(listPageRenderProps).toHaveBeenCalledTimes(1);
    const props: ListPageProps = listPageRenderProps.mock.calls[0][0];

    expect(props.title).toEqual('ServiceBindings');

    const statusRowFilter = props.rowFilters.find((filter) => filter.filterGroupName === 'Status');
    expect(statusRowFilter).toBeTruthy();
    expect(statusRowFilter.items.find((item) => item.title === 'Connected')).toBeTruthy();
    expect(statusRowFilter.items.find((item) => item.title === 'Error')).toBeTruthy();
  });

  describe('StatusFilter', () => {
    let filter: (serviceBindings: ServiceBinding[], statusFilter: FilterValue) => ServiceBinding[];

    beforeEach(() => {
      render(<ServiceBindingListPage />);

      expect(listPageRenderProps).toHaveBeenCalledTimes(1);
      const props: ListPageProps = listPageRenderProps.mock.calls[0][0];

      const statusRowFilter = props.rowFilters.find((f) => f.filterGroupName === 'Status');

      filter = (serviceBindings: ServiceBinding[], statusFilter: FilterValue): ServiceBinding[] => {
        return serviceBindings.filter((serviceBinding) =>
          statusRowFilter.filter(statusFilter, serviceBinding),
        );
      };
    });

    it('should show all items when no filter is selected', async () => {
      expect(filter([connectedServiceBinding, failedServiceBinding], {})).toHaveLength(2);
      expect(
        filter([connectedServiceBinding, failedServiceBinding], { selected: [] }),
      ).toHaveLength(2);
    });

    it('should show the right items when just one filter is selected', async () => {
      expect(
        filter([connectedServiceBinding, failedServiceBinding], { selected: ['Connected'] }),
      ).toHaveLength(1);
      expect(
        filter([connectedServiceBinding, failedServiceBinding], { selected: ['Error'] }),
      ).toHaveLength(1);
    });

    it('should show all items when all filters are selected', async () => {
      expect(
        filter([connectedServiceBinding, failedServiceBinding], {
          selected: ['Connected', 'Error'],
        }),
      ).toHaveLength(2);
    });
  });
});
