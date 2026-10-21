import type { FC, ChangeEvent } from 'react';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import * as _ from 'lodash';
import type { CatalogItemAttribute } from '@console/dynamic-plugin-sdk';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { alphanumericCompare } from '@console/shared/src/utils/utils';
import type { CatalogFilter, CatalogFilterCounts, CatalogFilterItem } from '../utils/types';
import { CatalogFilters } from '../utils/types';

type CatalogFiltersProps = {
  activeFilters: CatalogFilters;
  filterGroupCounts: CatalogFilterCounts;
  filterGroupMap: { [key: string]: ResolvedCodeRefProperties<CatalogItemAttribute> };
  filterGroupsShowAll: { [key: string]: boolean };
  onFilterChange: (filterType: string, id: string, value: boolean) => void;
  onShowAllToggle: (groupName: string) => void;
  sortFilterGroups?: boolean;
};

const CatalogFilters: FC<CatalogFiltersProps> = ({
  activeFilters,
  filterGroupCounts,
  filterGroupMap,
  filterGroupsShowAll,
  onFilterChange,
  onShowAllToggle,
  sortFilterGroups,
}) => {
  const sortedActiveFilters = sortFilterGroups
    ? Object.keys(activeFilters)
        .sort()
        .reduce<CatalogFilters>((acc, groupName) => {
          acc[groupName] = activeFilters[groupName];
          return acc;
        }, {})
    : Object.keys(activeFilters).reduce<CatalogFilters>((acc, groupName) => {
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
        onClick={(e: ChangeEvent<HTMLInputElement>) =>
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
    const filterGroupItemComparator = filterGroupMap[groupName]?.comparator ?? alphanumericCompare;
    if (filterGroupKeys.length > 0) {
      const sortedFilterGroup = filterGroupKeys
        .sort(filterGroupItemComparator || alphanumericCompare)
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
