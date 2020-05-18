import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { getQueryArgument } from '@console/internal/components/utils';
import { CustomResourceListProps } from './custom-resource-list-types';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';

const CustomResourceList: React.FC<CustomResourceListProps> = ({
  dependentResource,
  fetchCustomResources,
  queryArg,
  rowFilters,
  rowFilterReducer,
  textFilter,
  textFilterReducer,
  resourceHeader,
  resourceRow,
  sortBy,
  sortOrder,
}) => {
  const [listItems, setListItems] = React.useState([]);
  const [fetched, setFetched] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

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
    };

    fetchListItems();

    return () => {
      ignore = true;
    };
  }, [dependentResource, fetchCustomResources]);

  const applyFilters = React.useCallback(() => {
    const queryArgument = queryArg ? getQueryArgument(queryArg) : undefined;
    const activeFilters = queryArgument?.split(',');
    const params = new URLSearchParams(window.location.search);
    const filteredText = params.get(textFilter);

    let filteredItems = listItems;
    if (activeFilters) {
      filteredItems = rowFilterReducer(filteredItems, activeFilters);
    }
    if (filteredText) {
      filteredItems = textFilterReducer(filteredItems, filteredText);
    }
    return filteredItems;
  }, [listItems, queryArg, rowFilterReducer, textFilter, textFilterReducer]);

  const filteredListItems = applyFilters();

  return (
    <div className="co-m-pane__body">
      {(rowFilters || textFilter) && (
        <FilterToolbar
          rowFilters={rowFilters}
          data={listItems}
          textFilter={textFilter}
          hideLabelFilter
          reduxIDs={[]}
        />
      )}
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
  );
};

export default React.memo(CustomResourceList);
