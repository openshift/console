import * as React from 'react';
import * as _ from 'lodash';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
import {
  Button,
  Checkbox,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarChip,
  ToolbarItem,
  DropdownItem,
  Dropdown,
  DropdownToggle,
  DropdownGroup,
  Badge,
} from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon, ColumnsIcon } from '@patternfly/react-icons';
import { Dropdown as DropdownInternal } from '@console/internal/components/utils';

import { setQueryArgument, removeQueryArgument } from './utils';
import { filterList } from '../actions/k8s';
import AutocompleteInput from './autocomplete';
import { storagePrefix } from './row-filter';
import { createColumnManagementModal } from './modals';
import { ColumnLayout } from './modals/column-management-modal';

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

const getDropdownItems = (rowFilters: RowFilter[], selectedItems, data, props) =>
  rowFilters.map((grp) => {
    const items = grp.itemsGenerator ? grp.itemsGenerator(props, props.kind) : grp.items;
    return (
      <DropdownGroup
        key={grp.filterGroupName}
        label={grp.filterGroupName}
        className="co-filter-dropdown-group"
      >
        {_.map(items, (item) => (
          <DropdownItem
            data-test-row-filter={item.id}
            key={item.id}
            id={item.id}
            className="co-filter-dropdown__item"
            listItemClassName="co-filter-dropdown__list-item"
          >
            <div className="co-filter-dropdown-item">
              <span className="co-filter-dropdown-item__checkbox">
                <Checkbox isChecked={selectedItems.includes(item.id)} id={`${item.id}-checkbox`} />
              </span>
              <span className="co-filter-dropdown-item__name">{item.title}</span>
              <Badge key={item.id} isRead>
                {_.countBy(data, grp.reducer)?.[item.id] ?? '0'}
              </Badge>
            </div>
          </DropdownItem>
        ))}
      </DropdownGroup>
    );
  });

