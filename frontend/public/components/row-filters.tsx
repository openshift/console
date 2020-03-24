import * as React from 'react';
import * as _ from 'lodash';
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
import { setQueryArgument, removeQueryArgument } from './utils';
import { filterList } from '../actions/k8s';
import { connect } from 'react-redux';
import { searchFilterValues } from './search-filter-dropdown';
import AutoCompleteInput from './auto-complete';
import { Dropdown as DropdownInternal } from '@console/internal/components/utils';
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

const getDropdownItems = (rowFilters: RowFilter[], selectedItems, data) =>
  rowFilters.map((grp) => (
    <DropdownGroup
      key={grp.filterGroupName}
      label={grp.filterGroupName}
      className="co-filter-dropdown-group"
    >
      {..._.map(grp.items, (item) => (
        <DropdownItem
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
  ));

const getSelectedRowFilters = (rowFilters: RowFilter[]) =>
  rowFilters.reduce((acc, curr) => [...acc, ...curr?.selected], []);

const DropdownFilter_: React.FC<DropdownFilterProps> = (props) => {
  const { rowFilters = [], data, showNameFilter = true, showLabelFilter = false } = props;

  const [labelFilters, setLabelFilters] = React.useState<string[]>([]);
  const [nameFilter, setNameFilter] = React.useState('');
  const [labelFilterText, setLabelFilterText] = React.useState('');
  const [filterType, setFilterType] = React.useState(FilterType.NAME);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(() => getSelectedRowFilters(rowFilters));

  const filters: Filter = React.useMemo(
    () =>
      rowFilters.reduce((acc, curr) => {
        const items = _.map(curr.items, 'id');
        acc[curr.filterGroupName] = items;
        return acc;
      }, {}),
    [rowFilters],
  );

  // { 'Xstatus' = 'x-y-status' ...}
  const filterKeys: FilterKeys = React.useMemo(
    () =>
      rowFilters.reduce((acc, curr) => {
        const str = `${storagePrefix}${curr.type}`;
        acc[curr.filterGroupName] = str;
        return acc;
      }, {}),
    [rowFilters],
  );

  // Parse state from URL
  React.useEffect(() => {
    let q: string = '',
      name: string;
    const rowFiltersFromURL: string[] = [];

    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      q = params.get('q');
      name = params.get('name');
      _.map(_.values(filterKeys), (f) => {
        const vals = params.get(f);
        if (vals) {
          rowFiltersFromURL.push(...vals.split(','));
        }
      });
    }
    const labels = q ? q.split(',') : [];
    labels.length > 0 && setLabelFilters(labels);
    setNameFilter(name || '');
    setSelected([...selected, ...rowFiltersFromURL]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Logic for Name and Label Filter */

  const applyFilter = (value: string | string[], type: FilterType) => {
    const filter = type === FilterType.NAME ? value : { all: value };
    props.reduxIDs.forEach((id) => props.filterList(id, filterTypeMap[type], filter));
  };

  const addLabelFilter = (filter: string) => {
    setLabelFilters([...labelFilters, filter]);
    setQueryArgument('q', [...labelFilters, filter].join(','));
    applyFilter([...labelFilters, filter], FilterType.LABEL);
    setLabelFilterText('');
  };

  const removeLabelFilter = (filter: string) => {
    const filtered = labelFilters.filter((l) => l !== filter);
    setLabelFilters(filtered);
    setQueryArgument('q', filtered.join(','));
    if (filtered.length === 0) {
      removeQueryArgument('q');
    }
    applyFilter(filtered || [], FilterType.LABEL);
    setLabelFilterText('');
  };

  const removeAllLabelFilters = () => {
    setLabelFilters([]);
    setQueryArgument('q', '');
    removeQueryArgument('q');
    applyFilter([], FilterType.LABEL);
    setLabelFilterText('');
  };

  const updateFilter = (filter: string, type: FilterType) => {
    if (type === FilterType.NAME) {
      setNameFilter(filter);
      filter ? setQueryArgument('name', filter) : removeQueryArgument('name');
      applyFilter(filter, FilterType.NAME);
    } else {
      addLabelFilter(filter);
    }
  };

  const updateSearchFilter = (value: string) => {
    if (filterType === FilterType.NAME) {
      updateFilter(value, FilterType.NAME);
    } else {
      setLabelFilterText(value);
    }
  };

  const clearNameFilter = () => {
    setNameFilter('');
    setQueryArgument('name', '');
    updateFilter('', FilterType.NAME);
  };

  const dropdownItems = getDropdownItems(rowFilters, selected, data);

  /* Logic Related to Row Filters Ex:(Status, Type) */

  const setQueryParameters = (selected_) => {
    if (!_.isEmpty(selected) || !_.isEmpty(selected_)) {
      _.forIn(filters, (value, key) => {
        const recognized = _.filter(selected_, (item) => value.includes(item));
        if (recognized.length > 0) {
          setQueryArgument(filterKeys[key], recognized.join(','));
        } else {
          removeQueryArgument(filterKeys[key]);
        }
      });
      setSelected(selected_);
    }
  };

  const updateRowFilters = (newSelected) => {
    rowFilters.forEach((filter) => {
      const all = _.map(filter.items, 'id');
      const recognized = _.intersection(newSelected, all);
      (props.reduxIDs || []).forEach((id) =>
        props.filterList(id, filter.type, { selected: new Set(recognized), all }),
      );
    });
  };

  const updateRowFilterSelected = (id) => {
    const selectedNew = _.xor(selected, id);
    updateRowFilters(selectedNew);
    setQueryParameters(selectedNew);
    setIsOpen(false);
  };

  const clearAllRowFilter = (f) => {
    updateRowFilterSelected(_.intersection(filters[f], selected));
  };

  const onRowFilterSelect = (event) => {
    event.preventDefault();
    updateRowFilterSelected([event?.target?.id]);
  };

  return (
    <>
      <div className="co-list-filter-block">
        {rowFilters.length > 0 && (
          <Dropdown
            dropdownItems={dropdownItems}
            className="co-list-filter-block__row-dropdown"
            onSelect={onRowFilterSelect}
            isOpen={isOpen}
            toggle={
              <DropdownToggle onToggle={() => setIsOpen(!isOpen)} iconComponent={CaretDownIcon}>
                <FilterIcon className="span--icon__right-margin" />
                Filter
              </DropdownToggle>
            }
          />
        )}
        <div className="co-list-fliter-block__user-input-filter">
          {showLabelFilter && (
            <DropdownInternal
              items={FilterType}
              onChange={(f) => setFilterType(FilterType[f])}
              selectedKey={filterType}
              title={filterType}
            />
          )}
          {showNameFilter && (
            <AutoCompleteInput
              className="co-text-node co-m-label co-m-label--expand"
              onSuggestionSelect={addLabelFilter}
              showSuggestions={FilterType.LABEL === filterType}
              // Text Input value
              textValue={filterType === FilterType.NAME ? nameFilter : labelFilterText}
              // Set text input value
              setTextValue={updateSearchFilter}
              placeholder={FilterType.NAME === filterType ? 'Search by name...' : 'app=frontend'}
              data={data}
            />
          )}
        </div>
      </div>
      <ChipGroup withToolbar defaultIsOpen={false} numChips={8}>
        <ChipGroupToolbarItem key="name-category" categoryName={searchFilterValues.Name}>
          {nameFilter !== '' && (
            <Chip key="typehaed-chip" onClick={clearNameFilter}>
              {nameFilter}
            </Chip>
          )}
          {nameFilter !== '' && (
            <span>
              <Button variant="plain" aria-label="Close" onClick={clearNameFilter}>
                <CloseIcon />
              </Button>
            </span>
          )}
        </ChipGroupToolbarItem>
        {Object.keys(filters).map((key) => {
          const selected_ = _.intersection(selected, filters[key]);
          return (
            <ChipGroupToolbarItem key={key} categoryName={key}>
              {selected_.map((item) => (
                <Chip key={item} onClick={() => updateRowFilterSelected([item])}>
                  {item}
                </Chip>
              ))}
              {selected_.length > 0 && (
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
          {labelFilters.map((chip) => (
            <Chip key={chip} onClick={() => removeLabelFilter(chip)}>
              {chip}
            </Chip>
          ))}
          {labelFilters.length > 0 && (
            <span>
              <Button variant="plain" aria-label="Close" onClick={removeAllLabelFilters}>
                <CloseIcon />
              </Button>
            </span>
          )}
        </ChipGroupToolbarItem>
      </ChipGroup>
    </>
  );
};

type DropdownFilterProps = {
  rowFilters?: RowFilter[];
  data?: any;
  reduxIDs?: string[];
  filterList?: any;
  textFilter?: string;
  showNameFilter: boolean;
  showLabelFilter: boolean;
  parseAutoComplete?: any;
};

type RowFilter = {
  filterGroupName?: string;
  selected: string[];
  type: string;
  items: {
    [key: string]: string;
  }[];
  reducer: (param) => React.ReactText;
};

export const DropdownFilter = connect(null, { filterList })(DropdownFilter_);
