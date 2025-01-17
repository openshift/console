import * as React from 'react';
import { Flex, FlexItem, SearchInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { useDebounceCallback } from '@console/shared';
import { NO_GROUPING } from '../utils/category-utils';
import { CatalogSortOrder, CatalogStringMap } from '../utils/types';

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

const CatalogToolbar = React.forwardRef<HTMLInputElement, CatalogToolbarProps>(
  (
    {
      title,
      totalItems,
      searchKeyword,
      sortOrder,
      groupings,
      activeGrouping,
      onGroupingChange,
      onSearchKeywordChange,
      onSortOrderChange,
    },
    inputRef,
  ) => {
    const { t } = useTranslation();

    const catalogSortItems = {
      [CatalogSortOrder.ASC]: t('console-shared~A-Z'),
      [CatalogSortOrder.DESC]: t('console-shared~Z-A'),
    };

    const showGrouping = !_.isEmpty(groupings);

    const catalogGroupItems = {
      ...groupings,
      [NO_GROUPING]: t('console-shared~None'),
    };

    const debouncedOnSearchKeywordChange = useDebounceCallback(onSearchKeywordChange);

    return (
      <div className="co-catalog-page__header">
        <div className="co-catalog-page__heading text-capitalize">{title}</div>
        <div className="co-catalog-page__filter">
          <Flex>
            <FlexItem>
              <SearchInput
                ref={inputRef}
                data-test="search-catalog"
                type="text"
                placeholder={t('console-shared~Filter by keyword...')}
                value={searchKeyword}
                onChange={(_event, text) => debouncedOnSearchKeywordChange(text)}
                onClear={() => onSearchKeywordChange('')}
                aria-label={t('console-shared~Filter by keyword...')}
              />
            </FlexItem>
            <FlexItem>
              <Dropdown
                className="co-catalog-page__sort"
                items={catalogSortItems}
                title={catalogSortItems[sortOrder]}
                onChange={onSortOrderChange}
              />
            </FlexItem>
            {showGrouping && (
              <FlexItem>
                <Dropdown
                  className="co-catalog-page__btn-group__group-by"
                  menuClassName="dropdown-menu--text-wrap"
                  items={catalogGroupItems}
                  onChange={onGroupingChange}
                  titlePrefix={t('console-shared~Group by')}
                  title={catalogGroupItems[activeGrouping]}
                />
              </FlexItem>
            )}
          </Flex>
          <div className="co-catalog-page__num-items">
            {t('console-shared~{{totalItems}} items', { totalItems })}
          </div>
        </div>
      </div>
    );
  },
);

export default CatalogToolbar;
