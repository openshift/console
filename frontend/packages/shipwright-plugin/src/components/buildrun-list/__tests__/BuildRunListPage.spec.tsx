import * as React from 'react';
import { render } from '@testing-library/react';
import { FilterValue } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { ListPage, ListPageProps } from '@console/internal/components/factory';
import { incompleteBuildRun } from '../../../__tests__/mock-data.spec';
import { BuildRun } from '../../../types';
import BuildRunListPage from '../BuildRunListPage';

jest.mock('@console/internal/components/factory', () => ({
  ...require.requireActual('@console/internal/components/factory'),
  ListPage: jest.fn(),
}));

describe('BuildRunListPage', () => {
  const listPageRenderProps = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    (ListPage as jest.Mock).mockImplementation((props) => {
      listPageRenderProps(props);
      return null;
    });
  });

  it('should render a ListPage with a status filter', async () => {
    render(<BuildRunListPage />);

    expect(listPageRenderProps).toHaveBeenCalledTimes(1);
    const props: ListPageProps = listPageRenderProps.mock.calls[0][0];

    expect(props.title).toEqual('BuildRuns');

    const statusRowFilter = props.rowFilters.find((filter) => filter.filterGroupName === 'Status');
    expect(statusRowFilter).toBeTruthy();
    expect(statusRowFilter.items.find((item) => item.title === 'Connected')).toBeTruthy();
    expect(statusRowFilter.items.find((item) => item.title === 'Error')).toBeTruthy();
  });

  describe('StatusFilter', () => {
    let filter: (serviceBindings: BuildRun[], statusFilter: FilterValue) => BuildRun[];

    beforeEach(() => {
      render(<BuildRunListPage />);

      expect(listPageRenderProps).toHaveBeenCalledTimes(1);
      const props: ListPageProps = listPageRenderProps.mock.calls[0][0];

      const statusRowFilter = props.rowFilters.find((f) => f.filterGroupName === 'Status');

      filter = (serviceBindings: BuildRun[], statusFilter: FilterValue): BuildRun[] => {
        return serviceBindings.filter((serviceBinding) =>
          statusRowFilter.filter(statusFilter, serviceBinding),
        );
      };
    });

    it('should show all items when no filter is selected', async () => {
      expect(filter([incompleteBuildRun], {})).toHaveLength(2);
      expect(filter([incompleteBuildRun], { selected: [] })).toHaveLength(2);
    });

    it('should show the right items when just one filter is selected', async () => {
      expect(filter([incompleteBuildRun], { selected: ['Connected'] })).toHaveLength(1);
      expect(filter([incompleteBuildRun], { selected: ['Error'] })).toHaveLength(1);
    });

    it('should show all items when all filters are selected', async () => {
      expect(
        filter([incompleteBuildRun], {
          selected: ['Connected', 'Error'],
        }),
      ).toHaveLength(2);
    });
  });
});
