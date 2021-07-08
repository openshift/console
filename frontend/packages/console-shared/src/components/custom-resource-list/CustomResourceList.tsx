import * as React from 'react';
import { EmptyState, EmptyStateVariant } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Table, RowFunction } from '@console/internal/components/factory';
import { FilterToolbar, RowFilter } from '@console/internal/components/filter-toolbar';
import { getQueryArgument, LoadingBox } from '@console/internal/components/utils';

interface CustomResourceListProps {
  queryArg?: string;
  rowFilters?: RowFilter[];
  sortBy: string;
  sortOrder: SortByDirection;
  resourceRow: RowFunction;
  resources?: { [key: string]: any }[];
  resourceHeader: () => { [key: string]: any }[];
  EmptyMsg?: React.ComponentType;
  loaded?: boolean;
  rowFilterReducer?: (
    items: { [key: string]: any }[],
    filters: string | string[],
  ) => { [key: string]: any }[];
  textFilter?: string;
  textFilterReducer?: (
    items: { [key: string]: any }[],
    filters: string,
  ) => { [key: string]: any }[];
}

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
  const { t } = useTranslation();
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
        <p>{t('console-shared~No resources found')}</p>
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
