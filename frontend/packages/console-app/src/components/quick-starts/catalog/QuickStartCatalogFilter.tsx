import * as React from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Select,
  SelectVariant,
  SelectOption,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { useQueryParams } from '@console/shared';
import { QUICKSTART_SEARCH_FILTER_KEY, QUICKSTART_STATUS_FILTER_KEY } from '../utils/const';
import { QuickStartStatus } from '../utils/quick-start-types';

import './QuickStartCatalogFilter.scss';

type QuickStartCatalogFilterProps = {
  quickStartsCount: number;
  quickStartStatusCount: Record<QuickStartStatus, number>;
};

const QuickStartCatalogFilter: React.FC<QuickStartCatalogFilterProps> = ({
  quickStartsCount,
  quickStartStatusCount,
}) => {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get(QUICKSTART_SEARCH_FILTER_KEY) || '';
  const statusFilters = queryParams.get(QUICKSTART_STATUS_FILTER_KEY)?.split(',') || [];
  const statusTypes = {
    [QuickStartStatus.COMPLETE]: t('console-app~Complete ({{statusCount, number}})', {
      statusCount: quickStartStatusCount[QuickStartStatus.COMPLETE],
    }),
    [QuickStartStatus.IN_PROGRESS]: t('console-app~In progress ({{statusCount, number}})', {
      statusCount: quickStartStatusCount[QuickStartStatus.IN_PROGRESS],
    }),
    [QuickStartStatus.NOT_STARTED]: t('console-app~Not started ({{statusCount, number}})', {
      statusCount: quickStartStatusCount[QuickStartStatus.NOT_STARTED],
    }),
  };

  const [selectedFilters, setSelectedFilters] = React.useState(
    statusFilters.map((filter) => statusTypes[filter]),
  );

  const onRowfilterSelect = React.useCallback(
    (e) => {
      setIsDropdownOpen(false);
      const selection = e.target.parentElement.getAttribute('data-key');
      const selectedFiltersList = statusFilters.includes(selection)
        ? statusFilters.filter((status) => status !== selection)
        : [...statusFilters, selection];
      setSelectedFilters(selectedFiltersList.map((filterKey) => statusTypes[filterKey]));
      if (selectedFiltersList.length > 0) {
        setQueryArgument('status', selectedFiltersList.join(','));
      } else {
        removeQueryArgument(QUICKSTART_STATUS_FILTER_KEY);
      }
    },
    [statusFilters, statusTypes],
  );

  const dropdownItems = Object.entries(statusTypes).map(([key, val]) => (
    <SelectOption key={key} data-key={key} value={val} />
  ));

  const handleTextChange = (val: string) => {
    if (val.length > 0) {
      setQueryArgument(QUICKSTART_SEARCH_FILTER_KEY, val);
    } else {
      removeQueryArgument(QUICKSTART_SEARCH_FILTER_KEY);
    }
  };

  return (
    <Toolbar className="co-quick-start-catalog-filter__flex">
      <ToolbarContent>
        <ToolbarItem className="co-quick-start-catalog-filter__input">
          <SearchInput
            placeholder={t('console-app~Filter by keyword...')}
            value={searchQuery}
            onChange={handleTextChange}
            onClear={() => handleTextChange('')}
          />
        </ToolbarItem>
        <ToolbarItem>
          <Select
            variant={SelectVariant.checkbox}
            aria-label={t('console-app~Select filter')}
            isOpen={isDropdownOpen}
            onToggle={(isEnabled) => setIsDropdownOpen(isEnabled)}
            placeholderText={t('console-app~Status')}
            onSelect={onRowfilterSelect}
            selections={selectedFilters}
          >
            {dropdownItems}
          </Select>
        </ToolbarItem>
        <ToolbarItem
          className="co-quick-start-catalog-filter__count"
          alignment={{ default: 'alignRight' }}
        >
          {t('console-app~{{count, number}} item', { count: quickStartsCount })}
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default QuickStartCatalogFilter;
