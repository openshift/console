import { forwardRef } from 'react';
import { Flex, FlexItem, SearchInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { useDebounceCallback } from '@console/shared/src/hooks/useDebounceCallback';
import { NO_GROUPING } from '../utils/category-utils';
import type { CatalogStringMap } from '../utils/types';
import { CatalogSortOrder } from '../utils/types';
import CatalogPageHeader from './CatalogPageHeader';
import CatalogPageHeading from './CatalogPageHeading';
import CatalogPageNumItems from './CatalogPageNumItems';
import CatalogPageToolbar from './CatalogPageToolbar';

type CatalogToolbarProps = {
  title: string;
  totalItems: number;
  searchKeyword: string;
  sortOrder: CatalogSortOrder;
  groupings: CatalogStringMap;
  activeGrouping: string;
  catalogType?: string;
  onGroupingChange: (grouping: string) => void;
  onSearchKeywordChange: (searchKeyword: string) => void;
  onSortOrderChange: (sortOrder: CatalogSortOrder) => void;
};

export const CatalogToolbar = forwardRef<HTMLInputElement, CatalogToolbarProps>(
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
    const { t } = useTranslation('console-shared');

    const catalogSortItems = {
      [CatalogSortOrder.RELEVANCE]: t('Relevance'),
      [CatalogSortOrder.ASC]: t('A-Z'),
      [CatalogSortOrder.DESC]: t('Z-A'),
    };

    const showGrouping = !_.isEmpty(groupings);

    const catalogGroupItems = {
      ...groupings,
      [NO_GROUPING]: t('None'),
    };

    const debouncedOnSearchKeywordChange = useDebounceCallback(onSearchKeywordChange);

    return (
      <CatalogPageHeader>
        <CatalogPageHeading>{title}</CatalogPageHeading>
        <CatalogPageToolbar>
          <Flex>
            <FlexItem>
              <SearchInput
                ref={inputRef}
                data-test="search-catalog"
                type="text"
                placeholder={t('Filter by keyword...')}
                value={searchKeyword}
                onChange={(_event, text) => debouncedOnSearchKeywordChange(text)}
                onClear={() => onSearchKeywordChange('')}
                aria-label={t('Filter by keyword...')}
              />
            </FlexItem>
            <FlexItem>
              <ConsoleSelect
                className="co-catalog-page__sort"
                items={catalogSortItems}
                title={catalogSortItems[sortOrder]}
                alwaysShowTitle
                onChange={onSortOrderChange}
                selectedKey={sortOrder}
              />
            </FlexItem>
            {showGrouping && (
              <FlexItem>
                <ConsoleSelect
                  menuClassName="dropdown-menu--text-wrap"
                  items={catalogGroupItems}
                  onChange={onGroupingChange}
                  titlePrefix={t('Group by')}
                  title={catalogGroupItems[activeGrouping]}
                  alwaysShowTitle
                />
              </FlexItem>
            )}
          </Flex>
          <CatalogPageNumItems>{t('{{totalItems}} items', { totalItems })}</CatalogPageNumItems>
        </CatalogPageToolbar>
      </CatalogPageHeader>
    );
  },
);
