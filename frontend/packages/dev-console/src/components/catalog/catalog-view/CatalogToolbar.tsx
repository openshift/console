import * as React from 'react';
import * as _ from 'lodash';
import { SearchInput } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { CatalogSortOrder, CatalogStringMap } from '../utils/types';
import { NoGrouping } from '../utils/catalog-utils';

type CatalogToolbarProps = {
  title: string;
  totalItems: number;
  searchKeyword: string;
  sortOrder: CatalogSortOrder;
  groupings: CatalogStringMap;
  activeGrouping: string;
  onGroupingChange: (grouping: string) => void;
  onSearchKeywordChange: (searchKeyword: string) => void;
  onSortOrderChange: (sortOrder: CatalogSortOrder) => void;
};

// update to use inputRef when SearchInput support refs.
const CatalogToolbar = React.forwardRef<HTMLInputElement, CatalogToolbarProps>(
  ({
    title,
    totalItems,
    searchKeyword,
    sortOrder,
    groupings,
    activeGrouping,
    onGroupingChange,
    onSearchKeywordChange,
    onSortOrderChange,
  }) => {
    const catalogSortItems = { [CatalogSortOrder.ASC]: 'A-Z', [CatalogSortOrder.DESC]: 'Z-A' };

    const showGrouping = !_.isEmpty(groupings);

    const catalogGroupItems = {
      ...groupings,
      [NoGrouping]: 'None',
    };

    return (
      <div className="co-catalog-page__header">
        <div className="co-catalog-page__heading text-capitalize">{title}</div>
        <div className="co-catalog-page__filter">
          <div>
            <SearchInput
              className="co-catalog-page__input"
              data-test="search-catalog"
              type="text"
              placeholder="Filter by keyword..."
              value={searchKeyword}
              onChange={onSearchKeywordChange}
              onClear={() => onSearchKeywordChange('')}
              aria-label="Filter by keyword..."
            />
            <Dropdown
              className="co-catalog-page__sort"
              items={catalogSortItems}
              title={catalogSortItems[sortOrder]}
              onChange={onSortOrderChange}
            />
            {showGrouping && (
              <Dropdown
                className="co-catalog-page__btn-group__group-by"
                menuClassName="dropdown-menu--text-wrap"
                items={catalogGroupItems}
                onChange={onGroupingChange}
                titlePrefix="Group By"
                title={catalogGroupItems[activeGrouping]}
              />
            )}
          </div>
          <div className="co-catalog-page__num-items">{totalItems} items</div>
        </div>
      </div>
    );
  },
);

export default CatalogToolbar;
