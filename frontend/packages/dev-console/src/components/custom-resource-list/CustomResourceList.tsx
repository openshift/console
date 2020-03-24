import * as React from 'react';
import * as _ from 'lodash';
import { Table, TextFilter } from '@console/internal/components/factory';
import { CheckBoxes } from '@console/internal/components/row-filter';
import { getQueryArgument } from '@console/internal/components/utils';
import { CustomResourceListProps } from './custom-resource-list-types';

const CustomResourceList: React.FC<CustomResourceListProps> = ({
  dependentResource,
  fetchCustomResources,
  queryArg,
  rowFilters,
  rowFilterReducer,
  textFilterReducer,
  resourceHeader,
  resourceRow,
  sortBy,
  sortOrder,
}) => {
  const [listItems, setListItems] = React.useState([]);
  const [filteredListItems, setFilteredListItems] = React.useState([]);
  const [fetched, setFetched] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    const queryArgument = getQueryArgument(queryArg);
    const activeFilters = queryArgument?.split(',');

    const fetchListItems = async () => {
      let newListItems: any;
      try {
        newListItems = await fetchCustomResources();
      } catch {
        if (ignore) return;

        setListItems([]);
        setFetched(true);
      }

      if (ignore) return;

      setListItems(newListItems || []);
      setFetched(true);

      if (activeFilters) {
        const filteredItems = rowFilterReducer(newListItems, activeFilters);
        setFilteredListItems(filteredItems);
      } else {
        setFilteredListItems(newListItems);
      }
    };

    fetchListItems();

    return () => {
      ignore = true;
    };
  }, [dependentResource, fetchCustomResources, queryArg, rowFilters, rowFilterReducer]);

  const applyRowFilter = React.useCallback(
    (filter) => {
      const filteredItems = rowFilterReducer(listItems, filter);
      setFilteredListItems(filteredItems);
    },
    [listItems, rowFilterReducer],
  );

  const applyTextFilter = React.useCallback(
    (filter) => {
      const filteredItems = textFilterReducer(listItems, filter);
      setFilteredListItems(filteredItems);
    },
    [listItems, textFilterReducer],
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
          defaultSortField={sortBy}
          defaultSortOrder={sortOrder}
          aria-label="CustomResources"
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
