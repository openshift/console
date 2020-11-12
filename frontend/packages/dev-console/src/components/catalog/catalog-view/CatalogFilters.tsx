import * as React from 'react';
import * as _ from 'lodash';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import { FilterTypes } from '../utils/filter-utils';
import { CatalogFilterCounts, CatalogFilters } from '../utils/types';

type CatalogFiltersProps = {
  activeFilters: CatalogFilters;
  filterCounts: CatalogFilterCounts;
  filterGroupNameMap: { [key: string]: string };
  filterGroupsShowAll: { [key: string]: boolean };
  onFilterChange: (filterType: string, id: string, value: boolean) => void;
  onShowAllToggle: (groupName: string) => void;
};

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  activeFilters,
  filterCounts,
  filterGroupNameMap,
  filterGroupsShowAll,
  onFilterChange,
  onShowAllToggle,
}) => {
  const renderFilterItem = (filter, filterName, groupName) => {
    const { label, active } = filter;
    const dummyProps = {} as any; // To fix the props type issue with FilterSidePanelCategoryItem.
    return (
      <FilterSidePanelCategoryItem
        key={filterName}
        count={_.get(filterCounts, [groupName, filterName], 0)}
        checked={active}
        onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFilterChange(groupName, filterName, e.target.checked)
        }
        data-test={`${groupName}-${_.kebabCase(filterName)}`}
        {...dummyProps} // To fix the props type issue with FilterSidePanelCategoryItem.
      >
        {label}
      </FilterSidePanelCategoryItem>
    );
  };

  const renderFilterGroup = (filterGroup, groupName) => {
    if (groupName === FilterTypes.keyword) {
      return null;
    }

    return (
      <FilterSidePanelCategory
        key={groupName}
        title={filterGroupNameMap[groupName] || groupName}
        onShowAllToggle={() => onShowAllToggle(groupName)}
        showAll={_.get(filterGroupsShowAll, groupName, false)}
        data-test-group-name={groupName}
      >
        {_.map(filterGroup, (filter, filterName) =>
          renderFilterItem(filter, filterName, groupName),
        )}
      </FilterSidePanelCategory>
    );
  };

  return (
    <FilterSidePanel>
      {_.map(activeFilters, (filterGroup, groupName) => renderFilterGroup(filterGroup, groupName))}
    </FilterSidePanel>
  );
};

export default CatalogFilters;
