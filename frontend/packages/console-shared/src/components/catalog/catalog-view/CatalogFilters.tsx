import * as React from 'react';
import {
  FilterSidePanel,
  FilterSidePanelCategory,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import { Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import { CatalogItemAttribute } from '@console/dynamic-plugin-sdk';
import { IncompleteDataError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { YellowExclamationTriangleIcon } from '../../status/icons';
import {
  CatalogFilter,
  CatalogFilterCounts,
  CatalogFilterItem,
  CatalogFilters,
} from '../utils/types';

type CatalogFiltersProps = {
  activeFilters: CatalogFilters;
  catalogType: string;
  catalogLoadError: any;
  filterGroupCounts: CatalogFilterCounts;
  filterGroupMap: { [key: string]: CatalogItemAttribute };
  filterGroupsShowAll: { [key: string]: boolean };
  onFilterChange: (filterType: string, id: string, value: boolean) => void;
  onShowAllToggle: (groupName: string) => void;
};

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  activeFilters,
  catalogType,
  catalogLoadError,
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
    // TODO remove when adopting https://github.com/patternfly/patternfly-react/issues/5139
    const dummyProps = {} as any;
    return (
      <FilterSidePanelCategoryItem
        key={filterName}
        count={count}
        checked={active}
        onClick={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFilterChange(groupName, filterName, e.target.checked)
        }
        data-test={`${groupName}-${_.kebabCase(filterName)}`}
        {...dummyProps}
      >
        {label}
      </FilterSidePanelCategoryItem>
    );
  };

  const renderFilterGroup = (filterGroup: CatalogFilter, groupName: string) => {
    const filterGroupKeys = Object.keys(filterGroup);
    const { label, description, showAlert } = filterGroupMap[groupName];
    if (filterGroupKeys.length > 0) {
      const sortedFilterGroup = filterGroupKeys.sort().reduce<CatalogFilter>((acc, filterName) => {
        acc[filterName] = filterGroup[filterName];
        return acc;
      }, {});

      const catalogTypeError =
        catalogType &&
        catalogLoadError &&
        catalogLoadError instanceof IncompleteDataError &&
        catalogLoadError.err &&
        Object.values(catalogLoadError.err)[0]?.message;

      return (
        <FilterSidePanelCategory
          key={groupName}
          title={
            <>
              {label || groupName}
              {description && <FieldLevelHelp>{description}</FieldLevelHelp>}
              {showAlert && catalogTypeError && (
                <>
                  {' '}
                  <Tooltip content={catalogTypeError}>
                    <YellowExclamationTriangleIcon size="sm" />
                  </Tooltip>
                </>
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
