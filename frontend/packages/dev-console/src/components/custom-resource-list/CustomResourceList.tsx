import * as React from 'react';
import * as _ from 'lodash';
import { Table, TextFilter } from '@console/internal/components/factory';
import { SortByDirection } from '@patternfly/react-table';
import { CheckBoxes } from '@console/internal/components/row-filter';
import { getQueryArgument } from '@console/internal/components/utils';
import { useDeepCompareMemoize } from '@console/shared';
import {
  CustomResourceListFilterType,
  CustomResourceListProps,
} from './custom-resource-list-types';

const CustomResourceList: React.FC<CustomResourceListProps> = ({
  dependentResource,
  items,
  queryArg,
  rowFilters,
  getFilteredItems,
  resourceHeader,
  resourceRow,
}) => {
  const [listItems, setListItems] = React.useState([]);
  const [filteredListItems, setFilteredListItems] = React.useState([]);
  const [fetched, setFetched] = React.useState(false);

  const memoizedDependentResource = useDeepCompareMemoize(dependentResource?.data);

  React.useEffect(() => {
    let ignore = false;

    const queryArgument = getQueryArgument(queryArg);
    const activeFilters = queryArgument?.split(',');

    const fetchListItems = async () => {
      let newListItems: any;
      try {
        newListItems = await items;
      } catch {
        if (ignore) return;

        setListItems([]);
        setFetched(true);
      }

      if (ignore) return;

      setListItems(newListItems || []);
      setFetched(true);

      if (activeFilters) {
        const filteredItems = () => {
          return getFilteredItems(newListItems, CustomResourceListFilterType.Row, activeFilters);
        };
        setFilteredListItems(filteredItems);
      } else {
        setFilteredListItems(newListItems);
      }
    };

    fetchListItems();

    return () => {
      ignore = true;
    };
  }, [memoizedDependentResource, items, queryArg, rowFilters, getFilteredItems]);

  const applyRowFilter = React.useCallback(
    (filter) => {
      const filteredItems = getFilteredItems(listItems, CustomResourceListFilterType.Row, filter);
      setFilteredListItems(filteredItems);
    },
    [listItems, getFilteredItems],
  );

  const applyTextFilter = React.useCallback(
    (filter) => {
      const filteredItems = getFilteredItems(listItems, CustomResourceListFilterType.Text, filter);
      setFilteredListItems(filteredItems);
    },
    [listItems, getFilteredItems],
  );

  const rowsOfRowFilters = _.map(
    rowFilters,
    ({ items: filterItems, reducer, selected, type }, i) => {
      return (
        <CheckBoxes
          key={i}
          onFilterChange={applyRowFilter}
          items={filterItems}
          itemCount={_.size(listItems)}
          numbers={_.countBy(listItems, reducer)}
          selected={selected}
          type={type}
          reduxIDs={[]}
        />
      );
    },
  );

  return (
    <>
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group co-m-pane__filter-bar-group--filter">
          <TextFilter label="by name" onChange={(e) => applyTextFilter(e.target.value)} />
        </div>
      </div>

      <div className="co-m-pane__body">
        {!_.isEmpty(listItems) && rowsOfRowFilters}
        <Table
          data={filteredListItems}
          defaultSortField="name"
          defaultSortOrder={SortByDirection.asc}
          aria-label="Resources"
          Header={resourceHeader}
          Row={resourceRow}
          loaded={fetched}
          virtualize
        />
      </div>
    </>
  );
};

export default React.memo(CustomResourceList);
