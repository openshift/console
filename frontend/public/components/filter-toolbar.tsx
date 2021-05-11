import * as React from 'react';
import * as _ from 'lodash';
import { useLocation } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import {
  Badge,
  Button,
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
  Toolbar,
  ToolbarChip,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { FilterIcon, ColumnsIcon } from '@patternfly/react-icons';
import { Dropdown as DropdownInternal } from '@console/internal/components/utils';
import { useTranslation } from 'react-i18next';

import { setQueryArgument, removeQueryArgument } from './utils';
import { filterList } from '../actions/k8s';
import AutocompleteInput from './autocomplete';
import { storagePrefix } from './row-filter';
import { createColumnManagementModal } from './modals';
import { ColumnLayout } from './modals/column-management-modal';
import { OnFilterChange } from './factory/ListPage/filter-hook';

/**
 * Housing both the row filter and name/label filter in the same file.
 */
enum FilterType {
  NAME = 'Name',
  LABEL = 'Label',
}

const filterTypeMap = Object.freeze({
  [FilterType.LABEL]: 'labels',
  [FilterType.NAME]: 'name',
});

type Filter = {
  [key: string]: string[];
};

type FilterKeys = {
  [key: string]: string;
};

const getDropdownItems = (rowFilters: RowFilter[], selectedItems, data) =>
  rowFilters.map((grp) => {
    return (
      <SelectGroup key={grp.filterGroupName} label={grp.filterGroupName}>
        {_.map(grp.items, (item) => {
          return (
            <SelectOption
              data-test-row-filter={item.id}
              key={item.id}
              inputId={item.id}
              value={item.id}
            >
              <span className="co-filter-dropdown-item__name">{item.title}</span>
              <Badge key={item.id} isRead>
                {grp.isMatch
                  ? _.filter(data, (d) => grp.isMatch(d, item.id)).length
                  : _.countBy(data, grp.reducer)?.[item.id] ?? '0'}
              </Badge>
            </SelectOption>
          );
        })}
      </SelectGroup>
    );
  });

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  rowFilters,
  data,
  hideColumnManagement,
  hideLabelFilter,
  hideNameLabelFilters,
  columnLayout,
  nameFilterPlaceholder,
  labelFilterPlaceholder,
  textFilter = filterTypeMap[FilterType.NAME],
  labelFilter = filterTypeMap[FilterType.LABEL],
  uniqueFilterName,
  reduxIDs,
  labelPath,
  onFilterChange,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const translateFilterType = (value: string) => {
    switch (value) {
      case 'Name':
        return t('public~Name');
      case 'Label':
        return t('public~Label');
      default:
        return value;
    }
  };
  const filterDropdownItems = {
    NAME: t('public~Name'),
    LABEL: t('public~Label'),
  };

  // use unique name only when only when more than 1 table is in the view
  const uniqTextFilter = uniqueFilterName ? `${uniqueFilterName}-${textFilter}` : textFilter;
  const uniqlabelFilter = uniqueFilterName ? `${uniqueFilterName}-${labelFilter}` : labelFilter;

  const [inputText, setInputText] = React.useState('');
  const [filterType, setFilterType] = React.useState(FilterType.NAME);
  const [isOpen, setOpen] = React.useState(false);
  const [placeholder, setPlaceholder] = React.useState(
    nameFilterPlaceholder || t('public~Search by name...'),
  );

  // (rowFilters) => {'rowFilterTypeA': ['staA', 'staB'], 'rowFilterTypeB': ['stbA'] }
  const filters: Filter = (rowFilters ?? [])?.reduce((acc, curr) => {
    const items = _.map(curr.items, 'id');
    acc[curr.filterGroupName] = items;
    return acc;
  }, {});

  // {id: 'a' , title: 'A'} => filterNameMap['a'] = A
  const filtersNameMap: FilterKeys = (rowFilters ?? []).reduce((acc, curr) => {
    const items = curr.items.reduce((itemAcc, itemCurr) => {
      itemAcc[itemCurr.id] = itemCurr.title;
      return itemAcc;
    }, {});
    return { ...acc, ...items };
  }, {});

  // (storagePrefix, rowFilters) => { 'rowFilterTypeA' = 'storagePrefix-filterTypeA' ...}
  const filterKeys: FilterKeys = (rowFilters ?? []).reduce((acc, curr) => {
    const str = `${storagePrefix}${curr.type}`;
    acc[curr.filterGroupName] = str;
    return acc;
  }, {});

  // (url) => {nameFilter, labelFilters, rowFilters}
  const { name: nameFilter, labels: labelFilters, rowFiltersFromURL: selectedRowFilters } = (() => {
    const rowFiltersFromURL: string[] = [];
    const params = new URLSearchParams(location.search);
    const q = params.get(uniqlabelFilter);
    const name = params.get(uniqTextFilter);
    _.map(filterKeys, (f) => {
      const vals = params.get(f);
      if (vals) {
        rowFiltersFromURL.push(...vals.split(','));
      }
    });
    const labels = q ? q.split(',') : [];
    return { name, labels, rowFiltersFromURL };
  })();

  /* Logic for Name and Label Filter */

  const applyFilter = (input: string | string[], type: FilterType) => {
    const filter = type === FilterType.NAME ? textFilter : labelFilter;
    if (onFilterChange) {
      onFilterChange(filter, input);
    } else {
      reduxIDs.forEach((id) => dispatch(filterList(id, filter, input)));
    }
  };

  const updateLabelFilter = (filterValues: string[]) => {
    if (filterValues.length > 0) {
      setQueryArgument(uniqlabelFilter, filterValues.join(','));
    } else {
      removeQueryArgument(uniqlabelFilter);
    }
    setInputText('');
    applyFilter(filterValues, FilterType.LABEL);
  };

  const updateNameFilter = (filterValue: string) => {
    if (!_.isEmpty(filterValue)) {
      setQueryArgument(uniqTextFilter, filterValue);
    } else {
      removeQueryArgument(uniqTextFilter);
    }
    setInputText(filterValue);
    applyFilter(filterValue, FilterType.NAME);
  };

  const updateSearchFilter = (value: string) => {
    switch (filterType) {
      case FilterType.NAME:
        updateNameFilter(value);
        break;
      case FilterType.LABEL:
        setInputText(value);
        break;
      default:
        break;
    }
  };

  /* Logic Related to Row Filters Ex:(Status, Type) */

  const applyRowFilter = (selected: string[]) => {
    rowFilters?.forEach((filter) => {
      const all = _.map(filter.items, 'id');
      const recognized = _.intersection(selected, all);
      if (onFilterChange) {
        onFilterChange(filter.type, recognized);
      } else {
        (reduxIDs || []).forEach((id) =>
          dispatch(filterList(id, filter.type, { selected: new Set(recognized), all })),
        );
      }
    });
  };

  const setQueryParameters = (selected: string[]) => {
    if (!_.isEmpty(selectedRowFilters) || !_.isEmpty(selected)) {
      _.forIn(filters, (value, key) => {
        const recognized = _.filter(selected, (item) => value.includes(item));
        if (recognized.length > 0) {
          setQueryArgument(filterKeys[key], recognized.join(','));
        } else {
          removeQueryArgument(filterKeys[key]);
        }
      });
    }
  };

  const updateRowFilterSelected = (id: string[]) => {
    const selectedNew = _.xor(selectedRowFilters, id);
    applyRowFilter(selectedNew);
    setQueryParameters(selectedNew);
  };

  const clearAllRowFilter = (f: string) => {
    updateRowFilterSelected(_.intersection(filters[f], selectedRowFilters));
  };

  const onRowFilterSelect = (event) => {
    updateRowFilterSelected([event?.target?.id]);
  };

  const clearAll = () => {
    updateRowFilterSelected(selectedRowFilters);
    if (!hideNameLabelFilters) {
      updateNameFilter('');
    }
    if (!hideNameLabelFilters || !hideLabelFilter) {
      updateLabelFilter([]);
    }
  };

  // Initial URL parsing
  React.useEffect(() => {
    if (!hideNameLabelFilters || !hideLabelFilter) {
      applyFilter(labelFilters, FilterType.LABEL);
    }
    if (!hideNameLabelFilters) {
      setInputText(nameFilter ?? '');
      applyFilter(nameFilter, FilterType.NAME);
    }
    if (_.isEmpty(selectedRowFilters)) {
      updateRowFilterSelected(_.uniq(_.flatMap(rowFilters ?? [], 'defaultSelected')));
    } else {
      applyRowFilter(selectedRowFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchFilter = (type: FilterType) => {
    setFilterType(FilterType[type]);
    switch (FilterType[type]) {
      case 'Name':
        setPlaceholder(nameFilterPlaceholder || t('public~Search by name...'));
        break;
      case 'Label':
        setPlaceholder(labelFilterPlaceholder || t('public~Search by label...'));
        break;
      default:
        setPlaceholder('app=frontend');
    }
    setInputText(nameFilter && FilterType[type] === FilterType.NAME ? nameFilter : '');
  };

  const dropdownItems = getDropdownItems(rowFilters ?? [], selectedRowFilters, data);
  return (
    <Toolbar
      data-test="filter-toolbar"
      id="filter-toolbar"
      clearAllFilters={clearAll}
      clearFiltersButtonText={t('public~Clear all filters')}
    >
      <ToolbarContent>
        {rowFilters?.length > 0 && (
          <ToolbarItem>
            {_.reduce(
              Object.keys(filters),
              (acc, key) => (
                <ToolbarFilter
                  key={key}
                  chips={_.intersection(selectedRowFilters, filters[key]).map((item) => {
                    return { key: item, node: filtersNameMap[item] };
                  })}
                  deleteChip={(filter, chip: ToolbarChip) => updateRowFilterSelected([chip.key])}
                  categoryName={key}
                  deleteChipGroup={() => clearAllRowFilter(key)}
                >
                  {acc}
                </ToolbarFilter>
              ),
              <div data-test-id="filter-dropdown-toggle">
                <Select
                  placeholderText={
                    <span>
                      <FilterIcon className="span--icon__right-margin" />
                      {t('public~Filter')}
                    </span>
                  }
                  isOpen={isOpen}
                  onToggle={() => {
                    setOpen(!isOpen);
                  }}
                  onSelect={onRowFilterSelect}
                  variant={SelectVariant.checkbox}
                  selections={selectedRowFilters}
                  isCheckboxSelectionBadgeHidden
                  isGrouped
                >
                  {dropdownItems}
                </Select>
              </div>,
            )}
          </ToolbarItem>
        )}
        {!hideNameLabelFilters && (
          <ToolbarItem className="co-filter-search--full-width">
            <ToolbarFilter
              deleteChipGroup={() => updateLabelFilter([])}
              chips={[...labelFilters]}
              deleteChip={(filter, chip: string) =>
                updateLabelFilter(_.difference(labelFilters, [chip]))
              }
              categoryName={t('public~Label')}
            >
              <ToolbarFilter
                chips={nameFilter && nameFilter.length > 0 ? [nameFilter] : []}
                deleteChip={() => updateNameFilter('')}
                categoryName={t('public~Name')}
              >
                <div className="pf-c-input-group">
                  {!hideLabelFilter && (
                    <DropdownInternal
                      items={filterDropdownItems}
                      onChange={switchFilter}
                      selectedKey={filterType}
                      title={translateFilterType(filterType)}
                    />
                  )}
                  <AutocompleteInput
                    className="co-text-node"
                    onSuggestionSelect={(selected) => {
                      updateLabelFilter(_.uniq([...labelFilters, selected]));
                    }}
                    showSuggestions={FilterType.LABEL === filterType}
                    textValue={inputText}
                    setTextValue={updateSearchFilter}
                    placeholder={placeholder}
                    data={data}
                    labelPath={labelPath}
                  />
                </div>
              </ToolbarFilter>
            </ToolbarFilter>
          </ToolbarItem>
        )}
        {columnLayout?.id && !hideColumnManagement && (
          <ToolbarItem>
            <Tooltip content={t('public~Manage columns')}>
              <Button
                variant="plain"
                onClick={() =>
                  createColumnManagementModal({
                    columnLayout,
                  })
                }
                aria-label={t('public~Column management')}
              >
                <ColumnsIcon />
              </Button>
            </Tooltip>
          </ToolbarItem>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

type FilterToolbarProps = {
  rowFilters?: RowFilter[];
  data?: any;
  reduxIDs?: string[];
  filterList?: any;
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
  labelFilterPlaceholder?: string;
  // Used when multiple tables are in the same page
  uniqueFilterName?: string;
  onFilterChange?: OnFilterChange;
};

export type RowFilter<R = any> = {
  defaultSelected?: string[];
  filterGroupName: string;
  type: string;
  items: {
    [key: string]: string;
  }[];
  isMatch?: (param: R, id: string) => boolean;
  reducer?: (param: R) => React.ReactText;
  filter?: (filter: { selected: Set<string>; all: string[] }, object: R) => boolean;
};

FilterToolbar.displayName = 'FilterToolbar';
