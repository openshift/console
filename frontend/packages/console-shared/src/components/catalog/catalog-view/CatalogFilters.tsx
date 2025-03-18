import * as React from 'react';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import * as _ from 'lodash';
import { CatalogItemAttribute } from '@console/dynamic-plugin-sdk';
import { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { alphanumericCompare } from '@console/shared/src/utils/utils';
import {
  CatalogFilter,
  CatalogFilterCounts,
  CatalogFilterItem,
  CatalogFilters,
} from '../utils/types';

type CatalogFiltersProps = {
  activeFilters: CatalogFilters;
  filterGroupCounts: CatalogFilterCounts;
  filterGroupMap: { [key: string]: ResolvedCodeRefProperties<CatalogItemAttribute> };
  filterGroupsShowAll: { [key: string]: boolean };
  onFilterChange: (filterType: string, id: string, value: boolean) => void;
  onShowAllToggle: (groupName: string) => void;
};

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  activeFilters,
  filterGroupCounts,
  filterGroupMap,
  filterGroupsShowAll,
  onFilterChange,
  onShowAllToggle,
}) => {
  const sortedActiveFilters = Object.keys(activeFilters)
    .sort()
    .reduce<CatalogFilters>((acc, groupName) => {
      acc[groupName] = activeFilters[groupName];
      return acc;
    }, {});

  const renderFilterItem = (filter: CatalogFilterItem, filterName: string, groupName: string) => {
    const { label, active } = filter;
    const count = filterGroupCounts[groupName]?.[filterName] ?? 0;
    return (
      <FilterSidePanelCategoryItem
        key={filterName}
        count={count}
        checked={active}
        onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFilterChange(groupName, filterName, e.target.checked)
        }
        data-test={`${groupName}-${_.kebabCase(filterName)}`}
      >
        {label}
      </FilterSidePanelCategoryItem>
    );
  };

  const renderFilterGroup = (filterGroup: CatalogFilter, groupName: string) => {
    const filterGroupKeys = Object.keys(filterGroup);
    const filterGroupComparator = filterGroupMap[groupName]?.comparator ?? alphanumericCompare;
    if (filterGroupKeys.length > 0) {
      const sortedFilterGroup = filterGroupKeys
        .sort(filterGroupComparator || alphanumericCompare)
        .reduce<CatalogFilter>((acc, filterName) => {
          acc[filterName] = filterGroup[filterName];
          return acc;
        }, {});
      return (
        <FilterSidePanelCategory
          key={groupName}
          title={
            <>
              {filterGroupMap[groupName].label || groupName}
              {filterGroupMap[groupName].description && (
                <FieldLevelHelp>
                  <p style={{ whiteSpace: 'pre-line' }}>{filterGroupMap[groupName].description}</p>
                </FieldLevelHelp>
              )}
            </>
          }
          onShowAllToggle={() => onShowAllToggle(groupName)}
          showAll={filterGroupsShowAll[groupName] ?? false}
          data-test-group-name={groupName}
        >
          {_.map(sortedFilterGroup, (filter, filterName) =>
            renderFilterItem(filter, filterName, groupName),
          )}
        </FilterSidePanelCategory>
      );
    }
    return null;
  };

  return (
    <FilterSidePanel>
      {_.map(sortedActiveFilters, (filterGroup, groupName) =>
        renderFilterGroup(filterGroup, groupName),
      )}
    </FilterSidePanel>
  );
};

export default CatalogFilters;
