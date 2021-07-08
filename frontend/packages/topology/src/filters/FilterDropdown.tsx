import * as React from 'react';
import {
  Radio,
  Select,
  SelectGroup,
  SelectOption,
  SelectVariant,
  Switch,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DisplayFilters, TopologyDisplayFilterType, TopologyViewType } from '../topology-types';
import { EXPAND_GROUPS_FILTER_ID, SHOW_GROUPS_FILTER_ID } from './const';

import './FilterDropdown.scss';

type FilterDropdownProps = {
  filters: DisplayFilters;
  viewType: TopologyViewType;
  supportedFilters: string[];
  onChange: (filter: DisplayFilters) => void;
  isDisabled?: boolean;
  opened?: boolean; // Use only for testing
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filters,
  viewType,
  supportedFilters,
  onChange,
  isDisabled = false,
  opened = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(opened);
  const showGroups = filters?.find((f) => f.id === SHOW_GROUPS_FILTER_ID)?.value ?? true;
  const groupsExpanded = filters?.find((f) => f.id === EXPAND_GROUPS_FILTER_ID)?.value ?? true;

  const onToggle = (open: boolean): void => setIsOpen(open);
  const onSelect = (e: React.MouseEvent, key: string) => {
    const index = filters.findIndex((f) => f.id === key);
    const filter = { ...filters[index], value: (e.target as HTMLInputElement).checked };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const onShowGroupsChange = (value: boolean) => {
    const index = filters?.findIndex((f) => f.id === SHOW_GROUPS_FILTER_ID) ?? -1;
    if (index === -1) {
      return;
    }
    const filter = {
      ...filters[index],
      value,
    };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const onGroupsExpandedChange = (value: boolean) => {
    const index = filters?.findIndex((f) => f.id === EXPAND_GROUPS_FILTER_ID) ?? -1;
    if (index === -1) {
      return;
    }
    const filter = {
      ...filters[index],
      value,
    };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const expandFilters = filters
    .filter(
      (f) =>
        f.type === TopologyDisplayFilterType.expand &&
        f.id !== EXPAND_GROUPS_FILTER_ID &&
        supportedFilters.includes(f.id),
    )
    .sort((a, b) => a.priority - b.priority);

  const showFilters = filters
    .filter((f) => f.type === TopologyDisplayFilterType.show && supportedFilters.includes(f.id))
    .sort((a, b) => a.priority - b.priority);

  const selectContent = (
    <div className="odc-topology-filter-dropdown">
      <div className="odc-topology-filter-dropdown__group">
        <span className="pf-c-select__menu-group-title">{t('topology~Mode')}</span>
        <div className="odc-topology-filter-dropdown__radio-group">
          <Radio
            className="odc-topology-filter-dropdown__radio"
            id="showGroups"
            isChecked={showGroups}
            label={t('topology~Connectivity')}
            name="Connectivity"
            onChange={() => onShowGroupsChange(true)}
          />
          <Radio
            className="odc-topology-filter-dropdown__radio"
            id="hideGroups"
            isChecked={!showGroups}
            label={t('topology~Consumption')}
            name="Consumption"
            onChange={() => onShowGroupsChange(false)}
          />
        </div>
      </div>
      {expandFilters.length ? (
        <div className="odc-topology-filter-dropdown__group">
          <span className="odc-topology-filter-dropdown__expand-groups-switcher">
            <span className="pf-c-select__menu-group-title">{t('topology~Expand')}</span>
            <Switch
              aria-label={t('topology~Collapse groups')}
              isChecked={groupsExpanded}
              onChange={onGroupsExpandedChange}
              isDisabled={!showGroups}
            />
          </span>
          <SelectGroup className="odc-topology-filter-dropdown__expand-groups-label">
            {expandFilters.map((filter) => (
              <SelectOption
                key={filter.id}
                value={filter.id}
                isDisabled={!groupsExpanded || !showGroups}
                isChecked={filter.value}
              >
                {filter.labelKey ? t(filter.labelKey) : filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
      {viewType === TopologyViewType.graph && showFilters.length ? (
        <div className="odc-topology-filter-dropdown__group">
          <SelectGroup label={t('topology~Show')}>
            {showFilters.map((filter) => (
              <SelectOption key={filter.id} value={filter.id} isChecked={filter.value}>
                {filter.labelKey ? t(filter.labelKey) : filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
    </div>
  );

  return (
    <Select
      className="odc-topology-filter-dropdown__select"
      variant={SelectVariant.checkbox}
      customContent={selectContent}
      isDisabled={isDisabled}
      onToggle={onToggle}
      isOpen={isOpen}
      onSelect={onSelect}
      placeholderText={t('topology~Display options')}
      isGrouped
      isCheckboxSelectionBadgeHidden
    />
  );
};

export default FilterDropdown;
