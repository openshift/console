import * as React from 'react';
import * as _ from 'lodash';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
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
import {
  Dropdown as DropdownInternal,
  setOrRemoveQueryArgument,
} from '@console/internal/components/utils';
import { useTranslation } from 'react-i18next';
import { filterList as filterListAction } from '../actions/k8s';
import AutocompleteInput from './autocomplete';
import { storagePrefix } from './row-filter';
import { createColumnManagementModal } from './modals';
import { ColumnLayout } from './modals/column-management-modal';
import { TextFilter } from './factory';
import { useDebounceCallback, useDeepCompareMemoize } from '@console/shared/src';

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

const FilterToolbar_: React.FC<FilterToolbarProps & RouteComponentProps> = (props) => {
  const {
    rowFilters,
    data,
    hideColumnManagement,
    hideLabelFilter,
    hideNameLabelFilters,
    columnLayout,
    nameFilterPlaceholder,
    labelFilterPlaceholder,
    location,
    textFilter = filterTypeMap[FilterType.NAME],
    labelFilter = filterTypeMap[FilterType.LABEL],
    uniqueFilterName,
    reduxIDs,
    filterList,
    kinds,
  } = props;

  const { t } = useTranslation();
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
  const nameFilterQueryArgumentKey = uniqueFilterName
    ? `${uniqueFilterName}-${textFilter}`
    : textFilter;
  const labelFilterQueryArgumentKey = uniqueFilterName
    ? `${uniqueFilterName}-${labelFilter}`
    : labelFilter;
  const params = new URLSearchParams(location.search);
  const labelFilters = params.get(labelFilterQueryArgumentKey)?.split(',') ?? [];
  const [filterType, setFilterType] = React.useState(FilterType.NAME);
  const [isOpen, setOpen] = React.useState(false);
  const [nameInputText, setNameInputText] = React.useState(
    params.get(nameFilterQueryArgumentKey) ?? '',
  );
  const [labelInputText, setLabelInputText] = React.useState('');

  // Generate rowFilter items and counts. Memoize to minimize re-renders.
  const generatedRowFilters = useDeepCompareMemoize(
    (rowFilters ?? []).map((rowFilter) => ({
      ...rowFilter,
      items: (rowFilter.itemsGenerator?.(props, kinds) ?? rowFilter.items).map((item) => ({
        ...item,
        count: rowFilter.isMatch
          ? _.filter(data, (d) => rowFilter.isMatch(d, item.id)).length
          : _.countBy(data, rowFilter.reducer)?.[item.id] ?? '0',
      })),
    })),
  );

  // Reduce generatedRowFilters once and memoize
  const [filters, filtersNameMap, filterKeys, defaultSelections]: [
    Filter,
    FilterKeys,
    FilterKeys,
    string[],
  ] = React.useMemo(
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

  // Parse selected row filters from url query params
  const selectedRowFilters = React.useMemo(
    () => _.flatMap(filterKeys, (f) => params.get(f)?.split(',') ?? []),
    [filterKeys, params],
  );

  // Map row filters to select groups
  const dropdownItems = generatedRowFilters.map((rowFilter) => (
    <SelectGroup key={rowFilter.filterGroupName} label={rowFilter.filterGroupName}>
      {rowFilter.items?.map?.((item) => (
        <SelectOption
          data-test-row-filter={item.id}
          key={item.id}
          inputId={item.id}
          value={item.id}
        >
          <span className="co-filter-dropdown-item__name">{item.title}</span>
          <Badge key={item.id} isRead>
            {item.count}
          </Badge>
        </SelectOption>
      ))}
    </SelectGroup>
  ));

  const applyFilters = React.useCallback(
    (type, filter) => reduxIDs?.forEach?.((id) => filterList(id, type, filter)),
    [reduxIDs, filterList],
  );

  const applyRowFilter = (selected: string[]) => {
    generatedRowFilters?.forEach?.(({ items, type }) => {
      const all = items?.map?.(({ id }) => id) ?? [];
      const recognized = _.intersection(selected, all);
      applyFilters(type, { selected: new Set(recognized), all });
    });
  };

  const setRowFilterQueryParameters = (selected: string[]) => {
    if (!_.isEmpty(selectedRowFilters) || !_.isEmpty(selected)) {
      _.forIn(filters, (value, key) => {
        const recognized = _.filter(selected, (item) => value.includes(item));
        setOrRemoveQueryArgument(filterKeys[key], recognized.join(','));
      });
    }
  };

  const updateRowFilterSelected = (id: string[]) => {
    const selectedNew = _.xor(selectedRowFilters, id);
    setRowFilterQueryParameters(selectedNew);
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
    setOrRemoveQueryArgument(labelFilterQueryArgumentKey, values.join(','));
    applyFilters(labelFilter, { all: values });
  };

  const applyNameFilter = React.useCallback(
    (value: string) => {
      setOrRemoveQueryArgument(nameFilterQueryArgumentKey, value);
      applyFilters(textFilter, value);
    },
    [applyFilters, nameFilterQueryArgumentKey, textFilter],
  );

  const debounceApplyNameFilter = useDebounceCallback(applyNameFilter, 250);

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
  };

  // Run once on mount to apply filters from query params
  React.useEffect(() => {
    if (!hideNameLabelFilters || !hideLabelFilter) {
      applyFilters(labelFilter, { all: labelFilters });
    }
    if (!hideNameLabelFilters) {
      applyFilters(textFilter, nameInputText);
    }
    if (_.isEmpty(selectedRowFilters)) {
      updateRowFilterSelected(defaultSelections);
    } else {
      applyRowFilter(selectedRowFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                    return {
                      key: item,
                      node: filtersNameMap[item],
                    };
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
                  maxHeight="60vh"
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
              deleteChipGroup={() => {
                setLabelInputText('');
                applyLabelFilters([]);
              }}
              chips={labelFilters}
              deleteChip={(f, chip: string) => {
                setLabelInputText('');
                applyLabelFilters(_.difference(labelFilters, [chip]));
              }}
              categoryName={t('public~Label')}
            >
              <ToolbarFilter
                chips={nameInputText ? [nameInputText] : []}
                deleteChip={() => {
                  setNameInputText('');
                  applyNameFilter('');
                }}
                categoryName={t('public~Name')}
              >
                <div className="pf-c-input-group">
                  {!hideLabelFilter && (
                    <DropdownInternal
                      items={filterDropdownItems}
                      onChange={(type) => setFilterType(FilterType[type])}
                      selectedKey={filterType}
                      title={translateFilterType(filterType)}
                    />
                  )}
                  {filterType === FilterType.LABEL ? (
                    <AutocompleteInput
                      className="co-text-node"
                      onSuggestionSelect={(selected) => {
                        applyLabelFilters(_.uniq([...labelFilters, selected]));
                      }}
                      showSuggestions
                      textValue={labelInputText}
                      setTextValue={setLabelInputText}
                      placeholder={labelFilterPlaceholder ?? t('public~Search by label...')}
                      data={data}
                      labelPath={props.labelPath}
                    />
                  ) : (
                    <TextFilter
                      value={nameInputText}
                      onChange={(value: string) => {
                        setNameInputText(value);
                        value ? debounceApplyNameFilter(value) : applyNameFilter(value);
                      }}
                      placeholder={nameFilterPlaceholder ?? t('public~Search by name...')}
                    />
                  )}
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
};

type RowFilterItem = {
  id?: string;
  title?: string;
  [key: string]: string;
};

export type RowFilter<R = any> = {
  defaultSelected?: string[];
  filterGroupName: string;
  isMatch?: (param: R, id: string) => boolean;
  type: string;
  items?: RowFilterItem[];
  itemsGenerator?: (...args) => RowFilterItem[];
  reducer?: (param: R) => React.ReactText;
  filter?: any;
};

export const FilterToolbar = withRouter(
  connect(null, { filterList: filterListAction })(FilterToolbar_),
);
FilterToolbar.displayName = 'FilterToolbar';
