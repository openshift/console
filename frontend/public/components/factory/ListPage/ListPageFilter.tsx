import * as React from 'react';
import * as _ from 'lodash';

import { FilterToolbar, RowFilter } from '../../filter-toolbar';
import { ColumnLayout } from '../../modals/column-management-modal';
import { OnFilterChange } from './filter-hook';

type ListPageFilterProps<D = any> = {
  data: D;
  loaded: boolean;
  rowFilters?: RowFilter[];
  nameFilterPlaceholder?: string;
  labelFilterPlaceholder?: string;
  textFilter?: string;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  columnLayout?: ColumnLayout;
  onFilterChange: OnFilterChange;
  hideColumnManagement?: boolean;
};

const ListPageFilter: React.FC<ListPageFilterProps> = ({
  data,
  loaded,
  rowFilters,
  nameFilterPlaceholder,
  labelFilterPlaceholder,
  textFilter,
  hideNameLabelFilters,
  hideLabelFilter,
  columnLayout,
  onFilterChange,
  hideColumnManagement,
}) =>
  loaded &&
  !_.isEmpty(data) && (
    <FilterToolbar
      rowFilters={rowFilters}
      data={data}
      nameFilterPlaceholder={nameFilterPlaceholder}
      labelFilterPlaceholder={labelFilterPlaceholder}
      onFilterChange={onFilterChange}
      textFilter={textFilter}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
      columnLayout={columnLayout}
      hideColumnManagement={hideColumnManagement}
    />
  );

export default ListPageFilter;
