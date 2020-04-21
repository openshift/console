import * as React from 'react';
import * as _ from 'lodash';
import { withRouter, RouteComponentProps } from 'react-router';
import { compose } from 'redux';
import { connect } from 'react-redux';
import {
  Checkbox,
  DropdownItem,
  Dropdown,
  DropdownToggle,
  DropdownGroup,
  ChipGroup,
  Chip,
  ChipGroupToolbarItem,
  Button,
  Badge,
} from '@patternfly/react-core';
import { CaretDownIcon, CloseIcon, FilterIcon } from '@patternfly/react-icons';
import { Dropdown as DropdownInternal } from '@console/internal/components/utils';
import { setQueryArgument, removeQueryArgument } from './utils';
import { filterList } from '../actions/k8s';
import { searchFilterValues } from './search-filter-dropdown';
import AutocompleteInput from './autocomplete';
import { storagePrefix } from './row-filter';

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
  const { rowFilters = [], data, hideNameFilter, hideLabelFilter, location } = props;

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
    const q = params.get('label');
    const name = params.get('name');
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

  const applyFilter = (value: string | string[], type: FilterType) => {
    const filter = type === FilterType.NAME ? value : { all: value };
    props.reduxIDs.forEach((id) => props.filterList(id, filterTypeMap[type], filter));
  };

  const updateLabelFilter = (filterValues: string[]) => {
    if (filterValues.length > 0) {
      setQueryArgument('label', filterValues.join(','));
    } else {
      removeQueryArgument('label');
    }
    setInputText('');
    applyFilter(filterValues, FilterType.LABEL);
  };

  const updateNameFilter = (filterValue: string) => {
    if (!_.isEmpty(filterValue)) {
      setQueryArgument('name', filterValue);
    } else {
      removeQueryArgument('name');
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
    if (!hideNameFilter) {
      updateNameFilter('');
    }
    if (!hideLabelFilter) {
      updateLabelFilter([]);
    }
  };

  // Initial URL parsing
  React.useEffect(() => {
    !_.isEmpty(labelFilters) && applyFilter(labelFilters, FilterType.LABEL);
    !_.isEmpty(nameFilter) && applyFilter(nameFilter, FilterType.NAME);
    !_.isEmpty(selectedRowFilters) && applyRowFilter(selectedRowFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchFilter = (type: FilterType) => {
    setFilterType(FilterType[type]);
    setInputText('');
  };

  const dropdownItems = getDropdownItems(rowFilters, selectedRowFilters, data, props);

  return (
    <>
      <div className="co-search-group co-search-group__filter co-filter__block">
        {rowFilters.length > 0 && (
          <Dropdown
            dropdownItems={dropdownItems}
            className="co-list-filter-block__row-dropdown co-search-group__resource"
            onSelect={onRowFilterSelect}
            isOpen={isOpen}
            toggle={
              <DropdownToggle
                data-test-id="filter-dropdown-toggle"
                onToggle={() => setOpen(!isOpen)}
                iconComponent={CaretDownIcon}
              >
                <FilterIcon className="span--icon__right-margin" />
                Filter
              </DropdownToggle>
            }
          />
        )}
        <div className="pf-c-input-group co-search-group__filters co-search-group__resource">
          {!hideLabelFilter && (
            <DropdownInternal
              items={FilterType}
              onChange={switchFilter}
              selectedKey={filterType}
              title={filterType}
            />
          )}
          {!hideNameFilter && (
            <AutocompleteInput
              className="co-text-node"
              onSuggestionSelect={(selected) => {
                updateLabelFilter(_.uniq([...labelFilters, selected]));
              }}
              showSuggestions={FilterType.LABEL === filterType}
              textValue={inputText}
              setTextValue={updateSearchFilter}
              placeholder={FilterType.NAME === filterType ? 'Search by name...' : 'app=frontend'}
              data={data}
            />
          )}
        </div>
      </div>
      <ChipGroup className="co-filter__chips" withToolbar defaultIsOpen={false} numChips={8}>
        <ChipGroupToolbarItem key="name-category" categoryName={searchFilterValues.Name}>
          {!hideNameFilter && nameFilter && (
            <Chip key="typehaed-chip" onClick={() => updateNameFilter('')}>
              {nameFilter}
            </Chip>
          )}
          {!hideNameFilter && nameFilter && (
            <span>
              <Button variant="plain" aria-label="Close" onClick={() => updateNameFilter('')}>
                <CloseIcon />
              </Button>
            </span>
          )}
        </ChipGroupToolbarItem>
        {Object.keys(filters).map((key) => {
          const selected = _.intersection(selectedRowFilters, filters[key]);
          return (
            <ChipGroupToolbarItem key={key} categoryName={key}>
              {selected.map((item) => (
                <Chip key={item} onClick={() => updateRowFilterSelected([item])}>
                  {filtersNameMap[item]}
                </Chip>
              ))}
              {selected.length > 0 && (
                <span>
                  <Button variant="plain" aria-label="Close" onClick={() => clearAllRowFilter(key)}>
                    <CloseIcon />
                  </Button>
                </span>
              )}
            </ChipGroupToolbarItem>
          );
        })}
        <ChipGroupToolbarItem key="label-category" categoryName={searchFilterValues.Label}>
          {!hideLabelFilter &&
            labelFilters.map((chip) => (
              <Chip
                key={chip}
                onClick={() => updateLabelFilter(_.difference(labelFilters, [chip]))}
              >
                {chip}
              </Chip>
            ))}
          {!hideLabelFilter && labelFilters.length > 0 && (
            <span>
              <Button variant="plain" aria-label="Close" onClick={() => updateLabelFilter([])}>
                <CloseIcon />
              </Button>
            </span>
          )}
        </ChipGroupToolbarItem>
      </ChipGroup>
      {((labelFilters.length > 0 && !hideLabelFilter) ||
        selectedRowFilters.length > 0 ||
        (nameFilter && !hideLabelFilter)) && (
        <Button variant="link" key="clear-filters" onClick={clearAll}>
          Clear all filters
        </Button>
      )}
    </>
  );
};

type FilterToolbarProps = {
  rowFilters?: RowFilter[];
  data?: any;
  reduxIDs?: string[];
  filterList?: any;
  textFilter?: string;
  hideNameFilter?: boolean;
  hideLabelFilter?: boolean;
  parseAutoComplete?: any;
  kinds?: any;
};

export type RowFilter = {
  filterGroupName: string;
  type: string;
  items?: {
    [key: string]: string;
  }[];
  itemsGenerator?: (...args) => { [key: string]: string }[];
  reducer: (param) => React.ReactText;
  filter?: any;
};

export const FilterToolbar = compose(withRouter, connect(null, { filterList }))(FilterToolbar_);
FilterToolbar.displayName = 'FilterToolbar';
