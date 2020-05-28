import * as React from 'react';
import * as _ from 'lodash';
import { withRouter, RouteComponentProps } from 'react-router';
import { connect } from 'react-redux';
import {
  Checkbox,
  DataToolbar,
  DataToolbarContent,
  DataToolbarFilter,
  DataToolbarChip,
  DataToolbarItem,
  DropdownItem,
  Dropdown,
  DropdownToggle,
  DropdownGroup,
  Badge,
} from '@patternfly/react-core';
import { CaretDownIcon, FilterIcon } from '@patternfly/react-icons';
import { Dropdown as DropdownInternal } from '@console/internal/components/utils';
import { setQueryArgument, removeQueryArgument } from './utils';
import { filterList } from '../actions/k8s';
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
  const {
    data,
    filterList,
    hideLabelFilter,
    hideToolbar,
    location,
    reduxIDs,
    rowFilters = [],
    textFilter = filterTypeMap[FilterType.NAME],
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

  const params = new URLSearchParams(location.search);
  const q = params.get('label');
  const labelFilters = q ? q.split(',') : [];
  const nameFilter = params.get(textFilter);
  const selectedRowFilters = _.reduce(
    filterKeys,
    (acc: string[], f: string) => {
      const vals = params.get(f);
      return vals ? [...acc, ...vals.split(',')] : acc;
    },
    [],
  );

  /* Logic for Name and Label Filter */

  const updateLabelFilter = (filterValues: string[]) => {
    if (filterValues.length > 0) {
      setQueryArgument('label', filterValues.join(','));
    } else {
      removeQueryArgument('label');
    }
    setInputText('');
  };

  const updateNameFilter = (filterValue: string) => {
    if (!_.isEmpty(filterValue)) {
      setQueryArgument(textFilter, filterValue);
    } else {
      removeQueryArgument(textFilter);
    }
    setInputText(filterValue);
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
    updateNameFilter('');
    updateLabelFilter([]);
  };

  // Apply label filter on changes.
  React.useEffect(() => {
    reduxIDs?.forEach((id) =>
      filterList(id, filterTypeMap[FilterType.LABEL], { all: labelFilters }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, reduxIDs?.join(',')]);

  // Apply name filter on changes.
  React.useEffect(() => {
    reduxIDs?.forEach((id) => filterList(id, textFilter, nameFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameFilter, textFilter, reduxIDs?.join(',')]);

  // Apply row filters on changes.
  React.useEffect(() => {
    rowFilters.forEach((filter) => {
      const rowItems = filter.itemsGenerator
        ? filter.itemsGenerator(props, props?.kinds)
        : filter.items;
      const all = _.map(rowItems, 'id');
      const recognized = _.intersection(selectedRowFilters, all);
      reduxIDs?.forEach((id) =>
        filterList(id, filter.type, { selected: new Set(recognized), all }),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRowFilters.join(','), reduxIDs?.join(',')]);

  const switchFilter = (type: FilterType) => {
    setFilterType(FilterType[type]);
    setInputText(nameFilter && FilterType[type] === FilterType.NAME ? nameFilter : '');
  };

  const dropdownItems = getDropdownItems(rowFilters, selectedRowFilters, data, props);

  return (
    !hideToolbar && (
      <DataToolbar id="filter-toolbar" clearAllFilters={clearAll}>
        <DataToolbarContent>
          {rowFilters.length > 0 && (
            <DataToolbarItem>
              {_.reduce(
                Object.keys(filters),
                (acc, key) => (
                  <DataToolbarFilter
                    key={key}
                    chips={_.intersection(selectedRowFilters, filters[key]).map((item) => {
                      return { key: item, node: filtersNameMap[item] };
                    })}
                    deleteChip={(filter, chip: DataToolbarChip) =>
                      updateRowFilterSelected([chip.key])
                    }
                    categoryName={key}
                    deleteChipGroup={() => clearAllRowFilter(key)}
                  >
                    {acc}
                  </DataToolbarFilter>
                ),
                <Dropdown
                  dropdownItems={dropdownItems}
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
                />,
              )}
            </DataToolbarItem>
          )}
          <DataToolbarItem className="co-filter-search--full-width">
            <DataToolbarFilter
              deleteChipGroup={() => updateLabelFilter([])}
              chips={!hideLabelFilter ? [...labelFilters] : []}
              deleteChip={(filter, chip: string) =>
                updateLabelFilter(_.difference(labelFilters, [chip]))
              }
              categoryName="Label"
            >
              <DataToolbarFilter
                chips={nameFilter?.length ? [nameFilter] : []}
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
                  />
                </div>
              </DataToolbarFilter>
            </DataToolbarFilter>
          </DataToolbarItem>
        </DataToolbarContent>
      </DataToolbar>
    )
  );
};

type FilterToolbarProps = {
  rowFilters?: RowFilter[];
  data?: any;
  reduxIDs?: string[];
  filterList?: any;
  textFilter?: string;
  hideToolbar?: boolean;
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

export const FilterToolbar = withRouter(connect(null, { filterList })(FilterToolbar_));
FilterToolbar.displayName = 'FilterToolbar';
