import * as React from 'react';
import * as _ from 'lodash';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { Table } from '@console/internal/components/factory';
import { getQueryArgument, LoadingBox } from '@console/internal/components/utils';
import { CustomResourceListProps } from './custom-resource-list-types';
import { FilterToolbar } from '@console/internal/components/filter-toolbar';

const CustomResourceList: React.FC<CustomResourceListProps> = ({
  resources,
  loaded = true,
  EmptyMsg,
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
  const applyFilters = React.useCallback(() => {
    const queryArgument = queryArg ? getQueryArgument(queryArg) : undefined;
    const activeFilters = queryArgument?.split(',');
    const params = new URLSearchParams(window.location.search);
    const filteredText = params.get(textFilter);

    let filteredItems = resources;
    if (activeFilters) {
      filteredItems = rowFilterReducer(filteredItems, activeFilters);
    }
    if (filteredText) {
      filteredItems = textFilterReducer(filteredItems, filteredText);
    }
    return filteredItems;
  }, [resources, queryArg, rowFilterReducer, textFilter, textFilterReducer]);

  const filteredListItems = applyFilters();

  if (!loaded) {
    return <LoadingBox />;
  }

  if (_.isEmpty(resources)) {
    return EmptyMsg ? (
      <EmptyMsg />
    ) : (
      <EmptyState variant={EmptyStateVariant.full}>
        <p>No resources found</p>
      </EmptyState>
    );
  }

  return (
    <div className="co-m-pane__body">
      {(rowFilters || textFilter) && (
        <FilterToolbar
          rowFilters={rowFilters}
          data={resources}
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
        loaded={loaded}
        virtualize
      />
    </div>
  );
};

export default React.memo(CustomResourceList);
