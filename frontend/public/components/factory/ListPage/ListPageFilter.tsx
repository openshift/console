import * as React from 'react';
import * as _ from 'lodash';
import { ListPageFilterProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { FilterToolbar } from '../../filter-toolbar';

const ListPageFilter: React.FC<ListPageFilterProps> = ({
  data,
  loaded,
  rowFilters,
  labelFilter,
  labelPath,
  nameFilterTitle,
  nameFilterPlaceholder,
  labelFilterPlaceholder,
  hideNameLabelFilters,
  hideLabelFilter,
  columnLayout,
  onFilterChange,
  hideColumnManagement,
  nameFilter,
  rowSearchFilters,
}) =>
  loaded &&
  !_.isEmpty(data) && (
    <FilterToolbar
      rowFilters={rowFilters}
      labelFilter={labelFilter}
      labelPath={labelPath}
      nameFilterTitle={nameFilterTitle}
      data={data}
      nameFilterPlaceholder={nameFilterPlaceholder}
      labelFilterPlaceholder={labelFilterPlaceholder}
      onFilterChange={onFilterChange}
      hideNameLabelFilters={hideNameLabelFilters}
      hideLabelFilter={hideLabelFilter}
      columnLayout={columnLayout}
      hideColumnManagement={hideColumnManagement}
      textFilter={nameFilter}
      rowSearchFilters={rowSearchFilters}
    />
  );

export default ListPageFilter;
