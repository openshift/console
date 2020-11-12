import * as React from 'react';
import { TextInput } from '@patternfly/react-core';
import { Dropdown } from '@console/internal/components/utils';
import { CatalogCategory, CatalogSortOrder } from '../utils/types';

type CatalogToolbarProps = {
  activeCategory: CatalogCategory;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  sortOrder: CatalogSortOrder;
  onSortOrderChange: (sortOrder: CatalogSortOrder) => void;
  groupings?: any;
  selectedGrouping?: any;
  onGroupingChange?: any;
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
      selectedGrouping,
      onGroupingChange,
    },
    inputRef,
  ) => {
    const catalogSortItems = { [CatalogSortOrder.ASC]: 'A-Z', [CatalogSortOrder.DESC]: 'Z-A' };

    return (
      <div className="co-catalog-page__header">
        <div className="co-catalog-page__heading text-capitalize">{activeCategory.label}</div>
        <div className="co-catalog-page__filter">
          <div>
            <TextInput
              ref={inputRef}
              className="co-catalog-page__input"
              data-test="search-catalog"
              type="text"
              placeholder="Filter by keyword..."
              value={keyword}
              onChange={onKeywordChange}
              // onClear={() => onKeywordChange('')}
              aria-label="Filter by keyword..."
            />
            <Dropdown
              className="co-catalog-page__sort"
              items={catalogSortItems}
              title={catalogSortItems[sortOrder]}
              onChange={onSortOrderChange}
            />
            {groupings && (
              <Dropdown
                className="co-catalog-page__btn-group__group-by"
                menuClassName="dropdown-menu--text-wrap"
                items={groupings}
                onChange={onGroupingChange}
                titlePrefix="Group By"
                title={selectedGrouping}
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
