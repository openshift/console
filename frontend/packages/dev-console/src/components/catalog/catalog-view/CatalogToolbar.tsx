import * as React from 'react';
import * as _ from 'lodash';
import { SearchInput } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { CatalogCategory, CatalogSortOrder, CatalogStringMap } from '../utils/types';
import { NoGrouping } from '../utils/utils';

type CatalogToolbarProps = {
  activeCategory: CatalogCategory;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  sortOrder: CatalogSortOrder;
  onSortOrderChange: (sortOrder: CatalogSortOrder) => void;
  groupings?: CatalogStringMap;
  activeGrouping?: string;
  onGroupingChange?: (grouping: string) => void;
};

const CatalogToolbar = React.forwardRef<HTMLInputElement, CatalogToolbarProps>(
  (
    {
      activeCategory,
      keyword,
      onKeywordChange,
      sortOrder,
      onSortOrderChange,
      groupings,
      activeGrouping,
      onGroupingChange,
    },
    inputRef,
  ) => {
    const catalogSortItems = { [CatalogSortOrder.ASC]: 'A-Z', [CatalogSortOrder.DESC]: 'Z-A' };

    const showGrouping = !_.isEmpty(groupings);

    const catalogGroupItems = {
      ...groupings,
      [NoGrouping]: 'None',
    };

    return (
      <div className="co-catalog-page__header">
        <div className="co-catalog-page__heading text-capitalize">{activeCategory.label}</div>
        <div className="co-catalog-page__filter">
          <div>
            <SearchInput
              ref={inputRef}
              className="co-catalog-page__input"
              data-test="search-catalog"
              type="text"
              placeholder="Filter by keyword..."
              value={keyword}
              onChange={onKeywordChange}
              onClear={() => onKeywordChange('')}
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
          <div className="co-catalog-page__num-items">{activeCategory.numItems} items</div>
        </div>
      </div>
    );
  },
);

export default CatalogToolbar;