const FilterToolbar_: React.FC<FilterToolbarProps & RouteComponentProps> = (props) => {
  const {
    rowFilters = [],
    data,
    hideColumnManagement,
    hideLabelFilter,
    hideNameLabelFilters,
    columnLayout,
    location,
    textFilter = filterTypeMap[FilterType.NAME],
    labelFilter = filterTypeMap[FilterType.LABEL],
  } = props;

  const [inputText, setInputText] = React.useState('');
  const [filterType, setFilterType] = React.useState(FilterType.NAME);
  const [isOpen, setOpen] = React.useState(false);

  // (rowFilters) => {'rowFilterTypeA': ['staA', 'staB'], 'rowFilterTypeB': ['stbA'] }
  const filters: Filter = rowFilters.reduce((acc, curr) => {
    const rowItems = curr.itemsGenerator ? curr.itemsGenerator(props, props?.kinds) : curr.items;
    const items = _.map(rowItems, 'id');
    acc[curr.filterGroupName] = items;
    return acc;
  }, {});

  // {id: 'a' , title: 'A'} => filterNameMap['a'] = A
  const filtersNameMap: FilterKeys = rowFilters.reduce((acc, curr) => {
    const rowItems = curr.itemsGenerator ? curr.itemsGenerator(props, props?.kinds) : curr.items;
    const items = rowItems.reduce((itemAcc, itemCurr) => {
      itemAcc[itemCurr.id] = itemCurr.title;
      return itemAcc;
    }, {});
    return { ...acc, ...items };
  }, {});

  // (storagePrefix, rowFilters) => { 'rowFilterTypeA' = 'storagePrefix-filterTypeA' ...}
  const filterKeys: FilterKeys = rowFilters.reduce((acc, curr) => {
    const str = `${storagePrefix}${curr.type}`;
    acc[curr.filterGroupName] = str;
    return acc;
  }, {});

  // (url) => {nameFilter, labelFilters, rowFilters}
  const { name: nameFilter, labels: labelFilters, rowFiltersFromURL: selectedRowFilters } = (() => {
    const rowFiltersFromURL: string[] = [];
    const params = new URLSearchParams(location.search);
    const q = params.get(labelFilter);
    const name = params.get(textFilter);
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
    const value = type === FilterType.NAME ? input : { all: input };
    props.reduxIDs.forEach((id) => props.filterList(id, filter, value));
  };

  const updateLabelFilter = (filterValues: string[]) => {
    if (filterValues.length > 0) {
      setQueryArgument(labelFilter, filterValues.join(','));
    } else {
      removeQueryArgument(labelFilter);
    }
    setInputText('');
    applyFilter(filterValues, FilterType.LABEL);
  };

  const updateNameFilter = (filterValue: string) => {
    if (!_.isEmpty(filterValue)) {
      setQueryArgument(textFilter, filterValue);
    } else {
      removeQueryArgument(textFilter);
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
    rowFilters.forEach((filter) => {
      const rowItems = filter.itemsGenerator
        ? filter.itemsGenerator(props, props?.kinds)
        : filter.items;
      const all = _.map(rowItems, 'id');
      const recognized = _.intersection(selected, all);
      (props.reduxIDs || []).forEach((id) =>
        props.filterList(id, filter.type, { selected: new Set(recognized), all }),
      );
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
    setOpen(false);
  };

  const clearAllRowFilter = (f: string) => {
    updateRowFilterSelected(_.intersection(filters[f], selectedRowFilters));
  };

  const onRowFilterSelect = (event) => {
    event.preventDefault();
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
      updateRowFilterSelected(_.uniq(_.flatMap(rowFilters, 'defaultSelected')));
    } else {
      applyRowFilter(selectedRowFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchFilter = (type: FilterType) => {
    setFilterType(FilterType[type]);
    setInputText(nameFilter && FilterType[type] === FilterType.NAME ? nameFilter : '');
  };

  const dropdownItems = getDropdownItems(rowFilters, selectedRowFilters, data, props);
  return (
    <Toolbar id="filter-toolbar" clearAllFilters={clearAll}>
      <ToolbarContent>
        {rowFilters.length > 0 && (
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
              <Dropdown
                dropdownItems={dropdownItems}
                onSelect={onRowFilterSelect}
                isOpen={isOpen}
                toggle={
                  <DropdownToggle
                    data-test-id="filter-dropdown-toggle"
                    onToggle={() => setOpen(!isOpen)}
                    toggleIndicator={CaretDownIcon}
                  >
                    <FilterIcon className="span--icon__right-margin" />
                    Filter
                  </DropdownToggle>
                }
              />,
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
              categoryName="Label"
            >
              <ToolbarFilter
                chips={nameFilter && nameFilter.length > 0 ? [nameFilter] : []}
                deleteChip={() => updateNameFilter('')}
                categoryName="Name"
              >
                <div className="pf-c-input-group">
                  {!hideLabelFilter && (
                    <DropdownInternal
                      items={FilterType}
                      onChange={switchFilter}
                      selectedKey={filterType}
                      title={filterType}
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
                    placeholder={
                      FilterType.NAME === filterType ? 'Search by name...' : 'app=frontend'
                    }
                    data={data}
                    labelPath={props.labelPath}
                  />
                </div>
              </ToolbarFilter>
            </ToolbarFilter>
          </ToolbarItem>
        )}
        {columnLayout?.id && !hideColumnManagement && (
          <ToolbarItem>
            <Button
              variant="plain"
              onClick={() =>
                createColumnManagementModal({
                  columnLayout,
                })
              }
              aria-label="Column Management"
            >
              <ColumnsIcon />
            </Button>
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
};

export type RowFilter<R = any> = {
  defaultSelected?: string[];
  filterGroupName: string;
  type: string;
  items?: {
    [key: string]: string;
  }[];
  itemsGenerator?: (...args) => { [key: string]: string }[];
  reducer: (param: R) => React.ReactText;
  filter?: any;
};

export const FilterToolbar = withRouter(connect(null, { filterList })(FilterToolbar_));
FilterToolbar.displayName = 'FilterToolbar';
