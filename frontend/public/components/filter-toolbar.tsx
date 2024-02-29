import * as React from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router-dom-v5-compat';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import {
  Badge,
  Button,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  ToolbarToggleGroup,
  Tooltip,
} from '@patternfly/react-core';
import {
  Select as SelectDeprecated,
  SelectGroup as SelectGroupDeprecated,
  SelectOption as SelectOptionDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { ColumnsIcon } from '@patternfly/react-icons/dist/esm/icons/columns-icon';
import {
  RowFilterItem,
  ColumnLayout,
  OnFilterChange,
  FilterValue,
  RowSearchFilter,
} from '@console/dynamic-plugin-sdk';
import {
  Dropdown as DropdownInternal,
  setOrRemoveQueryArgument,
} from '@console/internal/components/utils';
import { useTranslation } from 'react-i18next';
import AutocompleteInput from './autocomplete';
import { storagePrefix } from './row-filter';
import { createColumnManagementModal } from './modals';
import { useDebounceCallback, useDeepCompareMemoize } from '@console/shared/src';
import { TextFilter } from './factory';
import { filterList } from '@console/dynamic-plugin-sdk/src/app/k8s/actions/k8s';
import useRowFilterFix from './useRowFilterFix';
import useLabelSelectionFix from './useLabelSelectionFix';
import useSearchFilters from './useSearchFilters';

/**
 * Housing both the row filter and name/label filter in the same file.
 */

enum FilterType {
  NAME = 'Name',
  LABEL = 'Label',
}

export const filterTypeMap = Object.freeze({
  [FilterType.LABEL]: 'labels',
  [FilterType.NAME]: 'name',
});

type Filter = {
  [key: string]: string[];
};

type FilterKeys = {
  [key: string]: string;
};

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  rowFilters,
  data,
  hideColumnManagement,
  hideLabelFilter,
  hideNameLabelFilters,
  columnLayout,
  nameFilterPlaceholder,
  nameFilterTitle,
  labelFilterPlaceholder,
  textFilter = filterTypeMap[FilterType.NAME],
  labelFilter = filterTypeMap[FilterType.LABEL],
  uniqueFilterName,
  reduxIDs,
  onFilterChange,
  labelPath,
  rowSearchFilters = [],
}) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { t } = useTranslation();

  const translatedNameFilterTitle = nameFilterTitle ?? t('public~Name');

  const { searchFiltersObject, searchFiltersState, changeSearchFiltersState } = useSearchFilters(
    rowSearchFilters,
    uniqueFilterName,
  );

  const translateFilterType = (value: string) => {
    switch (value) {
      case 'Name':
        return translatedNameFilterTitle;
      case 'Label':
        return t('public~Label');
      default:
        return searchFiltersObject?.[value]?.filterGroupName || value;
    }
  };

  const filterDropdownItems: Record<string, string> = {
    ...Object.keys(searchFiltersObject || {}).reduce(
      (acc, key) => ({
        ...acc,
        [key]: searchFiltersObject[key].filterGroupName,
      }),
      {},
    ),
  };

  if (!hideLabelFilter && !hideNameLabelFilters) {
    filterDropdownItems.LABEL = t('public~Label');
  }

  if (!hideNameLabelFilters) {
    filterDropdownItems.NAME = translatedNameFilterTitle;
  }

  // use unique name only when only when more than 1 table is in the view
  const nameFilterQueryArgumentKey = uniqueFilterName
    ? `${uniqueFilterName}-${textFilter}`
    : textFilter;
  const labelFilterQueryArgumentKey = uniqueFilterName
    ? `${uniqueFilterName}-${labelFilter}`
    : labelFilter;

  const params = new URLSearchParams(location.search);
  const [isOpen, setOpen] = React.useState(false);
  const [nameInputText, setNameInputText] = React.useState(
    params.get(nameFilterQueryArgumentKey) ?? '',
  );
  const [labelInputText, setLabelInputText] = React.useState('');

  const [filterType, setFilterType] = React.useState(
    nameInputText || !hideNameLabelFilters
      ? FilterType.NAME
      : Object.keys(searchFiltersState)?.[0] || rowSearchFilters?.[0]?.type,
  );

  // Generate rowFilter items and counts. Memoize to minimize re-renders.
  const generatedRowFilters = useDeepCompareMemoize(
    (rowFilters ?? []).map((rowFilter) => ({
      ...rowFilter,
      items: rowFilter.items.map((item) => ({
        ...item,
        count: (rowFilter as RowMatchFilter).isMatch
          ? _.filter(data, (d) => (rowFilter as RowMatchFilter).isMatch(d, item.id)).length
          : _.countBy(data, (rowFilter as RowReducerFilter).reducer)?.[item.id] ?? '0',
      })),
    })),
  );

  // Reduce generatedRowFilters once and memoize
  const [filters, filtersNameMap, filterKeys, defaultSelections] = React.useMemo<
    [Filter, FilterKeys, FilterKeys, string[]]
  >(
    () =>
      generatedRowFilters.reduce(
        (
          [filtersAcc, filtersNameMapAcc, filterKeysAcc, defaultSelectedAcc],
          { defaultSelected, filterGroupName, items, type },
        ) => [
          // (rowFilters) => {'rowFilterTypeA': ['staA', 'staB'], 'rowFilterTypeB': ['stbA'] }
          {
            ...filtersAcc,
            [filterGroupName]: (items ?? []).map(({ id }) => id),
          },
          // {id: 'a' , title: 'A'} => filterNameMap['a'] = A
          {
            ...filtersNameMapAcc,
            ...(items ?? []).reduce(
              (itemAcc, { id, title }) => ({
                ...itemAcc,
                [id]: title,
              }),
              {},
            ),
          },
          // (storagePrefix, rowFilters) => { 'rowFilterTypeA' = 'storagePrefix-filterTypeA' ...}
          {
            ...filterKeysAcc,
            [filterGroupName]: `${storagePrefix}${type}`,
          },
          // Default selections
          _.uniq([...defaultSelectedAcc, ...(defaultSelected ?? [])]),
        ],
        [{}, {}, {}, []],
      ),
    [generatedRowFilters],
  );
  const [selectedRowFilters, onRowFilterSearchParamChange, rowFiltersInitialized] = useRowFilterFix(
    params,
    filters,
    filterKeys,
    defaultSelections,
  );
  const [labelSelection, onLabelSelectionChange, labelSelectionInitialized] = useLabelSelectionFix(
    params,
    labelFilterQueryArgumentKey,
  );

  // Map row filters to select groups
  const dropdownItems = generatedRowFilters.map((rowFilter) => (
    <SelectGroupDeprecated key={rowFilter.filterGroupName} label={rowFilter.filterGroupName}>
      {rowFilter.items?.map?.((item) =>
        item.hideIfEmpty && (item.count === 0 || item.count === '0') ? (
          <React.Fragment key={item.id} />
        ) : (
          <SelectOptionDeprecated
            data-test-row-filter={item.id}
            key={item.id}
            inputId={item.id}
            value={item.id}
          >
            <span className="co-filter-dropdown-item__name">{item.title}</span>
            <Badge key={item.id} isRead>
              {item.count}
            </Badge>
          </SelectOptionDeprecated>
        ),
      )}
    </SelectGroupDeprecated>
  ));

  const applyFilters = React.useCallback(
    (type: string, input: FilterValue) =>
      onFilterChange
        ? onFilterChange(type, input)
        : reduxIDs?.forEach?.((id) => dispatch(filterList(id, type, input))),
    [onFilterChange, reduxIDs, dispatch],
  );

  const applyTextFilter = React.useCallback(
    (value: string, filterName: string) => {
      applyFilters(filterName, { selected: [value] });
    },
    [applyFilters],
  );

  const searchRowFilters = rowSearchFilters.map((searchFilter) => (
    <ToolbarFilter
      key={searchFilter.type}
      categoryName={translateFilterType(searchFilter.type)}
      deleteChip={() => {
        changeSearchFiltersState(searchFilter.type, '');
        applyTextFilter('', searchFilter.type);
      }}
      chips={searchFiltersState[searchFilter.type] ? [searchFiltersState[searchFilter.type]] : []}
    >
      <></>
    </ToolbarFilter>
  ));

  const applyRowFilter = (selected: string[]) => {
    generatedRowFilters?.forEach?.(({ items, type }) => {
      const all = items?.map?.(({ id }) => id) ?? [];
      const recognized = _.intersection(selected, all);
      applyFilters(type, { selected: [...new Set(recognized)], all });
    });
  };

  const updateRowFilterSelected = (id: string[]) => {
    const selectedNew = _.xor(selectedRowFilters, id);
    onRowFilterSearchParamChange(selectedNew);
    applyRowFilter(selectedNew);
  };

  const clearAllRowFilter = (f: string) => {
    updateRowFilterSelected(_.intersection(filters[f], selectedRowFilters));
  };

  const onRowFilterSelect = (event) => {
    updateRowFilterSelected([event?.target?.id]);
  };

  const applyLabelFilters = (values: string[]) => {
    setLabelInputText('');
    onLabelSelectionChange(values);
    applyFilters(labelFilter, { all: values });
  };

  const applyNameFilter = React.useCallback(
    (value: string) => {
      setOrRemoveQueryArgument(nameFilterQueryArgumentKey, value);
      applyFilters(textFilter, { selected: [value] });
    },
    [applyFilters, nameFilterQueryArgumentKey, textFilter],
  );

  const debounceApplyNameFilter = useDebounceCallback(applyNameFilter, 250);
  const debounceApplyTextFilter = useDebounceCallback(applyTextFilter, 250);

  const clearAll = () => {
    updateRowFilterSelected(selectedRowFilters);
    if (!hideNameLabelFilters) {
      setNameInputText('');
      applyNameFilter('');
    }
    if (!hideNameLabelFilters || !hideLabelFilter) {
      setLabelInputText('');
      applyLabelFilters([]);
    }

    if (rowSearchFilters.length > 0) {
      Object.keys(searchFiltersState).forEach((key) => {
        changeSearchFiltersState(key, '');
        applyTextFilter('', key);
      });
    }
  };

  // Run once on mount to apply filters from query params
  React.useEffect(() => {
    if (!hideNameLabelFilters || !hideLabelFilter) {
      applyFilters(labelFilter, { all: labelSelection });
    }
    if (!hideNameLabelFilters) {
      applyFilters(textFilter, { selected: [nameInputText] });
    }

    if (rowSearchFilters.length > 0) {
      Object.keys(searchFiltersState).forEach((key) => {
        applyFilters(key, { selected: [searchFiltersState[key]] });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Initialize any external data filters based on the hack-fix data when they are finished init
   * TODO: Remove during https://issues.redhat.com/browse/CONSOLE-3147
   */
  React.useEffect(() => {
    if (rowFiltersInitialized && labelSelectionInitialized) {
      applyFilters(labelFilter, { all: labelSelection });
      applyRowFilter(selectedRowFilters);
    }
    // Trigger the update only when we are initialized to sync the url params with the data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowFiltersInitialized, labelSelectionInitialized]);

  const showSearchFilters = Object.keys(filterDropdownItems).length !== 0;

  const showSearchFiltersDropdown = Object.keys(filterDropdownItems).length > 1;
  return (
    <Toolbar
      className="co-toolbar-no-padding pf-m-toggle-group-container"
      data-test="filter-toolbar"
      id="filter-toolbar"
      clearAllFilters={clearAll}
      clearFiltersButtonText={t('public~Clear all filters')}
    >
      <ToolbarContent>
        {(rowFilters?.length > 0 || !hideNameLabelFilters) && (
          <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="md">
            {rowFilters?.length > 0 && (
              <ToolbarItem>
                {_.reduce(
                  Object.keys(filters),
                  (acc, key) => (
                    <ToolbarFilter
                      key={key}
                      chips={_.intersection(selectedRowFilters, filters[key]).map((item) => {
                        return {
                          key: item,
                          node: filtersNameMap[item],
                        };
                      })}
                      deleteChip={(_filter, chip: ToolbarChip) =>
                        updateRowFilterSelected([chip.key])
                      }
                      categoryName={key}
                      deleteChipGroup={() => clearAllRowFilter(key)}
                      chipGroupCollapsedText={t('public~{{numRemaining}} more', {
                        numRemaining: '${remaining}',
                      })}
                      chipGroupExpandedText={t('public~Show less')}
                    >
                      {acc}
                    </ToolbarFilter>
                  ),
                  <div data-test-id="filter-dropdown-toggle">
                    <SelectDeprecated
                      placeholderText={
                        <span>
                          <FilterIcon className="span--icon__right-margin" />
                          {t('public~Filter')}
                        </span>
                      }
                      isOpen={isOpen}
                      onToggle={(_toggleEvent, isExpanded) => setOpen(isExpanded)}
                      onSelect={onRowFilterSelect}
                      variant={SelectVariantDeprecated.checkbox}
                      selections={selectedRowFilters}
                      isCheckboxSelectionBadgeHidden
                      isGrouped
                      maxHeight="60vh"
                    >
                      {dropdownItems}
                    </SelectDeprecated>
                  </div>,
                )}
              </ToolbarItem>
            )}
            {showSearchFilters && (
              <ToolbarItem className="co-filter-search--full-width">
                {searchRowFilters}
                <ToolbarFilter
                  deleteChipGroup={() => {
                    setLabelInputText('');
                    applyLabelFilters([]);
                  }}
                  chips={labelSelection}
                  deleteChip={(f, chip: string) => {
                    setLabelInputText('');
                    applyLabelFilters(_.difference(labelSelection, [chip]));
                  }}
                  categoryName={t('public~Label')}
                >
                  <ToolbarFilter
                    chips={nameInputText ? [nameInputText] : []}
                    deleteChip={() => {
                      setNameInputText('');
                      applyNameFilter('');
                    }}
                    categoryName={translatedNameFilterTitle}
                  >
                    <div className="pf-v5-c-input-group co-filter-group">
                      {showSearchFiltersDropdown && (
                        <DropdownInternal
                          items={filterDropdownItems}
                          onChange={(type) => setFilterType(FilterType[type] || type)}
                          selectedKey={filterType}
                          title={translateFilterType(filterType)}
                        />
                      )}
                      {filterType === FilterType.LABEL && (
                        <AutocompleteInput
                          className="co-text-node"
                          onSuggestionSelect={(selected) => {
                            applyLabelFilters(_.uniq([...labelSelection, selected]));
                          }}
                          showSuggestions
                          textValue={labelInputText}
                          setTextValue={setLabelInputText}
                          placeholder={labelFilterPlaceholder ?? t('public~Search by label...')}
                          data={data}
                          labelPath={labelPath}
                        />
                      )}

                      {filterType === FilterType.NAME && (
                        <TextFilter
                          data-test="name-filter-input"
                          value={nameInputText}
                          onChange={(_event, value: string) => {
                            setNameInputText(value);
                            debounceApplyNameFilter(value);
                          }}
                          placeholder={nameFilterPlaceholder ?? t('public~Search by name...')}
                        />
                      )}

                      {searchFiltersObject[filterType] && (
                        <TextFilter
                          data-test={`${filterType}-filter-input`}
                          value={searchFiltersState[filterType]}
                          onChange={(_event, value: string) => {
                            changeSearchFiltersState(filterType, value);
                            debounceApplyTextFilter(value, filterType);
                          }}
                          placeholder={searchFiltersObject[filterType].placeholder}
                        />
                      )}
                    </div>
                  </ToolbarFilter>
                </ToolbarFilter>
              </ToolbarItem>
            )}
          </ToolbarToggleGroup>
        )}
        {columnLayout?.id && !hideColumnManagement && (
          <ToolbarGroup>
            <ToolbarItem>
              <Tooltip content={t('public~Manage columns')} trigger="mouseenter">
                <Button
                  variant="plain"
                  onClick={() =>
                    createColumnManagementModal({
                      columnLayout,
                    })
                  }
                  aria-label={t('public~Column management')}
                  data-test="manage-columns"
                >
                  <ColumnsIcon />
                </Button>
              </Tooltip>
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

type RowFilterBase<R> = {
  filterGroupName: string;
  type: string;
  items: RowFilterItem[];
  filter?: (input: FilterValue, obj: R) => boolean;
  defaultSelected?: string[];
};

export type RowMatchFilter<R = any> = RowFilterBase<R> & {
  isMatch: (obj: R, id: string) => boolean;
};

export type RowReducerFilter<R = any> = RowFilterBase<R> & {
  reducer: (obj: R) => React.ReactText;
};

export type RowFilter<R = any> = RowMatchFilter<R> | RowReducerFilter<R>;

type FilterToolbarProps = {
  rowFilters?: RowFilter[];
  data?: any;
  reduxIDs?: string[];
  textFilter?: string;
  hideColumnManagement?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  labelFilter?: string;
  parseAutoComplete?: any;
  kinds?: any;
  labelPath?: string;
  columnLayout?: ColumnLayout;
  nameFilterPlaceholder?: string;
  nameFilterTitle?: string;
  labelFilterPlaceholder?: string;
  // Used when multiple tables are in the same page
  uniqueFilterName?: string;
  onFilterChange?: OnFilterChange;
  rowSearchFilters?: RowSearchFilter[];
};

FilterToolbar.displayName = 'FilterToolbar';
