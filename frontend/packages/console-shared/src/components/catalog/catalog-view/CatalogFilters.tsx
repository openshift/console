/* eslint-disable oxc/no-barrel-file */
import type { FC, ChangeEvent } from 'react';
import { useId } from 'react';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import { Radio } from '@patternfly/react-core/dist/dynamic/components/Radio';
import * as _ from 'lodash';
import type { CatalogItemAttribute } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { FieldLevelHelp } from '@console/internal/components/utils/field-level-help';
import { getSortedFilterKeys } from '../utils/filter-utils';
import type {
  CatalogFilter,
  CatalogFilterCounts,
  CatalogFilterItem,
  CatalogFilters as CatalogFiltersType,
} from '../utils/types';

type CatalogFiltersProps = {
  activeFilters: CatalogFiltersType;
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
  const id = useId();
  const sortedActiveFilters = sortFilterGroups
    ? Object.keys(activeFilters)
        .sort()
        .reduce<CatalogFiltersType>((acc, groupName) => {
          acc[groupName] = activeFilters[groupName];
          return acc;
        }, {})
    : Object.keys(activeFilters).reduce<CatalogFiltersType>((acc, groupName) => {
        acc[groupName] = activeFilters[groupName];
        return acc;
      }, {});

  const renderFilterItem = (filter: CatalogFilterItem, filterName: string, groupName: string) => {
    const { label, active } = filter;
    const count = filterGroupCounts[groupName]?.[filterName] ?? 0;
    if (filterGroupMap[groupName]?.filterType === 'radio') {
      return (
        <Radio
          key={filterName}
          id={`${id}-${encodeURIComponent(groupName)}-${encodeURIComponent(filterName)}`}
          name={`${id}-${groupName}`}
          isChecked={active}
          onChange={(_event, checked) => onFilterChange(groupName, filterName, checked)}
          label={`${label} (${count})`}
          data-test={`${groupName}-${_.kebabCase(filterName)}`}
        />
      );
    }
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
    const filterGroupKeys = getSortedFilterKeys(filterGroup, filterGroupMap[groupName]?.comparator);
    if (filterGroupKeys.length > 0) {
      const sortedFilterGroup = filterGroupKeys.reduce<CatalogFilter>((acc, filterName) => {
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
